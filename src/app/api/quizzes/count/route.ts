import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const criteria = {
      topicId: searchParams.get("topicId") || undefined,
      difficulty: (searchParams.get("difficulty") as any) || undefined,
      onlyFavorites: searchParams.get("onlyFavorites") === "true",
      onlyIncorrect: searchParams.get("onlyIncorrect") === "true",
      dueForReviewOnly: searchParams.get("dueForReviewOnly") === "true",
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const count = await QuizService.countMatchingQuestions(user.id, criteria);
    return NextResponse.json({ count });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to count questions." }, { status });
  }
}
