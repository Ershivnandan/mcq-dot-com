import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AIService } from "@/server/services/ai.service";
import { AIGenerateRequestSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = AIGenerateRequestSchema.parse(body);

    const drafts = await AIService.generateQuestions(user.id, validated);
    return NextResponse.json({ success: true, count: drafts.length, drafts });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to generate questions." }, { status });
  }
}
