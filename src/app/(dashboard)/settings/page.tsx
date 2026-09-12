"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  Upload,
  Download,
  Key,
  User,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WipeDataDialog } from "@/components/settings/wipe-data-dialog";

export default function SettingsHubPage() {
  const [importing, setImporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<string | null>(null);
  const [importSummary, setImportSummary] = React.useState<any | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [wipeDialogOpen, setWipeDialogOpen] = React.useState(false);
  const [wipeMode, setWipeMode] = React.useState<"questions-only" | "full-reset">("questions-only");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportSummary(null);
    setImportError(null);
    setImportStatus("Reading and parsing JSON file...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        const folderCount = Array.isArray(json.folders) ? json.folders.length : 0;
        const questionCount = Array.isArray(json.questions)
          ? json.questions.length
          : Array.isArray(json.folders)
          ? json.folders.reduce((acc: number, f: any) => acc + (f.questions?.length || 0), 0)
          : Array.isArray(json)
          ? json.length
          : 0;

        setImportStatus(
          `Uploading and bulk-importing ${questionCount.toLocaleString()} questions${
            folderCount ? ` across ${folderCount} folders` : ""
          }...`
        );

        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to import backup.");
        }

        setImportSummary(data.summary);
      } catch (err: any) {
        setImportError(err.message || "Failed to read or import file.");
      } finally {
        setImporting(false);
        setImportStatus(null);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file from disk.");
      setImporting(false);
      setImportStatus(null);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage your account, import/export question data, and configure AI providers.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/settings/ai">
          <Card className="hover:shadow-md transition-all cursor-pointer border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">AI Provider & API Keys</p>
                <p className="text-xs text-muted-foreground">Configure Google Gemini, OpenAI, or Anthropic BYOK keys.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/profile">
          <Card className="hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Account & Security</p>
                <p className="text-xs text-muted-foreground">Update profile name, change password, manage preferences.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Import / Export Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileJson className="h-4 w-4 text-blue-500" />
            <span>Data Migration & Backup</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Import existing JSON backups (including mcq_backup_new.json) or export your library.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Import Box */}
          <div className="rounded-xl border border-dashed p-6 text-center space-y-3 bg-muted/20">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Upload className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Import Backup JSON</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Automatically extracts date headers, normalizes options, merges duplicates, and links favorites.
              </p>
              {importing && importStatus && (
                <p className="text-xs text-primary font-semibold animate-pulse pt-1">{importStatus}</p>
              )}
            </div>

            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                <span>{importing ? "Importing & Bulk Processing..." : "Select JSON File"}</span>
              </span>
            </label>
          </div>

          {/* Import Summary Results */}
          {importSummary && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Import Completed Successfully!</span>
                </div>
                {importSummary.totalInFile > 0 && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Processed {importSummary.totalInFile.toLocaleString()} items
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-foreground pt-1">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Imported</span>
                  <span className="font-bold text-base text-emerald-600">{importSummary.imported.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Dates Extracted</span>
                  <span className="font-bold text-base text-blue-600">{importSummary.dateHeadersFound.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Dividers Skipped</span>
                  <span className="font-bold text-base text-muted-foreground">{importSummary.skipped.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Topics Created</span>
                  <span className="font-bold text-base text-purple-600">{importSummary.topicsCreated?.length || 0}</span>
                </div>
              </div>

              {importSummary.topicsCreated && importSummary.topicsCreated.length > 0 && (
                <div className="pt-2 border-t border-emerald-500/20">
                  <span className="text-muted-foreground block text-[11px] mb-1.5 font-medium">Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {importSummary.topicsCreated.map((t: string) => (
                      <span
                        key={t}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-background/80 border text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {importError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Export Box */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <div>
              <p className="text-sm font-bold text-foreground">Export Library</p>
              <p className="text-xs text-muted-foreground">Download all your questions, options, and explanations as JSON.</p>
            </div>
            <Link href="/api/export" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <Download className="h-3.5 w-3.5" />
                <span>Download Backup</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Hard Deletion & Account Reset */}
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            <span>Danger Zone & Account Reset</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Permanently hard-delete question records or wipe all data to start fresh. This cannot be undone.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Wipe Questions Only */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-destructive/20 bg-card">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-foreground">Delete All Questions</p>
              <p className="text-xs text-muted-foreground">
                Permanently hard-delete all questions, study progress records, and pending AI drafts. Topics and categories remain.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWipeMode("questions-only");
                setWipeDialogOpen(true);
              }}
              className="text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50 text-xs font-bold shrink-0 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All Questions</span>
            </Button>
          </div>

          {/* Full Account Data Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-destructive">Reset Entire Account (Start Fresh)</p>
              <p className="text-xs text-muted-foreground">
                Irrevocably hard-delete everything: all questions, progress, quizzes, attempts, topics, categories, tags, and logs. Your login account and session remain active.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setWipeMode("full-reset");
                setWipeDialogOpen(true);
              }}
              className="text-xs font-bold shrink-0 gap-1.5 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Account Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wipe Confirmation Dialog */}
      <WipeDataDialog
        open={wipeDialogOpen}
        onOpenChange={setWipeDialogOpen}
        mode={wipeMode}
      />
    </div>
  );
}
