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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function TodayAgendaWidget() {
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
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">9:00 AM</span>
            <span className="text-sm">Team standup meeting</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">2:00 PM</span>
            <span className="text-sm">Project review</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">5:00 PM</span>
            <span className="text-sm">Gym workout</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </CardContent>
    </Card>
  );
}

function TasksWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
          <CardDescription>Due today and upcoming</CardDescription>
        </div>
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox id="task-1" />
          <div className="flex-1">
            <label htmlFor="task-1" className="text-sm font-medium cursor-pointer">
              Review pull request
            </label>
            <p className="text-xs text-muted-foreground">Work</p>
          </div>
          <Badge variant="destructive" className="text-xs">High</Badge>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="task-2" />
          <div className="flex-1">
            <label htmlFor="task-2" className="text-sm font-medium cursor-pointer">
              Update documentation
            </label>
            <p className="text-xs text-muted-foreground">Work</p>
          </div>
          <Badge variant="secondary" className="text-xs">Medium</Badge>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="task-3" />
          <div className="flex-1">
            <label htmlFor="task-3" className="text-sm font-medium cursor-pointer">
              Buy groceries
            </label>
            <p className="text-xs text-muted-foreground">Personal</p>
          </div>
          <Badge variant="outline" className="text-xs">Low</Badge>
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </CardContent>
    </Card>
  );
}

function HabitsWidget() {
  const habits = [
    { name: "Exercise", completed: true, streak: 7 },
    { name: "Read 30 min", completed: true, streak: 14 },
    { name: "Meditate", completed: false, streak: 3 },
    { name: "Drink 8 glasses", completed: false, streak: 0 },
  ];

  const completedCount = habits.filter((h) => h.completed).length;
  const progress = (completedCount / habits.length) * 100;

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
        <Progress value={progress} className="h-2" />
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.name}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={habit.completed} />
                <span className="text-sm">{habit.name}</span>
              </div>
              {habit.streak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {habit.streak}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStatsWidget() {
  const stats = [
    { label: "Tasks Due Today", value: 5, icon: CheckSquare, color: "text-blue-500" },
    { label: "Active Habits", value: 4, icon: Target, color: "text-green-500" },
    { label: "Events This Week", value: 8, icon: Calendar, color: "text-purple-500" },
    { label: "Notes Created", value: 23, icon: FileText, color: "text-orange-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Mobile app redesign</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Consider a bottom navigation bar for better UX...
          </p>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Automation workflow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Set up automatic meal plan generation...
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Capture Idea
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your personal command center.
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStatsWidget />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TodayAgendaWidget />
        <TasksWidget />
        <HabitsWidget />
        <IdeasWidget />
      </div>
    </div>
  );
}
