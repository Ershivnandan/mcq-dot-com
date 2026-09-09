"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  startOfYear,
  isWithinInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePickerProps } from "@/typings";

export function DateRangePicker({
  dateFrom,
  dateTo,
  onSelect,
  className,
  placeholder = "Pick a date range",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse initial dates
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    fromDate || new Date()
  );
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  // Quick preset shortcuts
  const presets = [
    {
      label: "This Month",
      getValue: () => {
        const now = new Date();
        return {
          from: format(startOfMonth(now), "yyyy-MM-dd"),
          to: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      },
    },
    {
      label: "Last Month",
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          from: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          to: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        };
      },
    },
    {
      label: "Last 30 Days",
      getValue: () => {
        const now = new Date();
        return {
          from: format(subDays(now, 30), "yyyy-MM-dd"),
          to: format(now, "yyyy-MM-dd"),
        };
      },
    },
    {
      label: "Last 7 Days",
      getValue: () => {
        const now = new Date();
        return {
          from: format(subDays(now, 7), "yyyy-MM-dd"),
          to: format(now, "yyyy-MM-dd"),
        };
      },
    },
    {
      label: "Year to Date",
      getValue: () => {
        const now = new Date();
        return {
          from: format(startOfYear(now), "yyyy-MM-dd"),
          to: format(now, "yyyy-MM-dd"),
        };
      },
    },
  ];

  const handleDayClick = (day: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      // First click: select start
      onSelect({
        from: format(day, "yyyy-MM-dd"),
        to: null,
      });
    } else {
      // Second click: select end
      if (day < fromDate) {
        onSelect({
          from: format(day, "yyyy-MM-dd"),
          to: format(fromDate, "yyyy-MM-dd"),
        });
      } else {
        onSelect({
          from: format(fromDate, "yyyy-MM-dd"),
          to: format(day, "yyyy-MM-dd"),
        });
      }
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({ from: null, to: null });
  };

  // Generate calendar grid days for currentMonth
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isSelected = (day: Date) => {
    if (fromDate && isSameDay(day, fromDate)) return true;
    if (toDate && isSameDay(day, toDate)) return true;
    return false;
  };

  const isInRange = (day: Date) => {
    if (fromDate && toDate) {
      return isWithinInterval(day, { start: fromDate, end: toDate });
    }
    if (fromDate && !toDate && hoverDate) {
      const start = fromDate < hoverDate ? fromDate : hoverDate;
      const end = fromDate < hoverDate ? hoverDate : fromDate;
      return isWithinInterval(day, { start, end });
    }
    return false;
  };

  // Label formatting
  let displayLabel = placeholder;
  if (fromDate && toDate) {
    displayLabel = `${format(fromDate, "MMM d, yyyy")} - ${format(toDate, "MMM d, yyyy")}`;
  } else if (fromDate) {
    displayLabel = `${format(fromDate, "MMM d, yyyy")} - ...`;
  }

  const hasValue = Boolean(fromDate || toDate);

  return (
    <div className={cn("relative inline-block", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 min-w-[220px] justify-between text-left font-normal border-input bg-background text-xs cursor-pointer shadow-2xs hover:bg-accent/50",
              !hasValue && "text-muted-foreground",
              hasValue && "text-foreground font-medium border-purple-500/40"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{displayLabel}</span>
            </div>
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="ml-1 rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear date filter"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
            {/* Quick Presets sidebar */}
            <div className="p-3 space-y-1 sm:w-36 shrink-0 bg-muted/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Presets
              </p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const val = preset.getValue();
                    onSelect(val);
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-medium cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              {hasValue && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect({ from: null, to: null });
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium cursor-pointer pt-2 border-t border-border/50"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Calendar panel */}
            <div className="p-3 space-y-3">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-foreground">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="h-6 flex items-center justify-center">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const isCurrent = isSameMonth(day, currentMonth);
                  const selected = isSelected(day);
                  const inRange = isInRange(day);
                  const isStart = fromDate && isSameDay(day, fromDate);
                  const isEnd = toDate && isSameDay(day, toDate);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                      className={cn(
                        "h-8 w-8 text-xs rounded-md flex items-center justify-center transition-all cursor-pointer font-medium",
                        !isCurrent && "text-muted-foreground/30",
                        isCurrent && !selected && !inRange && "hover:bg-accent text-foreground",
                        inRange && !selected && "bg-purple-500/15 text-purple-900 dark:text-purple-200 rounded-none",
                        selected && "bg-purple-600 text-white font-bold shadow-xs hover:bg-purple-700",
                        isStart && "rounded-l-md",
                        isEnd && "rounded-r-md"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {/* Helper footer */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pt-1 border-t border-border/50">
                <span>
                  {fromDate && !toDate ? "Click end date to finish range" : "Select start date"}
                </span>
                {fromDate && (
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {format(fromDate, "yyyy-MM-dd")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
