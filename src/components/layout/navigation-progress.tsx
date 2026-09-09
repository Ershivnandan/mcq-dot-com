"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Stop progress animation when pathname or searchParams change
  React.useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Intercept click on internal links to trigger immediate feedback
  React.useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/api") &&
        target.target !== "_blank" &&
        href !== pathname
      ) {
        setIsNavigating(true);
      }
    };

    window.addEventListener("click", handleLinkClick, { capture: true });
    return () => window.removeEventListener("click", handleLinkClick, { capture: true });
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] overflow-hidden pointer-events-none">
      <div className="h-full bg-gradient-to-r from-purple-500 via-primary to-indigo-500 animate-[progress_1.2s_ease-in-out_infinite]" />
      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
