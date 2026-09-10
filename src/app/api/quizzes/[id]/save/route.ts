import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const isSaved = body.isSaved !== undefined ? Boolean(body.isSaved) : true;
    const result = await QuizService.saveQuiz(user.id, id, isSaved, body.title);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to update saved status." }, { status });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return POST(req, { params });
}
