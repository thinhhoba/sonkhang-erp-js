// File: src/app/api/hr/payroll/export-misa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MisaService } from "@/services/misa.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const monthYear = searchParams.get("monthYear");

    if (!monthYear) {
      return NextResponse.json({ error: "Thiếu tham số monthYear" }, { status: 400 });
    }

    const excelBuffer = await MisaService.exportPayrollToExcel(monthYear);

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Bang_Luong_MISA_${monthYear}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Lỗi xuất Excel MISA:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tạo file MISA" },
      { status: 500 }
    );
  }
}