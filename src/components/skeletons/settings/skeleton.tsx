import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Settings Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-5 rounded-xl border bg-card/60 flex items-center gap-4 shadow-xs">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
        ))}
      </div>

      {/* Backup & Data Section */}
      <div className="p-6 rounded-xl border bg-card/60 space-y-4 shadow-xs">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center space-y-3 bg-muted/20">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
    </div>
  );
}
