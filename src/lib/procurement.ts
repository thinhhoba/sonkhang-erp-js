/**
 * Authorization and input validation shared by the purchasing HTTP surface.
 * The database still stores roles as strings, so every unknown role is denied.
 */
export type ProcurementSurface = "suppliers" | "purchase-orders" | "invoices" | "receipts" | "three-way-match";

export class ProcurementDomainError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 = 400) {
    super(message);
    this.name = "ProcurementDomainError";
  }
}

export function procurementErrorStatus(error: unknown, fallback = 500): number {
  return error instanceof ProcurementDomainError ? error.status : fallback;
}

export function procurementErrorResponse(error: unknown): { status: number; error: string } {
  if (error instanceof ProcurementDomainError) return { status: error.status, error: error.message };
  if (error instanceof SyntaxError) return { status: 400, error: "Dữ liệu JSON không hợp lệ" };
  return { status: 500, error: "Lỗi hệ thống khi xử lý nghiệp vụ mua hàng" };
}

const VIEW_ROLES: Record<ProcurementSurface, readonly string[]> = {
  suppliers: ["ADMIN", "ACCOUNTANT", "WAREHOUSE"],
  "purchase-orders": ["ADMIN", "ACCOUNTANT", "WAREHOUSE"],
  invoices: ["ADMIN", "ACCOUNTANT"],
  receipts: ["ADMIN", "ACCOUNTANT"],
  "three-way-match": ["ADMIN", "ACCOUNTANT"],
};

const WRITE_ROLES = ["ADMIN", "ACCOUNTANT"] as const;
const PAYMENT_TERMS = new Set(["IMMEDIATE", "NET15", "NET30", "NET45", "NET60"]);

export function canAccessProcurement(role: string | undefined, surface: ProcurementSurface): boolean {
  return Boolean(role && VIEW_ROLES[surface].includes(role));
}

export function canWriteProcurement(role: string | undefined): boolean {
  return Boolean(role && WRITE_ROLES.includes(role as (typeof WRITE_ROLES)[number]));
}

export function invoiceMayMatchPurchaseOrder(invoice: { poId?: string | null; supplierTaxCode: string }, po: { id: string; supplierTaxCode: string }): boolean {
  return invoice.poId ? invoice.poId === po.id : invoice.supplierTaxCode === po.supplierTaxCode;
}

function requiredText(value: unknown, label: string, maxLength = 255): string {
  if (typeof value !== "string" || !value.trim()) throw new ProcurementDomainError(`${label} là bắt buộc`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new ProcurementDomainError(`${label} vượt quá ${maxLength} ký tự`);
  return normalized;
}

function optionalText(value: unknown, label: string, maxLength = 2000): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredText(value, label, maxLength);
}

