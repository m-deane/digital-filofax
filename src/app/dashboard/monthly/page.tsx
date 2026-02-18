"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  category: Category | null;
}

export default function MonthlyTasksPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("MEDIUM");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const utils = api.useUtils();

  const monthStart = startOfMonth(currentMonth);

  // Fetch tasks for the month
  const { data, isLoading, error } = api.tasks.getMonthlyTasks.useQuery({
    monthOf: monthStart,
  });

  // Fetch categories
  const { data: categoriesData } = api.categories.getAll.useQuery();

  // Create task mutation
  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getMonthlyTasks.invalidate();
      setIsCreateOpen(false);
      setNewTaskTitle("");
      setNewTaskPriority("MEDIUM");
      setSelectedCategoryId(null);
    },
  });

  // Update task mutation
  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getMonthlyTasks.invalidate();
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      title: newTaskTitle,
      priority: newTaskPriority,
      monthOf: monthStart,
      categoryId: selectedCategoryId || undefined,
    });
  };

  const handleToggleTask = (task: Task) => {
    const newStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    updateTask.mutate({
      id: task.id,
      status: newStatus,
    });
  };

  const openCreateForCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setIsCreateOpen(true);
  };

  const tasks = (data ?? []) as Task[];
  const categories = (categoriesData ?? []) as Category[];

  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const categoryKey = task.category?.id ?? "uncategorized";
    const categoryName = task.category?.name ?? "Uncategorized";
    const categoryColor = task.category?.color ?? "#6b7280";

    if (!acc[categoryKey]) {
      acc[categoryKey] = { tasks: [], name: categoryName, color: categoryColor };
    }
    acc[categoryKey].tasks.push(task);
    return acc;
  }, {} as Record<string, { tasks: Task[]; name: string; color: string }>);

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
          <h1 className="text-3xl font-bold tracking-tight">Monthly Tasks</h1>
          <p className="text-muted-foreground">
            Plan and track your monthly objectives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
            This Month
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {completedTasks}/{totalTasks} tasks completed
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-2 mt-2" />
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No monthly tasks yet. Add your first task!</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tasks by Category */}
      {!isLoading && tasks.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {Object.entries(tasksByCategory).map(([categoryId, { tasks: categoryTasks, name, color }]) => {
            const categoryCompleted = categoryTasks.filter((t) => t.status === "DONE").length;
            return (
              <Card key={categoryId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {categoryCompleted}/{categoryTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={task.status === "DONE"}
                        onCheckedChange={() => handleToggleTask(task)}
                      />
                      <span className={cn(
                        "text-sm",
                        task.status === "DONE" && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => openCreateForCategory(categoryId === "uncategorized" ? null : categoryId)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add task
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {/* Add new category card */}
          {Object.keys(tasksByCategory).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Monthly Task</DialogTitle>
            <DialogDescription>
              Add a task for {format(currentMonth, "MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
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
                value={selectedCategoryId ?? "none"}
                onValueChange={(v) => setSelectedCategoryId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={createTask.isPending || !newTaskTitle.trim()}>
              {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
