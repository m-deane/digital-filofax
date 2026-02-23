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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { SortDropdown } from "@/components/ui/sort-dropdown";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextViewer } from "@/components/rich-text-viewer";

type MemoType = "NOTE" | "ANECDOTE" | "JOURNAL" | "MEETING" | "QUICK_THOUGHT";

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

interface Memo {
  id: string;
  title: string;
  content: string;
  memoType: MemoType;
  categoryId: string | null;
  category: Category | null;
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
  onEdit,
  onArchive,
  onDelete,
  isPinning,
}: {
  memo: Memo;
  onTogglePin: () => void;
  onEdit: () => void;
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
              <DropdownMenuItem onClick={onEdit}>
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
        <div className="text-sm text-muted-foreground line-clamp-3 mb-3">
          <RichTextViewer content={memo.content} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {memo.category && (
              <Badge style={{ backgroundColor: memo.category.color, color: "#fff" }} className="text-xs">
                {memo.category.name}
              </Badge>
            )}
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

// Map MemoType to TemplateType key for auto-apply
const MEMO_TO_TEMPLATE_TYPE: Partial<Record<MemoType, string>> = {
  MEETING: "MEETING_NOTES",
};

// Convert a MEETING_NOTES template content to Tiptap JSON string
function meetingTemplateTotiptap(content: unknown): string {
  try {
    const c = content as { sections?: Array<{ heading: string; content: string }> };
    const sections = c?.sections ?? [];
    const doc = {
      type: "doc",
      content: sections.flatMap((s) => [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: s.heading }] },
        {
          type: "paragraph",
          content: s.content ? [{ type: "text", text: s.content }] : [],
        },
      ]),
    };
    return JSON.stringify(doc);
  } catch {
    return "";
  }
}

export default function MemosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MemoType | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [newMemoTitle, setNewMemoTitle] = useState("");
  const [newMemoContent, setNewMemoContent] = useState("");
  const [newMemoType, setNewMemoType] = useState<MemoType>("NOTE");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [pinningMemoId, setPinningMemoId] = useState<string | null>(null);

  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(() =>
    typeof window !== "undefined" ? (localStorage.getItem("filofax-sort-memos") ?? "updatedAt-desc") : "updatedAt-desc"
  );

  const utils = api.useUtils();

  // Fetch categories and tags
  const { data: categories } = api.categories.getAll.useQuery();
  const { data: allTags } = api.tags.getAll.useQuery();

  // Fetch default template for MEETING type (used when creating meeting notes)
  const templateTypeKey = MEMO_TO_TEMPLATE_TYPE[newMemoType];
  const { data: defaultTemplate } = api.templates.getDefaultForType.useQuery(
    { templateType: templateTypeKey ?? "" },
    { enabled: isCreateOpen && !editingMemo && !!templateTypeKey }
  );

  // Auto-populate content when a default template is available for the selected type
  useEffect(() => {
    if (!isCreateOpen || editingMemo || !defaultTemplate) return;
    if (newMemoType === "MEETING") {
      setNewMemoContent(meetingTemplateTotiptap(defaultTemplate.content));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTemplate?.id, newMemoType, isCreateOpen]);

  // Fetch memos from API with filters
  const { data, isLoading, error } = api.memos.getAll.useQuery({
    memoType: selectedType === "ALL" ? undefined : [selectedType],
    search: searchQuery || undefined,
    categoryId: filterCategoryId || undefined,
    tagIds: filterTagIds.length > 0 ? filterTagIds : undefined,
  });

  // Create memo mutation
  const createMemo = api.memos.create.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
      resetForm();
    },
  });

  // Update memo mutation
  const updateMemo = api.memos.update.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
      resetForm();
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
    setEditingMemo(null);
    setNewMemoTitle("");
    setNewMemoContent("");
    setNewMemoType("NOTE");
    setSelectedCategoryId("");
    setSelectedTagIds([]);
    setNewCategoryName("");
    setNewTagName("");
  };

  const handleCreateMemo = () => {
    if (!newMemoTitle.trim()) return;

    if (editingMemo) {
      updateMemo.mutate({
        id: editingMemo.id,
        title: newMemoTitle,
        content: newMemoContent,
        memoType: newMemoType,
        categoryId: selectedCategoryId || null,
        tagIds: selectedTagIds,
      });
    } else {
      createMemo.mutate({
        title: newMemoTitle,
        content: newMemoContent,
        memoType: newMemoType,
        categoryId: selectedCategoryId || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });
    }
  };

  const handleEdit = (memo: Memo) => {
    setEditingMemo(memo);
    setNewMemoTitle(memo.title);
    setNewMemoContent(memo.content);
    setNewMemoType(memo.memoType);
    setSelectedCategoryId(memo.categoryId ?? "");
    setSelectedTagIds(memo.tags.map((t) => t.id));
    setIsCreateOpen(true);
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

  const memos = useMemo(() => {
    const raw = (data?.memos ?? []) as Memo[];
    const sorted = [...raw];
    switch (sortBy) {
      case "updatedAt-asc":
        sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case "updatedAt-desc":
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "pinned":
        sorted.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
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
      case "type":
        sorted.sort((a, b) => a.memoType.localeCompare(b.memoType));
        break;
    }
    return sorted;
  }, [data?.memos, sortBy]);
  const memoTypes: (MemoType | "ALL")[] = ["ALL", "NOTE", "ANECDOTE", "JOURNAL", "MEETING", "QUICK_THOUGHT"];
  const isMutating = createMemo.isPending || updateMemo.isPending;

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
        <Dialog open={isCreateOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Memo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMemo ? "Edit Memo" : "Create New Memo"}</DialogTitle>
              <DialogDescription>
                {editingMemo ? "Update this memo" : "Capture a new note, thought, or memory"}
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

              <RichTextEditor
                value={newMemoContent}
                onChange={setNewMemoContent}
                placeholder="Start writing..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogChange(false)}>Cancel</Button>
              <Button onClick={handleCreateMemo} disabled={isMutating || !newMemoTitle.trim()}>
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMemo ? "Save Changes" : "Save Memo"}
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

      {/* Category and Tag Filters */}
      <div className="flex flex-wrap items-center gap-3">
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
          onChange={(v) => { setSortBy(v); localStorage.setItem("filofax-sort-memos", v); }}
          options={[
            { label: "Recently updated", value: "updatedAt-desc" },
            { label: "Oldest first", value: "updatedAt-asc" },
            { label: "Pinned first", value: "pinned" },
            { label: "A → Z", value: "alpha-asc" },
            { label: "Z → A", value: "alpha-desc" },
            { label: "Category", value: "category" },
            { label: "Type", value: "type" },
          ]}
        />
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
              onEdit={() => handleEdit(memo)}
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
              {searchQuery || selectedType !== "ALL" || hasActiveFilters
                ? "No memos found matching your filters"
                : "No memos yet. Create your first memo!"}
            </p>
            {!searchQuery && selectedType === "ALL" && !hasActiveFilters && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Memo
              </Button>
            )}
            {(searchQuery || selectedType !== "ALL" || hasActiveFilters) && (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedType("ALL"); clearFilters(); }}>
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
