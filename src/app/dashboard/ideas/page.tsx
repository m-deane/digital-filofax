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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IdeaStatus = "NEW" | "EXPLORING" | "IN_PROGRESS" | "IMPLEMENTED" | "ARCHIVED";

interface Idea {
  id: string;
  title: string;
  description?: string;
  status: IdeaStatus;
  priority: number;
  tags: string[];
  createdAt: Date;
}

const mockIdeas: Idea[] = [
  { id: "1", title: "Mobile app redesign", description: "Consider a bottom navigation bar for better UX on mobile devices", status: "NEW", priority: 4, tags: ["design", "mobile"], createdAt: new Date() },
  { id: "2", title: "Automation workflow", description: "Set up automatic meal plan generation from recipes repository", status: "NEW", priority: 3, tags: ["automation"], createdAt: new Date() },
  { id: "3", title: "Dark mode improvements", description: "Add more contrast options and custom accent colors", status: "EXPLORING", priority: 3, tags: ["design", "accessibility"], createdAt: new Date() },
  { id: "4", title: "API caching layer", description: "Implement Redis caching for frequently accessed endpoints", status: "EXPLORING", priority: 5, tags: ["tech", "performance"], createdAt: new Date() },
  { id: "5", title: "Weekly digest email", description: "Send users a summary of their weekly progress", status: "IN_PROGRESS", priority: 4, tags: ["feature"], createdAt: new Date() },
  { id: "6", title: "Keyboard shortcuts", description: "Add comprehensive keyboard navigation throughout the app", status: "IN_PROGRESS", priority: 3, tags: ["ux"], createdAt: new Date() },
  { id: "7", title: "Export to PDF", description: "Allow users to export their tasks and notes as PDF", status: "IMPLEMENTED", priority: 2, tags: ["feature"], createdAt: new Date() },
];

const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-blue-500" },
  EXPLORING: { label: "Exploring", color: "bg-yellow-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-500" },
  IMPLEMENTED: { label: "Implemented", color: "bg-green-500" },
  ARCHIVED: { label: "Archived", color: "bg-gray-500" },
};

function IdeaCard({ idea, onMove }: { idea: Idea; onMove: (status: IdeaStatus) => void }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < idea.priority ? "fill-yellow-400 text-yellow-400" : "text-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {idea.status !== "NEW" && (
                <DropdownMenuItem onClick={() => onMove("NEW")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to New
                </DropdownMenuItem>
              )}
              {idea.status !== "EXPLORING" && (
                <DropdownMenuItem onClick={() => onMove("EXPLORING")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to Exploring
                </DropdownMenuItem>
              )}
              {idea.status !== "IN_PROGRESS" && (
                <DropdownMenuItem onClick={() => onMove("IN_PROGRESS")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to In Progress
                </DropdownMenuItem>
              )}
              {idea.status !== "IMPLEMENTED" && (
                <DropdownMenuItem onClick={() => onMove("IMPLEMENTED")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to Implemented
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold mb-1">{idea.title}</h3>
        {idea.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {idea.description}
          </p>
        )}

        <div className="flex gap-1 flex-wrap">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ title, status, ideas, onMove }: {
  title: string;
  status: IdeaStatus;
  ideas: Idea[];
  onMove: (id: string, status: IdeaStatus) => void;
}) {
  const columnIdeas = ideas.filter((i) => i.status === status);
  const config = statusConfig[status];

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-3 h-3 rounded-full", config.color)} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {columnIdeas.length}
        </Badge>
      </div>
      <div className="space-y-3">
        {columnIdeas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onMove={(newStatus) => onMove(idea.id, newStatus)}
          />
        ))}
        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add idea
        </Button>
      </div>
    </div>
  );
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIdeas = ideas.filter((idea) => {
    if (!searchQuery) return true;
    return (
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleMove = (id: string, newStatus: IdeaStatus) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, status: newStatus } : idea
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideas</h1>
          <p className="text-muted-foreground">
            Capture, develop, and track your ideas
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Capture Idea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Capture New Idea</DialogTitle>
              <DialogDescription>
                Quick capture a new idea to explore later
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Idea title" />
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Description (optional)"
              />
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save Idea</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        <KanbanColumn title="New" status="NEW" ideas={filteredIdeas} onMove={handleMove} />
        <KanbanColumn title="Exploring" status="EXPLORING" ideas={filteredIdeas} onMove={handleMove} />
        <KanbanColumn title="In Progress" status="IN_PROGRESS" ideas={filteredIdeas} onMove={handleMove} />
        <KanbanColumn title="Implemented" status="IMPLEMENTED" ideas={filteredIdeas} onMove={handleMove} />
      </div>
    </div>
  );
}
