"use client";

import { useState, useEffect, useMemo } from "react";
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
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Lightbulb,
  ArrowRight,
  Loader2,
  List,
  LayoutGrid,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { SortDropdown } from "@/components/ui/sort-dropdown";

type IdeaStatus = "NEW" | "EXPLORING" | "IN_PROGRESS" | "IMPLEMENTED" | "ARCHIVED";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  priority: number;
  categoryId: string | null;
  category: Category | null;
  tags: Tag[];
  createdAt: Date;
}

const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-blue-500" },
  EXPLORING: { label: "Exploring", color: "bg-yellow-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-500" },
  IMPLEMENTED: { label: "Implemented", color: "bg-green-500" },
  ARCHIVED: { label: "Archived", color: "bg-gray-500" },
};

const VIEW_STORAGE_KEY = "filofax-ideas-view";

function IdeaCard({
  idea,
  onMove,
  onEdit,
  onDelete,
  onUpdatePriority,
  isUpdating,
}: {
  idea: Idea;
  onMove: (status: IdeaStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePriority: (priority: number) => void;
  isUpdating: boolean;
}) {
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
                    "h-3 w-3 cursor-pointer transition-colors",
                    i < idea.priority ? "fill-yellow-400 text-yellow-400" : "text-muted hover:text-yellow-400"
                  )}
                  onClick={() => onUpdatePriority(i + 1)}
                />
              ))}
            </div>
          </div>
          <IdeaActions idea={idea} onMove={onMove} onEdit={onEdit} onDelete={onDelete} isUpdating={isUpdating} />
        </div>

        <h3 className="font-semibold mb-1">{idea.title}</h3>
        {idea.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {idea.description}
          </p>
        )}

        <div className="flex gap-1 flex-wrap">
          {idea.category && (
            <Badge style={{ backgroundColor: idea.category.color, color: "#fff" }} className="text-xs">
              {idea.category.name}
            </Badge>
          )}
          {idea.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IdeaActions({
  idea,
  onMove,
  onEdit,
  onDelete,
  isUpdating,
  className,
}: {
  idea: Idea;
  onMove: (status: IdeaStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  className?: string;
}) {
  const moveTargets: IdeaStatus[] = ["NEW", "EXPLORING", "IN_PROGRESS", "IMPLEMENTED"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8", className)} disabled={isUpdating}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        {moveTargets
          .filter((s) => s !== idea.status)
          .map((status) => (
            <DropdownMenuItem key={status} onClick={() => onMove(status)}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Move to {statusConfig[status].label}
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function IdeaListItem({
  idea,
  onMove,
  onEdit,
  onDelete,
  onUpdatePriority,
  isUpdating,
}: {
  idea: Idea;
  onMove: (status: IdeaStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePriority: (priority: number) => void;
  isUpdating: boolean;
}) {
  const config = statusConfig[idea.status];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{idea.title}</p>
        {idea.description && (
          <p className="text-sm text-muted-foreground truncate">{idea.description}</p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3 cursor-pointer transition-colors",
              i < idea.priority ? "fill-yellow-400 text-yellow-400" : "text-muted hover:text-yellow-400"
            )}
            onClick={() => onUpdatePriority(i + 1)}
          />
        ))}
      </div>
      <div className="hidden md:flex gap-1 flex-shrink-0">
        {idea.category && (
          <Badge style={{ backgroundColor: idea.category.color, color: "#fff" }} className="text-xs">
            {idea.category.name}
          </Badge>
        )}
        {idea.tags.slice(0, 2).map((tag) => (
          <Badge key={tag.id} variant="outline" className="text-xs">
            {tag.name}
          </Badge>
        ))}
      </div>
      <IdeaActions
        idea={idea}
        onMove={onMove}
        onEdit={onEdit}
        onDelete={onDelete}
        isUpdating={isUpdating}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0"
      />
    </div>
  );
}

function IdeasListView({
  ideas,
  onMove,
  onEdit,
  onDelete,
  onUpdatePriority,
  onAddIdea,
  updatingIdeaId,
}: {
  ideas: Idea[];
  onMove: (id: string, status: IdeaStatus) => void;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onUpdatePriority: (id: string, priority: number) => void;
  onAddIdea: (status: IdeaStatus) => void;
  updatingIdeaId: string | null;
}) {
  const statusOrder: IdeaStatus[] = ["NEW", "EXPLORING", "IN_PROGRESS", "IMPLEMENTED", "ARCHIVED"];

  return (
    <div className="space-y-6">
      {statusOrder.map((status) => {
        const statusIdeas = ideas.filter((i) => i.status === status);
        if (statusIdeas.length === 0) return null;
        const config = statusConfig[status];

        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-3 h-3 rounded-full", config.color)} />
              <h3 className="font-semibold text-sm">{config.label}</h3>
              <Badge variant="secondary">{statusIdeas.length}</Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 gap-1 text-muted-foreground"
                onClick={() => onAddIdea(status)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {statusIdeas.map((idea) => (
                <IdeaListItem
                  key={idea.id}
                  idea={idea}
                  onMove={(newStatus) => onMove(idea.id, newStatus)}
                  onEdit={() => onEdit(idea)}
                  onDelete={() => onDelete(idea.id)}
                  onUpdatePriority={(priority) => onUpdatePriority(idea.id, priority)}
                  isUpdating={updatingIdeaId === idea.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanColumn({
  title,
  status,
  ideas,
  onMove,
  onEdit,
  onDelete,
  onUpdatePriority,
  onAddIdea,
  updatingIdeaId,
}: {
  title: string;
  status: IdeaStatus;
  ideas: Idea[];
  onMove: (id: string, status: IdeaStatus) => void;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onUpdatePriority: (id: string, priority: number) => void;
  onAddIdea: (status: IdeaStatus) => void;
  updatingIdeaId: string | null;
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
            onEdit={() => onEdit(idea)}
            onDelete={() => onDelete(idea.id)}
            onUpdatePriority={(priority) => onUpdatePriority(idea.id, priority)}
            isUpdating={updatingIdeaId === idea.id}
          />
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddIdea(status)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add idea
        </Button>
      </div>
    </div>
  );
}

export default function IdeasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaDescription, setNewIdeaDescription] = useState("");
  const [newIdeaStatus, setNewIdeaStatus] = useState<IdeaStatus>("NEW");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [updatingIdeaId, setUpdatingIdeaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(() =>
    typeof window !== "undefined" ? (localStorage.getItem("filofax-sort-ideas") ?? "createdAt-desc") : "createdAt-desc"
  );

  const utils = api.useUtils();

  // Load saved view preference
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY) as "list" | "board" | null;
    if (saved) setViewMode(saved);
  }, []);

  const toggleView = (mode: "list" | "board") => {
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  };

  // Fetch categories and tags
  const { data: categories } = api.categories.getAll.useQuery();
  const { data: allTags } = api.tags.getAll.useQuery();

  // Fetch ideas from API
  const { data, isLoading, error } = api.ideas.getAll.useQuery({
    search: searchQuery || undefined,
    categoryId: filterCategoryId || undefined,
    tagIds: filterTagIds.length > 0 ? filterTagIds : undefined,
  });

  // Create idea mutation
  const createIdea = api.ideas.create.useMutation({
    onSuccess: () => {
      utils.ideas.getAll.invalidate();
      resetForm();
    },
  });

  // Update idea mutation
  const updateIdea = api.ideas.update.useMutation({
    onSuccess: () => {
      utils.ideas.getAll.invalidate();
      resetForm();
    },
  });

  // Update status mutation
  const updateStatus = api.ideas.updateStatus.useMutation({
    onSuccess: () => {
      utils.ideas.getAll.invalidate();
      setUpdatingIdeaId(null);
    },
    onError: () => {
      setUpdatingIdeaId(null);
    },
  });

  // Update priority mutation
  const updatePriority = api.ideas.updatePriority.useMutation({
    onSuccess: () => {
      utils.ideas.getAll.invalidate();
    },
  });

  // Delete mutation
  const deleteIdea = api.ideas.delete.useMutation({
    onSuccess: () => {
      utils.ideas.getAll.invalidate();
    },
  });

  // Inline create category
  const createCategory = api.categories.create.useMutation({
    onSuccess: (newCat) => {
      utils.categories.getAll.invalidate();
      setSelectedCategoryId(newCat.id);
      setNewCategoryName("");
    },
  });

  // Inline create tag
  const createTag = api.tags.create.useMutation({
    onSuccess: (newTag) => {
      utils.tags.getAll.invalidate();
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagName("");
    },
  });

  const resetForm = () => {
    setIsCreateOpen(false);
    setEditingIdea(null);
    setNewIdeaTitle("");
    setNewIdeaDescription("");
    setNewIdeaStatus("NEW");
    setSelectedCategoryId("");
    setSelectedTagIds([]);
    setNewCategoryName("");
    setNewTagName("");
  };

  const handleCreateIdea = () => {
    if (!newIdeaTitle.trim()) return;

    if (editingIdea) {
      updateIdea.mutate({
        id: editingIdea.id,
        title: newIdeaTitle,
        description: newIdeaDescription || null,
        categoryId: selectedCategoryId || null,
        tagIds: selectedTagIds,
      });
    } else {
      createIdea.mutate({
        title: newIdeaTitle,
        description: newIdeaDescription || undefined,
        status: newIdeaStatus,
        categoryId: selectedCategoryId || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });
    }
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setNewIdeaTitle(idea.title);
    setNewIdeaDescription(idea.description ?? "");
    setSelectedCategoryId(idea.categoryId ?? "");
    setSelectedTagIds(idea.tags.map((t) => t.id));
    setIsCreateOpen(true);
  };

  const handleMove = (id: string, newStatus: IdeaStatus) => {
    setUpdatingIdeaId(id);
    updateStatus.mutate({ id, status: newStatus });
  };

  const handleUpdatePriority = (id: string, priority: number) => {
    updatePriority.mutate({ id, priority });
  };

  const handleDelete = (id: string) => {
    deleteIdea.mutate({ id });
  };

  const handleAddIdea = (status: IdeaStatus) => {
    setNewIdeaStatus(status);
    setIsCreateOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) resetForm();
    else setIsCreateOpen(true);
  };

  const handleInlineCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategory.mutate({ name: newCategoryName });
  };

  const handleInlineCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag.mutate({ name: newTagName });
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleFilterTag = (tagId: string) => {
    setFilterTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const hasActiveFilters = filterCategoryId || filterTagIds.length > 0;

  const clearFilters = () => {
    setFilterCategoryId("");
    setFilterTagIds([]);
  };

  const ideas = useMemo(() => {
    const raw = (data?.ideas ?? []) as Idea[];
    const sorted = [...raw];
    switch (sortBy) {
      case "createdAt-asc":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "createdAt-desc":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "priority-desc":
        sorted.sort((a, b) => b.priority - a.priority);
        break;
      case "priority-asc":
        sorted.sort((a, b) => a.priority - b.priority);
        break;
      case "alpha-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alpha-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "category":
        sorted.sort((a, b) => (a.category?.name ?? "").localeCompare(b.category?.name ?? ""));
        break;
    }
    return sorted;
  }, [data?.ideas, sortBy]);

  const isMutating = createIdea.isPending || updateIdea.isPending;

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading ideas: {error.message}</p>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 gap-1.5"
              onClick={() => toggleView("list")}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="h-7 gap-1.5"
              onClick={() => toggleView("board")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Capture Idea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingIdea ? "Edit Idea" : "Capture New Idea"}</DialogTitle>
                <DialogDescription>
                  {editingIdea ? "Update this idea" : "Quick capture a new idea to explore later"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Idea title"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                />
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Description (optional)"
                  value={newIdeaDescription}
                  onChange={(e) => setNewIdeaDescription(e.target.value)}
                />

                {/* Category Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInlineCreateCategory()}
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      onClick={handleInlineCreateCategory}
                      disabled={!newCategoryName.trim() || createCategory.isPending}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Tags Multi-select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-1.5 flex-wrap min-h-[32px] p-2 rounded-md border">
                    {allTags?.length === 0 && selectedTagIds.length === 0 && (
                      <span className="text-sm text-muted-foreground">No tags available</span>
                    )}
                    {allTags?.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleTagSelection(tag.id)}
                      >
                        {tag.name}
                        {selectedTagIds.includes(tag.id) && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New tag..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInlineCreateTag()}
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      onClick={handleInlineCreateTag}
                      disabled={!newTagName.trim() || createTag.isPending}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleDialogChange(false)}>Cancel</Button>
                <Button onClick={handleCreateIdea} disabled={isMutating || !newIdeaTitle.trim()}>
                  {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingIdea ? "Save Changes" : "Save Idea"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategoryId || "all"} onValueChange={(v) => setFilterCategoryId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5 flex-wrap">
          {allTags?.map((tag) => (
            <Badge
              key={tag.id}
              variant={filterTagIds.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleFilterTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
        <SortDropdown
          value={sortBy}
          onChange={(v) => { setSortBy(v); localStorage.setItem("filofax-sort-ideas", v); }}
          options={[
            { label: "Newest first", value: "createdAt-desc" },
            { label: "Oldest first", value: "createdAt-asc" },
            { label: "Priority: high → low", value: "priority-desc" },
            { label: "Priority: low → high", value: "priority-asc" },
            { label: "A → Z", value: "alpha-asc" },
            { label: "Z → A", value: "alpha-desc" },
            { label: "Category", value: "category" },
          ]}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && ideas.length === 0 && !searchQuery && !hasActiveFilters && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No ideas yet. Capture your first idea!</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Capture Idea
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No results with filters */}
      {!isLoading && ideas.length === 0 && (searchQuery || hasActiveFilters) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No ideas match your filters</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); clearFilters(); }}>
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ideas Content */}
      {!isLoading && ideas.length > 0 && (
        <>
          {viewMode === "list" ? (
            <IdeasListView
              ideas={ideas}
              onMove={handleMove}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdatePriority={handleUpdatePriority}
              onAddIdea={handleAddIdea}
              updatingIdeaId={updatingIdeaId}
            />
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              <KanbanColumn
                title="New"
                status="NEW"
                ideas={ideas}
                onMove={handleMove}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdatePriority={handleUpdatePriority}
                onAddIdea={handleAddIdea}
                updatingIdeaId={updatingIdeaId}
              />
              <KanbanColumn
                title="Exploring"
                status="EXPLORING"
                ideas={ideas}
                onMove={handleMove}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdatePriority={handleUpdatePriority}
                onAddIdea={handleAddIdea}
                updatingIdeaId={updatingIdeaId}
              />
              <KanbanColumn
                title="In Progress"
                status="IN_PROGRESS"
                ideas={ideas}
                onMove={handleMove}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdatePriority={handleUpdatePriority}
                onAddIdea={handleAddIdea}
                updatingIdeaId={updatingIdeaId}
              />
              <KanbanColumn
                title="Implemented"
                status="IMPLEMENTED"
                ideas={ideas}
                onMove={handleMove}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdatePriority={handleUpdatePriority}
                onAddIdea={handleAddIdea}
                updatingIdeaId={updatingIdeaId}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
