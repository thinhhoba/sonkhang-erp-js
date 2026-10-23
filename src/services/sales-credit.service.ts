import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class SalesCreditDomainError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "SalesCreditDomainError";
  }
}

export type CreditDecision = "APPROVE" | "REJECT";

/**
 * Credit exceptions are a state transition, not an editable order property.
 * This uses a conditional write so that a replayed or concurrent approval
 * cannot silently replace the original approver/audit record.
 */
export class SalesCreditService {
  static async decide(orderId: string, decision: CreditDecision, actorId: string, note?: string) {
    if (!orderId || !actorId) throw new SalesCreditDomainError("Thiếu định danh đơn hàng hoặc người phê duyệt");
    if (!note?.trim()) throw new SalesCreditDomainError("Cần nêu lý do phê duyệt hoặc từ chối");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.salesOrder.updateMany({
        where: { id: orderId, requiresCreditApproval: true, creditApprovalStatus: "PENDING_APPROVAL" },
        data: {
          requiresCreditApproval: decision === "REJECT",
          creditApprovalStatus: decision === "APPROVE" ? "APPROVED" : "REJECTED",
          creditApprovalNote: note.trim(),
          creditApprovedById: actorId,
        },
      });

      if (updated.count !== 1) {
        const order = await tx.salesOrder.findUnique({
          where: { id: orderId },
          select: { id: true, creditApprovalStatus: true, requiresCreditApproval: true },
        });
        if (!order) throw new SalesCreditDomainError("Không tìm thấy đơn hàng", 404);
        throw new SalesCreditDomainError("Yêu cầu duyệt đã được xử lý hoặc không còn hợp lệ", 409);
      }

      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        select: { id: true, orderCode: true, creditApprovalStatus: true, requiresCreditApproval: true, creditApprovalNote: true, creditApprovedById: true },
      });
      if (!order) throw new SalesCreditDomainError("Không tìm thấy đơn hàng", 404);

      await tx.auditLog.create({
        data: {
          employeeId: actorId,
          action: decision === "APPROVE" ? "APPROVE_SALES_CREDIT" : "REJECT_SALES_CREDIT",
          targetId: orderId,
          oldValue: JSON.stringify({ creditApprovalStatus: "PENDING_APPROVAL", requiresCreditApproval: true }),
          newValue: JSON.stringify({ creditApprovalStatus: order.creditApprovalStatus, requiresCreditApproval: order.requiresCreditApproval }),
          note: note.trim(),
        },
      });
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
