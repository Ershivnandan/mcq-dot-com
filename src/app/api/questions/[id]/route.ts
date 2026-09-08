import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuestionService } from "@/server/services/question.service";
import { QuestionInputSchema } from "@/lib/validation/schemas";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const question = await QuestionService.getQuestionById(user.id, id);
    return NextResponse.json(question);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 404;
    return NextResponse.json({ error: error.message || "Question not found." }, { status });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = QuestionInputSchema.parse(body);

    const updated = await QuestionService.updateQuestion(user.id, id, validated);
    return NextResponse.json(updated);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to update question." }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await QuestionService.deleteQuestion(user.id, id);
    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete question." }, { status });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    if (body.action === "toggleFavorite") {
      const updated = await QuestionService.toggleFavorite(user.id, id);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to update question." }, { status });
  }
}
