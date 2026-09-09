"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Download,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { QuestionCard } from "@/components/questions/question-card";
import { QuestionTable } from "@/components/questions/question-table";
import { QuestionFilterBar } from "@/components/questions/question-filter-bar";
import { BulkActionsBar } from "@/components/questions/bulk-actions-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/store";
import { setFilters, setPage } from "@/store/slices/filter-slice";
import { setViewMode } from "@/store/slices/ui-slice";
import { useTopicsQuery } from "@/hooks/queries/use-topics";
import {
  useQuestionsQuery,
  useToggleFavoriteMutation,
  useDeleteQuestionMutation,
  useBulkQuestionsMutation,
} from "@/hooks/queries/use-questions";

export default function QuestionsPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const viewMode = useAppSelector((state) => state.ui.viewMode);

  // TanStack Queries for data caching and synchronization
  const { data: topics = [] } = useTopicsQuery();
  const { data, isLoading: loading } = useQuestionsQuery(filters);

  const questions = data?.questions || [];
  const pagination = data?.pagination || {
    total: 0,
    page: filters.page,
    limit: filters.limit,
    totalPages: 1,
  };

  // Mutations for optimistic / cache-invalidating updates
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const deleteMutation = useDeleteQuestionMutation();
  const bulkMutation = useBulkQuestionsMutation();

  // Local selection state for bulk actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleToggleFavorite = (id: string) => {
    toggleFavoriteMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      },
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (questions.length > 0 && questions.every((q: any) => selectedIds.includes(q.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q: any) => q.id));
    }
  };

  const handleBulkAction = (action: "favorite" | "archive" | "delete") => {
    if (selectedIds.length === 0) return;
    bulkMutation.mutate(
      { questionIds: selectedIds, action },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
      }
    );
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
            Manage, filter, search, and practice your entire MCQ collection (
            {pagination.total} total).
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
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
            >
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

      {/* Filter Bar connected to Redux store */}
      <QuestionFilterBar
        filters={{
          search: filters.search,
          topicId: filters.topicId,
          difficulty: filters.difficulty,
          isFavorite: filters.isFavorite,
          isArchived: filters.isArchived,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          viewMode: viewMode,
        }}
        onChange={(newFilters) => {
          dispatch(
            setFilters({
              search: newFilters.search,
              topicId: newFilters.topicId,
              difficulty: newFilters.difficulty,
              isFavorite: newFilters.isFavorite,
              isArchived: newFilters.isArchived,
              dateFrom: newFilters.dateFrom,
              dateTo: newFilters.dateTo,
              page: 1,
            })
          );
          if (newFilters.viewMode && newFilters.viewMode !== viewMode) {
            dispatch(setViewMode(newFilters.viewMode));
          }
        }}
        topics={topics}
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
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q: any) => (
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

      {/* Shadcn Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 text-xs">
          <p className="text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
            Showing Page <span className="font-bold text-foreground">{pagination.page}</span> of{" "}
            <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} questions)
          </p>

          <Pagination className="order-1 sm:order-2 justify-center sm:justify-end w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => dispatch(setPage(Math.max(1, pagination.page - 1)))}
                  disabled={pagination.page <= 1}
                />
              </PaginationItem>

              {(() => {
                const total = pagination.totalPages;
                const current = pagination.page;
                let items: (number | string)[] = [];

                if (total <= 7) {
                  items = Array.from({ length: total }, (_, i) => i + 1);
                } else if (current <= 4) {
                  items = [1, 2, 3, 4, 5, "ellipsis-end", total];
                } else if (current >= total - 3) {
                  items = [1, "ellipsis-start", total - 4, total - 3, total - 2, total - 1, total];
                } else {
                  items = [1, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", total];
                }

                return items.map((item, idx) => {
                  if (typeof item === "string") {
                    return (
                      <PaginationItem key={`${item}-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={item === current}
                        onClick={() => dispatch(setPage(item))}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    dispatch(setPage(Math.min(pagination.totalPages, pagination.page + 1)))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
