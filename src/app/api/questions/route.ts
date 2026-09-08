import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuestionService } from "@/server/services/question.service";
import { QuestionInputSchema, QuestionQuerySchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const query = QuestionQuerySchema.parse(rawParams);

    const result = await QuestionService.getQuestions(user.id, query);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to fetch questions." }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = QuestionInputSchema.parse(body);

    const question = await QuestionService.createQuestion(user.id, validated);
    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to create question." }, { status });
  }
}
