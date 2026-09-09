import { Skeleton } from "@/components/ui/skeleton";

export function QuizSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Quiz History Cards List */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl border bg-card/60 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right space-y-1">
                <Skeleton className="h-6 w-16 ml-auto" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
