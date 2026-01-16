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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "kanban";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category?: string;
  categoryColor?: string;
  dueDate?: string;
}

const mockTasks: Task[] = [
  { id: "1", title: "Review pull request", status: "TODO", priority: "HIGH", category: "Work", categoryColor: "#3b82f6", dueDate: "2026-01-17" },
  { id: "2", title: "Update documentation", status: "TODO", priority: "MEDIUM", category: "Work", categoryColor: "#3b82f6" },
  { id: "3", title: "Buy groceries", status: "TODO", priority: "LOW", category: "Personal", categoryColor: "#10b981" },
  { id: "4", title: "Fix authentication bug", status: "IN_PROGRESS", priority: "URGENT", category: "Work", categoryColor: "#3b82f6" },
  { id: "5", title: "Write blog post", status: "IN_PROGRESS", priority: "MEDIUM", category: "Personal", categoryColor: "#10b981" },
  { id: "6", title: "Finish code review", status: "DONE", priority: "HIGH", category: "Work", categoryColor: "#3b82f6" },
  { id: "7", title: "Plan weekend trip", status: "DONE", priority: "LOW", category: "Personal", categoryColor: "#10b981" },
];

function getPriorityBadge(priority: Priority) {
  const variants: Record<Priority, { variant: "destructive" | "default" | "secondary" | "outline"; label: string }> = {
    URGENT: { variant: "destructive", label: "Urgent" },
    HIGH: { variant: "destructive", label: "High" },
    MEDIUM: { variant: "secondary", label: "Medium" },
    LOW: { variant: "outline", label: "Low" },
  };
  return variants[priority];
}

function TaskCard({ task, onToggle }: { task: Task; onToggle: () => void }) {
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
              style={{ borderColor: task.categoryColor, color: task.categoryColor }}
            >
              {task.category}
            </Badge>
          )}
          <Badge variant={priorityBadge.variant} className="text-xs">
            {priorityBadge.label}
          </Badge>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {task.dueDate}
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
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function KanbanColumn({ title, tasks, status }: { title: string; tasks: Task[]; status: TaskStatus }) {
  const statusTasks = tasks.filter((t) => t.status === status);

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary">{statusTasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {statusTasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={() => {}} />
        ))}
        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add task
        </Button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks] = useState<Task[]>(mockTasks);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Dialog>
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
              <Input placeholder="Task title" />
              <Input placeholder="Description (optional)" />
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Create Task</Button>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Tag className="h-4 w-4" />
            Category
          </Button>
          <div className="flex items-center border rounded-md">
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

      {/* Task Views */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>{filteredTasks.length} tasks total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={() => {}} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn title="To Do" tasks={filteredTasks} status="TODO" />
          <KanbanColumn title="In Progress" tasks={filteredTasks} status="IN_PROGRESS" />
          <KanbanColumn title="Done" tasks={filteredTasks} status="DONE" />
        </div>
      )}
    </div>
  );
}
