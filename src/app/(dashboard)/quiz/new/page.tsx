import * as React from "react";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { QuizCreator } from "@/components/quiz/quiz-creator";

export default async function NewQuizPage() {
  const user = await requireAuth();

  const [topics, categories, collections] = await Promise.all([
    prisma.topic.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.collection.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

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
