import { NextResponse } from "next/server";

export async function GET() {
  // Collections removed per user request: folder categorization not needed
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({ error: "Collections have been removed per configuration" }, { status: 410 });
}
