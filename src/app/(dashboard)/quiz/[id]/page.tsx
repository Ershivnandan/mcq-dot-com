import * as React from "react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";
import { QuizRunner } from "@/components/quiz/quiz-runner";

export default async function ActiveQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  let quizData;
  try {
    quizData = await QuizService.getQuiz(user.id, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <QuizRunner quiz={quizData.quiz} questions={quizData.questions} />
    </div>
  );
}
