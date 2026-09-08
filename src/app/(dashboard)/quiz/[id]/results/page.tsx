import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";
import { QuizResults } from "@/components/quiz/quiz-results";

export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const { attemptId } = await searchParams;

  if (!attemptId) {
    redirect(`/quiz/${id}`);
  }

  let attemptData;
  try {
    attemptData = await QuizService.getAttemptById(user.id, attemptId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <QuizResults
        attempt={attemptData.attempt as any}
        answers={attemptData.answers as any}
      />
    </div>
  );
}
