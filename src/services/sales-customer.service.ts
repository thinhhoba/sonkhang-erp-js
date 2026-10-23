import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class SalesCustomerDomainError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); this.name = "SalesCustomerDomainError"; }
}

export type CustomerInput = {
  customerCode?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  ward?: string;
  city?: string;
  creditLimit?: number;
  paymentTerms?: string;
  maxOverdueDays?: number;
  isBlocked?: boolean;
};

function cleanText(value: unknown, max: number, label: string, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new SalesCustomerDomainError(`${label} là bắt buộc`);
    return undefined;
  }
  if (typeof value !== "string") throw new SalesCustomerDomainError(`${label} không hợp lệ`);
  const result = value.trim();
  if (required && !result) throw new SalesCustomerDomainError(`${label} là bắt buộc`);
  if (result.length > max) throw new SalesCustomerDomainError(`${label} vượt quá ${max} ký tự`);
  return result || undefined;
}

function vnd(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new SalesCustomerDomainError("Hạn mức phải là số nguyên VND không âm");
  }
  return value;
}

function days(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 3650) {
    throw new SalesCustomerDomainError("Số ngày quá hạn không hợp lệ");
  }
  return value;
}

function validate(input: CustomerInput, isCreate: boolean) {
  const name = cleanText(input.name, 160, "Tên khách hàng", isCreate);
  const customerCode = cleanText(input.customerCode, 64, "Mã khách hàng");
  const phone = cleanText(input.phone, 32, "Số điện thoại");
  const email = cleanText(input.email, 254, "Email");
  const address = cleanText(input.address, 500, "Địa chỉ");
  const district = cleanText(input.district, 120, "Quận/huyện");
  const ward = cleanText(input.ward, 120, "Phường/xã");
  const city = cleanText(input.city, 120, "Tỉnh/thành phố");
  const paymentTerms = cleanText(input.paymentTerms, 32, "Điều khoản thanh toán");
  if (paymentTerms && !["COD", "NET15", "NET30", "NET45", "NET60"].includes(paymentTerms)) {
    throw new SalesCustomerDomainError("Điều khoản thanh toán không được hỗ trợ");
  }
  if (input.isBlocked !== undefined && typeof input.isBlocked !== "boolean") throw new SalesCustomerDomainError("Trạng thái khóa nợ không hợp lệ");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SalesCustomerDomainError("Email không hợp lệ");
  return { name, customerCode, phone, email, address, district, ward, city, paymentTerms, creditLimit: vnd(input.creditLimit), maxOverdueDays: days(input.maxOverdueDays), isBlocked: input.isBlocked };
}

function auditSnapshot(customer: { customerCode: string; name: string; phone?: string | null; email?: string | null; address?: string | null; district?: string | null; ward?: string | null; city?: string | null; creditLimit: number; paymentTerms: string; maxOverdueDays: number; isBlocked: boolean }) {
  return { customerCode: customer.customerCode, name: customer.name, phone: customer.phone ?? null, email: customer.email ?? null, address: customer.address ?? null, district: customer.district ?? null, ward: customer.ward ?? null, city: customer.city ?? null, creditLimit: customer.creditLimit, paymentTerms: customer.paymentTerms, maxOverdueDays: customer.maxOverdueDays, isBlocked: customer.isBlocked };
}

export class SalesCustomerService {
  static async create(input: CustomerInput, actorId: string) {
    const data = validate(input, true);
    const customerCode = data.customerCode || `KH-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: { customerCode, name: data.name!, phone: data.phone, email: data.email, address: data.address, district: data.district, ward: data.ward, city: data.city || "TP. Hồ Chí Minh", creditLimit: data.creditLimit ?? 20_000_000, paymentTerms: data.paymentTerms || "NET30", maxOverdueDays: data.maxOverdueDays ?? 30, isBlocked: data.isBlocked ?? false },
      });
      await tx.auditLog.create({ data: { employeeId: actorId, action: "CREATE_SALES_CUSTOMER", targetId: customer.id, newValue: JSON.stringify(auditSnapshot(customer)) } });
      return customer;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  static async update(id: string, input: CustomerInput, actorId: string) {
    const data = validate(input, false);
    if (!Object.values(data).some((value) => value !== undefined)) throw new SalesCustomerDomainError("Không có dữ liệu cần cập nhật");
    return prisma.$transaction(async (tx) => {
      const current = await tx.customer.findUnique({ where: { id }, select: { id: true, customerCode: true, name: true, phone: true, email: true, address: true, district: true, ward: true, city: true, creditLimit: true, paymentTerms: true, maxOverdueDays: true, isBlocked: true } });
      if (!current) throw new SalesCustomerDomainError("Không tìm thấy khách hàng", 404);
      const customer = await tx.customer.update({ where: { id }, data: { name: data.name, phone: data.phone, email: data.email, address: data.address, district: data.district, ward: data.ward, city: data.city, creditLimit: data.creditLimit, paymentTerms: data.paymentTerms, maxOverdueDays: data.maxOverdueDays, isBlocked: data.isBlocked } });
      await tx.auditLog.create({ data: { employeeId: actorId, action: "UPDATE_SALES_CUSTOMER", targetId: id, oldValue: JSON.stringify(auditSnapshot(current)), newValue: JSON.stringify(auditSnapshot(customer)) } });
      return customer;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
