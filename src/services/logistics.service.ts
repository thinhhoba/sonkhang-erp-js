import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { InventoryService } from "./inventory.service";
import { PayrollService } from "./payroll.service";
import { ForbiddenError } from "@/lib/http-errors";

export interface CreateTripInput {
  actorId: string;
  driverId: string;
  vehiclePlate?: string;
  plannedDurationMin?: number;
  orderIds: string[];
}

export interface CompleteStopInput {
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  actualDeliveredKg?: number;
  cashCollected?: number;
  transferCollected?: number;
  debtSigned?: number;
  proofImageUrl?: string;
  failOrPartialReason?: string;
  itemsReturned?: Array<{
    salesOrderItemId: string;
    returnedQty: number;
  }>;
}

export interface TripActor {
  id: string;
  role?: string;
}

const TRIP_OPERATORS = new Set(["ADMIN", "DISPATCHER"]);
const TERMINAL_STOP_STATUSES = new Set(["SUCCESS", "PARTIAL", "FAILED"]);
const STOP_STATUSES = new Set(["SUCCESS", "PARTIAL", "FAILED"]);

function assertTripActor(trip: { driverId: string }, actor: TripActor) {
  if (actor.id === trip.driverId || (actor.role && TRIP_OPERATORS.has(actor.role))) {
    return;
  }
  throw new ForbiddenError("Không có quyền thao tác chuyến xe này!");
}

/** Runtime validation because route JSON is untyped at the trust boundary. */
export function validateCompleteStopInput(input: CompleteStopInput) {
  if (!STOP_STATUSES.has(input.status)) {
    throw new Error("Trạng thái hoàn thành điểm giao không hợp lệ!");
  }

  for (const [field, value] of Object.entries({
    actualDeliveredKg: input.actualDeliveredKg,
    cashCollected: input.cashCollected,
    transferCollected: input.transferCollected,
    debtSigned: input.debtSigned,
  })) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`${field} phải là số không âm hợp lệ!`);
    }
  }

  if (input.status !== "PARTIAL" && input.itemsReturned?.length) {
    throw new Error("Chỉ điểm giao một phần mới được khai báo hàng trả lại!");
  }

  if (input.status === "PARTIAL" && !input.itemsReturned?.length) {
    throw new Error("Giao một phần phải khai báo ít nhất một dòng hàng trả lại!");
  }

  const returnedItemIds = new Set<string>();
  for (const item of input.itemsReturned || []) {
    if (!item?.salesOrderItemId || !Number.isFinite(item.returnedQty) || item.returnedQty < 0) {
      throw new Error("Dòng hàng trả lại không hợp lệ!");
    }
    if (returnedItemIds.has(item.salesOrderItemId)) {
      throw new Error("Không được khai báo trùng dòng hàng trả lại!");
    }
    returnedItemIds.add(item.salesOrderItemId);
  }
}

type ReconciliationOrder = {
  codAmountRequired: number;
  totalWeightKg: number;
  items: Array<{ id: string; orderedQty: number; lineAmount: number; lineWeightKg: number }>;
};

const WEIGHT_TOLERANCE_KG = 0.001;

