import { NextRequest, NextResponse } from "next/server";
import { MisaService } from "@/services/misa.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const monthYear = searchParams.get("monthYear");

    let fromDate: Date;
    let toDate: Date;

    if (monthYear) {
      fromDate = dayjs(`${monthYear}-01`).startOf("month").toDate();
      toDate = dayjs(`${monthYear}-01`).endOf("month").toDate();
    } else {
      fromDate = dayjs().startOf("month").toDate();
      toDate = dayjs().endOf("month").toDate();
    }

    const excelBuffer = await MisaService.exportSalesOrdersToExcel(fromDate, toDate);

    const filename = `Chung_Tu_Ban_Hang_MISA_${monthYear || dayjs().format("YYYY-MM")}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Lỗi xuất Excel Bán hàng MISA:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tạo file MISA" },
      { status: 500 }
    );
  }
}
