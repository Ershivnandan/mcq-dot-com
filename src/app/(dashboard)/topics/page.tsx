"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  ArrowRight,
  FolderPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TopicItem {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  _count?: { questions: number };
}

export default function TopicsPage() {
  const [topics, setTopics] = React.useState<TopicItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  // New topic modal state
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState("");
  const [newTopicDesc, setNewTopicDesc] = React.useState("");
  const [newTopicColor, setNewTopicColor] = React.useState("#6366f1");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Edit topic modal state
  const [editingTopic, setEditingTopic] = React.useState<TopicItem | null>(null);
  const [editTopicName, setEditTopicName] = React.useState("");
  const [editTopicDesc, setEditTopicDesc] = React.useState("");
  const [editTopicColor, setEditTopicColor] = React.useState("#6366f1");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const loadTopics = async () => {
    try {
      const res = await fetch("/api/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTopics();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: newTopicDesc.trim() || undefined,
          color: newTopicColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create topic");
      }

      setNewTopicName("");
      setNewTopicDesc("");
      setShowNewModal(false);
      await loadTopics();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create topic");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (topic: TopicItem) => {
    setEditingTopic(topic);
    setEditTopicName(topic.name);
    setEditTopicDesc(topic.description || "");
    setEditTopicColor(topic.color || "#6366f1");
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editTopicName.trim()) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/topics/${editingTopic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTopicName.trim(),
          description: editTopicDesc.trim() || null,
          color: editTopicColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update topic");
      }

      setEditingTopic(null);
      await loadTopics();
    } catch (err: any) {
      setEditError(err.message || "Failed to update topic");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete topic "${name}"? Questions tagged under this topic will remain intact.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/topics/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTopics((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const filteredTopics = search.trim()
    ? topics.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
      )
    : topics;

  const totalQuestionsInTopics = topics.reduce(
    (acc, t) => acc + (t._count?.questions || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-primary" />
            <span>Topics Collection</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Create, customize, and manage custom topics at your convenience to organize questions and target study sessions.
          </p>
        </div>

        <Button onClick={() => setShowNewModal(true)} className="gap-1.5 font-bold shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Topic</span>
        </Button>
      </div>

      {/* Summary & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium px-2">
          <span>{topics.length} topics</span>
          <span>•</span>
          <span>{totalQuestionsInTopics} questions organized</span>
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base">
                {search ? "No topics found" : "No Topics Created Yet"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search
                  ? `No topics match "${search}". Try a different keyword.`
                  : "Create separate topics whenever convenient (e.g. Modern History, Machine Learning, Calculus) to group questions."}
              </p>
            </div>
            {!search && (
              <Button onClick={() => setShowNewModal(true)} className="gap-1.5 font-bold mt-2">
                <Plus className="h-4 w-4" />
                <span>Create First Topic</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((t) => (
            <Card
              key={t.id}
              className="hover:shadow-md transition-all border-border/80 group flex flex-col justify-between overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: t.color || "#6366f1" }}
                    />
                    <span className="truncate">{t.name}</span>
                  </CardTitle>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(t)}
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      title="Edit Topic"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id, t.name)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete Topic"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {t.description && (
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {t.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-2 flex items-center justify-between border-t text-xs">
                <span className="text-muted-foreground font-medium">
                  {t._count?.questions || 0} questions
                </span>

                <div className="flex items-center gap-1.5">
                  <Link href={`/questions?topicId=${t.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                      View
                    </Button>
                  </Link>
                  <Link href={`/quiz/new?topicId=${t.id}`}>
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

      {/* New Topic Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription className="text-xs">
              Add a topic to your separate topics collection whenever convenient.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Topic Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Modern Indian History, Computer Networks"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
              <Input
                placeholder="Brief summary of what this topic covers..."
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Color Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTopicColor}
                  onChange={(e) => setNewTopicColor(e.target.value)}
                  className="h-8 w-12 rounded border p-0.5 cursor-pointer bg-transparent"
                />
                <span className="text-xs text-muted-foreground font-mono">{newTopicColor}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newTopicName.trim()} className="font-semibold">
                {creating ? "Creating..." : "Create Topic"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={Boolean(editingTopic)} onOpenChange={(open) => !open && setEditingTopic(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription className="text-xs">
              Update this topic&apos;s name, description, or color tag.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
              {editError}
            </div>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Topic Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={editTopicName}
                onChange={(e) => setEditTopicName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
              <Input
                value={editTopicDesc}
                onChange={(e) => setEditTopicDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Color Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editTopicColor}
                  onChange={(e) => setEditTopicColor(e.target.value)}
                  className="h-8 w-12 rounded border p-0.5 cursor-pointer bg-transparent"
                />
                <span className="text-xs text-muted-foreground font-mono">{editTopicColor}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingTopic(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit || !editTopicName.trim()} className="font-semibold">
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
