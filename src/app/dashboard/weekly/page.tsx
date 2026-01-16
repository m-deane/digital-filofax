"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyTask {
  id: string;
  title: string;
  completed: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dayIndex: number; // 0-6 for Mon-Sun
}

const mockWeeklyTasks: WeeklyTask[] = [
  { id: "1", title: "Team standup", completed: true, priority: "MEDIUM", dayIndex: 0 },
  { id: "2", title: "Review PRs", completed: false, priority: "HIGH", dayIndex: 0 },
  { id: "3", title: "Project planning", completed: false, priority: "HIGH", dayIndex: 1 },
  { id: "4", title: "Write documentation", completed: true, priority: "MEDIUM", dayIndex: 2 },
  { id: "5", title: "Code review session", completed: false, priority: "MEDIUM", dayIndex: 3 },
  { id: "6", title: "Sprint retrospective", completed: false, priority: "HIGH", dayIndex: 4 },
  { id: "7", title: "Gym workout", completed: true, priority: "LOW", dayIndex: 5 },
  { id: "8", title: "Meal prep", completed: false, priority: "MEDIUM", dayIndex: 6 },
];

const weeklyGoals = [
  { id: "1", title: "Complete feature implementation", completed: false },
  { id: "2", title: "Review all pending PRs", completed: true },
  { id: "3", title: "Update project documentation", completed: false },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case "HIGH":
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
  const [tasks, setTasks] = useState<WeeklyTask[]>(mockWeeklyTasks);
  const [goals, setGoals] = useState(weeklyGoals);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const toggleGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

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

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Goals</CardTitle>
          <CardDescription>Key objectives for this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <Checkbox
                checked={goal.completed}
                onCheckedChange={() => toggleGoal(goal.id)}
              />
              <span className={cn("text-sm", goal.completed && "line-through text-muted-foreground")}>
                {goal.title}
              </span>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add goal
          </Button>
        </CardContent>
      </Card>

      {/* Week Grid */}
      <div className="grid gap-4 md:grid-cols-7">
        {weekDays.map((day, dayIndex) => {
          const dayTasks = tasks.filter((t) => t.dayIndex === dayIndex);
          const completedCount = dayTasks.filter((t) => t.completed).length;

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
                      task.completed ? "bg-muted/50" : "bg-card"
                    )}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="h-3 w-3"
                    />
                    <span className={cn(task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
