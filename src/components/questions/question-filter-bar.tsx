"use client";

import * as React from "react";
import { Search, Filter, Star, Archive, LayoutGrid, List, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export interface FilterState {
  search: string;
  topicId: string;
  difficulty: string;
  isFavorite: boolean;
  isArchived: boolean;
  dateFrom: string;
  dateTo: string;
  viewMode: "cards" | "table";
}

interface QuestionFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  topics: Array<{ id: string; name: string }>;
}

export function QuestionFilterBar({
  filters,
  onChange,
  topics,
}: QuestionFilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const resetFilters = () => {
    onChange({
      search: "",
      topicId: "",
      difficulty: "",
      isFavorite: false,
      isArchived: false,
      dateFrom: "",
      dateTo: "",
      viewMode: filters.viewMode,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.topicId ||
    filters.difficulty ||
    filters.isFavorite ||
    filters.isArchived ||
    filters.dateFrom ||
    filters.dateTo
  );

  return (
    <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
      {/* Primary search and main dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions, explanations, or notes..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Topic Filter */}
        <div className="w-[160px]">
          <Select
            value={filters.topicId || "all"}
            onValueChange={(val) =>
              onChange({ ...filters, topicId: val === "all" ? "" : val })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div className="w-[130px]">
          <Select
            value={filters.difficulty || "all"}
            onValueChange={(val) =>
              onChange({ ...filters, difficulty: val === "all" ? "" : val })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* shadcn Date Range Picker (Month-wise & Custom Presets) */}
        <div className="w-[240px]">
          <DateRangePicker
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            onSelect={(range) =>
              onChange({
                ...filters,
                dateFrom: range.from || "",
                dateTo: range.to || "",
              })
            }
            placeholder="Filter by Exam Date"
          />
        </div>

        {/* Starred Filter Button */}
        <Button
          variant={filters.isFavorite ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...filters, isFavorite: !filters.isFavorite })}
          className="gap-1.5 h-9 text-xs"
        >
          <Star className={`h-3.5 w-3.5 ${filters.isFavorite ? "fill-current" : ""}`} />
          <span>Starred</span>
        </Button>

        {/* More Filters Toggle (Archive, Reset) */}
        <Button
          variant={showMoreFilters || filters.isArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="gap-1.5 h-9 text-xs"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>More</span>
        </Button>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 ml-auto">
          <Button
            variant={filters.viewMode === "cards" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => onChange({ ...filters, viewMode: "cards" })}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="sr-only">Card view</span>
          </Button>
          <Button
            variant={filters.viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => onChange({ ...filters, viewMode: "table" })}
          >
            <List className="h-3.5 w-3.5" />
            <span className="sr-only">Table view</span>
          </Button>
        </div>
      </div>

      {/* Expanded filters (Archive & Reset) */}
      {(showMoreFilters || hasActiveFilters) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t text-xs">
          <div className="flex items-center gap-2">
            <Button
              variant={filters.isArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onChange({ ...filters, isArchived: !filters.isArchived })}
              className="gap-1.5 h-7 text-xs"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>{filters.isArchived ? "Showing Archived" : "Show Archived"}</span>
            </Button>
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                📅 Date Active: {filters.dateFrom || "Start"} → {filters.dateTo || "End"}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
