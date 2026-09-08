import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIProviderSettings } from "@/components/ai/ai-provider-settings";

export default function AISettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span>AI Provider & API Key Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your Bring Your Own Key (BYOK) providers for Google Gemini, OpenAI, and Anthropic.
          </p>
        </div>
      </div>

      <AIProviderSettings />
    </div>
  );
}
