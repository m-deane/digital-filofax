"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Tag,
  LayoutGrid,
  List,
  Loader2,
  X,
  CheckCircle2,
  Layers,
  AlertCircle,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { useSelection } from "@/hooks/use-selection";

type ViewMode = "list" | "kanban";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Context {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  category?: Category | null;
  context?: Context | null;
  dueDate?: Date | null;
}

function getPriorityBadge(priority: Priority) {
  const variants: Record<Priority, { variant: "destructive" | "default" | "secondary" | "outline"; label: string }> = {
    URGENT: { variant: "destructive", label: "Urgent" },
    HIGH: { variant: "destructive", label: "High" },
    MEDIUM: { variant: "secondary", label: "Medium" },
    LOW: { variant: "outline", label: "Low" },
  };
  return variants[priority];
}

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelectToggle: (shiftKey: boolean) => void;
  selectionMode: boolean;
}

function TaskCard({ task, onToggle, onEdit, onDelete, isSelected, onSelectToggle, selectionMode }: TaskCardProps) {
  const priorityBadge = getPriorityBadge(task.priority);

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow",
      isSelected && "ring-2 ring-primary"
    )}>
      <Checkbox
        checked={selectionMode ? isSelected : task.status === "DONE"}
        onCheckedChange={() => {
          if (selectionMode) {
            onSelectToggle(false);
          } else {
            onToggle();
          }
        }}
        onClick={(e) => {
          if (selectionMode) {
            onSelectToggle(e.shiftKey);
          }
        }}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", task.status === "DONE" && !selectionMode && "line-through text-muted-foreground")}>
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {task.category && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: task.category.color, color: task.category.color }}
            >
              {task.category.name}
            </Badge>
          )}
          {task.context && (
            <Badge variant="secondary" className="text-xs gap-1">
              <AtSign className="h-3 w-3" />
              {task.context.name}
            </Badge>
          )}
          <Badge variant={priorityBadge.variant} className="text-xs">
            {priorityBadge.label}
          </Badge>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {!selectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function KanbanColumn({ title, tasks, status, onToggle, onEdit, onDelete, isSelected, onSelectToggle, selectionMode }: {
  title: string;
  tasks: Task[];
  status: TaskStatus;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: (id: string) => boolean;
  onSelectToggle: (id: string, shiftKey: boolean) => void;
  selectionMode: boolean;
}) {
  const statusTasks = tasks.filter((t) => t.status === status);

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary">{statusTasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {statusTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={() => onToggle(task.id)}
            onEdit={() => onEdit(task.id)}
            onDelete={() => onDelete(task.id)}
            isSelected={isSelected(task.id)}
            onSelectToggle={(shiftKey) => onSelectToggle(task.id, shiftKey)}
            selectionMode={selectionMode}
          />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter states
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<Priority[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const [editingTask, setEditingTask] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const utils = api.useUtils();

  // Fetch categories
  const { data: categoriesData } = api.categories.getAll.useQuery();
  const categories = (categoriesData ?? []) as Category[];

  // Fetch contexts
  const { data: contextsData } = api.contexts.getAll.useQuery();
  const contexts = (contextsData ?? []) as Context[];

  // Fetch tasks from API with filters
  const { data, isLoading, error } = api.tasks.getAll.useQuery({
    status: statusFilters.length > 0 ? statusFilters : undefined,
    priority: priorityFilters.length > 0 ? priorityFilters : undefined,
    categoryId: selectedCategoryId || undefined,
    contextId: selectedContextId || undefined,
    search: searchQuery || undefined,
  });

  const tasks = (data?.tasks ?? []) as Task[];

  // Selection hook
  const selection = useSelection({
    items: tasks,
    getId: (task) => task.id,
  });

  // Clear selection on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selection.hasSelection) {
        selection.clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection]);

  // Update task mutation
  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  // Delete task mutation
  const deleteTask = api.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  // Bulk mutations
  const bulkUpdateStatus = api.tasks.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      selection.clearSelection();
    },
  });

  const bulkDelete = api.tasks.bulkDelete.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      selection.clearSelection();
      setIsDeleteDialogOpen(false);
    },
  });

  const bulkAssignPriority = api.tasks.bulkAssignPriority.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      selection.clearSelection();
    },
  });

  const bulkAssignCategory = api.tasks.bulkAssignCategory.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      selection.clearSelection();
    },
  });

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({
      id: taskId,
      status: task.status === "DONE" ? "TODO" : "DONE",
    });
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setIsEditOpen(true);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate({ id: taskId });
  };

  const handleBulkMarkComplete = () => {
    const selectedIds = selection.getSelectedIds();
    if (selectedIds.length === 0) return;
    bulkUpdateStatus.mutate({ taskIds: selectedIds, status: "DONE" });
  };

  const handleBulkDelete = () => {
    const selectedIds = selection.getSelectedIds();
    if (selectedIds.length === 0) return;
    bulkDelete.mutate({ taskIds: selectedIds });
  };

  const handleBulkSetPriority = (priority: Priority) => {
    const selectedIds = selection.getSelectedIds();
    if (selectedIds.length === 0) return;
    bulkAssignPriority.mutate({ taskIds: selectedIds, priority });
  };

  const handleBulkSetCategory = (categoryId: string | null) => {
    const selectedIds = selection.getSelectedIds();
    if (selectedIds.length === 0) return;
    bulkAssignCategory.mutate({ taskIds: selectedIds, categoryId });
  };

  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: Priority) => {
    setPriorityFilters((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setSelectedCategoryId(null);
    setSelectedContextId(null);
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilters.length > 0 || priorityFilters.length > 0 || selectedCategoryId !== null || selectedContextId !== null || searchQuery !== "";

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading tasks: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks across all categories
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selection.hasSelection && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium">{selection.selectedCount} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkComplete}
                disabled={bulkUpdateStatus.isPending}
                className="gap-2"
              >
                {bulkUpdateStatus.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Mark Complete
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={bulkAssignPriority.isPending}>
                    {bulkAssignPriority.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    Set Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Select Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkSetPriority("URGENT")}>
                    <Badge variant="destructive" className="mr-2">Urgent</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkSetPriority("HIGH")}>
                    <Badge variant="destructive" className="mr-2">High</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkSetPriority("MEDIUM")}>
                    <Badge variant="secondary" className="mr-2">Medium</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkSetPriority("LOW")}>
                    <Badge variant="outline" className="mr-2">Low</Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={bulkAssignCategory.isPending}>
                    {bulkAssignCategory.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Tag className="h-4 w-4 mr-2" />
                    )}
                    Set Category
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkSetCategory(null)}>
                    No Category
                  </DropdownMenuItem>
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.id} onClick={() => handleBulkSetCategory(cat.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={bulkDelete.isPending}
                className="gap-2"
              >
                {bulkDelete.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </Button>

              <Button variant="ghost" size="sm" onClick={selection.clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Select All Checkbox */}
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
              <Checkbox
                checked={selection.allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selection.selectAll();
                  } else {
                    selection.clearSelection();
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {(statusFilters.length > 0 || priorityFilters.length > 0) && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {statusFilters.length + priorityFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes("TODO")}
                onCheckedChange={() => toggleStatusFilter("TODO")}
              >
                To Do
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes("IN_PROGRESS")}
                onCheckedChange={() => toggleStatusFilter("IN_PROGRESS")}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes("DONE")}
                onCheckedChange={() => toggleStatusFilter("DONE")}
              >
                Done
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-semibold">Priority</div>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes("URGENT")}
                onCheckedChange={() => togglePriorityFilter("URGENT")}
              >
                Urgent
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes("HIGH")}
                onCheckedChange={() => togglePriorityFilter("HIGH")}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes("MEDIUM")}
                onCheckedChange={() => togglePriorityFilter("MEDIUM")}
              >
                Medium
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilters.includes("LOW")}
                onCheckedChange={() => togglePriorityFilter("LOW")}
              >
                Low
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Category
                {selectedCategoryId && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => setSelectedCategoryId(null)}
                className={cn(!selectedCategoryId && "bg-accent")}
              >
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(selectedCategoryId === cat.id && "bg-accent")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                </DropdownMenuItem>
              ))}
              {categories.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories yet</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Context Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <AtSign className="h-4 w-4" />
                Context
                {selectedContextId && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => setSelectedContextId(null)}
                className={cn(!selectedContextId && "bg-accent")}
              >
                All Contexts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {contexts.map((ctx) => (
                <DropdownMenuItem
                  key={ctx.id}
                  onClick={() => setSelectedContextId(ctx.id)}
                  className={cn(selectedContextId === ctx.id && "bg-accent")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ctx.color }} />
                    {ctx.name}
                  </div>
                </DropdownMenuItem>
              ))}
              {contexts.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No contexts yet</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md ml-auto">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Done"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleStatusFilter(status)} />
            </Badge>
          ))}
          {priorityFilters.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
              <X className="h-3 w-3 cursor-pointer" onClick={() => togglePriorityFilter(priority)} />
            </Badge>
          ))}
          {selectedCategoryId && (
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.id === selectedCategoryId)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategoryId(null)} />
            </Badge>
          )}
          {selectedContextId && (
            <Badge variant="secondary" className="gap-1">
              <AtSign className="h-3 w-3" />
              {contexts.find((c) => c.id === selectedContextId)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedContextId(null)} />
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? "No tasks match your filters" : "No tasks yet. Create your first task!"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Views */}
      {!isLoading && tasks.length > 0 && (
        viewMode === "list" ? (
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>{tasks.length} tasks total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task.id)}
                  onEdit={() => handleEditTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  isSelected={selection.isSelected(task.id)}
                  onSelectToggle={(shiftKey) => selection.toggleSelect(task.id, shiftKey)}
                  selectionMode={selection.hasSelection}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn
              title="To Do"
              tasks={tasks}
              status="TODO"
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              isSelected={selection.isSelected}
              onSelectToggle={selection.toggleSelect}
              selectionMode={selection.hasSelection}
            />
            <KanbanColumn
              title="In Progress"
              tasks={tasks}
              status="IN_PROGRESS"
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              isSelected={selection.isSelected}
              onSelectToggle={selection.toggleSelect}
              selectionMode={selection.hasSelection}
            />
            <KanbanColumn
              title="Done"
              tasks={tasks}
              status="DONE"
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              isSelected={selection.isSelected}
              onSelectToggle={selection.toggleSelect}
              selectionMode={selection.hasSelection}
            />
          </div>
        )
      )}

      {/* Create Task Dialog */}
      <TaskFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => utils.tasks.getAll.invalidate()}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <TaskFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          task={editingTask}
          onSuccess={() => utils.tasks.getAll.invalidate()}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selection.selectedCount} tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDelete.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
