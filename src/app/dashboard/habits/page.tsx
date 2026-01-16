"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  TrendingUp,
  Flame,
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  name: string;
  description?: string;
  habitType: "BOOLEAN" | "NUMERIC" | "DURATION";
  targetValue?: number;
  unit?: string;
  color: string;
  completedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weekData: boolean[];
}

const mockHabits: Habit[] = [
  {
    id: "1",
    name: "Exercise",
    description: "30 minutes of physical activity",
    habitType: "BOOLEAN",
    color: "#ef4444",
    completedToday: true,
    currentStreak: 7,
    longestStreak: 14,
    completionRate: 85,
    weekData: [true, true, true, false, true, true, true],
  },
  {
    id: "2",
    name: "Read",
    description: "Read for at least 30 minutes",
    habitType: "DURATION",
    targetValue: 30,
    unit: "minutes",
    color: "#3b82f6",
    completedToday: true,
    currentStreak: 14,
    longestStreak: 21,
    completionRate: 92,
    weekData: [true, true, true, true, true, true, true],
  },
  {
    id: "3",
    name: "Meditate",
    description: "Morning meditation session",
    habitType: "DURATION",
    targetValue: 10,
    unit: "minutes",
    color: "#8b5cf6",
    completedToday: false,
    currentStreak: 3,
    longestStreak: 10,
    completionRate: 70,
    weekData: [true, true, true, false, false, false, false],
  },
  {
    id: "4",
    name: "Drink Water",
    description: "8 glasses of water per day",
    habitType: "NUMERIC",
    targetValue: 8,
    unit: "glasses",
    color: "#06b6d4",
    completedToday: false,
    currentStreak: 0,
    longestStreak: 7,
    completionRate: 60,
    weekData: [true, true, false, true, false, true, false],
  },
  {
    id: "5",
    name: "No Social Media",
    description: "Avoid social media before noon",
    habitType: "BOOLEAN",
    color: "#f59e0b",
    completedToday: true,
    currentStreak: 5,
    longestStreak: 12,
    completionRate: 75,
    weekData: [true, true, true, true, true, false, false],
  },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function HabitCard({ habit, onToggle }: { habit: Habit; onToggle: () => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={habit.completedToday}
              onCheckedChange={onToggle}
              className="h-6 w-6"
              style={{ borderColor: habit.color }}
            />
            <div>
              <h3 className="font-semibold">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground">{habit.description}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart2 className="h-4 w-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Week Progress */}
        <div className="flex justify-between mb-4">
          {weekDays.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{day}</span>
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                  habit.weekData[i]
                    ? "text-white"
                    : "bg-muted text-muted-foreground"
                )}
                style={{ backgroundColor: habit.weekData[i] ? habit.color : undefined }}
              >
                {habit.weekData[i] ? "✓" : ""}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{habit.currentStreak}</span>
              <span className="text-muted-foreground">day streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-green-500" />
              <span className="font-medium">{habit.completionRate}%</span>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Best: {habit.longestStreak}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TodayOverview({ habits }: { habits: Habit[] }) {
  const completed = habits.filter((h) => h.completedToday).length;
  const total = habits.length;
  const progress = (completed / total) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today&apos;s Progress</CardTitle>
        <CardDescription>
          {completed} of {total} habits completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="h-3 mb-4" />
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-orange-500">
              {Math.max(...habits.map((h) => h.currentStreak))}
            </div>
            <div className="text-xs text-muted-foreground">Best Active Streak</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-green-500">
              {Math.round(habits.reduce((acc, h) => acc + h.completionRate, 0) / habits.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Completion</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HabitsPage() {
  const [habits] = useState<Habit[]>(mockHabits);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground">
            Track and build consistent daily habits
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
              <DialogDescription>
                Start tracking a new daily habit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Habit name" />
              <Input placeholder="Description (optional)" />
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Create Habit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview and Habits Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TodayOverview habits={habits} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onToggle={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
