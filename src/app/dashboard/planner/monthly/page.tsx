"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
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
} from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
  allDay?: boolean;
}

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
}

const mockEvents: CalendarEvent[] = [
  { id: "1", title: "Team Meeting", date: new Date(2026, 0, 16), color: "#3b82f6" },
  { id: "2", title: "Project Deadline", date: new Date(2026, 0, 20), color: "#ef4444" },
  { id: "3", title: "Sprint Review", date: new Date(2026, 0, 17), color: "#8b5cf6" },
  { id: "4", title: "Client Presentation", date: new Date(2026, 0, 22), color: "#f59e0b" },
  { id: "5", title: "Team Lunch", date: new Date(2026, 0, 24), color: "#10b981" },
  { id: "6", title: "Conference", date: new Date(2026, 0, 28), color: "#ec4899", allDay: true },
  { id: "7", title: "Conference", date: new Date(2026, 0, 29), color: "#ec4899", allDay: true },
];

const mockTasks: Task[] = [
  { id: "1", title: "Review PRs", dueDate: new Date(2026, 0, 16), completed: false },
  { id: "2", title: "Update docs", dueDate: new Date(2026, 0, 18), completed: true },
  { id: "3", title: "Fix bugs", dueDate: new Date(2026, 0, 20), completed: false },
];

export default function MonthlyPlannerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) =>
    mockEvents.filter((event) => isSameDay(event.date, date));

  const getTasksForDay = (date: Date) =>
    mockTasks.filter((task) => isSameDay(task.dueDate, date));

  const weekDayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
          <Button className="gap-2 ml-2">
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

      {/* Calendar Grid */}
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
              const events = getEventsForDay(day);
              const tasks = getTasksForDay(day);
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
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      dayIsToday && "text-primary"
                    )}>
                      {format(day, "d")}
                    </span>
                    {(events.length > 0 || tasks.length > 0) && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {events.length + tasks.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: event.color }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {tasks.slice(0, 2 - events.length).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate border",
                          task.completed ? "line-through text-muted-foreground" : ""
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                    {events.length + tasks.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{events.length + tasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Meetings</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Deadlines</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Reviews</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded border" />
              <span>Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
