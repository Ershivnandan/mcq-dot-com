import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AIService } from "@/server/services/ai.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const drafts = await AIService.getDrafts(user.id);
    return NextResponse.json(drafts);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();
    const result = await AIService.clearPendingDrafts(user.id);
    return NextResponse.json({
      success: true,
      message: "All pending drafts cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
