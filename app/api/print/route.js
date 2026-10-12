import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Printing is temporarily unavailable during the kiosk upgrade.",
    },
    { status: 503 },
  );
}
