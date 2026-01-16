"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

type MemoType = "NOTE" | "ANECDOTE" | "JOURNAL" | "MEETING" | "QUICK_THOUGHT";

interface Memo {
  id: string;
  title: string;
  content: string;
  memoType: MemoType;
  tags: string[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mockMemos: Memo[] = [
  {
    id: "1",
    title: "Project Ideas for Q2",
    content: "Consider building a habit tracking feature with gamification elements. Users could earn badges and compete on leaderboards...",
    memoType: "NOTE",
    tags: ["work", "ideas"],
    isPinned: true,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-16"),
  },
  {
    id: "2",
    title: "Meeting with Design Team",
    content: "Discussed the new dashboard layout. Key points: simplify navigation, add quick actions, improve mobile experience...",
    memoType: "MEETING",
    tags: ["work", "design"],
    isPinned: false,
    createdAt: new Date("2026-01-14"),
    updatedAt: new Date("2026-01-14"),
  },
  {
    id: "3",
    title: "Great conversation with Sarah",
    content: "Had coffee with Sarah today. She mentioned an interesting book about productivity systems...",
    memoType: "ANECDOTE",
    tags: ["personal"],
    isPinned: false,
    createdAt: new Date("2026-01-13"),
    updatedAt: new Date("2026-01-13"),
  },
  {
    id: "4",
    title: "Weekly reflection",
    content: "This week was productive overall. Completed the main feature, fixed several bugs. Need to focus more on documentation...",
    memoType: "JOURNAL",
    tags: ["personal", "reflection"],
    isPinned: false,
    createdAt: new Date("2026-01-12"),
    updatedAt: new Date("2026-01-12"),
  },
  {
    id: "5",
    title: "API optimization idea",
    content: "What if we cache the most frequently accessed endpoints?",
    memoType: "QUICK_THOUGHT",
    tags: ["work", "tech"],
    isPinned: false,
    createdAt: new Date("2026-01-11"),
    updatedAt: new Date("2026-01-11"),
  },
];

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

function MemoCard({ memo, onTogglePin }: { memo: Memo; onTogglePin: () => void }) {
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
              <DropdownMenuItem onClick={onTogglePin}>
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
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
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
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(memo.updatedAt, "MMM d")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemosPage() {
  const [memos] = useState<Memo[]>(mockMemos);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MemoType | "ALL">("ALL");

  const filteredMemos = memos
    .filter((memo) => {
      if (selectedType !== "ALL" && memo.memoType !== selectedType) return false;
      if (searchQuery) {
        return (
          memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memo.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const memoTypes: (MemoType | "ALL")[] = ["ALL", "NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"];

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
        <Dialog>
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
              <Input placeholder="Title" />
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Start writing..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save Memo</Button>
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

      {/* Memos Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMemos.map((memo) => (
          <MemoCard key={memo.id} memo={memo} onTogglePin={() => {}} />
        ))}
      </div>

      {filteredMemos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No memos found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
