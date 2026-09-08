"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  ArrowLeft,
  Calendar,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface OptionItem {
  id: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

interface QuestionEditorProps {
  initialData?: {
    id?: string;
    questionText: string;
    explanation?: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questionDate?: string | Date | null;
    source?: string | null;
    notes?: string | null;
    isFavorite: boolean;
    topicId?: string | null;
    categoryId?: string | null;
    options: OptionItem[];
  };
  topics: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; topicId?: string | null }>;
  isEditing?: boolean;
}

export function QuestionEditor({
  initialData,
  topics,
  categories,
  isEditing = false,
}: QuestionEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [questionText, setQuestionText] = React.useState(initialData?.questionText || "");
  const [explanation, setExplanation] = React.useState(initialData?.explanation || "");
  const [difficulty, setDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">(
    initialData?.difficulty || "MEDIUM"
  );
  const [questionDate, setQuestionDate] = React.useState<string>(
    initialData?.questionDate
      ? new Date(initialData.questionDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [source, setSource] = React.useState(initialData?.source || "");
  const [notes, setNotes] = React.useState(initialData?.notes || "");
  const [isFavorite, setIsFavorite] = React.useState(initialData?.isFavorite || false);
  const [topicId, setTopicId] = React.useState(initialData?.topicId || "");
  const [categoryId, setCategoryId] = React.useState(initialData?.categoryId || "");

  // Options state
  const [options, setOptions] = React.useState<OptionItem[]>(
    initialData?.options && initialData.options.length >= 2
      ? initialData.options
      : [
          { id: "opt_1", optionText: "", isCorrect: true, optionOrder: 0 },
          { id: "opt_2", optionText: "", isCorrect: false, optionOrder: 1 },
          { id: "opt_3", optionText: "", isCorrect: false, optionOrder: 2 },
          { id: "opt_4", optionText: "", isCorrect: false, optionOrder: 3 },
        ]
  );

  const addOption = () => {
    const nextIdx = options.length;
    setOptions([
      ...options,
      {
        id: `opt_${nextIdx + 1}`,
        optionText: "",
        isCorrect: false,
        optionOrder: nextIdx,
      },
    ]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      alert("A question must have at least 2 options.");
      return;
    }
    const updated = options.filter((_, i) => i !== idx);
    // If we removed the correct option, default first option to correct
    if (!updated.some((o) => o.isCorrect) && updated.length > 0) {
      updated[0].isCorrect = true;
    }
    setOptions(updated);
  };

  const updateOptionText = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].optionText = text;
    setOptions(updated);
  };

  const setCorrectOption = (idx: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    }));
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    const filledOptions = options.map((o) => ({
      ...o,
      optionText: o.optionText.trim(),
    }));

    if (filledOptions.some((o) => !o.optionText)) {
      setError("All option fields must have text.");
      return;
    }

    if (!filledOptions.some((o) => o.isCorrect)) {
      setError("Please select at least one correct option.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        questionText: questionText.trim(),
        explanation: explanation.trim() || null,
        difficulty,
        questionDate: questionDate ? new Date(questionDate).toISOString() : new Date().toISOString(),
        source: source.trim() || null,
        notes: notes.trim() || null,
        isFavorite,
        topicId: topicId || null,
        categoryId: categoryId || null,
        options: filledOptions,
      };

      const url = isEditing
        ? `/api/questions/${initialData?.id}`
        : "/api/questions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save question.");
      }

      router.push("/questions");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = topicId
    ? categories.filter((c) => c.topicId === topicId)
    : categories;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Library</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading} className="gap-2 font-semibold">
            <Save className="h-4 w-4" />
            <span>{loading ? "Saving..." : isEditing ? "Update Question" : "Save Question"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isEditing ? "Edit Question" : "Create New Question"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Question Statement <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="e.g. Which of the following is true about JavaScript closures?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="min-h-[100px] text-base leading-relaxed"
              required
            />
          </div>

          {/* Options List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Answer Options (select radio for the correct answer){" "}
                <span className="text-destructive">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="h-8 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Option</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    opt.isCorrect
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                      : "border-border bg-card"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setCorrectOption(idx)}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all cursor-pointer",
                      opt.isCorrect
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-muted-foreground/40 text-muted-foreground hover:border-emerald-500"
                    )}
                    title="Mark as correct answer"
                  >
                    {opt.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </button>

                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                    value={opt.optionText}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                    className="flex-1 border-none shadow-none focus-visible:ring-0 px-1 bg-transparent text-sm"
                    required
                  />

                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete option</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>Explanation / Solution</span>
              <span className="text-xs text-muted-foreground font-normal">(shown during practice & review)</span>
            </label>
            <Textarea
              placeholder="Explain why the correct answer is right and why others are incorrect..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Topic</label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Difficulty</label>
              <Select
                value={difficulty}
                onValueChange={(val: any) => setDifficulty(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Question / Exam Date</span>
              </label>
              <Input
                type="date"
                value={questionDate}
                onChange={(e) => setQuestionDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Source / Exam Name</label>
              <Input
                placeholder="e.g. UPSC Prelims 2026, May 1"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Starred */}
            <div className="space-y-1.5 flex flex-col justify-center">
              <label className="text-xs font-semibold text-muted-foreground mb-1">Bookmark / Star</label>
              <div className="flex items-center gap-2">
                <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
                <span className="text-sm font-medium">
                  {isFavorite ? "⭐ Starred" : "Normal"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Personal Notes</label>
            <Input
              placeholder="Any personal hints, mnemonics, or revision reminders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
