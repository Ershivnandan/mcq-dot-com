import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { QuestionService } from "@/server/services/question.service";
import { BulkQuestionActionSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = BulkQuestionActionSchema.parse(body);

    const result = await QuestionService.bulkAction(
      user.id,
      validated.questionIds,
      validated.action,
      validated.payload
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to execute bulk action." }, { status });
  }
}
