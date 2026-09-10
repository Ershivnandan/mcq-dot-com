import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await QuizService.retakeQuiz(user.id, id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to retake quiz." }, { status });
  }
}
