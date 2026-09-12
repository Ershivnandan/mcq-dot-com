import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { UserResetService } from "@/server/services/user-reset.service";

/**
 * GET /api/questions/delete-all
 * Retrieves count of questions, progress, and drafts for preview before deletion.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const counts = await UserResetService.getUserDataCounts(user.id);
    return NextResponse.json({
      questionCount: counts.questionCount,
      progressCount: counts.progressCount,
      draftCount: counts.draftCount,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to retrieve question counts." },
      { status }
    );
  }
}

/**
 * DELETE /api/questions/delete-all
 * Hard-deletes all questions, question progress, and drafts belonging to the user.
 */
export async function DELETE(req: Request) {
  try {
    const user = await requireAuth();

    // Optional confirmation check from body
    let confirmPhrase = "";
    try {
      const body = await req.json();
      confirmPhrase = body.confirmPhrase;
    } catch {
      // Body may be empty, proceed if allowed or query param
    }

    const result = await UserResetService.wipeUserQuestions(user.id);
    return NextResponse.json({
      message: "All questions and study progress have been permanently deleted.",
      ...result,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to wipe questions." },
      { status }
    );
  }
}
