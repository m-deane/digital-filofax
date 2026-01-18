"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  FileText,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/trpc";

type MemoType = "NOTE" | "ANECDOTE" | "JOURNAL" | "MEETING" | "QUICK_THOUGHT";

interface Tag {
  id: string;
  name: string;
}

interface Memo {
  id: string;
  title: string;
  content: string;
  memoType: MemoType;
  tags: Tag[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function getMemoIcon(type: MemoType) {
  switch (type) {
    case "NOTE":
      return FileText;
    case "ANECDOTE":
      return BookOpen;
    case "JOURNAL":
      return BookOpen;
    case "MEETING":
      return MessageSquare;
    case "QUICK_THOUGHT":
      return Lightbulb;
  }
}

function getMemoTypeLabel(type: MemoType) {
  switch (type) {
    case "NOTE":
      return "Note";
    case "ANECDOTE":
      return "Anecdote";
    case "JOURNAL":
      return "Journal";
    case "MEETING":
      return "Meeting";
    case "QUICK_THOUGHT":
      return "Quick Thought";
  }
}

function MemoCard({
  memo,
  onTogglePin,
  onArchive,
  onDelete,
  isPinning,
}: {
  memo: Memo;
  onTogglePin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isPinning: boolean;
}) {
  const Icon = getMemoIcon(memo.memoType);

  return (
    <Card className={cn(memo.isPinned && "border-primary/50")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {getMemoTypeLabel(memo.memoType)}
            </Badge>
            {memo.isPinned && <Pin className="h-3 w-3 text-primary" />}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onTogglePin} disabled={isPinning}>
                {memo.isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold mb-2">{memo.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {memo.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {memo.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(new Date(memo.updatedAt), "MMM d")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MemoType | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMemoTitle, setNewMemoTitle] = useState("");
  const [newMemoContent, setNewMemoContent] = useState("");
  const [newMemoType, setNewMemoType] = useState<MemoType>("NOTE");
  const [pinningMemoId, setPinningMemoId] = useState<string | null>(null);

  const utils = api.useUtils();

  // Fetch memos from API with filters
  const { data, isLoading, error } = api.memos.getAll.useQuery({
    memoType: selectedType === "ALL" ? undefined : [selectedType],
    search: searchQuery || undefined,
  });

  // Create memo mutation
  const createMemo = api.memos.create.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
      setIsCreateOpen(false);
      setNewMemoTitle("");
      setNewMemoContent("");
      setNewMemoType("NOTE");
    },
  });

  // Toggle pin mutation
  const togglePin = api.memos.togglePin.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
      setPinningMemoId(null);
    },
    onError: () => {
      setPinningMemoId(null);
    },
  });

  // Archive mutation
  const archiveMemo = api.memos.archive.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
    },
  });

  // Delete mutation
  const deleteMemo = api.memos.delete.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
    },
  });

  const handleCreateMemo = () => {
    if (!newMemoTitle.trim()) return;
    createMemo.mutate({
      title: newMemoTitle,
      content: newMemoContent,
      memoType: newMemoType,
    });
  };

  const handleTogglePin = (memoId: string) => {
    setPinningMemoId(memoId);
    togglePin.mutate({ id: memoId });
  };

  const handleArchive = (memoId: string) => {
    archiveMemo.mutate({ id: memoId });
  };

  const handleDelete = (memoId: string) => {
    deleteMemo.mutate({ id: memoId });
  };

  const memos = (data?.memos ?? []) as Memo[];
  const memoTypes: (MemoType | "ALL")[] = ["ALL", "NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"];

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading memos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memos</h1>
          <p className="text-muted-foreground">
            Capture notes, thoughts, and memories
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Memo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Memo</DialogTitle>
              <DialogDescription>
                Capture a new note, thought, or memory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Title"
                value={newMemoTitle}
                onChange={(e) => setNewMemoTitle(e.target.value)}
              />
              <Select value={newMemoType} onValueChange={(v) => setNewMemoType(v as MemoType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Memo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="ANECDOTE">Anecdote</SelectItem>
                  <SelectItem value="JOURNAL">Journal</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="QUICK_THOUGHT">Quick Thought</SelectItem>
                </SelectContent>
              </Select>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Start writing..."
                value={newMemoContent}
                onChange={(e) => setNewMemoContent(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateMemo} disabled={createMemo.isPending || !newMemoTitle.trim()}>
                {createMemo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Memo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search memos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {memoTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {type === "ALL" ? "All" : getMemoTypeLabel(type)}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Memos Grid */}
      {!isLoading && memos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              onTogglePin={() => handleTogglePin(memo.id)}
              onArchive={() => handleArchive(memo.id)}
              onDelete={() => handleDelete(memo.id)}
              isPinning={pinningMemoId === memo.id}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && memos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== "ALL" ? "No memos found" : "No memos yet. Create your first memo!"}
            </p>
            {!searchQuery && selectedType === "ALL" && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Memo
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
