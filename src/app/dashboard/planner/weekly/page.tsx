"use client";

import { useState } from "react";
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
  isSameDay,
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

const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function WeeklyPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(9);

  const utils = api.useUtils();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch events for the week
  const { data, isLoading, error } = api.calendar.getEvents.useQuery({
    startDate: weekStart,
    endDate: weekEnd,
  });

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
    const startDate = setMinutes(setHours(selectedDate, selectedHour), 0);
    const endDate = addHours(startDate, 1); // Default 1 hour duration
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

  const events = (data ?? []) as CalendarEvent[];

  // Get events for a specific day and hour
  const getEventsForTime = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return isSameDay(eventStart, day) && getHours(eventStart) === hour;
    });
  };

  // Calculate event duration in hours
  const getEventDuration = (event: CalendarEvent) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading events: {error.message}</p>
      </div>
    );
  }

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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Calendar Grid */}
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
                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              "relative border-r last:border-r-0 h-16 cursor-pointer hover:bg-muted/30",
                              isToday(day) && "bg-primary/5"
                            )}
                            onClick={() => openCreateForTime(day, hour)}
                          >
                            {/* Events for this hour/day */}
                            {timeEvents.map((event) => {
                              const duration = getEventDuration(event);
                              return (
                                <div
                                  key={event.id}
                                  className="absolute left-1 right-1 rounded px-2 py-1 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10"
                                  style={{
                                    backgroundColor: event.color || "#3b82f6",
                                    height: `${duration * 64 - 4}px`,
                                    top: "2px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="font-medium truncate">{event.title}</div>
                                  <div className="text-white/80">
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
  );
}
