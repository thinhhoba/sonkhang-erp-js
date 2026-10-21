import { NextResponse } from "next/server";

// Endpoint cũ đã hợp nhất về POST /api/driver/trips/[id]/stops/[stopId]/complete.
// Giữ stub trả 410 để client cũ không gọi nhầm.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Endpoint đã hợp nhất. Hãy dùng POST /api/driver/trips/[tripId]/stops/[stopId]/complete",
    },
    { status: 410 }
  );
}
