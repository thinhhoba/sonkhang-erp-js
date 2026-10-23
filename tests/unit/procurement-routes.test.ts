import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { ProcurementDomainError } from "@/lib/procurement";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(), requireRole: vi.fn(), createPurchaseOrder: vi.fn(), updateDraftPurchaseOrder: vi.fn(), updateSupplier: vi.fn(), approvePurchaseOrder: vi.fn(), submitPurchaseOrder: vi.fn(), syncPurchaseInvoice: vi.fn(),
  listPurchaseOrders: vi.fn(), getPurchaseOrderById: vi.fn(), listSuppliers: vi.fn(), getSupplierById: vi.fn(), performThreeWayMatching: vi.fn(),
  invoiceFindMany: vi.fn(), invoiceFindFirst: vi.fn(), importPurchaseInvoiceToStock: vi.fn(), mapItemProduct: vi.fn(),
}));

vi.mock("@/lib/route-guard", () => ({ requireSession: mocks.requireSession, requireRole: mocks.requireRole }));
vi.mock("@/services/procurement.service", () => ({ ProcurementService: {
  listPurchaseOrders: mocks.listPurchaseOrders, getPurchaseOrderById: mocks.getPurchaseOrderById,
  listSuppliers: mocks.listSuppliers, getSupplierById: mocks.getSupplierById, performThreeWayMatching: mocks.performThreeWayMatching,
  createPurchaseOrder: mocks.createPurchaseOrder,
  approvePurchaseOrder: mocks.approvePurchaseOrder, submitPurchaseOrder: mocks.submitPurchaseOrder,
  updateDraftPurchaseOrder: mocks.updateDraftPurchaseOrder, updateSupplier: mocks.updateSupplier,
} }));
vi.mock("@/services/meinvoice.service", () => ({ MeInvoiceService: { syncPurchaseInvoice: mocks.syncPurchaseInvoice, mapItemProduct: mocks.mapItemProduct } }));
vi.mock("@/services/inventory.service", () => ({ InventoryService: { importPurchaseInvoiceToStock: mocks.importPurchaseInvoiceToStock } }));
vi.mock("@/lib/prisma", () => ({ default: { purchaseInvoice: { findMany: mocks.invoiceFindMany, findFirst: mocks.invoiceFindFirst } } }));

import { GET as listOrders, POST as createOrder } from "@/app/api/procurement/orders/route";
import { POST as approveOrder } from "@/app/api/procurement/orders/[id]/approve/route";
import { POST as submitOrder } from "@/app/api/procurement/orders/[id]/submit/route";
import { GET as getOrder, PATCH as updateOrder } from "@/app/api/procurement/orders/[id]/route";
import { GET as getSupplier, PUT as updateSupplier } from "@/app/api/procurement/suppliers/[id]/route";
import { GET as listSuppliers } from "@/app/api/procurement/suppliers/route";
import { GET as matchOrder } from "@/app/api/procurement/orders/[id]/match/route";
import * as receiptCollection from "@/app/api/procurement/receipts/route";
import { GET as getReceipt } from "@/app/api/procurement/receipts/[id]/route";
import { GET as listInvoices } from "@/app/api/inventory/invoices/route";
import { GET as getInvoice } from "@/app/api/inventory/invoices/[id]/route";
import { POST as importStock } from "@/app/api/inventory/invoices/import-stock/route";
import { POST as mapItem } from "@/app/api/inventory/invoices/map-item/route";
import { POST as simulateInvoice } from "@/app/api/inventory/invoices/simulate-meinvoice/route";

const validBody = { supplierId: "supplier-1", items: [{ productId: "product-1", orderedQty: 2, unitPrice: 100_000 }] };

