import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AnalyticsService } from "@/server/services/analytics.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const metrics = await AnalyticsService.getDashboardMetrics(user.id);
    return NextResponse.json(metrics);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch analytics." }, { status });
  }
}
