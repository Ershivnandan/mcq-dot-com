import { Skeleton } from "@/components/ui/skeleton";

export function QuestionsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="p-4 rounded-xl border bg-card shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 flex-1 min-w-[200px] rounded-lg" />
          <Skeleton className="h-9 w-[160px] rounded-lg" />
          <Skeleton className="h-9 w-[130px] rounded-lg" />
          <Skeleton className="h-9 w-[200px] rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg ml-auto" />
        </div>
      </div>

      {/* Questions Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-xl border bg-card/60 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>

            <Skeleton className="h-6 w-5/6" />

            <div className="space-y-2 pt-1">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