describe("procurement mutation routes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireRole.mockReturnValue(null); delete process.env.ENABLE_DEMO_INVOICE_SIMULATION; });

  it("returns 401 and performs no persistence without a session", async () => {
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({ success: false }, { status: 401 }) });
    const response = await createOrder(new Request("http://localhost/api/procurement/orders", { method: "POST", body: JSON.stringify(validBody) }));
    expect(response.status).toBe(401); expect(mocks.createPurchaseOrder).not.toHaveBeenCalled();
  });

  it("returns 403 and performs no persistence for a warehouse mutation", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    const response = await createOrder(new Request("http://localhost/api/procurement/orders", { method: "POST", body: JSON.stringify(validBody) }));
    expect(response.status).toBe(403); expect(mocks.createPurchaseOrder).not.toHaveBeenCalled();
  });

  it("binds creator, submitter and approver to the authenticated employee", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } });
    mocks.createPurchaseOrder.mockResolvedValue({ id: "po-1" }); mocks.submitPurchaseOrder.mockResolvedValue({ id: "po-1" }); mocks.approvePurchaseOrder.mockResolvedValue({ id: "po-1" });
    await createOrder(new Request("http://localhost/api/procurement/orders", { method: "POST", body: JSON.stringify({ ...validBody, createdById: "attacker" }) }));
    await submitOrder(new Request("http://localhost/api/procurement/orders/po-1/submit", { method: "POST" }), { params: { id: "po-1" } });
    await approveOrder(new Request("http://localhost/api/procurement/orders/po-1/approve", { method: "POST", body: JSON.stringify({ approvedById: "attacker" }) }), { params: { id: "po-1" } });
    expect(mocks.createPurchaseOrder).toHaveBeenCalledWith(expect.objectContaining({ createdById: "accountant-1" }), "accountant-1");
    expect(mocks.submitPurchaseOrder).toHaveBeenCalledWith("po-1", "accountant-1");
    expect(mocks.approvePurchaseOrder).toHaveBeenCalledWith("po-1", "accountant-1");
  });

  it("exposes receipts as read-only HTTP surface", () => {
    expect(receiptCollection.GET).toBeTypeOf("function");
    expect((receiptCollection as any).POST).toBeUndefined();
  });

  it("keeps invoice simulation disabled without the explicit development flag", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } });
    const previous = process.env.ENABLE_DEMO_INVOICE_SIMULATION;
    delete process.env.ENABLE_DEMO_INVOICE_SIMULATION;
    const response = await simulateInvoice();
    if (previous !== undefined) process.env.ENABLE_DEMO_INVOICE_SIMULATION = previous;
    expect(response.status).toBe(403); expect(mocks.syncPurchaseInvoice).not.toHaveBeenCalled();
  });

  it("guards PATCH and binds its audit actor to the session", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } });
    mocks.updateDraftPurchaseOrder.mockResolvedValue({ id: "po-1" });
    const response = await updateOrder(new Request("http://localhost/api/procurement/orders/po-1", { method: "PATCH", body: JSON.stringify(validBody) }), { params: { id: "po-1" } });
    expect(response.status).toBe(200);
    expect(mocks.updateDraftPurchaseOrder).toHaveBeenCalledWith("po-1", expect.any(Object), "accountant-1");
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    expect((await updateOrder(new Request("http://localhost/api/procurement/orders/po-1", { method: "PATCH", body: JSON.stringify(validBody) }), { params: { id: "po-1" } })).status).toBe(403);
  });

  it("guards supplier PUT and binds its audit actor to the session", async () => {
    const supplierBody = { code: "NCC-1", name: "Nhà cung cấp", taxCode: "031", paymentTerms: "NET30" };
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } });
    mocks.updateSupplier.mockResolvedValue({ id: "supplier-1" });
    expect((await updateSupplier(new Request("http://localhost/api/procurement/suppliers/supplier-1", { method: "PUT", body: JSON.stringify(supplierBody) }), { params: { id: "supplier-1" } })).status).toBe(200);
    expect(mocks.updateSupplier).toHaveBeenCalledWith("supplier-1", expect.any(Object), "accountant-1");
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
    expect((await updateSupplier(new Request("http://localhost/api/procurement/suppliers/supplier-1", { method: "PUT", body: JSON.stringify(supplierBody) }), { params: { id: "supplier-1" } })).status).toBe(401);
  });

  it("enforces simulation session, role and explicit flag, then permits the safe path", async () => {
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
    expect((await simulateInvoice()).status).toBe(401);
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    mocks.requireRole.mockReturnValueOnce(NextResponse.json({}, { status: 403 }));
    expect((await simulateInvoice()).status).toBe(403);
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } }); mocks.requireRole.mockReturnValue(null);
    process.env.ENABLE_DEMO_INVOICE_SIMULATION = "true"; mocks.syncPurchaseInvoice.mockResolvedValue({ invoiceNumber: "1", supplierName: "NCC" });
    expect((await simulateInvoice()).status).toBe(200);
  });

  it("returns a generic 500 without leaking an internal mutation error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } });
    mocks.createPurchaseOrder.mockRejectedValue(new Error("postgres password=secret"));
    const response = await createOrder(new Request("http://localhost/api/procurement/orders", { method: "POST", body: JSON.stringify(validBody) }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: "Lỗi hệ thống khi xử lý nghiệp vụ mua hàng" });
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("password"));
    consoleSpy.mockRestore();
  });

  it("returns stable 400 validation and known domain status contracts", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } });
    const invalid = await createOrder(new Request("http://localhost/api/procurement/orders", { method: "POST", body: JSON.stringify({ supplierId: "supplier-1", items: [] }) }));
    expect(invalid.status).toBe(400);
    mocks.createPurchaseOrder.mockRejectedValue(new ProcurementDomainError("Xung đột PO", 409));
    const conflict = await createOrder(new Request("http://localhost/api/procurement/orders", { method: "POST", body: JSON.stringify(validBody) }));
    expect(conflict.status).toBe(409); expect(await conflict.json()).toMatchObject({ error: "Xung đột PO" });
  });

  it("never leaks internal database errors from purchasing GET routes", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } }); mocks.requireRole.mockReturnValue(null);
    const cases: Array<[ReturnType<typeof vi.fn>, () => Promise<Response>]> = [
      [mocks.listPurchaseOrders, () => listOrders(new Request("http://localhost/api/procurement/orders"))],
      [mocks.getPurchaseOrderById, () => getOrder(new Request("http://localhost/api/procurement/orders/po-1"), { params: { id: "po-1" } })],
      [mocks.listSuppliers, () => listSuppliers()],
      [mocks.getSupplierById, () => getSupplier(new Request("http://localhost/api/procurement/suppliers/s-1"), { params: { id: "s-1" } })],
      [mocks.performThreeWayMatching, () => matchOrder(new Request("http://localhost/api/procurement/orders/po-1/match"), { params: { id: "po-1" } })],
      [mocks.invoiceFindMany, () => receiptCollection.GET()],
      [mocks.invoiceFindFirst, () => getReceipt(new Request("http://localhost/api/procurement/receipts/r-1"), { params: { id: "r-1" } })],
      [mocks.invoiceFindMany, () => listInvoices()],
      [mocks.invoiceFindFirst, () => getInvoice(new Request("http://localhost/api/inventory/invoices/i-1"), { params: { id: "i-1" } })],
    ];
    for (const [dependency, invoke] of cases) {
      dependency.mockRejectedValueOnce(new Error("db-secret-get"));
      const response = await invoke(); const payload = await response.json();
      expect(response.status).toBe(500); expect(payload.error).toBe("Lỗi hệ thống khi xử lý nghiệp vụ mua hàng"); expect(JSON.stringify(payload)).not.toContain("db-secret-get");
    }
    consoleSpy.mockRestore();
  });

  it("keeps import-stock and map-item validation/domain/internal error contracts safe", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } }); mocks.requireRole.mockReturnValue(null);
    const missing = await importStock(new Request("http://localhost/api/inventory/invoices/import-stock", { method: "POST", body: "{}" }));
    expect(missing.status).toBe(400);
    mocks.importPurchaseInvoiceToStock.mockRejectedValueOnce(new ProcurementDomainError("Đã nhập kho", 409));
    expect((await importStock(new Request("http://localhost/api/inventory/invoices/import-stock", { method: "POST", body: JSON.stringify({ invoiceId: "i-1" }) }))).status).toBe(409);
    mocks.importPurchaseInvoiceToStock.mockRejectedValueOnce(new Error("db-secret-import"));
    const importFailure = await importStock(new Request("http://localhost/api/inventory/invoices/import-stock", { method: "POST", body: JSON.stringify({ invoiceId: "i-1" }) }));
    expect(importFailure.status).toBe(500); expect(JSON.stringify(await importFailure.json())).not.toContain("db-secret-import");
    mocks.mapItemProduct.mockRejectedValueOnce(new Error("db-secret-map"));
    const mapFailure = await mapItem(new Request("http://localhost/api/inventory/invoices/map-item", { method: "POST", body: JSON.stringify({ invoiceItemId: "ii-1", productId: "p-1", conversionRate: 1 }) }));
    expect(mapFailure.status).toBe(500); expect(JSON.stringify(await mapFailure.json())).not.toContain("db-secret-map");
    const invalidRate = await mapItem(new Request("http://localhost/api/inventory/invoices/map-item", { method: "POST", body: JSON.stringify({ invoiceItemId: "ii-1", productId: "p-1", conversionRate: -1 }) }));
    expect(invalidRate.status).toBe(400);
  });

  it("binds purchase-invoice stock import auditing to the authenticated actor", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant-1", role: "ACCOUNTANT" } }); mocks.requireRole.mockReturnValue(null);
    mocks.importPurchaseInvoiceToStock.mockResolvedValue({ id: "invoice-1" });
    const response = await importStock(new Request("http://localhost/api/inventory/invoices/import-stock", { method: "POST", body: JSON.stringify({ invoiceId: "invoice-1" }) }));
    expect(response.status).toBe(200);
    expect(mocks.importPurchaseInvoiceToStock).toHaveBeenCalledWith("invoice-1", "accountant-1");
  });
});
