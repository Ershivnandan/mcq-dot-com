"use client";

import * as React from "react";
import Link from "next/link";
import { Star, Edit3, Trash2, Calendar, BookOpen, CheckCircle2, XCircle, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

export interface QuestionCardProps {
  question: {
    id: string;
    questionText: string;
    explanation?: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questionDate?: string | Date | null;
    source?: string | null;
    notes?: string | null;
    isFavorite: boolean;
    isArchived: boolean;
    topic?: { name: string } | null;
    options: Array<{
      id: string;
      optionText: string;
      optionOrder: number;
      isCorrect: boolean;
    }>;
  };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function QuestionCard({
  question,
  isSelected,
  onSelect,
  onToggleFavorite,
  onDelete,
}: QuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = React.useState<string | null>(null);
  const [showExplanation, setShowExplanation] = React.useState(false);

  const handleOptionClick = (optionId: string) => {
    if (selectedOptionId !== null) return; // already tested
    setSelectedOptionId(optionId);
    setShowExplanation(true);
  };

  const difficultyVariant =
    question.difficulty === "EASY"
      ? "success"
      : question.difficulty === "HARD"
      ? "destructive"
      : "warning";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md border-border/80 relative overflow-hidden",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5"
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header Badges & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={() => onSelect(question.id)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer mr-1"
              />
            )}
            <Badge variant={difficultyVariant}>{question.difficulty}</Badge>
            {question.topic && (
              <Badge variant="secondary" className="font-medium">
                {question.topic.name}
              </Badge>
            )}
            {question.questionDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(question.questionDate)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                onClick={() => onToggleFavorite(question.id)}
              >
                <Star
                  className={cn("h-4 w-4", question.isFavorite && "fill-amber-500 text-amber-500")}
                />
                <span className="sr-only">Favorite</span>
              </Button>
            )}
            <Link href={`/questions/${question.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Edit3 className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this question?")) onDelete(question.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Question Text */}
        <p className="text-base font-semibold text-foreground leading-relaxed">
          {question.questionText}
        </p>

        {/* Interactive Options List (Practice inline) */}
        <div className="space-y-2 pt-1">
          {question.options.map((opt, idx) => {
            const isTested = selectedOptionId !== null;
            const isChosen = selectedOptionId === opt.id;
            const isCorrect = opt.isCorrect;

            let optionStyle =
              "border-border/60 hover:border-primary/50 hover:bg-accent/50 cursor-pointer text-foreground";
            if (isTested) {
              if (isCorrect) {
                optionStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold";
              } else if (isChosen && !isCorrect) {
                optionStyle = "bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300";
              } else {
                optionStyle = "opacity-50 border-transparent bg-muted/20 cursor-default";
              }
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleOptionClick(opt.id)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all select-none",
                  optionStyle
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt.optionText}</span>
                </div>
                {isTested && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                {isTested && isChosen && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
              </div>
            );
          })}
        </div>

        {/* Explanation Reveal */}
        {showExplanation && question.explanation && (
          <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed space-y-1 border border-border/40">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>Explanation</span>
            </div>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {/* Footer Notes/Source */}
        {(question.source || question.notes) && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/80 pt-1">
            {question.source && <span>Source: {question.source}</span>}
            {question.notes && <span>Note: {question.notes}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
