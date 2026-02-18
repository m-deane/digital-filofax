"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Loader2,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "HIGH":
    case "URGENT":
      return "border-l-red-500";
    case "MEDIUM":
      return "border-l-yellow-500";
    case "LOW":
      return "border-l-green-500";
    default:
      return "border-l-gray-500";
  }
}

export default function WeeklyTasksPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("MEDIUM");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const utils = api.useUtils();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch tasks for the week - using weekOf filter
  const { data, isLoading, error } = api.tasks.getWeeklyTasks.useQuery({
    weekOf: weekStart,
  });

  // Create task mutation
  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getWeeklyTasks.invalidate();
      setIsCreateOpen(false);
      setNewTaskTitle("");
      setNewTaskPriority("MEDIUM");
    },
  });

  // Update task mutation
  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getWeeklyTasks.invalidate();
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    const dueDate = weekDays[selectedDayIndex];
    createTask.mutate({
      title: newTaskTitle,
      priority: newTaskPriority,
      dueDate,
      weekOf: weekStart,
    });
  };

  const handleToggleTask = (task: Task) => {
    const newStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    updateTask.mutate({
      id: task.id,
      status: newStatus,
    });
  };

  const openCreateForDay = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    setIsCreateOpen(true);
  };

  const tasks = (data ?? []) as Task[];

  // Group tasks by day of the week based on dueDate
  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day));
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Weekly Tasks</h1>
          <p className="text-muted-foreground">
            Plan and track your tasks for the week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Week Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-7">
          {weekDays.map((day, dayIndex) => {
            const dayTasks = getTasksForDay(day);
            const completedCount = dayTasks.filter((t) => t.status === "DONE").length;

            return (
              <Card key={dayIndex} className={cn(isToday(day) && "ring-2 ring-primary")}>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE")}
                    </span>
                    {dayTasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {completedCount}/{dayTasks.length}
                      </Badge>
                    )}
                  </div>
                  <span className={cn(
                    "text-lg font-bold",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, "d")}
                  </span>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded text-xs border-l-2",
                        getPriorityColor(task.priority),
                        task.status === "DONE" ? "bg-muted/50" : "bg-card"
                      )}
                    >
                      <Checkbox
                        checked={task.status === "DONE"}
                        onCheckedChange={() => handleToggleTask(task)}
                        className="h-3 w-3"
                      />
                      <span className={cn(task.status === "DONE" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => openCreateForDay(dayIndex)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Add a task for {weekDays[selectedDayIndex] ? format(weekDays[selectedDayIndex], "EEEE, MMMM d") : ""}
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
