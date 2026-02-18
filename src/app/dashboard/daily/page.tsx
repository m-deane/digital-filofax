"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Calendar,
  Target,
  FileText,
  Loader2,
  GripVertical,
} from "lucide-react";
import { format, addDays, subDays, startOfDay, isSameDay } from "date-fns";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Time slots from 7am to 9pm
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7;
  return {
    hour,
    label: format(new Date().setHours(hour, 0, 0, 0), "h a"),
  };
});

function TimeGrid({
  events,
  scheduledTasks,
  onDropTask,
}: {
  events: Array<{
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    color: string | null;
  }>;
  scheduledTasks: Array<{
    id: string;
    title: string;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    category: { color: string } | null;
  }>;
  onDropTask: (taskId: string, hour: number) => void;
}) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDragOverHour(hour);
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDropTask(taskId, hour);
    }
    setDragOverHour(null);
  };

  const getItemsForHour = (hour: number) => {
    const hourStart = new Date();
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date();
    hourEnd.setHours(hour + 1, 0, 0, 0);

    const hourEvents = events.filter((e) => {
      const start = new Date(e.startDate);
      return start.getHours() === hour;
    });

    const hourTasks = scheduledTasks.filter((t) => {
      if (!t.scheduledStart) return false;
      const start = new Date(t.scheduledStart);
      return start.getHours() === hour;
    });

    return { events: hourEvents, tasks: hourTasks };
  };

  return (
    <div className="space-y-0">
      {TIME_SLOTS.map(({ hour, label }) => {
        const { events: hourEvents, tasks: hourTasks } = getItemsForHour(hour);
        const isDragOver = dragOverHour === hour;

        return (
          <div
            key={hour}
            className={cn(
              "flex border-b min-h-[60px] transition-colors",
              isDragOver && "bg-primary/10"
            )}
            onDragOver={(e) => handleDragOver(e, hour)}
            onDragLeave={() => setDragOverHour(null)}
            onDrop={(e) => handleDrop(e, hour)}
          >
            <div className="w-16 flex-shrink-0 py-2 text-xs text-muted-foreground text-right pr-2 border-r">
              {label}
            </div>
            <div className="flex-1 p-1 space-y-1">
              {hourEvents.map((event) => (
                <div
                  key={event.id}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: event.color || "#6366f1",
                    color: "white",
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium truncate">{event.title}</span>
                  </div>
                </div>
              ))}
              {hourTasks.map((task) => (
                <div
                  key={task.id}
                  className="px-2 py-1 rounded text-xs border-l-4"
                  style={{
                    borderLeftColor: task.category?.color || "#10b981",
                    backgroundColor: "hsl(var(--muted))",
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{task.title}</span>
                  </div>
                </div>
              ))}
              {hourEvents.length === 0 && hourTasks.length === 0 && isDragOver && (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Drop task here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskItem({
  task,
  onTogglePriority,
  isDraggable = true,
}: {
  task: {
    id: string;
    title: string;
    priority: string;
    status: string;
    isDailyPriority: boolean;
    category: { name: string; color: string } | null;
  };
  onTogglePriority: (taskId: string) => void;
  isDraggable?: boolean;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-500";
      case "HIGH":
        return "text-orange-500";
      case "MEDIUM":
        return "text-yellow-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
        isDraggable && "cursor-grab active:cursor-grabbing",
        task.isDailyPriority && "ring-2 ring-yellow-500/50"
      )}
    >
      {isDraggable && (
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate",
            task.status === "DONE" && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {task.category && (
          <p className="text-xs text-muted-foreground">{task.category.name}</p>
        )}
      </div>
      <Badge
        variant="outline"
        className={cn("text-xs flex-shrink-0", getPriorityColor(task.priority))}
      >
        {task.priority}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={() => onTogglePriority(task.id)}
      >
        <Star
          className={cn(
            "h-4 w-4",
            task.isDailyPriority
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground"
          )}
        />
      </Button>
    </div>
  );
}

function HabitChecklist({
  habits,
  onToggle,
}: {
  habits: Array<{
    id: string;
    name: string;
    completedToday: boolean;
  }>;
  onToggle: (habitId: string, completed: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <div key={habit.id} className="flex items-center gap-2">
          <Checkbox
            checked={habit.completedToday}
            onCheckedChange={(checked) => onToggle(habit.id, checked as boolean)}
          />
          <span
            className={cn(
              "text-sm",
              habit.completedToday && "line-through text-muted-foreground"
            )}
          >
            {habit.name}
          </span>
        </div>
      ))}
      {habits.length === 0 && (
        <p className="text-sm text-muted-foreground">No habits tracked</p>
      )}
    </div>
  );
}

export default function DailyPlanningPage() {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const utils = api.useUtils();

  const { data, isLoading } = api.daily.getDailyView.useQuery({
    date: selectedDate,
  });

  const togglePriority = api.daily.toggleDailyPriority.useMutation({
    onSuccess: () => {
      utils.daily.getDailyView.invalidate();
    },
  });

  const scheduleTask = api.daily.scheduleTask.useMutation({
    onSuccess: () => {
      utils.daily.getDailyView.invalidate();
    },
  });

  const logHabit = api.habits.logCompletion.useMutation({
    onSuccess: () => {
      utils.daily.getDailyView.invalidate();
    },
  });

  const removeHabitLog = api.habits.removeLog.useMutation({
    onSuccess: () => {
      utils.daily.getDailyView.invalidate();
    },
  });

  const handleDropTask = (taskId: string, hour: number) => {
    const start = new Date(selectedDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(hour + 1, 0, 0, 0);

    scheduleTask.mutate({
      taskId,
      scheduledStart: start,
      scheduledEnd: end,
    });
  };

  const handleTogglePriority = (taskId: string) => {
    togglePriority.mutate({ taskId });
  };

  const handleToggleHabit = (habitId: string, completed: boolean) => {
    if (completed) {
      logHabit.mutate({ habitId, date: selectedDate });
    } else {
      removeHabitLog.mutate({ habitId, date: selectedDate });
    }
  };

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(startOfDay(new Date()));

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Planner</h1>
          <p className="text-muted-foreground">
            Plan your day with time blocking and priorities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isToday ? "default" : "outline"}
            onClick={goToToday}
            className="min-w-[180px]"
          >
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Time Grid - Left 60% (3 columns) */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Time Blocks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <TimeGrid
                  events={data.events}
                  scheduledTasks={data.scheduledTasks}
                  onDropTask={handleDropTask}
                />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel - 40% (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Daily Priorities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Today&apos;s Priorities
                  <Badge variant="secondary" className="ml-auto">
                    {data.priorityTasks.length}/3
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.priorityTasks.length > 0 ? (
                  data.priorityTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onTogglePriority={handleTogglePriority}
                      isDraggable={false}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Star up to 3 tasks to set your priorities
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Unscheduled Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Tasks
                  <Badge variant="outline" className="ml-auto">
                    {data.unscheduledTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {data.unscheduledTasks.length > 0 ? (
                      data.unscheduledTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onTogglePriority={handleTogglePriority}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No tasks for today
                      </p>
                    )}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-2">
                  Drag tasks to the time grid to schedule them
                </p>
              </CardContent>
            </Card>

            {/* Habits */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Habits
                  <Badge variant="outline" className="ml-auto">
                    {data.habits.filter((h) => h.completedToday).length}/
                    {data.habits.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HabitChecklist
                  habits={data.habits}
                  onToggle={handleToggleHabit}
                />
              </CardContent>
            </Card>

            {/* Recent Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Recent Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentMemos.length > 0 ? (
                  <div className="space-y-2">
                    {data.recentMemos.slice(0, 3).map((memo) => (
                      <div
                        key={memo.id}
                        className="p-2 rounded border bg-muted/50"
                      >
                        <p className="text-sm font-medium truncate">
                          {memo.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(memo.updatedAt), "MMM d")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent notes
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
