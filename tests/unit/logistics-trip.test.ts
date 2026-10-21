// Mock @/lib/prisma: logistics/payroll services import it at top-level.
vi.mock('@/lib/prisma', () => ({ default: {} }));

import { describe, it, expect, vi } from 'vitest';

// --- Helper thuần mô phỏng LogisticsService.completeStop ---
// Ánh xạ: src/services/logistics.service.ts completeStop dòng ~185-189:
//   if (ret.returnedQty < 0 || ret.returnedQty >= targetItem.orderedQty) throw ...
//   deliveredQty = orderedQty - returnedQty
function applyPartialReturn(orderedQty: number, returnedQty: number): number {
  if (returnedQty < 0 || returnedQty >= orderedQty) {
    throw new Error(
      `Số lượng trả lại (${returnedQty}) phải >= 0 và < số lượng đặt (${orderedQty})!`
    );
  }
  return orderedQty - returnedQty;
}

// --- Predicate thuần mô phỏng PayrollService.settleAndCloseTrip ---
// Ánh xạ: src/services/payroll.service.ts settleAndCloseTrip dòng ~69-76:
// check hàng hoàn TRƯỚC (hasReturnGoods && !returnStockSettledAt), check cash SAU (!cashSettledAt).
function canClose(args: {
  hasReturnGoods: boolean;
  cashSettledAt: Date | null;
  returnStockSettledAt: Date | null;
}): boolean {
  if (args.hasReturnGoods && !args.returnStockSettledAt) {
    throw new Error(
      'Chuyến xe có hàng giao trượt/hoàn lại. Thủ kho phải bấm xác nhận nhận lại hàng trước khi đóng chuyến!'
    );
  }
  if (!args.cashSettledAt) {
    throw new Error('Kế toán phải xác nhận đã thu đủ tiền COD trước khi đóng chuyến!');
  }
  return true;
}

describe('completeStop PARTIAL — deliveredQty = orderedQty - returnedQty', () => {
  it('đơn 10 thùng trả 3 → delivered 7 (logistics.service.ts completeStop ~dòng 194)', () => {
    expect(applyPartialReturn(10, 3)).toBe(7);
  });

  it('returnedQty = 10 (>= ordered 10) → throw', () => {
    expect(() => applyPartialReturn(10, 10)).toThrow();
  });

  it('returnedQty = -1 → throw', () => {
    expect(() => applyPartialReturn(10, -1)).toThrow();
  });

  it('returned = 0 → delivered 10, hợp lệ', () => {
    expect(applyPartialReturn(10, 0)).toBe(10);
  });
});

describe('Khóa sổ 2 chốt — PayrollService.settleAndCloseTrip (~dòng 69-76)', () => {
  const cash = new Date('2026-10-20T10:00:00Z');
  const ret = new Date('2026-10-20T11:00:00Z');

  it('có hàng hoàn mà returnStockSettledAt null (dù đã có cash) → throw lỗi thủ kho', () => {
    expect(() =>
      canClose({ hasReturnGoods: true, cashSettledAt: cash, returnStockSettledAt: null })
    ).toThrow('Thủ kho phải bấm xác nhận nhận lại hàng trước khi đóng chuyến!');
  });

  it('chưa có cashSettledAt → throw lỗi kế toán', () => {
    expect(() =>
      canClose({ hasReturnGoods: false, cashSettledAt: null, returnStockSettledAt: null })
    ).toThrow('Kế toán phải xác nhận đã thu đủ tiền COD trước khi đóng chuyến!');
  });

  it('đủ cả 2 chốt → true', () => {
    expect(
      canClose({ hasReturnGoods: true, cashSettledAt: cash, returnStockSettledAt: ret })
    ).toBe(true);
  });

  it('chuyến không hàng hoàn + có cash → true', () => {
    expect(
      canClose({ hasReturnGoods: false, cashSettledAt: cash, returnStockSettledAt: null })
    ).toBe(true);
  });
});
