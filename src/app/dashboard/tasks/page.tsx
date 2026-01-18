"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

type ViewMode = "list" | "kanban";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  category?: Category | null;
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

function TaskCard({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const priorityBadge = getPriorityBadge(task.priority);

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <Checkbox
        checked={task.status === "DONE"}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", task.status === "DONE" && "line-through text-muted-foreground")}>
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
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function KanbanColumn({ title, tasks, status, onToggle, onDelete }: {
  title: string;
  tasks: Task[];
  status: TaskStatus;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
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
            onDelete={() => onDelete(task.id)}
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("MEDIUM");
  const [newTaskCategoryId, setNewTaskCategoryId] = useState<string | null>(null);

  // Filter states
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<Priority[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const utils = api.useUtils();

  // Fetch categories
  const { data: categoriesData } = api.categories.getAll.useQuery();
  const categories = (categoriesData ?? []) as Category[];

  // Fetch tasks from API with filters
  const { data, isLoading, error } = api.tasks.getAll.useQuery({
    status: statusFilters.length > 0 ? statusFilters : undefined,
    priority: priorityFilters.length > 0 ? priorityFilters : undefined,
    categoryId: selectedCategoryId || undefined,
    search: searchQuery || undefined,
  });

  // Create task mutation
  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      setIsCreateOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("MEDIUM");
      setNewTaskCategoryId(null);
    },
  });

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

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
      categoryId: newTaskCategoryId || undefined,
    });
  };

  const handleToggleTask = (taskId: string) => {
    const task = data?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({
      id: taskId,
      status: task.status === "DONE" ? "TODO" : "DONE",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate({ id: taskId });
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
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilters.length > 0 || priorityFilters.length > 0 || selectedCategoryId !== null || searchQuery !== "";

  const tasks = data?.tasks ?? [];

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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
              <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {categories.length > 0 && (
                <Select
                  value={newTaskCategoryId ?? "none"}
                  onValueChange={(v) => setNewTaskCategoryId(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={createTask.isPending || !newTaskTitle.trim()}>
                {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                  task={task as Task}
                  onToggle={() => handleToggleTask(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn
              title="To Do"
              tasks={tasks as Task[]}
              status="TODO"
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
            <KanbanColumn
              title="In Progress"
              tasks={tasks as Task[]}
              status="IN_PROGRESS"
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
            <KanbanColumn
              title="Done"
              tasks={tasks as Task[]}
              status="DONE"
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          </div>
        )
      )}
    </div>
  );
}
