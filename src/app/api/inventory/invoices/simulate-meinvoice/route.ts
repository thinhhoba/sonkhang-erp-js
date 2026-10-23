import { NextResponse } from "next/server";
import { MeInvoiceService, MisaInbotInvoicePayload } from "@/services/meinvoice.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { procurementErrorResponse } from "@/lib/procurement";

export const dynamic = "force-dynamic";

const SUPPLIERS_POOL = [
  {
    taxCode: "0312456789",
    name: "Công ty TNHH Thực phẩm Indomie Việt Nam",
    symbolPrefix: "1C26TIN",
    itemsPool: [
      {
        ItemName: "Mì xào Indomie Mi Goreng Đặc Biệt (Thùng 40 gói)",
        UnitName: "Thùng",
        quantity: 50,
        unitPrice: 240000,
      },
      {
        ItemName: "Mì xào Indomie Vị Sườn Nướng BBQ 85g (Thùng 40 gói)",
        UnitName: "Thùng",
        quantity: 25,
        unitPrice: 245000,
      },
      {
        ItemName: "Mì xào Indomie Vị Cay Siêu Cấp 80g (Thùng 40 gói)",
        UnitName: "Thùng",
        quantity: 20,
        unitPrice: 250000,
      },
    ],
  },
  {
    taxCode: "0109887766",
    name: "Công ty Cổ phần Nước Sốt & Gia Vị MEJE Quốc Tế",
    symbolPrefix: "1C26TME",
    itemsPool: [
      {
        ItemName: "Sốt Mayonnaise MEJE Thùng 12 Chai x 1Kg",
        UnitName: "Thùng",
        quantity: 15,
        unitPrice: 960000,
      },
      {
        ItemName: "Tương Cà Đậm Đà MEJE Can 5L",
        UnitName: "Can",
        quantity: 20,
        unitPrice: 155000,
      },
      {
        ItemName: "Sốt Phô Mai Chảy Cao Cấp MEJE Túi 1Kg",
        UnitName: "Túi",
        quantity: 30,
        unitPrice: 110000,
      },
    ],
  },
];

export async function POST() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT"]);
  if (forbidden) return forbidden;
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEMO_INVOICE_SIMULATION !== "true") {
    return NextResponse.json({ success: false, error: "Endpoint mô phỏng chưa được bật cho môi trường này" }, { status: 403 });
  }
  try {
    const supplier = SUPPLIERS_POOL[Math.floor(Math.random() * SUPPLIERS_POOL.length)];
    const randomInvNo = Math.floor(1000 + Math.random() * 9000);
    const invoiceId = `INBOT-INV-${Date.now()}-${randomInvNo}`;
    const invoiceNumber = String(randomInvNo).padStart(7, "0");
    const invoiceSymbol = supplier.symbolPrefix;

    // Chọn 1-3 mặt hàng
    const itemCount = Math.floor(Math.random() * 2) + 1;
    const shuffledItems = [...supplier.itemsPool].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    let totalSaleAmount = 0;
    const items = shuffledItems.map((item) => {
      const qty = Math.floor(Math.random() * 20) + 10;
      const amount = qty * item.unitPrice;
      totalSaleAmount += amount;
      return {
        ItemName: item.ItemName,
        UnitName: item.UnitName,
        Quantity: qty,
        UnitPrice: item.unitPrice,
        Amount: amount,
      };
    });

    const discountAmount = Math.round(totalSaleAmount * 0.02); // 2% chiết khấu
    const subTotalAfterDiscount = totalSaleAmount - discountAmount;
    const vatAmount = Math.round(subTotalAfterDiscount * 0.08); // 8% VAT
    const grandTotal = subTotalAfterDiscount + vatAmount;

    const payload: MisaInbotInvoicePayload = {
      InvoiceId: invoiceId,
      InvoiceNumber: invoiceNumber,
      InvoiceSymbol: invoiceSymbol,
      InvoiceDate: new Date().toISOString(),
      SellerTaxCode: supplier.taxCode,
      SellerName: supplier.name,
      TotalSaleAmount: totalSaleAmount,
      TotalDiscountAmount: discountAmount,
      TotalVATAmount: vatAmount,
      TotalAmount: grandTotal,
      XmlUrl: `https://inbot.misa.vn/xml/raw-${invoiceNumber}.xml`,
      Items: items,
    };

    const invoice = await MeInvoiceService.syncPurchaseInvoice(payload);

    return NextResponse.json({
      success: true,
      message: `Đã kéo thành công Hóa đơn số ${invoice.invoiceNumber} từ NCC ${invoice.supplierName}!`,
      data: invoice,
    });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[Simulate meInvoice]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
