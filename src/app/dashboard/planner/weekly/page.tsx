"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
  setHours,
  setMinutes,
  getHours,
  addHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { WeeklyCompass } from "@/components/dashboard/weekly-compass";
import { DroppableDay } from "@/components/planner/droppable-day";
import { TaskSidebar } from "@/components/planner/task-sidebar";
import { DraggableTask } from "@/components/planner/draggable-task";
import type { Task, Category, Tag, Subtask, Context } from "@prisma/client";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string | null;
}

type TaskWithRelations = Task & {
  category: Category | null;
  context: Context | null;
  tags: Tag[];
  subtasks: Subtask[];
};

const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function WeeklyPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  const utils = api.useUtils();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch events for the week
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = api.calendar.getEvents.useQuery({
    startDate: weekStart,
    endDate: weekEnd,
  });

  // Fetch scheduled tasks for the week
  const { data: scheduledTasks = [], isLoading: tasksLoading } = api.tasks.getScheduledTasks.useQuery({
    startDate: weekStart,
    endDate: addHours(weekEnd, 23),
  });

  // Fetch unscheduled tasks (tasks without scheduledStart)
  const { data: unscheduledData } = api.tasks.getAll.useQuery({
    status: ["TODO", "IN_PROGRESS"],
  });

  const unscheduledTasks = (unscheduledData?.tasks ?? []).filter(
    (task) => !task.scheduledStart
  );

  // Create event mutation
  const createEvent = api.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsCreateOpen(false);
      setNewEventTitle("");
    },
  });

  // Move task mutation
  const moveTask = api.tasks.moveToDate.useMutation({
    onSuccess: () => {
      utils.tasks.getScheduledTasks.invalidate();
      utils.tasks.getAll.invalidate();
    },
  });

  // Update schedule mutation (for unscheduling)
  const updateSchedule = api.tasks.updateSchedule.useMutation({
    onSuccess: () => {
      utils.tasks.getScheduledTasks.invalidate();
      utils.tasks.getAll.invalidate();
    },
  });

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as TaskWithRelations | undefined;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = active.data.current?.task as TaskWithRelations | undefined;
    if (!task) return;

    const overData = over.data.current;

    // Dropping into unscheduled area
    if (overData?.type === "unscheduled") {
      updateSchedule.mutate({
        taskId: task.id,
        scheduledStart: null,
        scheduledEnd: null,
      });
      return;
    }

    // Dropping into a time slot
    if (overData?.type === "timeslot") {
      const { date, hour } = overData as { date: Date; hour: number };
      const scheduledStart = setMinutes(setHours(date, hour), 0);
      const scheduledEnd = addHours(scheduledStart, 1); // Default 1 hour duration

      moveTask.mutate({
        taskId: task.id,
        scheduledStart,
        scheduledEnd,
      });
    }
  };

  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) return;
    const startDate = setMinutes(setHours(selectedDate, selectedHour), 0);
    const endDate = addHours(startDate, 1);
    createEvent.mutate({
      title: newEventTitle,
      startDate,
      endDate,
      color: "#3b82f6",
    });
  };

  const openCreateForTime = (day: Date, hour: number) => {
    setSelectedDate(day);
    setSelectedHour(hour);
    setIsCreateOpen(true);
  };

  const events = useMemo(() => (eventsData ?? []) as CalendarEvent[], [eventsData]);

  // Pre-index events and tasks by "day-hour" key for O(1) lookups instead of O(n) per cell
  const eventsIndex = useMemo(() => {
    const index = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const eventStart = new Date(event.startDate);
      const key = `${format(eventStart, "yyyy-MM-dd")}-${getHours(eventStart)}`;
      const existing = index.get(key);
      if (existing) {
        existing.push(event);
      } else {
        index.set(key, [event]);
      }
    }
    return index;
  }, [events]);

  const tasksIndex = useMemo(() => {
    const index = new Map<string, TaskWithRelations[]>();
    for (const task of scheduledTasks) {
      if (!task.scheduledStart) continue;
      const taskStart = new Date(task.scheduledStart);
      const key = `${format(taskStart, "yyyy-MM-dd")}-${getHours(taskStart)}`;
      const existing = index.get(key);
      if (existing) {
        existing.push(task);
      } else {
        index.set(key, [task]);
      }
    }
    return index;
  }, [scheduledTasks]);

  // O(1) lookups using pre-built indexes
  const getEventsForTime = (day: Date, hour: number) => {
    const key = `${format(day, "yyyy-MM-dd")}-${hour}`;
    return eventsIndex.get(key) ?? [];
  };

  const getTasksForTime = (day: Date, hour: number) => {
    const key = `${format(day, "yyyy-MM-dd")}-${hour}`;
    return tasksIndex.get(key) ?? [];
  };

  // Calculate event duration in hours
  const getEventDuration = (event: CalendarEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const isLoading = eventsLoading || tasksLoading;

  if (eventsError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading events: {eventsError.message}</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Weekly Compass */}
        <WeeklyCompass weekOf={currentWeek} />

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Weekly Planner</h1>
            <p className="text-muted-foreground">
              Drag tasks to schedule them in your calendar
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
            <Button className="gap-2 ml-2" onClick={() => {
              setSelectedDate(new Date());
              setSelectedHour(9);
              setIsCreateOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Add Event
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unscheduled Tasks Sidebar */}
          <div className="lg:col-span-1">
            <TaskSidebar tasks={unscheduledTasks} />
          </div>

          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Day Headers */}
                      <div className="grid grid-cols-8 border-b">
                        <div className="p-2 border-r bg-muted/30" />
                        {weekDays.map((day, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-2 text-center border-r last:border-r-0",
                              isToday(day) && "bg-primary/5"
                            )}
                          >
                            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                            <div className={cn(
                              "text-lg font-semibold",
                              isToday(day) && "text-primary"
                            )}>
                              {format(day, "d")}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Time Grid */}
                      <div className="relative">
                        {hours.map((hour) => (
                          <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                            <div className="p-2 pr-4 text-right text-xs text-muted-foreground border-r bg-muted/30 h-16">
                              {format(setHours(new Date(), hour), "h a")}
                            </div>
                            {weekDays.map((day, dayIndex) => {
                              const timeEvents = getEventsForTime(day, hour);
                              const timeTasks = getTasksForTime(day, hour);
                              return (
                                <div key={dayIndex} className="relative">
                                  <DroppableDay
                                    date={day}
                                    hour={hour}
                                    tasks={timeTasks}
                                    onClick={() => openCreateForTime(day, hour)}
                                  />
                                  {/* Events overlay (read-only) */}
                                  {timeEvents.map((event) => {
                                    const duration = getEventDuration(event);
                                    return (
                                      <div
                                        key={event.id}
                                        className="absolute left-1 right-1 rounded px-2 py-1 text-xs text-white overflow-hidden pointer-events-none z-20"
                                        style={{
                                          backgroundColor: event.color || "#3b82f6",
                                          height: `${duration * 64 - 4}px`,
                                          top: "2px",
                                          opacity: 0.7,
                                        }}
                                      >
                                        <div className="font-medium truncate">{event.title}</div>
                                        <div className="text-white/90">
                                          {format(new Date(event.startDate), "h:mm a")}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Event Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>
                Add an event for {format(selectedDate, "EEEE, MMMM d")} at {format(setHours(new Date(), selectedHour), "h:mm a")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateEvent} disabled={createEvent.isPending || !newEventTitle.trim()}>
                {createEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? <DraggableTask task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
