import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));

import {
  isMatchingCompletionForReplay,
  buildStopCompletionAudit,
  validateCompletionReconciliation,
  validateCompleteStopInput,
  validateDeliveredWeight,
} from "@/services/logistics.service";

describe("delivery stop runtime validation", () => {
  it("rejects an unknown stop status from untrusted JSON", () => {
    expect(() => validateCompleteStopInput({ status: "CLOSED" as never })).toThrow(
      "Trạng thái hoàn thành điểm giao không hợp lệ!"
    );
  });

  it("rejects negative or non-finite financial values", () => {
    expect(() => validateCompleteStopInput({ status: "SUCCESS", cashCollected: -1 })).toThrow(
      "cashCollected phải là số không âm hợp lệ!"
    );
    expect(() => validateCompleteStopInput({ status: "SUCCESS", debtSigned: Number.NaN })).toThrow(
      "debtSigned phải là số không âm hợp lệ!"
    );
  });

  it("rejects duplicate returns and returns on a fully successful stop", () => {
    expect(() =>
      validateCompleteStopInput({
        status: "PARTIAL",
        itemsReturned: [
          { salesOrderItemId: "line-1", returnedQty: 1 },
          { salesOrderItemId: "line-1", returnedQty: 2 },
        ],
      })
    ).toThrow("Không được khai báo trùng dòng hàng trả lại!");

    expect(() =>
      validateCompleteStopInput({
        status: "SUCCESS",
        itemsReturned: [{ salesOrderItemId: "line-1", returnedQty: 1 }],
      })
    ).toThrow("Chỉ điểm giao một phần mới được khai báo hàng trả lại!");
  });

  it("requires a positive partial return and reconciles all collection methods", () => {
    expect(() => validateCompleteStopInput({ status: "PARTIAL", itemsReturned: [] })).toThrow(
      "Giao một phần phải khai báo ít nhất một dòng hàng trả lại!"
    );

    const order = {
      codAmountRequired: 1_000,
      totalWeightKg: 10,
      items: [
        { id: "a", orderedQty: 10, lineAmount: 1_000, lineWeightKg: 10 },
      ],
    };
    const partial = {
      status: "PARTIAL" as const,
      itemsReturned: [{ salesOrderItemId: "a", returnedQty: 2 }],
      cashCollected: 500,
      transferCollected: 200,
      debtSigned: 100,
    };
    expect(validateCompletionReconciliation(partial, order)).toBe(800);
    expect(() => validateCompletionReconciliation({ ...partial, debtSigned: 98 }, order)).toThrow(
      "không khớp số phải thu"
    );
    expect(() => validateCompletionReconciliation({ status: "FAILED", cashCollected: 2 }, order)).toThrow(
      "không khớp số phải thu"
    );
  });

  it("recognizes an exact terminal retry but rejects altered replay payloads", () => {
    const stored = {
      status: "SUCCESS",
      actualDeliveredKg: 10,
      cashCollected: 1_000,
      transferCollected: 0,
      debtSigned: 0,
      proofImageUrl: null,
      failOrPartialReason: null,
      salesOrder: { totalWeightKg: 10, items: [{ id: "a", returnedQty: 0 }] },
    };
    expect(isMatchingCompletionForReplay(stored, { status: "SUCCESS", cashCollected: 1_000 })).toBe(true);
    expect(isMatchingCompletionForReplay(stored, { status: "SUCCESS", cashCollected: 999 })).toBe(false);
  });

  it("caps delivered kg and keeps partial kg consistent with returned lines", () => {
    const order = {
      codAmountRequired: 1_000,
      totalWeightKg: 10,
      items: [{ id: "a", orderedQty: 10, lineAmount: 1_000, lineWeightKg: 10 }],
    };
    expect(() => validateDeliveredWeight({ status: "SUCCESS", actualDeliveredKg: 10.1 }, order)).toThrow(
      "không được vượt"
    );
    expect(() => validateDeliveredWeight({ status: "FAILED", actualDeliveredKg: 1 }, order)).toThrow(
      "bằng 0"
    );
    expect(() =>
      validateDeliveredWeight(
        { status: "PARTIAL", actualDeliveredKg: 7, itemsReturned: [{ salesOrderItemId: "a", returnedQty: 2 }] },
        order
      )
    ).toThrow("không khớp");
    expect(
      validateDeliveredWeight(
        { status: "PARTIAL", actualDeliveredKg: 8, itemsReturned: [{ salesOrderItemId: "a", returnedQty: 2 }] },
        order
      )
    ).toBe(8);
  });

  it("builds an actor-attributed audit payload with before/after snapshots", () => {
    const before = {
      status: "PENDING", actualDeliveredKg: 0, cashCollected: 0, transferCollected: 0,
      debtSigned: 0, proofImageUrl: null, failOrPartialReason: null,
    };
    const after = { ...before, status: "SUCCESS", actualDeliveredKg: 10, cashCollected: 1_000 };
    const audit = buildStopCompletionAudit("driver-a", "TRIP-1", "stop-1", before, after);
    expect(audit).toMatchObject({ employeeId: "driver-a", action: "COMPLETE_TRIP_STOP", targetId: "stop-1" });
    expect(JSON.parse(audit.oldValue)).toMatchObject({ status: "PENDING" });
    expect(JSON.parse(audit.newValue)).toMatchObject({ status: "SUCCESS", cashCollected: 1_000 });
  });
});
