"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  isSameDay,
  isSameMonth,
  addMonths,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isValid,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerProps } from "@/typings";

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  className,
  clearable = true,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse date safely
  const parsedDate = React.useMemo(() => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    return isValid(d) ? d : null;
  }, [date]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    parsedDate || new Date()
  );

  // Sync currentMonth when date changes from outside
  React.useEffect(() => {
    if (parsedDate) {
      setCurrentMonth(parsedDate);
    }
  }, [parsedDate]);

  const presets = [
    {
      label: "Today",
      getValue: () => format(new Date(), "yyyy-MM-dd"),
    },
    {
      label: "Yesterday",
      getValue: () => format(subDays(new Date(), 1), "yyyy-MM-dd"),
    },
    {
      label: "1 Week Ago",
      getValue: () => format(subDays(new Date(), 7), "yyyy-MM-dd"),
    },
    {
      label: "1 Month Ago",
      getValue: () => format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    },
  ];

  const handleDayClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onSelect?.(formatted);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(null);
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isSelected = (day: Date) => {
    return parsedDate ? isSameDay(day, parsedDate) : false;
  };

  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };

  const displayLabel = parsedDate ? format(parsedDate, "MMM d, yyyy") : placeholder;
  const hasValue = Boolean(parsedDate);

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-between text-left font-normal border-input bg-background text-xs cursor-pointer shadow-2xs hover:bg-accent/50",
              !hasValue && "text-muted-foreground",
              hasValue && "text-foreground font-medium border-purple-500/40"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate">{displayLabel}</span>
            </div>
            {hasValue && clearable && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="ml-1 rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear date"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
            {/* Quick Presets */}
            <div className="p-3 space-y-1 sm:w-32 shrink-0 bg-muted/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Presets
              </p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onSelect?.(preset.getValue());
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-medium cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}

              {hasValue && clearable && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(null);
                    setOpen(false);
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium cursor-pointer pt-2 border-t border-border/50"
                >
                  Clear date
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
                  const today = isToday(day);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "h-8 w-8 text-xs rounded-md flex items-center justify-center transition-all cursor-pointer font-medium relative",
                        !isCurrent && "text-muted-foreground/30",
                        isCurrent && !selected && "hover:bg-accent text-foreground",
                        today && !selected && "font-bold text-purple-600 dark:text-purple-400 border border-purple-500/30",
                        selected && "bg-purple-600 text-white font-bold shadow-xs hover:bg-purple-700"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {/* Helper footer */}
              {parsedDate && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pt-1 border-t border-border/50">
                  <span>Selected date:</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {format(parsedDate, "yyyy-MM-dd")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
