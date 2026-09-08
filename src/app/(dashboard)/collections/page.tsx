"use client";

import * as React from "react";
import Link from "next/link";
import { FolderTree, Plus, Play, Trash2, BookOpen, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CollectionsPage() {
  const [collections, setCollections] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");
  const [newCollectionDesc, setNewCollectionDesc] = React.useState("");

  const loadCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollectionName.trim(),
          description: newCollectionDesc.trim() || undefined,
        }),
      });

      if (res.ok) {
        setNewCollectionName("");
        setNewCollectionDesc("");
        setShowNewModal(false);
        await loadCollections();
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"? Questions inside will not be deleted.`)) return;

    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-amber-500" />
            <span>Collections</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Group questions into custom study sets (e.g. GATE Prep, JavaScript Interview, Weak Questions).
          </p>
        </div>

        <Button onClick={() => setShowNewModal(true)} className="gap-1.5 font-bold shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Collection</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <FolderTree className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base">No Collections Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create custom collections to curate questions for targeted study sessions.
              </p>
            </div>
            <Button onClick={() => setShowNewModal(true)} className="gap-1.5 font-bold mt-2">
              <Plus className="h-4 w-4" />
              <span>Create First Collection</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Card key={col.id} className="hover:shadow-md transition-all border-border/80 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>{col.name}</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(col.id, col.name)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {col.description && (
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {col.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-2 flex items-center justify-between border-t text-xs">
                <span className="text-muted-foreground">
                  {col._count?.questions || col.questionIds?.length || 0} questions
                </span>

                <div className="flex items-center gap-2">
                  <Link href={`/questions?collectionId=${col.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View
                    </Button>
                  </Link>
                  <Link href={`/quiz/new?collectionId=${col.id}`}>
                    <Button size="sm" className="h-7 text-xs gap-1 font-bold">
                      <Play className="h-3 w-3 fill-current" />
                      <span>Quiz</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Collection Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Collection Name</label>
              <Input
                placeholder="e.g. GATE CS Revision 2026"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
              <Input
                placeholder="Targeted review set for upcoming examination..."
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newCollectionName.trim()}>
                Create Collection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
