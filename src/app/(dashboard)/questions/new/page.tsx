import * as React from "react";
import { requireAuth } from "@/server/auth/session";
import { TaxonomyService } from "@/server/services/taxonomy.service";
import { QuestionEditor } from "@/components/questions/question-editor";

export default async function NewQuestionPage() {
  const user = await requireAuth();
  const { topics } = await TaxonomyService.getTaxonomies(user.id);

  return (
    <div className="space-y-6">
      <QuestionEditor topics={topics} />
    </div>
  );
}
