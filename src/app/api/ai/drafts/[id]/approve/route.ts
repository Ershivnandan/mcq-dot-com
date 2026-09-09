import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { AIService } from "@/server/services/ai.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    let overrides: any = undefined;
    try {
      const text = await req.text();
      if (text) {
        overrides = JSON.parse(text);
      }
    } catch {
      // Body is optional
    }

    const question = await AIService.approveDraft(user.id, id, overrides);
    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: error.message || "Failed to approve draft." }, { status });
  }
}
