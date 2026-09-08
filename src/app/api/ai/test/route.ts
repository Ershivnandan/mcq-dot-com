import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AIService } from "@/server/services/ai.service";
import { z } from "zod";
import { AIProviderTypeEnum } from "@/lib/validation/schemas";

const TestKeySchema = z.object({
  provider: AIProviderTypeEnum,
  apiKey: z.string().min(1, "API Key is required"),
});

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { provider, apiKey } = TestKeySchema.parse(body);

    const result = await AIService.testConnection(provider, apiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}
