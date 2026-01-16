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
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, addHours, setHours } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  startHour: number;
  duration: number; // in hours
  dayIndex: number;
  color: string;
}

const mockEvents: CalendarEvent[] = [
  { id: "1", title: "Team Standup", startHour: 9, duration: 0.5, dayIndex: 0, color: "#3b82f6" },
  { id: "2", title: "Project Planning", startHour: 10, duration: 2, dayIndex: 0, color: "#8b5cf6" },
  { id: "3", title: "Client Call", startHour: 14, duration: 1, dayIndex: 1, color: "#ef4444" },
  { id: "4", title: "Code Review", startHour: 11, duration: 1.5, dayIndex: 2, color: "#10b981" },
  { id: "5", title: "Sprint Demo", startHour: 15, duration: 1, dayIndex: 3, color: "#f59e0b" },
  { id: "6", title: "Team Lunch", startHour: 12, duration: 1, dayIndex: 4, color: "#ec4899" },
  { id: "7", title: "Gym", startHour: 7, duration: 1, dayIndex: 5, color: "#06b6d4" },
  { id: "8", title: "Brunch", startHour: 10, duration: 2, dayIndex: 6, color: "#84cc16" },
];

const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function WeeklyPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [events] = useState<CalendarEvent[]>(mockEvents);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Planner</h1>
          <p className="text-muted-foreground">
            Plan your week with time-blocked scheduling
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
          <Button className="gap-2 ml-2">
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

      {/* Calendar Grid */}
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
                    {weekDays.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={cn(
                          "relative border-r last:border-r-0 h-16",
                          isToday(day) && "bg-primary/5"
                        )}
                      >
                        {/* Events for this hour/day */}
                        {events
                          .filter((e) => e.dayIndex === dayIndex && e.startHour === hour)
                          .map((event) => (
                            <div
                              key={event.id}
                              className="absolute left-1 right-1 rounded px-2 py-1 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                backgroundColor: event.color,
                                height: `${event.duration * 64 - 4}px`,
                                top: "2px",
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-white/80">
                                {format(setHours(new Date(), event.startHour), "h:mm a")}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
