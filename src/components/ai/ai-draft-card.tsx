"use client";

import * as React from "react";
import { Check, X, Sparkles, BookOpen, Edit2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AIDraftCardProps {
  draft: {
    id: string;
    questionText: string;
    explanation?: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topic?: string | null;
    category?: string | null;
    optionsJson: any;
    tagsJson?: any;
    createdAt: string | Date;
  };
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function AIDraftCard({ draft, onApprove, onReject }: AIDraftCardProps) {
  const [approving, setApproving] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Editable draft state
  const [questionText, setQuestionText] = React.useState(draft.questionText);
  const [explanation, setExplanation] = React.useState(draft.explanation || "");
  const [options, setOptions] = React.useState<Array<{ id: string; optionText: string; isCorrect: boolean }>>(
    Array.isArray(draft.optionsJson)
      ? draft.optionsJson.map((o: any, idx: number) => ({
          id: o.id || `opt_${idx + 1}`,
          optionText: o.optionText || o.text || "",
          isCorrect: Boolean(o.isCorrect),
        }))
      : []
  );

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(draft.id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(draft.id);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <Card className="border-purple-500/20 shadow-sm relative overflow-hidden bg-card/60">
      <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-500" />
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple" className="flex items-center gap-1 font-bold">
              <Sparkles className="h-3 w-3" />
              <span>AI Generated — Draft</span>
            </Badge>
            {draft.topic && <Badge variant="secondary">{draft.topic}</Badge>}
            <Badge variant="outline">{draft.difficulty}</Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Done Editing" : "Edit"}</span>
            </Button>
          </div>
        </div>

        {/* Question Text */}
        {isEditing ? (
          <Textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="text-base font-semibold min-h-[70px]"
          />
        ) : (
          <p className="text-base font-semibold text-foreground leading-relaxed">
            {questionText}
          </p>
        )}

        {/* Options */}
        <div className="space-y-2 pt-1">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${
                opt.isCorrect
                  ? "border-emerald-500/80 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold"
                  : "border-border bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) return;
                    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
                  }}
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    opt.isCorrect ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  } ${isEditing ? "cursor-pointer ring-1 ring-primary" : ""}`}
                  title={isEditing ? "Click to set as correct" : undefined}
                >
                  {String.fromCharCode(65 + idx)}
                </button>

                {isEditing ? (
                  <Input
                    value={opt.optionText}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[idx].optionText = e.target.value;
                      setOptions(updated);
                    }}
                    className="h-7 text-xs border-none bg-transparent shadow-none"
                  />
                ) : (
                  <span>{opt.optionText}</span>
                )}
              </div>

              {opt.isCorrect && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Correct Answer</span>
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed space-y-1 border border-border/40">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-purple-500" />
              <span>Explanation</span>
            </div>
            {isEditing ? (
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            ) : (
              <p className="text-muted-foreground">{explanation}</p>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={rejecting || approving}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <X className="h-3.5 w-3.5" />
            <span>{rejecting ? "Rejecting..." : "Reject"}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{approving ? "Adding..." : "Approve & Add to Library"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
