import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AIService } from "@/server/services/ai.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const stats = await AIService.getUsageStats(user.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch AI usage stats." }, { status });
  }
}
