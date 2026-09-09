import { NextResponse } from "next/server";

export async function GET() {
  // Categories removed: month-wise division used instead
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({ error: "Categories have been deprecated and replaced with month-wise division" }, { status: 410 });
}
