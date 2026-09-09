"use client";

import * as React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="max-w-md w-full p-8 rounded-2xl border bg-card shadow-lg space-y-5 animate-in fade-in">
        <div className="h-16 w-16 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <WifiOff className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            You&apos;re Offline
          </h1>
          <p className="text-sm text-muted-foreground">
            It looks like you lost internet connection. You can still access previously viewed pages, or reconnect to continue practicing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="w-full sm:w-auto gap-2 font-bold"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
