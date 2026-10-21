// File: src/app/api/webhooks/sapo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SapoService } from "@/services/sapo.service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sapoHmac = req.headers.get("x-sapo-hmac-sha256");

    // Xác thực chữ ký nếu có cấu hình bí mật SAPO_WEBHOOK_SECRET
    if (process.env.SAPO_WEBHOOK_SECRET) {
      const isValid = SapoService.verifyWebhookSignature(rawBody, sapoHmac);
      if (!isValid) {
        return NextResponse.json(
          { error: "Chữ ký xác thực Webhook không hợp lệ" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);

    // Xử lý đơn hàng
    const order = await SapoService.syncOrderFromWebhook(payload);

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      totalWeightKg: order.totalWeightKg,
    });
  } catch (error: any) {
    console.error("Lỗi xử lý Sapo Webhook:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}