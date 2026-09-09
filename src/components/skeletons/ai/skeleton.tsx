import { Skeleton } from "@/components/ui/skeleton";

export function AISkeleton() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Generator Panel Skeleton */}
      <div className="p-6 rounded-2xl border bg-card/60 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <Skeleton className="h-20 w-full rounded-xl" />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>

        <Skeleton className="h-9 w-36 rounded-lg ml-auto" />
      </div>

      {/* Drafts List Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl border bg-card/60 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <Skeleton className="h-5 w-5/6" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
