import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await QuizService.getAttemptById(user.id, id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 404;
    return NextResponse.json({ error: error.message || "Attempt not found." }, { status });
  }
}
