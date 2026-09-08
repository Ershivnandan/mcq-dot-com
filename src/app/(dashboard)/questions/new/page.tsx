import * as React from "react";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { QuestionEditor } from "@/components/questions/question-editor";

export default async function NewQuestionPage() {
  const user = await requireAuth();

  const [topics, categories] = await Promise.all([
    prisma.topic.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <QuestionEditor topics={topics} categories={categories} />
    </div>
  );
}
