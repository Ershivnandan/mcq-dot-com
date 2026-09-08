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
    const user = await requireAuth();
    const body = await req.json();
    const { provider, apiKey } = TestKeySchema.parse(body);

    const result = await AIService.testConnection(provider, apiKey);

    // If test succeeds and has detected models, update user's saved config if one exists
    if (result.success && result.models && result.models.length > 0) {
      try {
        const { getAIProviderConfigsCol } = await import("@/server/db");
        const col = await getAIProviderConfigsCol();
        await col.updateOne(
          { userId: user.id, provider },
          { $set: { detectedModels: result.models, updatedAt: new Date() } }
        );
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}
