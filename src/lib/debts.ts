export type DebtSurface =
  | "overview"
  | "receivables"
  | "receivable-detail"
  | "payables"
  | "payable-detail"
  | "aging"
  | "credit-limits";

export type AgingBucket = "CURRENT" | "DUE_1_30" | "DUE_31_60" | "DUE_61_90" | "DUE_90_PLUS";

export interface DebtPagination {
  page: number;
  limit: number;
}

export const DEFAULT_DEBT_PAGE_SIZE = 20;
export const MAX_DEBT_PAGE_SIZE = 100;

export function parseDebtPagination(searchParams: URLSearchParams): DebtPagination | null {
  const rawPage = searchParams.get("page") || "1";
  const rawLimit = searchParams.get("limit") || String(DEFAULT_DEBT_PAGE_SIZE);
  if (!/^\d+$/.test(rawPage) || !/^\d+$/.test(rawLimit)) return null;
  const page = Number(rawPage);
  const limit = Number(rawLimit);
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || page < 1 || limit < 1 || limit > MAX_DEBT_PAGE_SIZE) {
    return null;
  }
  return { page, limit };
}

export interface AgingProjectionInput {
  id: string;
  code: string;
  name: string;
  balanceVnd: string;
  paymentTerms?: string | null;
  orderDate?: Date | string | null;
}

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Accept only an existing Gregorian calendar day, interpreted at UTC midnight. */
export function parseIsoDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const matched = ISO_DATE_ONLY.exec(value);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }
  return parsed;
}

/** Legacy Float money must be an integer VND within JS safe range before BigInt conversion. */
export function legacyMoneyToVnd(value: number, field: string): bigint {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${field} phải là số nguyên VND trong giới hạn an toàn.`);
  }
  return BigInt(value);
}

export function serializeVnd(value: bigint): string {
  return value.toString(10);
}

export interface AgingProjection extends AgingProjectionInput {
  dueDate: Date | null;
  daysPastDue: number;
  bucket: AgingBucket;
}

const RECEIVABLE_ROLES = ["ADMIN", "ACCOUNTANT", "SALES"] as const;
const PAYABLE_ROLES = ["ADMIN", "ACCOUNTANT"] as const;

/** Permission is duplicated at the API boundary; navigation visibility is not authorization. */
export function canAccessDebtSurface(role: string | undefined, surface: DebtSurface): boolean {
  if (!role) return false;
  if (surface === "payables" || surface === "payable-detail") {
    return PAYABLE_ROLES.includes(role as (typeof PAYABLE_ROLES)[number]);
  }
  return RECEIVABLE_ROLES.includes(role as (typeof RECEIVABLE_ROLES)[number]);
}

export function paymentTermDays(paymentTerms?: string | null): number {
  const normalized = (paymentTerms || "NET30").trim().toUpperCase();
  if (normalized === "COD" || normalized === "IMMEDIATE") return 0;
  const matched = /^NET(\d+)$/.exec(normalized);
  return matched ? Number(matched[1]) : 30;
}

export function agingBucketForDaysPastDue(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return "CURRENT";
  if (daysPastDue <= 30) return "DUE_1_30";
  if (daysPastDue <= 60) return "DUE_31_60";
  if (daysPastDue <= 90) return "DUE_61_90";
  return "DUE_90_PLUS";
}

/**
 * This is a risk projection, not an accounts-receivable ledger. The current
 * schema stores only a cached customer balance, so the complete balance is
 * classified using the oldest known sales-order date until an AR ledger and
 * payment allocation are introduced.
 */
export function projectAging(
  input: AgingProjectionInput,
  asOf: Date = new Date()
): AgingProjection {
  const orderDate = input.orderDate ? new Date(input.orderDate) : null;
  if (!orderDate || Number.isNaN(orderDate.getTime())) {
    return { ...input, dueDate: null, daysPastDue: 0, bucket: "CURRENT" };
  }

  const dueDate = new Date(orderDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + paymentTermDays(input.paymentTerms));
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysPastDue = Math.max(0, Math.floor((asOf.getTime() - dueDate.getTime()) / millisecondsPerDay));

  return {
    ...input,
    dueDate,
    daysPastDue,
    bucket: agingBucketForDaysPastDue(daysPastDue),
  };
}
