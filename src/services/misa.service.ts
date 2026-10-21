// File: src/services/misa.service.ts
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export class MisaService {
  /**
   * 1. XUẤT BẢNG TÍNH LƯƠNG & CHỨNG TỪ HẠCH TOÁN CHI PHÍ LƯƠNG SANG EXCEL MISA
   * Mẫu: Bảng thanh toán tiền lương & hạch toán chi phí (Nợ 6411/6421 - Có 3341)
   */
  static async exportPayrollToExcel(monthYear: string): Promise<Buffer> {
    // Lấy các bản ghi lương của tháng (chỉ lấy các bản ghi đã CONFIRMED hoặc PAID)
    const payrolls = await prisma.monthlyPayroll.findMany({
      where: {
        monthYear,
        status: { in: ["CONFIRMED", "PAID"] },
      },
      include: {
        employee: true,
      },
      orderBy: {
        employee: { code: "asc" },
      },
    });

    if (payrolls.length === 0) {
      throw new Error(`Không có dữ liệu bảng lương đã chốt (CONFIRMED) cho tháng ${monthYear}`);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Son Khang ERP V6";
    workbook.created = new Date();

    // Sheet 1: Bảng thanh toán tiền lương chi tiết
    const salarySheet = workbook.addWorksheet("Bang_Luong_Chi_Tiet", {
      views: [{ showGridLines: true }],
    });

    // Cấu hình tiêu đề cột
    salarySheet.columns = [
      { header: "Mã nhân viên (*)", key: "empCode", width: 16 },
      { header: "Tên nhân viên", key: "empName", width: 25 },
      { header: "Bộ phận / Vị trí", key: "role", width: 16 },
      { header: "Ngày công thực tế", key: "workDays", width: 16 },
      { header: "Lương cơ bản", key: "baseSalary", width: 16 },
      { header: "Số chuyến Tera V6", key: "tripsCount", width: 16 },
      { header: "Sản lượng giao (Kg)", key: "deliveredKg", width: 18 },
      { header: "Lương chuyến & năng suất", key: "tripSalary", width: 22 },
      { header: "Phụ cấp", key: "allowance", width: 14 },
      { header: "Thưởng", key: "bonus", width: 14 },
      { header: "Tạm ứng", key: "advance", width: 14 },
      { header: "Khấu trừ phạt", key: "penalty", width: 14 },
      { header: "Thực lĩnh (*)", key: "netSalary", width: 18 },
    ];

    // Định dạng dòng tiêu đề
    salarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    salarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F497D" }, // Màu xanh MISA
    };
    salarySheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    // Đổ dữ liệu nhân viên
    payrolls.forEach((p) => {
      salarySheet.addRow({
        empCode: p.employee.code,
        empName: p.employee.fullName,
        role: p.employee.role,
        workDays: p.totalWorkDays,
        baseSalary: p.baseSalaryEarned,
        tripsCount: p.totalTripsCount,
        deliveredKg: p.totalDeliveredKg,
        tripSalary: p.totalTripSalary,
        allowance: p.allowanceAmount,
        bonus: p.bonusAmount,
        advance: p.advanceDeducted,
        penalty: p.penaltyDeducted,
        netSalary: p.netSalary,
      });
    });

    // Sheet 2: Mẫu Chứng từ nghiệp vụ khác (Import hạch toán chi phí lương MISA)
    const journalSheet = workbook.addWorksheet("Chung_Tu_Hach_Toan_Luong", {
      views: [{ showGridLines: true }],
    });

    journalSheet.columns = [
      { header: "Ngày hạch toán (*)", key: "postedDate", width: 16 },
      { header: "Ngày chứng từ (*)", key: "docDate", width: 16 },
      { header: "Số chứng từ", key: "docNo", width: 16 },
      { header: "Diễn giải", key: "description", width: 35 },
      { header: "TK Nợ (*)", key: "debitAcc", width: 12 },
      { header: "TK Có (*)", key: "creditAcc", width: 12 },
      { header: "Số tiền (*)", key: "amount", width: 16 },
      { header: "Đối tượng (Mã NV) (*)", key: "objectCode", width: 18 },
      { header: "Tên đối tượng", key: "objectName", width: 25 },
    ];

    journalSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    journalSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF276A3C" }, // Màu xanh lá hạch toán
    };
    journalSheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    const endOfMonth = dayjs(`${monthYear}-01`).endOf("month").format("DD/MM/YYYY");
    const docNumber = `PKT-L-${monthYear.replace("-", "")}`;

    payrolls.forEach((p) => {
      // Xác định tài khoản chi phí: DRIVER/SALE đưa vào 6411 (hoặc 6421 tùy quyết định DN), bộ phận khác vào 6422
      const debitAccount = p.employee.role === "DRIVER" || p.employee.role === "SALE" ? "6411" : "6422";
      const totalCostEarned = p.baseSalaryEarned + p.totalTripSalary + p.allowanceAmount + p.bonusAmount;

      journalSheet.addRow({
        postedDate: endOfMonth,
        docDate: endOfMonth,
        docNo: docNumber,
        description: `Chi phí lương tháng ${monthYear} - ${p.employee.fullName}`,
        debitAcc: debitAccount,
        creditAcc: "3341",
        amount: totalCostEarned,
        objectCode: p.employee.code,
        objectName: p.employee.fullName,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 2. XUẤT CHỨNG TỪ BÁN HÀNG KIÊM XUẤT KHO SANG FILE EXCEL MISA
   * Mẫu: Chứng từ bán hàng kiêm phiếu xuất kho (Có sinh giá vốn Nợ 632/Có 1561)
   */
  static async exportSalesOrdersToExcel(fromDate: Date, toDate: Date): Promise<Buffer> {
    // Chỉ lấy các đơn đã giao thành công và chưa xuất MISA
    const orders = await prisma.salesOrder.findMany({
      where: {
        deliveryStatus: { in: ["DELIVERED", "PARTIAL"] },
        orderDate: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        tripStops: {
          include: { trip: true },
        },
      },
      orderBy: { orderDate: "asc" },
    });

    if (orders.length === 0) {
      throw new Error("Không có đơn hàng nào đủ điều kiện xuất khẩu MISA trong khoảng thời gian này!");
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Chung_Tu_Ban_Hang", {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: "Ngày hạch toán (*)", key: "postedDate", width: 15 },
      { header: "Ngày chứng từ (*)", key: "docDate", width: 15 },
      { header: "Số chứng từ (*)", key: "docNo", width: 16 },
      { header: "Mã khách hàng (*)", key: "customerCode", width: 16 },
      { header: "Tên khách hàng", key: "customerName", width: 30 },
      { header: "Địa chỉ", key: "address", width: 35 },
      { header: "Diễn giải", key: "reason", width: 30 },
      { header: "Mã hàng (*)", key: "itemCode", width: 16 },
      { header: "Tên hàng", key: "itemName", width: 30 },
      { header: "ĐVT", key: "unit", width: 10 },
      { header: "Mã kho (*)", key: "warehouseCode", width: 12 },
      { header: "Số lượng (*)", key: "qty", width: 12 },
      { header: "Đơn giá bán", key: "salePrice", width: 14 },
      { header: "Thành tiền bán (*)", key: "saleAmount", width: 16 },
      { header: "TK Doanh thu (*)", key: "creditAccRev", width: 14 },
      { header: "TK Công nợ/Tiền (*)", key: "debitAccRec", width: 16 },
      { header: "Đơn giá vốn", key: "costPrice", width: 14 },
      { header: "Thành tiền giá vốn", key: "costAmount", width: 16 },
      { header: "TK Giá vốn (*)", key: "debitAccCost", width: 14 },
      { header: "TK Kho (*)", key: "creditAccStock", width: 14 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF004B87" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    orders.forEach((order) => {
      const orderDateFormatted = dayjs(order.orderDate).format("DD/MM/YYYY");
      const customerMisaCode = order.misaCustomerCode || `KH_${order.orderCode}`;

      // Xác định tài khoản nợ tiền bán dựa vào thu tiền thực tế
      const latestStop = order.tripStops[0];
      let debitAccountRevenue = "131"; // Mặc định công nợ nếu khách ký nợ
      if (latestStop) {
        if (latestStop.cashCollected > 0 && latestStop.transferCollected === 0) {
          debitAccountRevenue = "1111"; // Tiền mặt tài xế cầm nộp về
        } else if (latestStop.transferCollected > 0 && latestStop.cashCollected === 0) {
          debitAccountRevenue = "1121"; // Khách chuyển khoản
        }
      }

      order.items.forEach((item) => {
        const actualQty = item.deliveredQty > 0 ? item.deliveredQty : item.orderedQty;
        if (actualQty <= 0) return; // Bỏ qua nếu khách không nhận cái nào

        const itemCodeMisa = item.product.misaItemCode || item.product.sku;
        const lineSaleAmount = actualQty * item.unitPrice;
        const lineCostAmount = actualQty * item.product.avgCostPrice;

        sheet.addRow({
          postedDate: orderDateFormatted,
          docDate: orderDateFormatted,
          docNo: `BH-${order.orderCode}`,
          customerCode: customerMisaCode,
          customerName: order.customerName,
          address: order.shippingAddress,
          reason: `Xuất bán đơn hàng Sapo ${order.orderCode}`,
          itemCode: itemCodeMisa,
          itemName: item.product.name,
          unit: item.product.baseUnit,
          warehouseCode: "KHO_CHINH", // Kho chuẩn MISA
          qty: actualQty,
          salePrice: item.unitPrice,
          saleAmount: lineSaleAmount,
          creditAccRev: "5111",
          debitAccRec: debitAccountRevenue,
          costPrice: item.product.avgCostPrice,
          costAmount: lineCostAmount,
          debitAccCost: "632",
          creditAccStock: "1561",
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 3. [THỬ NGHIỆM - EXPERIMENTAL] XUẤT CHỨNG TỪ XML ĐỂ IMPORT VÀO MISA.
   *
   * CẢNH BÁO VẬN HÀNH: cấu trúc XML dưới đây là format nội bộ tự chế,
   * CHƯA đối chiếu XSD schema import chính thức của MISA SME 2023/2026
   * nên có thể bị MISA từ chối khi import.
   * Luồng vận hành chính thức: dùng `exportSalesOrdersToExcel()` /
   * `exportPayrollToExcel()` (Excel khớp cột import MISA SME) để kế toán
   * vận hành ngay. Chỉ dùng hàm này để test nội bộ cho tới khi có XSD chuẩn.
   */
  static MISA_XML_EXPERIMENTAL = true;
  static generateMisaXmlInvoice(order: any): string {
    const docDate = dayjs(order.orderDate).format("YYYY-MM-DD");
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<Voucher>\n`;
    xml += `  <VoucherType>SA_Invoice</VoucherType>\n`;
    xml += `  <VoucherNo>BH-${order.orderCode}</VoucherNo>\n`;
    xml += `  <VoucherDate>${docDate}</VoucherDate>\n`;
    xml += `  <CustomerCode>${order.misaCustomerCode || "KH_LE"}</CustomerCode>\n`;
    xml += `  <CustomerName><![CDATA[${order.customerName}]]></CustomerName>\n`;
    xml += `  <Address><![CDATA[${order.shippingAddress}]]></Address>\n`;
    xml += `  <Details>\n`;

    order.items.forEach((item: any, idx: number) => {
      const actualQty = item.deliveredQty > 0 ? item.deliveredQty : item.orderedQty;
      xml += `    <Detail>\n`;
      xml += `      <SortOrder>${idx + 1}</SortOrder>\n`;
      xml += `      <ItemCode>${item.product.misaItemCode || item.product.sku}</ItemCode>\n`;
      xml += `      <Quantity>${actualQty}</Quantity>\n`;
      xml += `      <UnitPrice>${item.unitPrice}</UnitPrice>\n`;
      xml += `      <Amount>${actualQty * item.unitPrice}</Amount>\n`;
      xml += `      <DebitAccount>131</DebitAccount>\n`;
      xml += `      <CreditAccount>5111</CreditAccount>\n`;
      xml += `      <CostAccount>632</CostAccount>\n`;
      xml += `      <StockAccount>1561</StockAccount>\n`;
      xml += `    </Detail>\n`;
    });

    xml += `  </Details>\n`;
    xml += `</Voucher>`;
    return xml;
  }
}