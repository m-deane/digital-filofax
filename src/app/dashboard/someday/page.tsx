"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CloudOff,
  Plus,
  Search,
  Trash2,
  ArrowRight,
  Target,
  Trophy,
  Calendar,
  Lightbulb,
  FolderKanban,
  ListTodo,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type SomedayItemType = "TASK" | "PROJECT" | "IDEA";

export default function SomedayMaybePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<SomedayItemType | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToPromote, setItemToPromote] = useState<{
    id: string;
    type: "task" | "goal";
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "IDEA" as SomedayItemType,
    category: "",
    reviewDate: "",
  });

  const utils = api.useUtils();

  // Queries
  const { data: items = [], isLoading } = api.someday.getAll.useQuery({
    ...(selectedType !== "ALL" && { type: selectedType }),
    ...(selectedCategory !== "all" && { category: selectedCategory }),
    ...(searchQuery && { search: searchQuery }),
  });

  const { data: reviewDue = [] } = api.someday.getReviewDue.useQuery();
  const { data: stats } = api.someday.getStats.useQuery();

  // Mutations
  const createItem = api.someday.create.useMutation({
    onSuccess: () => {
      utils.someday.getAll.invalidate();
      utils.someday.getStats.invalidate();
      utils.someday.getReviewDue.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Item added to Someday/Maybe list" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteItem = api.someday.delete.useMutation({
    onSuccess: () => {
      utils.someday.getAll.invalidate();
      utils.someday.getStats.invalidate();
      utils.someday.getReviewDue.invalidate();
      setItemToDelete(null);
      toast({ title: "Item deleted" });
    },
  });

  const promoteToTask = api.someday.promoteToTask.useMutation({
    onSuccess: () => {
      utils.someday.getAll.invalidate();
      utils.someday.getStats.invalidate();
      utils.tasks.getAll.invalidate();
      setItemToPromote(null);
      toast({ title: "Promoted to active task" });
    },
  });

  const promoteToGoal = api.someday.promoteToGoal.useMutation({
    onSuccess: () => {
      utils.someday.getAll.invalidate();
      utils.someday.getStats.invalidate();
      utils.goals.getAll.invalidate();
      setItemToPromote(null);
      toast({ title: "Promoted to goal" });
    },
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate({
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      category: formData.category || undefined,
      reviewDate: formData.reviewDate ? new Date(formData.reviewDate) : undefined,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "IDEA",
      category: "",
      reviewDate: "",
    });
  };

  const handlePromoteToTask = () => {
    if (itemToPromote) {
      promoteToTask.mutate({ id: itemToPromote.id });
    }
  };

  const handlePromoteToGoal = () => {
    if (itemToPromote) {
      promoteToGoal.mutate({ id: itemToPromote.id });
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ) as string[];

  const getTypeIcon = (type: SomedayItemType) => {
    switch (type) {
      case "TASK":
        return <ListTodo className="h-4 w-4" />;
      case "PROJECT":
        return <FolderKanban className="h-4 w-4" />;
      case "IDEA":
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SomedayItemType) => {
    switch (type) {
      case "TASK":
        return "bg-blue-500/10 text-blue-500";
      case "PROJECT":
        return "bg-purple-500/10 text-purple-500";
      case "IDEA":
        return "bg-yellow-500/10 text-yellow-500";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Someday/Maybe</h1>
          <p className="text-muted-foreground">
            Ideas and projects you might do someday - GTD style
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Someday/Maybe</DialogTitle>
              <DialogDescription>
                Capture an idea, task, or project you might want to do someday
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="What's the idea?"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Add some details..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as SomedayItemType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDEA">Idea</SelectItem>
                      <SelectItem value="TASK">Task</SelectItem>
                      <SelectItem value="PROJECT">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g. Work, Personal, Learning"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reviewDate">Review Date (optional)</Label>
                  <Input
                    id="reviewDate"
                    type="date"
                    value={formData.reviewDate}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createItem.isPending}>
                  Add Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <CloudOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review Due</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviewDue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.task}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.project}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Due Section */}
      {reviewDue.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Items Due for Review
            </CardTitle>
            <CardDescription>
              These items are ready to be reviewed and potentially promoted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewDue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.reviewDate && (
                        <p className="text-sm text-muted-foreground">
                          Review date:{" "}
                          {formatDistanceToNow(new Date(item.reviewDate), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItemToPromote({ id: item.id, type: "task" })}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      To Task
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItemToPromote({ id: item.id, type: "goal" })}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      To Goal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as SomedayItemType | "ALL")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IDEA">Ideas</SelectItem>
                <SelectItem value="TASK">Tasks</SelectItem>
                <SelectItem value="PROJECT">Projects</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CloudOff className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No items yet</p>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Start capturing ideas, tasks, and projects you might want to do someday
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start justify-between pt-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">{getTypeIcon(item.type)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge className={getTypeColor(item.type)}>
                        {item.type.toLowerCase()}
                      </Badge>
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Added {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      {item.reviewDate && (
                        <span>
                          Review:{" "}
                          {formatDistanceToNow(new Date(item.reviewDate), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setItemToPromote({ id: item.id, type: "task" })}
                  >
                    <Target className="mr-1 h-3 w-3" />
                    Task
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setItemToPromote({ id: item.id, type: "goal" })}
                  >
                    <Trophy className="mr-1 h-3 w-3" />
                    Goal
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setItemToDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>
              This will permanently delete this item from your Someday/Maybe list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => itemToDelete && deleteItem.mutate({ id: itemToDelete })}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Confirmation Dialog */}
      <Dialog open={!!itemToPromote} onOpenChange={() => setItemToPromote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Promote to {itemToPromote?.type === "task" ? "Task" : "Goal"}?
            </DialogTitle>
            <DialogDescription>
              This will move the item to your active{" "}
              {itemToPromote?.type === "task" ? "tasks" : "goals"} and remove it from
              the Someday/Maybe list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToPromote(null)}>
              Cancel
            </Button>
            <Button
              onClick={
                itemToPromote?.type === "task"
                  ? handlePromoteToTask
                  : handlePromoteToGoal
              }
            >
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
