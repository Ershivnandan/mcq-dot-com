"use client";

import * as React from "react";
import { Download, Smartphone, X, CheckCircle2, Info, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BeforeInstallPromptEvent } from "@/typings";

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [isInsecureOrigin, setIsInsecureOrigin] = React.useState(false);

  React.useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    // 2. Check if running on non-localhost HTTP (Mobile Chrome blocks PWA install on HTTP IP)
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const isHttps = window.location.protocol === "https:";

    if (!isLocalhost && !isHttps) {
      setIsInsecureOrigin(true);
    }

    // 3. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[PWA] Service Worker registration failed:", err);
        });
    }

    // 4. Listen for Chrome's beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsStandalone(true);
      console.log("[PWA] App successfully installed!");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. Listen for custom trigger from Header / Menu
    const handleCustomOpen = () => {
      setShowHelpModal(true);
    };
    window.addEventListener("open-pwa-install", handleCustomOpen);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install", handleCustomOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If deferredPrompt is not available (e.g. Chrome throttled or non-localhost HTTP), show instructions modal
      setShowHelpModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
      } else {
        console.log("[PWA] User dismissed the install prompt");
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (err) {
      console.error("[PWA] Install prompt error:", err);
      setShowHelpModal(true);
    }
  };

  // Don't display anything if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating PWA Install Banner on Mobile / Tablet */}
      {showBanner && !dismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl supports-[backdrop-filter]:bg-background/85 border-primary/20">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-bold text-foreground truncate">Install MCQ Quiz App</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Faster loading & offline exam practice
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="h-8 px-3 text-xs font-bold gap-1.5 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </Button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Instructions Dialog for Mobile Chrome */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5 text-primary" />
              <span>How to Install on Mobile Chrome</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Follow these simple steps to install the app onto your Android or iOS home screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {isInsecureOrigin && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Important for Local Wi-Fi Testing:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Mobile Chrome blocks automatic PWA installation on plain HTTP local network addresses (e.g. <code>http://192.168.x.x:3000</code>). To enable PWA download on local Wi-Fi:
                </p>
                <ol className="list-decimal list-inside text-[11px] space-y-0.5 pt-1 font-medium">
                  <li>In Chrome mobile, open: <code className="bg-background/80 px-1 py-0.5 rounded">chrome://flags</code></li>
                  <li>Search for: <strong>unsafely-treat-insecure-origin-as-secure</strong></li>
                  <li>Enable it and add your URL: <code className="bg-background/80 px-1 py-0.5 rounded">{typeof window !== "undefined" ? window.location.origin : ""}</code></li>
                  <li>Relaunch Chrome.</li>
                </ol>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-foreground">Open Chrome Menu</p>
                  <p className="text-muted-foreground text-[11px]">
                    Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-foreground">Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</p>
                  <p className="text-muted-foreground text-[11px]">
                    Select <strong>Install app</strong> from the dropdown menu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-bold text-foreground">Confirm Installation</p>
                  <p className="text-muted-foreground text-[11px]">
                    Tap <strong>Install</strong> when prompted. The MCQ Quiz App will be installed with its own standalone icon on your device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHelpModal(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