export function validateCompletionReconciliation(
  input: CompleteStopInput,
  order: ReconciliationOrder
): number {
  const collected = (input.cashCollected ?? 0) + (input.transferCollected ?? 0) + (input.debtSigned ?? 0);
  let expectedCollection = 0;

  if (input.status === "SUCCESS") {
    expectedCollection = order.codAmountRequired;
  } else if (input.status === "PARTIAL") {
    const returnedByItem = new Map(input.itemsReturned!.map((item) => [item.salesOrderItemId, item.returnedQty]));
    let orderedAmount = 0;
    let returnedAmount = 0;
    for (const item of order.items) {
      orderedAmount += item.lineAmount;
      const returnedQty = returnedByItem.get(item.id) ?? 0;
      if (returnedQty < 0 || returnedQty >= item.orderedQty) {
        throw new Error(`Số lượng trả lại (${returnedQty}) phải >= 0 và < số lượng đặt (${item.orderedQty})!`);
      }
      returnedAmount += item.lineAmount * (returnedQty / item.orderedQty);
    }
    if (returnedAmount <= 0 || orderedAmount <= 0) {
      throw new Error("Giao một phần phải có giá trị hàng trả lại hợp lệ!");
    }
    expectedCollection = order.codAmountRequired * ((orderedAmount - returnedAmount) / orderedAmount);
  }

  // Amounts are currently Float. A one-VND tolerance prevents representation
  // noise while still rejecting material COD discrepancies.
  if (Math.abs(collected - expectedCollection) > 1) {
    throw new Error("Tổng tiền mặt, chuyển khoản và công nợ ký nhận không khớp số phải thu!");
  }
  return expectedCollection;
}

export function validateDeliveredWeight(input: CompleteStopInput, order: ReconciliationOrder): number {
  const actualDeliveredKg = input.actualDeliveredKg ?? (input.status === "SUCCESS" ? order.totalWeightKg : 0);
  if (actualDeliveredKg > order.totalWeightKg + WEIGHT_TOLERANCE_KG) {
    throw new Error("Khối lượng thực giao không được vượt quá khối lượng đơn hàng!");
  }
  if (input.status === "FAILED" && actualDeliveredKg !== 0) {
    throw new Error("Giao thất bại phải có khối lượng thực giao bằng 0!");
  }
  if (input.status === "SUCCESS" && Math.abs(actualDeliveredKg - order.totalWeightKg) > WEIGHT_TOLERANCE_KG) {
    throw new Error("Giao thành công phải có khối lượng thực giao bằng khối lượng đơn hàng!");
  }
  if (input.status === "PARTIAL") {
    const returnedByItem = new Map(input.itemsReturned!.map((item) => [item.salesOrderItemId, item.returnedQty]));
    const expectedDeliveredKg = order.items.reduce((sum, item) => {
      const returnedQty = returnedByItem.get(item.id) ?? 0;
      return sum + item.lineWeightKg * ((item.orderedQty - returnedQty) / item.orderedQty);
    }, 0);
    if (actualDeliveredKg <= 0 || actualDeliveredKg >= order.totalWeightKg) {
      throw new Error("Giao một phần phải có khối lượng thực giao lớn hơn 0 và nhỏ hơn khối lượng đơn hàng!");
    }
    if (Math.abs(actualDeliveredKg - expectedDeliveredKg) > WEIGHT_TOLERANCE_KG) {
      throw new Error("Khối lượng thực giao không khớp với số lượng hàng trả lại!");
    }
  }
  return actualDeliveredKg;
}

type StopAuditSnapshot = {
  status: string;
  actualDeliveredKg: number;
  cashCollected: number;
  transferCollected: number;
  debtSigned: number;
  proofImageUrl: string | null;
  failOrPartialReason: string | null;
};

export function buildStopCompletionAudit(
  actorId: string,
  tripCode: string,
  stopId: string,
  before: StopAuditSnapshot,
  after: StopAuditSnapshot
) {
  return {
    employeeId: actorId,
    action: "COMPLETE_TRIP_STOP",
    targetId: stopId,
    oldValue: JSON.stringify(before),
    newValue: JSON.stringify(after),
    note: `Hoàn tất điểm giao ${stopId} của chuyến ${tripCode}: ${before.status} → ${after.status}`,
  };
}

