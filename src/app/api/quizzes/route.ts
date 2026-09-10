import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";
import { CreateQuizSchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    if (searchParams.get("saved") === "true") {
      const saved = await QuizService.getSavedQuizzes(user.id);
      return NextResponse.json(saved);
    }
    const attempts = await QuizService.getAttempts(user.id);
    return NextResponse.json(attempts);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch quizzes." }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = CreateQuizSchema.parse(body);

    const quiz = await QuizService.createQuiz(user.id, validated);
    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to create quiz." }, { status });
  }
}
