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

export interface FilterState {
  search: string;
  topicId: string;
  categoryId: string;
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
  categories: Array<{ id: string; name: string; topicId?: string | null }>;
}

export function QuestionFilterBar({
  filters,
  onChange,
  topics,
  categories,
}: QuestionFilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const resetFilters = () => {
    onChange({
      search: "",
      topicId: "",
      categoryId: "",
      difficulty: "",
      isFavorite: false,
      isArchived: false,
      dateFrom: "",
      dateTo: "",
      viewMode: filters.viewMode,
    });
  };

  const filteredCategories = filters.topicId
    ? categories.filter((c) => c.topicId === filters.topicId)
    : categories;

  return (
    <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
      {/* Primary search and main dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions, notes, or explanations..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 h-9"
          />
        </div>

        {/* Topic Filter */}
        <div className="w-[160px]">
          <Select
            value={filters.topicId || "all"}
            onValueChange={(val) =>
              onChange({ ...filters, topicId: val === "all" ? "" : val, categoryId: "" })
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

        {/* Category Filter */}
        {filteredCategories.length > 0 && (
          <div className="w-[160px]">
            <Select
              value={filters.categoryId || "all"}
              onValueChange={(val) =>
                onChange({ ...filters, categoryId: val === "all" ? "" : val })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        {/* Favorite Quick Button */}
        <Button
          variant={filters.isFavorite ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...filters, isFavorite: !filters.isFavorite })}
          className="gap-1.5 h-9"
        >
          <Star className={`h-3.5 w-3.5 ${filters.isFavorite ? "fill-current" : ""}`} />
          <span>Starred</span>
        </Button>

        {/* More Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="gap-1.5 h-9"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
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

      {/* Expanded filters (Date range, Archive, Reset) */}
      {showMoreFilters && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Date:</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            />
          </div>

          <Button
            variant={filters.isArchived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onChange({ ...filters, isArchived: !filters.isArchived })}
            className="gap-1 h-8 text-xs"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-1 h-8 text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All</span>
          </Button>
        </div>
      )}
    </div>
  );
}
