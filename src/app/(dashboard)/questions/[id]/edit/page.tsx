import * as React from "react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { QuestionService } from "@/server/services/question.service";
import { prisma } from "@/server/db";
import { QuestionEditor } from "@/components/questions/question-editor";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  let question;
  try {
    question = await QuestionService.getQuestionById(user.id, id);
  } catch {
    notFound();
  }

  const [topics, categories] = await Promise.all([
    prisma.topic.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <QuestionEditor
        initialData={question}
        topics={topics}
        categories={categories}
        isEditing
      />
    </div>
  );
}
