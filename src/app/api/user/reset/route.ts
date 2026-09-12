import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { UserResetService } from "@/server/services/user-reset.service";

/**
 * GET /api/user/reset
 * Retrieves exact count of all items owned by the user before wiping.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const counts = await UserResetService.getUserDataCounts(user.id);
    return NextResponse.json(counts);
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to retrieve user statistics." },
      { status }
    );
  }
}

/**
 * POST /api/user/reset
 * Hard-wipes all user data (questions, quizzes, attempts, taxonomy, drafts, logs).
 * Requires { confirmPhrase: "RESET" } to protect against accidental calls.
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));

    if (body.confirmPhrase !== "RESET") {
      return NextResponse.json(
        { error: "Confirmation phrase must be 'RESET' to proceed." },
        { status: 400 }
      );
    }

    const wipeAIKeys = Boolean(body.wipeAIKeys);
    const result = await UserResetService.resetUserData(user.id, { wipeAIKeys });

    return NextResponse.json({
      message: "Your account data has been completely reset. You can now start fresh.",
      ...result,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to reset account data." },
      { status }
    );
  }
}
