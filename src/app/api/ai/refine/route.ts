import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { RAGService } from "@/server/services/rag.service";
import { getAIDraftsCol } from "@/server/db";
import { DraftStatus } from "@/typings";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const feedback = body.feedback?.trim();
    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback / critique is required to refine question." },
        { status: 400 }
      );
    }

    let targetDraftId = body.draftId;

    // If no draftId explicitly provided, attempt to infer from feedback (e.g. "question 2", "1st question")
    // or pick the most recent pending draft
    if (!targetDraftId) {
      const draftsCol = await getAIDraftsCol();
      const pendingDrafts = await draftsCol
        .find({ userId: user.id, status: { $in: [DraftStatus.DRAFT, "DRAFT"] } })
        .sort({ createdAt: -1 })
        .toArray();

      if (pendingDrafts.length === 0) {
        return NextResponse.json(
          { error: "No pending draft questions found to refine." },
          { status: 404 }
        );
      }

      // Check for index reference like "question 2" or "draft 1"
      const matchIndex = feedback.match(/(?:question|draft|#)\s*(\d+)/i);
      if (matchIndex) {
        const idx = parseInt(matchIndex[1], 10) - 1;
        // The drafts are usually displayed in ascending order of generation, so let's reverse to match 1-based display
        const chronological = [...pendingDrafts].reverse();
        if (chronological[idx]) {
          targetDraftId = chronological[idx]._id?.toString();
        }
      }

      // Default to first pending draft if still undetermined
      if (!targetDraftId) {
        targetDraftId = pendingDrafts[0]._id?.toString();
      }
    }

    const result = await RAGService.refineDraftQuestion(user.id, {
      draftId: targetDraftId,
      feedback,
      conversationHistory: body.conversationHistory || [],
    });

    return NextResponse.json({
      message: "Question refined successfully according to your feedback.",
      ...result,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to refine draft question." },
      { status }
    );
  }
}
