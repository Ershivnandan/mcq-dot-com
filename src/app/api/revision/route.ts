import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { SpacedRepetitionService } from "@/server/services/spaced-repetition.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const questions = await SpacedRepetitionService.getQuestionsDueToday(user.id);
    return NextResponse.json(questions);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch revision questions." }, { status });
  }
}
