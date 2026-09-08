import * as React from "react";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { QuizCreator } from "@/components/quiz/quiz-creator";

export default async function NewQuizPage() {
  const user = await requireAuth();
  const { topics, categories, collections } = await TaxonomyService.getTaxonomies(user.id);

  return (
    <div className="space-y-6">
      <QuizCreator
        topics={topics}
        categories={categories}
        collections={collections}
      />
    </div>
  );
}
