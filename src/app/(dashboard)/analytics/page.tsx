import * as React from "react";
import { requireAuth } from "@/server/auth/session";
import { AnalyticsService } from "@/server/services/analytics.service";
import dynamic from "next/dynamic";
import { AnalyticsSkeleton } from "@/components/skeletons/analytics/skeleton";

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics/analytics-dashboard").then((mod) => mod.AnalyticsDashboard),
  {
    loading: () => <AnalyticsSkeleton />,
  }
);

export default async function AnalyticsPage() {
  const user = await requireAuth();
  const metrics = await AnalyticsService.getDashboardMetrics(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Track learning performance, recall accuracy, difficulty mastery, and study habits over time.
        </p>
      </div>

      <AnalyticsDashboard metrics={metrics} />
    </div>
  );
}