function nonNegativeNumber(value: unknown, label: string, maximum = 1_000_000_000_000): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum) {
    throw new ProcurementDomainError(`${label} không hợp lệ`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, label: string, maximum = Number.MAX_SAFE_INTEGER): number {
  const parsed = nonNegativeNumber(value, label, maximum);
  if (!Number.isSafeInteger(parsed)) throw new ProcurementDomainError(`${label} phải là số nguyên an toàn`);
  return parsed;
}

export function validateSupplierInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ProcurementDomainError("Dữ liệu nhà cung cấp không hợp lệ");
  const source = input as Record<string, unknown>;
  const paymentTerms = source.paymentTerms === undefined ? "NET30" : requiredText(source.paymentTerms, "Điều khoản thanh toán", 20).toUpperCase();
  if (!PAYMENT_TERMS.has(paymentTerms)) throw new ProcurementDomainError("Điều khoản thanh toán không được hỗ trợ");
  const email = optionalText(source.email, "Email", 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ProcurementDomainError("Email không hợp lệ");

  return {
    code: requiredText(source.code, "Mã nhà cung cấp", 64).toUpperCase(),
    name: requiredText(source.name, "Tên nhà cung cấp", 255),
    taxCode: requiredText(source.taxCode, "Mã số thuế", 32),
    contactPerson: optionalText(source.contactPerson, "Người liên hệ", 255),
    phone: optionalText(source.phone, "Số điện thoại", 50),
    email,
    address: optionalText(source.address, "Địa chỉ", 1000),
    paymentTerms,
    creditLimit: source.creditLimit === undefined ? 0 : nonNegativeNumber(source.creditLimit, "Hạn mức công nợ"),
    bankAccount: optionalText(source.bankAccount, "Số tài khoản", 100),
    bankName: optionalText(source.bankName, "Ngân hàng", 255),
  };
}

export function validatePurchaseOrderInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ProcurementDomainError("Dữ liệu đơn mua hàng không hợp lệ");
  const source = input as Record<string, unknown>;
  if (!Array.isArray(source.items) || source.items.length === 0 || source.items.length > 200) {
    throw new ProcurementDomainError("Đơn mua hàng cần từ 1 đến 200 dòng hàng");
  }

  const productIds = new Set<string>();
  const items = source.items.map((rawItem, index) => {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) throw new ProcurementDomainError(`Dòng hàng ${index + 1} không hợp lệ`);
    const item = rawItem as Record<string, unknown>;
    const productId = requiredText(item.productId, `Sản phẩm dòng ${index + 1}`, 128);
    if (productIds.has(productId)) throw new ProcurementDomainError("Một sản phẩm chỉ được xuất hiện một lần trong PO");
    productIds.add(productId);
    const orderedQty = nonNegativeInteger(item.orderedQty, `Số lượng dòng ${index + 1}`, 1_000_000_000);
    if (orderedQty <= 0) throw new ProcurementDomainError(`Số lượng dòng ${index + 1} phải lớn hơn 0`);
    return {
      productId,
      orderedQty,
      unitPrice: nonNegativeInteger(item.unitPrice, `Đơn giá dòng ${index + 1}`),
      note: optionalText(item.note, `Ghi chú dòng ${index + 1}`, 1000),
    };
  });

  let expectedDeliveryDate: string | undefined;
  if (source.expectedDeliveryDate !== undefined && source.expectedDeliveryDate !== null && source.expectedDeliveryDate !== "") {
    if (typeof source.expectedDeliveryDate !== "string" || Number.isNaN(Date.parse(source.expectedDeliveryDate))) {
      throw new ProcurementDomainError("Ngày giao dự kiến không hợp lệ");
    }
    expectedDeliveryDate = source.expectedDeliveryDate;
  }
  const paymentTerms = source.paymentTerms === undefined ? undefined : requiredText(source.paymentTerms, "Điều khoản thanh toán", 20).toUpperCase();
  if (paymentTerms && !PAYMENT_TERMS.has(paymentTerms)) throw new ProcurementDomainError("Điều khoản thanh toán không được hỗ trợ");
  const vatRate = source.vatRate === undefined ? undefined : nonNegativeInteger(source.vatRate, "Thuế suất VAT", 100);

  return {
    supplierId: requiredText(source.supplierId, "Nhà cung cấp", 128),
    expectedDeliveryDate,
    paymentTerms,
    note: optionalText(source.note, "Ghi chú", 2000),
    vatRate,
    items,
  };
}

/** Calculate integer VND values without binary floating-point money arithmetic. */
export function calculatePurchaseOrderVnd(items: Array<{ orderedQty: number; unitPrice: number }>, vatRate: number) {
  let total = BigInt(0);
  const lines = items.map((item) => {
    if (!Number.isSafeInteger(item.orderedQty) || !Number.isSafeInteger(item.unitPrice)) {
      throw new ProcurementDomainError("Số lượng và đơn giá phải là số nguyên an toàn");
    }
    const line = BigInt(item.orderedQty) * BigInt(item.unitPrice);
    total += line;
    return line;
  });
  const vat = (total * BigInt(vatRate) + BigInt(50)) / BigInt(100);
  const grand = total + vat;
  for (const value of [...lines, total, vat, grand]) {
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new ProcurementDomainError("Giá trị PO vượt giới hạn an toàn");
  }
  return { lineAmounts: lines.map(Number), totalAmount: Number(total), vatAmount: Number(vat), grandTotal: Number(grand) };
}

export function vndDifference(left: number, right: number): number {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) {
    throw new ProcurementDomainError("Dữ liệu tiền tệ phải là số nguyên VND an toàn", 409);
  }
  const difference = BigInt(left) - BigInt(right);
  return Number(difference < BigInt(0) ? -difference : difference);
}
