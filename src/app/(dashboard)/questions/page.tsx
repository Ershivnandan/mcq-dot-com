"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Download, Upload, HelpCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/questions/question-card";
import { QuestionTable } from "@/components/questions/question-table";
import { QuestionFilterBar, FilterState } from "@/components/questions/question-filter-bar";
import { BulkActionsBar } from "@/components/questions/bulk-actions-bar";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionsPage() {
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [topics, setTopics] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = React.useState(true);

  // Filter state
  const [filters, setFilters] = React.useState<FilterState>({
    search: "",
    topicId: "",
    categoryId: "",
    difficulty: "",
    isFavorite: false,
    isArchived: false,
    dateFrom: "",
    dateTo: "",
    viewMode: "cards",
  });

  // Bulk selection state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Load topics & categories
  React.useEffect(() => {
    Promise.all([
      fetch("/api/topics").then((r) => r.json()).catch(() => []),
      fetch("/api/categories").then((r) => r.json()).catch(() => []),
    ]).then(([t, c]) => {
      if (Array.isArray(t)) setTopics(t);
      if (Array.isArray(c)) setCategories(c);
    });
  }, []);

  // Fetch questions on filter or page change
  const fetchQuestions = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.topicId) params.set("topicId", filters.topicId);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.difficulty) params.set("difficulty", filters.difficulty);
      if (filters.isFavorite) params.set("isFavorite", "true");
      if (filters.isArchived) params.set("isArchived", "true");
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      fetchQuestions();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchQuestions]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFavorite" }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, isFavorite: !q.isFavorite } : q))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (questions.every((q) => selectedIds.includes(q.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleBulkAction = async (action: "favorite" | "archive" | "delete" | "add_to_collection") => {
    try {
      const res = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: selectedIds,
          action,
        }),
      });

      if (res.ok) {
        setSelectedIds([]);
        await fetchQuestions();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Question Library
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage, filter, search, and practice your entire MCQ collection ({pagination.total} total).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/questions/new">
            <Button size="sm" className="gap-1.5 font-bold shadow-sm">
              <PlusCircle className="h-4 w-4 text-primary-foreground" />
              <span>Add Question</span>
            </Button>
          </Link>
          <Link href="/ai">
            <Button size="sm" variant="secondary" className="gap-1.5 font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Generate AI</span>
            </Button>
          </Link>
          <Link href="/api/export" target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <QuestionFilterBar
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        topics={topics}
        categories={categories}
      />

      {/* Questions Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-xl border bg-card space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border bg-card/40 space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">No questions found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No questions matched your active filters or search terms. Try adjusting your filters or import existing questions.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/questions/new">
              <Button size="sm" className="font-bold">
                Create First Question
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="sm" variant="outline">
                Import Backup JSON
              </Button>
            </Link>
          </div>
        </div>
      ) : filters.viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isSelected={selectedIds.includes(q.id)}
              onSelect={handleToggleSelect}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <QuestionTable
          questions={questions}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 text-xs">
          <p className="text-muted-foreground">
            Showing Page <span className="font-bold text-foreground">{pagination.page}</span> of{" "}
            <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} questions)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onAction={handleBulkAction}
      />
    </div>
  );
}
