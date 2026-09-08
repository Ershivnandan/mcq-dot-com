import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AIService } from "@/server/services/ai.service";
import { AIConfigInputSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const user = await requireAuth();
    const configs = await AIService.getUserConfigs(user.id);
    return NextResponse.json(configs);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = AIConfigInputSchema.parse(body);

    const saved = await AIService.saveConfig(user.id, validated);
    return NextResponse.json(saved);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to save AI configuration." }, { status });
  }
}
