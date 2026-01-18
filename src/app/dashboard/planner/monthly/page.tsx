"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  setHours,
  addHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string | null;
}

interface Task {
  id: string;
  title: string;
  dueDate: Date | null;
  status: string;
}

export default function MonthlyPlannerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const utils = api.useUtils();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch events for the month
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = api.calendar.getEvents.useQuery({
    startDate: calendarStart,
    endDate: calendarEnd,
  });

  // Fetch tasks for the month (those with due dates)
  const { data: tasksData, isLoading: tasksLoading } = api.tasks.getAll.useQuery({});

  // Create event mutation
  const createEvent = api.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsCreateOpen(false);
      setNewEventTitle("");
    },
  });

  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) return;
    const startDate = setHours(selectedDate, 9);
    const endDate = addHours(startDate, 1);
    createEvent.mutate({
      title: newEventTitle,
      startDate,
      endDate,
      color: "#3b82f6",
    });
  };

  const openCreateForDay = (day: Date) => {
    setSelectedDate(day);
    setIsCreateOpen(true);
  };

  const events = (eventsData ?? []) as CalendarEvent[];
  const allTasks = (tasksData?.tasks ?? []) as Task[];

  // Filter tasks to only those with due dates
  const tasks = allTasks.filter((t) => t.dueDate !== null);

  const getEventsForDay = (date: Date) =>
    events.filter((event) => isSameDay(new Date(event.startDate), date));

  const getTasksForDay = (date: Date) =>
    tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), date));

  const weekDayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const isLoading = eventsLoading || tasksLoading;

  if (eventsError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading calendar: {eventsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Planner</h1>
          <p className="text-muted-foreground">
            View your month at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button className="gap-2 ml-2" onClick={() => {
            setSelectedDate(new Date());
            setIsCreateOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Month Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Calendar Grid */}
      {!isLoading && (
        <Card>
          <CardContent className="p-4">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDayHeaders.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const dayIsToday = isToday(day);

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      !isCurrentMonth && "opacity-40",
                      dayIsToday && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => openCreateForDay(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium",
                        dayIsToday && "text-primary"
                      )}>
                        {format(day, "d")}
                      </span>
                      {(dayEvents.length > 0 || dayTasks.length > 0) && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {dayEvents.length + dayTasks.length}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: event.color || "#3b82f6" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayTasks.slice(0, 2 - dayEvents.length).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate border",
                            task.status === "DONE" ? "line-through text-muted-foreground" : ""
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayEvents.length + dayTasks.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length + dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Events</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded border" />
              <span>Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>
              Add an event for {format(selectedDate, "EEEE, MMMM d, yyyy")}
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
  );
}
