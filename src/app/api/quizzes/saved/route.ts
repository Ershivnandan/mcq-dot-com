import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const saved = await QuizService.getSavedQuizzes(user.id);
    return NextResponse.json(saved);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch saved quizzes." }, { status });
  }
}
