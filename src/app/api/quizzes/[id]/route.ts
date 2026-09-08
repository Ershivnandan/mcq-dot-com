import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";
import { SubmitQuizAttemptSchema } from "@/lib/validation/schemas";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await QuizService.getQuiz(user.id, id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 404;
    return NextResponse.json({ error: error.message || "Quiz not found." }, { status });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = SubmitQuizAttemptSchema.parse({ ...body, quizId: id });

    const attempt = await QuizService.submitQuizAttempt(user.id, validated);
    return NextResponse.json(attempt, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to submit quiz attempt." }, { status });
  }
}
