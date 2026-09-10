import * as React from "react";
import { requireAuth } from "@/server/auth/session";
import { QuizService } from "@/server/services/quiz.service";
import { QuizHistoryView } from "@/components/quiz/quiz-history-view";

export default async function QuizHistoryPage() {
  const user = await requireAuth();
  const [attempts, savedQuizzes] = await Promise.all([
    QuizService.getAttempts(user.id, 50),
    QuizService.getSavedQuizzes(user.id),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Quiz Library & History
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Review past attempts, track accuracy, or retake saved quizzes from your library.
        </p>
      </div>

      <QuizHistoryView
        initialAttempts={attempts}
        initialSavedQuizzes={savedQuizzes}
      />
    </div>
  );
}

