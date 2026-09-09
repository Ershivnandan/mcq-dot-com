import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardChartsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Primary Chart Skeleton */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-64" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Skeleton className="h-48 w-full rounded-xl" />
          </CardContent>
        </Card>

        {/* Right Secondary Chart Skeleton */}
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </div>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Skeleton className="h-48 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Retention / Mastery Funnel Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent p-6 rounded-2xl border border-primary/20">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 sm:w-96" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl border bg-card/60 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <DashboardChartsSkeleton />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Due for Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Skeleton className="h-8 rounded-lg" />
                  <Skeleton className="h-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Activity & Weakest Topics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border bg-card/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
