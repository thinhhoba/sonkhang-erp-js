import { NextResponse } from "next/server";

// Endpoint cũ trùng với POST /api/driver/trips/[id]/return. Đã hợp nhất về /return.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Endpoint đã hợp nhất. Hãy dùng POST /api/driver/trips/[id]/return",
    },
    { status: 410 }
  );
}
