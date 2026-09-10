"use client";

import * as React from "react";
import { format, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthPickerProps } from "@/typings";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthPicker({
  value,
  onSelect,
  placeholder = "Pick a month",
  className,
  clearable = true,
  disabled = false,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse initial year and month
  const parsed = React.useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        return { year: y, month: m };
      }
    }
    return null;
  }, [value]);

  const [viewingYear, setViewingYear] = React.useState<number>(
    parsed?.year || new Date().getFullYear()
  );

  React.useEffect(() => {
    if (parsed?.year) {
      setViewingYear(parsed.year);
    }
  }, [parsed?.year]);

  const handleSelectMonth = (monthIndex: number) => {
    const year = viewingYear;
    const month = monthIndex + 1;
    const monthStr = String(month).padStart(2, "0");
    const val = `${year}-${monthStr}`;

    const lastDay = new Date(year, month, 0).getDate();
    const from = `${year}-${monthStr}-01`;
    const to = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[monthIndex]} ${year}`;

    onSelect(val, { from, to, label });
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  const selectPreset = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthStr = String(m).padStart(2, "0");
    const val = `${y}-${monthStr}`;
    const lastDay = new Date(y, m, 0).getDate();
    const from = `${y}-${monthStr}-01`;
    const to = `${y}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[m - 1]} ${y}`;

    setViewingYear(y);
    onSelect(val, { from, to, label });
    setOpen(false);
  };

  const displayText = parsed
    ? `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`
    : placeholder;

  const currentCalendarDate = new Date();
  const currentCalendarYear = currentCalendarDate.getFullYear();
  const currentCalendarMonth = currentCalendarDate.getMonth() + 1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 bg-background border-border/80 shadow-2xs hover:bg-accent/50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
          <span className="truncate flex-1 font-medium text-foreground">
            {displayText}
          </span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-3 shadow-xl rounded-xl border-border/80" align="start">
        {/* Quick presets */}
        <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => selectPreset(new Date())}
            className="h-7 text-xs flex-1 font-semibold"
          >
            This Month
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => selectPreset(subMonths(new Date(), 1))}
            className="h-7 text-xs flex-1 font-semibold"
          >
            Last Month
          </Button>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center justify-between pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setViewingYear((y) => y - 1)}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-bold text-sm tracking-tight">{viewingYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setViewingYear((y) => y + 1)}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {MONTH_NAMES.map((name, index) => {
            const isSelected =
              parsed?.year === viewingYear && parsed?.month === index + 1;
            const isCurrentMonth =
              currentCalendarYear === viewingYear && currentCalendarMonth === index + 1;

            return (
              <Button
                key={name}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSelectMonth(index)}
                className={cn(
                  "h-9 text-xs font-semibold rounded-lg transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : isCurrentMonth
                    ? "border border-primary/40 text-primary font-bold hover:bg-accent"
                    : "hover:bg-accent text-foreground"
                )}
              >
                {name.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
