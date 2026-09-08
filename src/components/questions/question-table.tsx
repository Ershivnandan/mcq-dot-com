"use client";

import * as React from "react";
import Link from "next/link";
import { Star, Edit3, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface QuestionTableProps {
  questions: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function QuestionTable({
  questions,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onToggleFavorite,
  onDelete,
}: QuestionTableProps) {
  const allSelected = questions.length > 0 && questions.every((q) => selectedIds.includes(q.id));

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
                />
              </th>
              <th className="p-3 w-10 text-center">⭐</th>
              <th className="p-3 min-w-[300px]">Question</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Difficulty</th>
              <th className="p-3">Exam Date</th>
              <th className="p-3 text-center">Options</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {questions.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              const difficultyVariant =
                q.difficulty === "EASY"
                  ? "success"
                  : q.difficulty === "HARD"
                  ? "destructive"
                  : "warning";

              return (
                <tr
                  key={q.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(q.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onToggleFavorite(q.id)}
                      className="text-muted-foreground hover:text-amber-500 cursor-pointer"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          q.isFavorite ? "fill-amber-500 text-amber-500" : ""
                        }`}
                      />
                    </button>
                  </td>
                  <td className="p-3 font-medium text-foreground">
                    <Link
                      href={`/questions/${q.id}/edit`}
                      className="hover:underline hover:text-primary line-clamp-2"
                    >
                      {q.questionText}
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {q.topic?.name || "-"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <Badge variant={difficultyVariant} className="text-[10px]">
                      {q.difficulty}
                    </Badge>
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(q.questionDate)}
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-center font-mono">
                    {q.options?.length || 0}
                  </td>
                  <td className="p-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/questions/${q.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this question?")) onDelete(q.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
