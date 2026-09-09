"use client";

import * as React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeStore, AppStore } from "@/store";
import { getQueryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { CommandPalette } from "@/components/layout/command-palette";
import { PWAInstaller } from "@/components/pwa/pwa-installer";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { AppProvidersProps } from "@/typings";

export function AppProviders({ children }: AppProvidersProps) {
  // Ensure Redux store is created once per request in SSR/client
  const storeRef = React.useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  // Get or initialize singleton QueryClient
  const queryClient = getQueryClient();

  return (
    <ReduxProvider store={storeRef.current}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <React.Suspense fallback={null}>
            <NavigationProgress />
          </React.Suspense>
          {children}
          <CommandPalette />
          <PWAInstaller />
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
