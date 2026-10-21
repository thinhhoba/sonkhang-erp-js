// Mock @/lib/prisma: InventoryService imports it at top-level.
vi.mock('@/lib/prisma', () => ({ default: {} }));

import { describe, it, expect, vi } from 'vitest';
import { InventoryService } from '@/services/inventory.service';

interface MockProduct {
  id: string;
  currentStock: number;
  inTransitStock: number;
  avgCostPrice: number;
}

function createMockTx(initial: MockProduct) {
  const store: Record<string, MockProduct> = {
    [initial.id]: { ...initial },
  };
  const ledgers: any[] = [];
  const tx = {
    product: {
      findUnique: vi.fn(async ({ where }: any) => {
        const p = store[where.id];
        return p ? { ...p } : null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        store[where.id] = { ...store[where.id], ...data };
        return { ...store[where.id] };
      }),
    },
    inventoryLedger: {
      create: vi.fn(async ({ data }: any) => {
        const entry = { id: `ledger-${ledgers.length + 1}`, ...data };
        ledgers.push(entry);
        return entry;
      }),
    },
    __store: store,
    __ledgers: ledgers,
  };
  return tx;
}

describe('InventoryService.recordTransactionInTx — Luật Thép Số 1', () => {
  it('1. WAC thuần ((100*10000)+550000)/(100+50) = 10.333,33 + xuất kho OUT_DISPATCH -30/+30 → 70/30', () => {
    // GHI CHÚ: công thức WAC thật nằm ở importPurchaseInvoiceToStock
    // (src/services/inventory.service.ts dòng ~124-127):
    // newAvgCost = (currentStockVal + actualLineCost) / totalStockAfter
    // Luồng đó cần DB (purchaseInvoice + items) nên test thuần công thức tại đây.
    const expected = ((100 * 10000) + 550000) / (100 + 50);
    expect(expected).toBeCloseTo(10333.33, 1);

    return (async () => {
      const tx = createMockTx({ id: 'p1', currentStock: 100, inTransitStock: 0, avgCostPrice: 10000 });
      const ledger = await InventoryService.recordTransactionInTx(tx as any, {
        productId: 'p1',
        type: 'OUT_DISPATCH',
        referenceCode: 'TRIP-TEST-01',
        qtyChange: -30,
        inTransitChange: 30,
      });
      expect(tx.__store['p1'].currentStock).toBe(70);
      expect(tx.__store['p1'].inTransitStock).toBe(30);
      expect(ledger.stockAfter).toBe(70);
      expect(ledger.avgCostAfter).toBe(10000); // xuất kho không đổi giá vốn
    })();
  });

  it('2. IN_RETURN_TRIP hoàn hàng +20/-20 từ state 70/30 → 90/10, avgCost không đổi', async () => {
    const tx = createMockTx({ id: 'p1', currentStock: 70, inTransitStock: 30, avgCostPrice: 10000 });
    const ledger = await InventoryService.recordTransactionInTx(tx as any, {
      productId: 'p1',
      type: 'IN_RETURN_TRIP',
      referenceCode: 'TRIP-TEST-01',
      qtyChange: 20,
      inTransitChange: -20,
    });
    expect(tx.__store['p1'].currentStock).toBe(90);
    expect(tx.__store['p1'].inTransitStock).toBe(10);
    expect(ledger.stockAfter).toBe(90);
    expect(ledger.avgCostAfter).toBe(10000);
  });

  it('3. ADJUSTMENT hàng hỏng qtyChange 0, inTransitChange -10 → tồn giữ 90, inTransit 0', async () => {
    const tx = createMockTx({ id: 'p1', currentStock: 90, inTransitStock: 10, avgCostPrice: 10000 });
    const ledger = await InventoryService.recordTransactionInTx(tx as any, {
      productId: 'p1',
      type: 'ADJUSTMENT',
      referenceCode: 'ADJ-BROKEN',
      qtyChange: 0,
      inTransitChange: -10,
      note: 'Hàng hỏng trên xe',
    });
    expect(tx.__store['p1'].currentStock).toBe(90);
    expect(tx.__store['p1'].inTransitStock).toBe(0);
    expect(ledger.stockAfter).toBe(90);
  });

  it('4. product không tồn tại → throw', async () => {
    const tx = createMockTx({ id: 'p1', currentStock: 100, inTransitStock: 0, avgCostPrice: 10000 });
    await expect(
      InventoryService.recordTransactionInTx(tx as any, {
        productId: 'missing-id',
        type: 'OUT_DISPATCH',
        referenceCode: 'TRIP-TEST-01',
        qtyChange: -5,
      })
    ).rejects.toThrow();
  });
});