export function isMatchingCompletionForReplay(
  stop: {
    status: string;
    actualDeliveredKg: number;
    cashCollected: number;
    transferCollected: number;
    debtSigned: number;
    proofImageUrl: string | null;
    failOrPartialReason: string | null;
    salesOrder: { totalWeightKg: number; items: Array<{ id: string; returnedQty: number }> };
  },
  input: CompleteStopInput
) {
  const actualDeliveredKg = input.actualDeliveredKg ?? (input.status === "SUCCESS" ? stop.salesOrder.totalWeightKg : 0);
  if (
    stop.status !== input.status ||
    stop.actualDeliveredKg !== actualDeliveredKg ||
    stop.cashCollected !== (input.cashCollected ?? 0) ||
    stop.transferCollected !== (input.transferCollected ?? 0) ||
    stop.debtSigned !== (input.debtSigned ?? 0) ||
    stop.proofImageUrl !== (input.proofImageUrl || null) ||
    stop.failOrPartialReason !== (input.failOrPartialReason || null)
  ) {
    return false;
  }
  const returnedByItem = new Map((input.itemsReturned || []).map((item) => [item.salesOrderItemId, item.returnedQty]));
  return stop.salesOrder.items.every((item) => item.returnedQty === (returnedByItem.get(item.id) ?? 0));
}

