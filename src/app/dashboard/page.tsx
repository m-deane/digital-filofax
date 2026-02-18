"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckSquare,
  Target,
  Calendar,
  FileText,
  Lightbulb,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format, startOfDay, isSameDay, subDays } from "date-fns";
import { api } from "@/lib/trpc";
import { useIsWidgetEnabled } from "@/hooks/use-modules";
import { WidgetPicker } from "@/components/dashboard/widget-picker";
import { FocusTimerWidget } from "@/components/dashboard/focus-timer-widget";
import { GoalsWidget } from "@/components/dashboard/goals-widget";

function TodayAgendaWidget() {
  const { data, isLoading } = api.calendar.getToday.useQuery();
  const events = data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Today&apos;s Agenda</CardTitle>
          <CardDescription>{format(new Date(), "EEEE, MMMM d")}</CardDescription>
        </div>
        <Link href="/dashboard/planner/weekly">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && events.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No events scheduled for today</p>
        )}
        {!isLoading && events.length > 0 && (
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(event.startDate), "h:mm a")}
                </span>
                <span className="text-sm">{event.title}</span>
              </div>
            ))}
          </div>
        )}
        <Link href="/dashboard/planner/weekly">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function TasksWidget() {
  const utils = api.useUtils();
  const { data, isLoading } = api.tasks.getDueSoon.useQuery({ days: 7 });
  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getDueSoon.invalidate();
      utils.tasks.getAll.invalidate();
    },
  });

  const tasks = data ?? [];

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleToggle = (taskId: string, currentStatus: string) => {
    updateTask.mutate({
      id: taskId,
      status: currentStatus === "DONE" ? "TODO" : "DONE",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
          <CardDescription>Due soon</CardDescription>
        </div>
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
        )}
        {!isLoading && tasks.slice(0, 3).map((task) => (
          <div key={task.id} className="flex items-start gap-3">
            <Checkbox
              checked={task.status === "DONE"}
              onCheckedChange={() => handleToggle(task.id, task.status)}
            />
            <div className="flex-1">
              <span className="text-sm font-medium">{task.title}</span>
              {task.category && (
                <p className="text-xs text-muted-foreground">{task.category.name}</p>
              )}
            </div>
            <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
              {task.priority}
            </Badge>
          </div>
        ))}
        <Link href="/dashboard/tasks">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function HabitsWidget() {
  const utils = api.useUtils();
  const { data, isLoading } = api.habits.getAll.useQuery({});

  const logCompletion = api.habits.logCompletion.useMutation({
    onSuccess: () => {
      utils.habits.getAll.invalidate();
    },
  });

  const removeLog = api.habits.removeLog.useMutation({
    onSuccess: () => {
      utils.habits.getAll.invalidate();
    },
  });

  const habits = data ?? [];
  const today = startOfDay(new Date());

  const getCompletedToday = (habit: { logs: { date: Date }[] }) => {
    return habit.logs.some((log) => isSameDay(new Date(log.date), today));
  };

  const getStreak = (habit: { logs: { date: Date }[] }) => {
    const logDates = habit.logs.map((log) => startOfDay(new Date(log.date)));
    let streak = 0;
    let checkDate = today;

    const todayCompleted = logDates.some((d) => isSameDay(d, today));
    const yesterdayCompleted = logDates.some((d) => isSameDay(d, subDays(today, 1)));

    if (todayCompleted) {
      streak = 1;
      checkDate = subDays(today, 1);
    } else if (yesterdayCompleted) {
      streak = 1;
      checkDate = subDays(today, 2);
    }

    if (streak > 0) {
      while (logDates.some((d) => isSameDay(d, checkDate))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    return streak;
  };

  const handleToggle = (habitId: string, completedToday: boolean) => {
    if (completedToday) {
      removeLog.mutate({ habitId, date: new Date() });
    } else {
      logCompletion.mutate({ habitId, date: new Date() });
    }
  };

  const completedCount = habits.filter((h) => getCompletedToday(h)).length;
  const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Today&apos;s Habits</CardTitle>
          <CardDescription>{completedCount} of {habits.length} completed</CardDescription>
        </div>
        <Link href="/dashboard/habits">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && habits.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No habits tracked yet</p>
        )}
        {!isLoading && habits.length > 0 && (
          <>
            <Progress value={progress} className="h-2" />
            <div className="space-y-2">
              {habits.slice(0, 4).map((habit) => {
                const completedToday = getCompletedToday(habit);
                const streak = getStreak(habit);
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={completedToday}
                        onCheckedChange={() => handleToggle(habit.id, completedToday)}
                      />
                      <span className="text-sm">{habit.name}</span>
                    </div>
                    {streak > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {streak}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStatsWidget() {
  const tasksEnabled = useIsWidgetEnabled("tasks");
  const habitsEnabled = useIsWidgetEnabled("habits");
  const calendarEnabled = useIsWidgetEnabled("agenda");
  const memosEnabled = useIsWidgetEnabled("quick-capture");

  const { data: tasksData } = api.tasks.getDueSoon.useQuery({ days: 1 }, { enabled: tasksEnabled });
  const { data: habitsData } = api.habits.getAll.useQuery({}, { enabled: habitsEnabled });
  const { data: eventsData } = api.calendar.getThisWeek.useQuery(undefined, { enabled: calendarEnabled });
  const { data: memosData } = api.memos.getAll.useQuery({}, { enabled: memosEnabled });

  const tasksDueToday = tasksData?.length ?? 0;
  const activeHabits = habitsData?.length ?? 0;
  const eventsThisWeek = eventsData?.length ?? 0;
  const totalMemos = memosData?.memos?.length ?? 0;

  const stats = [
    { label: "Tasks Due Today", value: tasksDueToday, icon: CheckSquare, color: "text-blue-500", enabled: tasksEnabled },
    { label: "Active Habits", value: activeHabits, icon: Target, color: "text-green-500", enabled: habitsEnabled },
    { label: "Events This Week", value: eventsThisWeek, icon: Calendar, color: "text-purple-500", enabled: calendarEnabled },
    { label: "Notes Created", value: totalMemos, icon: FileText, color: "text-orange-500", enabled: memosEnabled },
  ].filter(stat => stat.enabled);

  if (stats.length === 0) return null;

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : ""}`}>
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function IdeasWidget() {
  const { data, isLoading } = api.ideas.getAll.useQuery({ limit: 5 });
  const ideas = data?.ideas ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Ideas</CardTitle>
          <CardDescription>Your latest captured ideas</CardDescription>
        </div>
        <Link href="/dashboard/ideas">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && ideas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No ideas captured yet</p>
        )}
        {!isLoading && ideas.slice(0, 2).map((idea) => (
          <div key={idea.id} className="p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{idea.title}</span>
            </div>
            {idea.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {idea.description}
              </p>
            )}
          </div>
        ))}
        <Link href="/dashboard/ideas">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Capture Idea
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const agendaEnabled = useIsWidgetEnabled("agenda");
  const tasksEnabled = useIsWidgetEnabled("tasks");
  const habitsEnabled = useIsWidgetEnabled("habits");
  const ideasEnabled = useIsWidgetEnabled("ideas");
  const goalsEnabled = useIsWidgetEnabled("goals");
  const focusEnabled = useIsWidgetEnabled("focus");

  const widgets = [
    { key: "agenda", enabled: agendaEnabled, component: <TodayAgendaWidget /> },
    { key: "tasks", enabled: tasksEnabled, component: <TasksWidget /> },
    { key: "habits", enabled: habitsEnabled, component: <HabitsWidget /> },
    { key: "ideas", enabled: ideasEnabled, component: <IdeasWidget /> },
    { key: "goals", enabled: goalsEnabled, component: <GoalsWidget /> },
    { key: "focus", enabled: focusEnabled, component: <FocusTimerWidget /> },
  ].filter(w => w.enabled);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your personal command center.
          </p>
        </div>
        <WidgetPicker />
      </div>

      {/* Quick Stats */}
      <QuickStatsWidget />

      {/* Main Content Grid */}
      {widgets.length > 0 ? (
        <div className={`grid gap-6 md:grid-cols-2 ${widgets.length >= 3 ? "lg:grid-cols-3" : ""}`}>
          {widgets.map(w => (
            <div key={w.key}>{w.component}</div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No widgets enabled. Click Customize to add widgets.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
