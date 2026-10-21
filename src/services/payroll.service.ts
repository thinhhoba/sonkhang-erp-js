// File: src/services/payroll.service.ts
import prisma from "@/lib/prisma";
import { InventoryService } from "./inventory.service";

export class PayrollService {
  /**
   * 1. Tính toán trước tiền lương cho 1 chuyến xe (Snapshot)
   * Công thức: RateChuyến (30k) + (ĐiểmThànhCông * 5k) + (TổngKgThựcGiao * 250đ)
   */
  static calculateTripSalary(
    ratePerTrip: number,
    ratePerStop: number,
    ratePerKg: number,
    totalSuccessStops: number,
    totalDeliveredKg: number
  ): number {
    const tripFee = ratePerTrip;
    const stopFee = totalSuccessStops * ratePerStop;
    const kgFee = totalDeliveredKg * ratePerKg;
    return Math.round(tripFee + stopFee + kgFee);
  }

  /**
   * 2. Hoàn tất đối soát và Khóa sổ chuyến xe (CLOSED)
   * Điều kiện tiên quyết: Đã nộp tiền mặt COD + Đã đối soát hàng hoàn trên xe (nếu có)
   */
  static async settleAndCloseTrip(tripId: string, settledByUserId: string) {
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.deliveryTrip.findUnique({
        where: { id: tripId },
        include: {
          driver: true,
          stops: {
            include: {
              salesOrder: {
                include: { items: true },
              },
            },
          },
        },
      });

      if (!trip) throw new Error("Chuyến xe không tồn tại");
      if (trip.status === "CLOSED") throw new Error("Chuyến xe này đã được khóa sổ!");

      // Kiểm tra xem có điểm nào có hàng rớt lại không (FAILED hoặc PARTIAL)
      let hasReturnGoods: boolean = false;
      let totalSuccessStops = 0;
      let totalDeliveredKg = 0;
      let totalCash = 0;
      let totalTransfer = 0;
      let totalDebt = 0;

      for (const stop of trip.stops) {
        if (stop.status === "SUCCESS" || stop.status === "PARTIAL") {
          totalSuccessStops += 1;
          totalDeliveredKg += stop.actualDeliveredKg;
          totalCash += stop.cashCollected;
          totalTransfer += stop.transferCollected;
          totalDebt += stop.debtSigned;
        }

        if (stop.status === "FAILED" || stop.status === "PARTIAL") {
          hasReturnGoods = true;
        }
      }

      // Nếu có hàng trả lại mà Thủ kho chưa bấm xác nhận nhập lại kho
      if (hasReturnGoods && !trip.returnStockSettledAt) {
        throw new Error("Chuyến xe có hàng giao trượt/hoàn lại. Thủ kho phải bấm xác nhận nhận lại hàng trước khi đóng chuyến!");
      }

      // Nếu chưa xác nhận thu tiền mặt COD
      if (!trip.cashSettledAt) {
        throw new Error("Kế toán phải xác nhận đã thu đủ tiền COD trước khi đóng chuyến!");
      }

      // Hoàn kho cho các mặt hàng giao không hết — qua Single Source of Truth.
      // Thủ kho đã xác nhận returnStockSettledAt trước khi tới đây.
      for (const stop of trip.stops) {
        if (stop.status === "FAILED") {
          // Trả toàn bộ đơn hàng về kho & đưa đơn về trạng thái chờ xếp chuyến lại
          for (const item of stop.salesOrder.items) {
            await InventoryService.recordTransactionInTx(tx, {
              productId: item.productId,
              type: "IN_RETURN_TRIP",
              referenceCode: trip.tripCode,
              qtyChange: item.orderedQty,
              inTransitChange: -item.orderedQty,
              note: `Nhập lại kho hàng giao trượt chuyến ${trip.tripCode} đơn ${stop.salesOrder.orderCode}`,
            });
          }
          await tx.salesOrder.update({
            where: { id: stop.salesOrderId },
            data: { deliveryStatus: "WAITING_DISPATCH" },
          });
        } else if (stop.status === "PARTIAL") {
          // Trả phần hàng dư về kho
          for (const item of stop.salesOrder.items) {
            if (item.returnedQty > 0) {
              await InventoryService.recordTransactionInTx(tx, {
                productId: item.productId,
                type: "IN_RETURN_TRIP",
                referenceCode: trip.tripCode,
                qtyChange: item.returnedQty,
                inTransitChange: -item.returnedQty,
                note: `Nhập lại kho hàng hoàn 1 phần chuyến ${trip.tripCode} đơn ${stop.salesOrder.orderCode}`,
              });
            }
          }
          await tx.salesOrder.update({
            where: { id: stop.salesOrderId },
            data: { deliveryStatus: "PARTIAL" },
          });
        } else if (stop.status === "SUCCESS") {
          // Giảm inTransitStock vì khách đã nhận đủ (không đổi currentStock)
          for (const item of stop.salesOrder.items) {
            await InventoryService.recordTransactionInTx(tx, {
              productId: item.productId,
              type: "OUT_DISPATCH",
              referenceCode: trip.tripCode,
              qtyChange: 0,
              inTransitChange: -item.orderedQty,
              note: `Khách nhận đủ hàng chuyến ${trip.tripCode} đơn ${stop.salesOrder.orderCode}`,
            });
          }
          await tx.salesOrder.update({
            where: { id: stop.salesOrderId },
            data: { deliveryStatus: "DELIVERED" },
          });
        }
      }

      // Tính lương chuyến theo cấu hình của tài xế
      const tripSalaryEarned = this.calculateTripSalary(
        trip.driver.ratePerTrip,
        trip.driver.ratePerStop,
        trip.driver.ratePerKg,
        totalSuccessStops,
        totalDeliveredKg
      );

      // Cập nhật Chuyến xe sang CLOSED
      const updatedTrip = await tx.deliveryTrip.update({
        where: { id: trip.id },
        data: {
          status: "CLOSED",
          hasReturnGoods: hasReturnGoods as any,
          totalSuccessStops,
          totalDeliveredKg,
          totalCashCollected: totalCash,
          totalTransferCollected: totalTransfer,
          totalDebtSigned: totalDebt,
          tripSalaryEarned,
        },
      });

      // Ghi nhật ký AuditLog
      await tx.auditLog.create({
        data: {
          employeeId: settledByUserId,
          action: "SETTLE_AND_CLOSE_TRIP",
          targetId: trip.id,
          note: `Khóa sổ chuyến xe ${trip.tripCode}. Lương chuyến ghi nhận: ${tripSalaryEarned.toLocaleString("vi-VN")}đ`,
        },
      });

      return updatedTrip;
    });
  }

  /**
   * 3. Tổng hợp Bảng lương tháng tự động cho Tài xế
   * Quét toàn bộ chuyến xe CLOSED trong tháng + Ngày công thực tế
   */
  static async generateMonthlyPayroll(employeeId: string, monthYear: string) {
    return await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) throw new Error("Nhân viên không tồn tại");

      // Xác định ngày bắt đầu và kết thúc của tháng (VD: "2026-10")
      const [yearStr, monthStr] = monthYear.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Lấy toàn bộ chuyến xe CLOSED trong tháng của tài xế
      const closedTrips = await tx.deliveryTrip.findMany({
        where: {
          driverId: employeeId,
          status: "CLOSED",
          cashSettledAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalTripsCount = closedTrips.length;
      const totalStopsCount = closedTrips.reduce((sum, t) => sum + t.totalSuccessStops, 0);
      const totalDeliveredKg = closedTrips.reduce((sum, t) => sum + t.totalDeliveredKg, 0);
      const totalTripSalary = closedTrips.reduce((sum, t) => sum + t.tripSalaryEarned, 0);

      // Lấy ngày công từ bảng Attendance
      const attendances = await tx.attendance.findMany({
        where: {
          employeeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalWorkDays = attendances.reduce((sum, a) => sum + a.workDayValue, 0);
      const attendancePenalties = attendances.reduce((sum, a) => sum + a.penaltyAmount, 0);
      
      // Giả định 1 tháng chuẩn 26 ngày công
      const baseSalaryEarned = Math.round((employee.baseSalary / 26) * totalWorkDays);

      // Giữ nguyên các khoản đã nhập tay (phụ cấp / thưởng / tạm ứng).
      const existing = await tx.monthlyPayroll.findUnique({
        where: { employeeId_monthYear: { employeeId, monthYear } },
      });
      const allowanceAmount = existing?.allowanceAmount ?? 0;
      const bonusAmount = existing?.bonusAmount ?? 0;
      const advanceDeducted = existing?.advanceDeducted ?? 0;

      // Tạo hoặc cập nhật phiếu lương tháng
      return await tx.monthlyPayroll.upsert({
        where: {
          employeeId_monthYear: {
            employeeId,
            monthYear,
          },
        },
        create: {
          employeeId,
          monthYear,
          totalWorkDays,
          baseSalaryEarned,
          totalTripsCount,
          totalStopsCount,
          totalDeliveredKg,
          totalTripSalary,
          penaltyDeducted: attendancePenalties,
          netSalary: baseSalaryEarned + totalTripSalary - attendancePenalties,
          status: "DRAFT",
        },
        update: {
          totalWorkDays,
          baseSalaryEarned,
          totalTripsCount,
          totalStopsCount,
          totalDeliveredKg,
          totalTripSalary,
          penaltyDeducted: attendancePenalties,
          netSalary: baseSalaryEarned + totalTripSalary + allowanceAmount + bonusAmount - advanceDeducted - attendancePenalties,
        },
      });
    });
  }
}