export class LogisticsService {
  /**
   * Tạo chuyến xe mới, gắn các đơn hàng đã chọn, xuất kho lên xe và cập nhật trạng thái đơn
   */
  static async createTrip(input: CreateTripInput) {
    const { driverId, vehiclePlate, plannedDurationMin = 180, orderIds, actorId } = input;

    if (!actorId || !orderIds || orderIds.length === 0) {
      throw new Error("Cần chọn ít nhất 1 đơn hàng để tạo chuyến!");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra tài xế
      const driver = await tx.employee.findUnique({
        where: { id: driverId },
      });
      if (!driver) throw new Error("Tài xế không tồn tại!");

      // 2. Sinh mã chuyến dạng TRIP-YYYYMMDD-XXX
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const tripCountToday = await tx.deliveryTrip.count({
        where: {
          tripCode: {
            startsWith: `TRIP-${todayStr}`,
          },
        },
      });
      const seqNumber = String(tripCountToday + 1).padStart(2, "0");
      const tripCode = `TRIP-${todayStr}-${seqNumber}`;

      // 3. Kiểm tra các đơn hàng
      const orders = await tx.salesOrder.findMany({
        where: { id: { in: orderIds } },
        include: { items: { include: { product: true } } },
      });

      if (orders.length !== orderIds.length) {
        throw new Error("Một số đơn hàng được chọn không tồn tại!");
      }

      for (const order of orders) {
        if (order.deliveryStatus === "IN_TRANSIT") {
          throw new Error(`Đơn hàng ${order.orderCode} đang trong một chuyến xe khác!`);
        }
        if (order.requiresCreditApproval && order.creditApprovalStatus !== "APPROVED") {
          throw new Error(
            `Đơn hàng ${order.orderCode} (Khách: ${order.customerName}) đang bị CẢNH BÁO CÔNG NỢ (${order.creditApprovalNote || "Vượt hạn mức"}). Cần Giám đốc phê duyệt đặc biệt trước khi tạo chuyến!`
          );
        }
      }

      // 4. Tạo bản ghi DeliveryTrip
      const trip = await tx.deliveryTrip.create({
        data: {
          tripCode,
          driverId,
          vehiclePlate: vehiclePlate || "Tera V6",
          plannedDurationMin,
          status: "DRAFT",
          stops: {
            create: orders.map((order, index) => ({
              salesOrderId: order.id,
              stopSequence: index + 1,
              status: "PENDING",
            })),
          },
        },
        include: {
          stops: {
            include: { salesOrder: true },
          },
          driver: true,
        },
      });

      // 5. Cập nhật trạng thái đơn hàng và xuất kho lên xe qua Single Source of Truth.
      // Mọi biến động kho BẮT BUỘC đi qua InventoryService.recordTransactionInTx.
      for (const order of orders) {
        await tx.salesOrder.update({
          where: { id: order.id },
          data: { deliveryStatus: "IN_TRANSIT" },
        });

        for (const item of order.items) {
          await InventoryService.recordTransactionInTx(tx, {
            productId: item.productId,
            type: "OUT_DISPATCH",
            referenceCode: tripCode,
            qtyChange: -item.orderedQty,
            inTransitChange: item.orderedQty,
            actorId,
            note: `Xuất kho lên xe Tera V6 chuyến ${tripCode} giao cho đơn ${order.orderCode}`,
          });
        }
      }

      return trip;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Tài xế bấm Xuất phát rời kho
   */
  static async departTrip(tripId: string, actor: TripActor) {
    const trip = await prisma.deliveryTrip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Chuyến xe không tồn tại!");
    assertTripActor(trip, actor);
    if (trip.status === "CLOSED") throw new Error("Chuyến xe đã được khóa sổ!");
    if (trip.status !== "DRAFT") throw new Error("Chuyến xe không ở trạng thái chờ xuất phát!");

    return await prisma.deliveryTrip.update({
      where: { id: tripId },
      data: {
        status: "ON_ROAD",
        departedAt: new Date(),
      },
    });
  }

  /**
   * Tài xế bấm Đã đến điểm giao
   */
  static async arriveAtStop(tripId: string, stopId: string, actor: TripActor) {
    const stop = await prisma.deliveryTripStop.findUnique({
      where: { id: stopId },
      include: { trip: true },
    });
    if (!stop) throw new Error("Điểm giao không tồn tại!");
    if (stop.tripId !== tripId) throw new Error("Điểm giao không thuộc chuyến xe này!");
    assertTripActor(stop.trip, actor);
    if (stop.trip.status === "CLOSED") throw new Error("Chuyến xe đã được khóa sổ!");
    if (stop.trip.status !== "ON_ROAD") throw new Error("Chuyến xe chưa ở trạng thái đang giao!");
    if (TERMINAL_STOP_STATUSES.has(stop.status)) {
      throw new Error("Điểm giao đã hoàn tất, không thể cập nhật!");
    }

    return await prisma.deliveryTripStop.update({
      where: { id: stopId },
      data: {
        arrivedAt: stop.arrivedAt || new Date(),
      },
    });
  }

  /**
   * Tài xế hoàn thành điểm giao (SUCCESS, PARTIAL, hoặc FAILED)
   */
  static async completeStop(
    tripId: string,
    stopId: string,
    input: CompleteStopInput,
    actor: TripActor
  ) {
    validateCompleteStopInput(input);
    return await prisma.$transaction(async (tx) => {
      const stop = await tx.deliveryTripStop.findUnique({
        where: { id: stopId },
        include: {
          trip: { include: { driver: true } },
          salesOrder: { include: { items: true } },
        },
      });

      if (!stop) throw new Error("Điểm giao không tồn tại!");
      if (stop.tripId !== tripId) throw new Error("Điểm giao không thuộc chuyến xe này!");
      assertTripActor(stop.trip, actor);
      if (stop.trip.status === "CLOSED") throw new Error("Chuyến xe đã được khóa sổ!");
      if (stop.trip.status !== "ON_ROAD") {
        throw new Error("Chuyến xe chưa ở trạng thái đang giao!");
      }
      const actualDeliveredKg = input.actualDeliveredKg ?? (input.status === "SUCCESS" ? stop.salesOrder.totalWeightKg : 0);
      const cashCollected = input.cashCollected ?? 0;
      const transferCollected = input.transferCollected ?? 0;
      const debtSigned = input.debtSigned ?? 0;

      if (TERMINAL_STOP_STATUSES.has(stop.status)) {
        if (isMatchingCompletionForReplay(stop, input)) return stop;
        throw new Error("Điểm giao đã hoàn tất với dữ liệu khác, không thể cập nhật!");
      }

      validateCompletionReconciliation(input, stop.salesOrder);
      validateDeliveredWeight(input, stop.salesOrder);

      // Validate all partial lines before claiming the stop, then claim it with
      // a conditional write so a duplicate/concurrent POST cannot post twice.
      if (input.status === "PARTIAL" && input.itemsReturned) {
        for (const ret of input.itemsReturned) {
          const targetItem = stop.salesOrder.items.find((i: any) => i.id === ret.salesOrderItemId);
          if (!targetItem) {
            throw new Error(`Dòng hàng ${ret.salesOrderItemId} không thuộc đơn này!`);
          }
          if (ret.returnedQty < 0 || ret.returnedQty >= targetItem.orderedQty) {
            throw new Error(
              `Số lượng trả lại (${ret.returnedQty}) phải >= 0 và < số lượng đặt (${targetItem.orderedQty})!`
            );
          }
        }
      }

      const claimedStop = await tx.deliveryTripStop.updateMany({
        where: { id: stopId, tripId, status: "PENDING" },
        data: {
          status: input.status,
          actualDeliveredKg,
          cashCollected,
          transferCollected,
          debtSigned,
          proofImageUrl: input.proofImageUrl || null,
          failOrPartialReason: input.failOrPartialReason || null,
          completedAt: new Date(),
        },
      });

      if (claimedStop.count !== 1) {
        const currentStop = await tx.deliveryTripStop.findUnique({
          where: { id: stopId },
          include: { salesOrder: { include: { items: true } } },
        });
        if (currentStop && isMatchingCompletionForReplay(currentStop, input)) return currentStop;
        throw new Error("Điểm giao đã hoàn tất với dữ liệu khác, không thể cập nhật!");
      }

      // deliveredQty = orderedQty - returnedQty (never decrement from zero).
      if (input.status === "PARTIAL" && input.itemsReturned) {
        for (const ret of input.itemsReturned) {
          const targetItem = stop.salesOrder.items.find((i: any) => i.id === ret.salesOrderItemId)!;
          await tx.salesOrderItem.update({
            where: { id: ret.salesOrderItemId },
            data: {
              returnedQty: ret.returnedQty,
              deliveredQty: targetItem.orderedQty - ret.returnedQty,
            },
          });
        }
      }

      const updatedStop = await tx.deliveryTripStop.findUniqueOrThrow({ where: { id: stopId } });

      // Cập nhật đơn hàng tương ứng
      let orderDeliveryStatus = "IN_TRANSIT";
      if (input.status === "SUCCESS") orderDeliveryStatus = "DELIVERED";
      else if (input.status === "PARTIAL") orderDeliveryStatus = "PARTIAL";
      else if (input.status === "FAILED") orderDeliveryStatus = "FAILED";

      await tx.salesOrder.update({
        where: { id: stop.salesOrderId },
        data: { deliveryStatus: orderDeliveryStatus },
      });

      // Tính toán lại tổng quan của chuyến xe
      const allStops = await tx.deliveryTripStop.findMany({
        where: { tripId: stop.tripId },
      });

      let totalSuccessStops = 0;
      let totalDeliveredKg = 0;
      let totalCashCollected = 0;
      let totalTransferCollected = 0;
      let totalDebtSigned = 0;
      let hasReturnGoods = false;

      for (const s of allStops) {
        if (s.status === "SUCCESS" || s.status === "PARTIAL") {
          totalSuccessStops += 1;
          totalDeliveredKg += s.actualDeliveredKg;
          totalCashCollected += s.cashCollected;
          totalTransferCollected += s.transferCollected;
          totalDebtSigned += s.debtSigned;
        }
        if (s.status === "FAILED" || s.status === "PARTIAL") {
          hasReturnGoods = true;
        }
      }

      const tripSalaryEarned = PayrollService.calculateTripSalary(
        stop.trip.driver.ratePerTrip,
        stop.trip.driver.ratePerStop,
        stop.trip.driver.ratePerKg,
        totalSuccessStops,
        totalDeliveredKg
      );

      await tx.deliveryTrip.update({
        where: { id: stop.tripId },
        data: {
          totalSuccessStops,
          totalDeliveredKg,
          totalCashCollected,
          totalTransferCollected,
          totalDebtSigned,
          hasReturnGoods,
          tripSalaryEarned,
        },
      });

      await tx.auditLog.create({
        data: buildStopCompletionAudit(actor.id, stop.trip.tripCode, stopId, stop, updatedStop),
      });

      return updatedStop;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Tài xế bấm Đã về tới kho
   */
  static async returnToWarehouse(tripId: string, actor: TripActor) {
    const trip = await prisma.deliveryTrip.findUnique({
      where: { id: tripId },
      include: { stops: true },
    });
    if (!trip) throw new Error("Chuyến xe không tồn tại!");
    assertTripActor(trip, actor);
    if (trip.status === "CLOSED") throw new Error("Chuyến xe đã được khóa sổ!");
    if (trip.status !== "ON_ROAD") {
      throw new Error("Chuyến xe chưa ở trạng thái đang giao!");
    }
    if (trip.stops.some((stop) => !TERMINAL_STOP_STATUSES.has(stop.status))) {
      throw new Error("Phải hoàn tất tất cả điểm giao trước khi về kho!");
    }

    return await prisma.deliveryTrip.update({
      where: { id: tripId },
      data: {
        status: "WAITING_SETTLE",
        returnedAt: new Date(),
      },
    });
  }

  /**
   * Kế toán xác nhận đã thu đủ tiền mặt COD vào két
   */
  static async settleCash(tripId: string, settledByUserId: string) {
    if (!settledByUserId) throw new Error("Thiếu tác nhân đối soát COD");
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.deliveryTrip.findUnique({ where: { id: tripId } });
      if (!trip) throw new Error("Chuyến xe không tồn tại!");
      if (trip.status !== "WAITING_SETTLE") throw new Error("Chuyến xe chưa ở trạng thái chờ đối soát COD!");
      if (trip.cashSettledAt) throw new Error("Chuyến xe đã được xác nhận thu tiền mặt COD!");

      const updated = await tx.deliveryTrip.update({
        where: { id: tripId },
        data: {
          cashSettledAt: new Date(),
          cashSettledById: settledByUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: settledByUserId,
          action: "SETTLE_CASH",
          targetId: tripId,
          note: `Xác nhận thu đủ ${trip.totalCashCollected.toLocaleString("vi-VN")}đ tiền mặt COD chuyến ${trip.tripCode}`,
        },
      });

      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Thủ kho xác nhận đã nhận lại đủ hàng hoàn trên xe về kho
   */
  static async settleReturnStock(tripId: string, settledByUserId: string) {
    if (!settledByUserId) throw new Error("Thiếu tác nhân đối soát hàng hoàn");
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.deliveryTrip.findUnique({
        where: { id: tripId },
        include: { stops: { include: { salesOrder: { include: { items: true } } } } },
      });
      if (!trip) throw new Error("Chuyến xe không tồn tại!");
      if (trip.status !== "WAITING_SETTLE") throw new Error("Chuyến xe chưa ở trạng thái chờ đối soát hàng hoàn!");
      if (trip.returnStockSettledAt) throw new Error("Chuyến xe đã được xác nhận nhận lại hàng hoàn!");
      if (!trip.stops.some((stop) => stop.status === "FAILED" || stop.status === "PARTIAL")) {
        throw new Error("Chuyến xe không có hàng hoàn cần đối soát!");
      }

      const updated = await tx.deliveryTrip.update({
        where: { id: tripId },
        data: {
          returnStockSettledAt: new Date(),
          returnSettledById: settledByUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          employeeId: settledByUserId,
          action: "SETTLE_RETURN_STOCK",
          targetId: tripId,
          note: `Thủ kho xác nhận kiểm đếm và nhận lại hàng rớt trên xe chuyến ${trip.tripCode}`,
        },
      });

      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Khóa sổ chuyến xe (gọi sang PayrollService)
   */
  static async closeTrip(tripId: string, settledByUserId: string) {
    return await PayrollService.settleAndCloseTrip(tripId, settledByUserId);
  }
}
