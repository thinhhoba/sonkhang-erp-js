export const MANAGEABLE_EMPLOYEE_ROLES = [
  "ADMIN",
  "ACCOUNTANT",
  "DISPATCHER",
  "WAREHOUSE",
  "SALES",
  "DRIVER",
] as const;

export type ManageableEmployeeRole = (typeof MANAGEABLE_EMPLOYEE_ROLES)[number];

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

export interface EmployeeInput {
  code?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  avatarUrl?: unknown;
  role?: unknown;
  isActive?: unknown;
}

export type ValidatedEmployeeInput = {
  code?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  role?: ManageableEmployeeRole;
  isActive?: boolean;
};

function text(value: unknown, label: string, required = false, max = 160): string | undefined {
  if (value === undefined) {
    if (required) throw new SettingsValidationError(`${label} là bắt buộc.`);
    return undefined;
  }
  if (typeof value !== "string") throw new SettingsValidationError(`${label} không hợp lệ.`);
  const normalized = value.trim();
  if (!normalized && required) throw new SettingsValidationError(`${label} là bắt buộc.`);
  if (normalized.length > max) throw new SettingsValidationError(`${label} vượt quá ${max} ký tự.`);
  return normalized;
}

function email(value: unknown, required = false): string | undefined {
  const normalized = text(value, "Email", required, 254)?.toLowerCase();
  if (normalized && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new SettingsValidationError("Email không hợp lệ.");
  }
  return normalized;
}

export function validateEmployeeInput(input: EmployeeInput, options: { create?: boolean } = {}): ValidatedEmployeeInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new SettingsValidationError("Dữ liệu nhân viên không hợp lệ.");
  }
  const create = Boolean(options.create);
  const role = input.role === undefined ? undefined : text(input.role, "Vai trò", true, 32);
  if (role !== undefined && !MANAGEABLE_EMPLOYEE_ROLES.includes(role as ManageableEmployeeRole)) {
    throw new SettingsValidationError("Vai trò không hợp lệ.");
  }
  if (input.isActive !== undefined && typeof input.isActive !== "boolean") {
    throw new SettingsValidationError("Trạng thái hoạt động không hợp lệ.");
  }
  const avatarUrl = text(input.avatarUrl, "URL ảnh đại diện", false, 2048);
  if (avatarUrl && !/^https:\/\//i.test(avatarUrl)) {
    throw new SettingsValidationError("URL ảnh đại diện phải sử dụng HTTPS.");
  }
  return {
    // Any present identifier is required to be non-empty, including PATCH.
    code: text(input.code, "Mã nhân viên", create || input.code !== undefined, 48),
    fullName: text(input.fullName, "Họ và tên", create || input.fullName !== undefined, 160),
    email: email(input.email, create || input.email !== undefined),
    phone: text(input.phone, "Số điện thoại", create || input.phone !== undefined, 32),
    avatarUrl: avatarUrl === undefined ? undefined : avatarUrl || null,
    role: role as ManageableEmployeeRole | undefined,
    isActive: input.isActive,
  };
}

export function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}
