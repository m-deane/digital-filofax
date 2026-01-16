"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Target,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface MonthlyTask {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  categoryColor: string;
}

interface MonthlyGoal {
  id: string;
  title: string;
  progress: number;
  target: number;
  unit: string;
}

const mockMonthlyTasks: MonthlyTask[] = [
  { id: "1", title: "Complete Q1 planning", completed: true, category: "Work", categoryColor: "#3b82f6" },
  { id: "2", title: "Launch new feature", completed: false, category: "Work", categoryColor: "#3b82f6" },
  { id: "3", title: "Read 2 books", completed: false, category: "Personal", categoryColor: "#10b981" },
  { id: "4", title: "Complete online course", completed: true, category: "Learning", categoryColor: "#8b5cf6" },
  { id: "5", title: "Organize home office", completed: false, category: "Personal", categoryColor: "#10b981" },
  { id: "6", title: "Review and update resume", completed: false, category: "Career", categoryColor: "#f59e0b" },
  { id: "7", title: "Schedule annual checkup", completed: true, category: "Health", categoryColor: "#ef4444" },
  { id: "8", title: "Plan family vacation", completed: false, category: "Personal", categoryColor: "#10b981" },
];

const mockMonthlyGoals: MonthlyGoal[] = [
  { id: "1", title: "Exercise sessions", progress: 12, target: 20, unit: "sessions" },
  { id: "2", title: "Books read", progress: 1, target: 2, unit: "books" },
  { id: "3", title: "Savings target", progress: 750, target: 1000, unit: "dollars" },
  { id: "4", title: "Learning hours", progress: 15, target: 30, unit: "hours" },
];

export default function MonthlyTasksPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<MonthlyTask[]>(mockMonthlyTasks);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = { tasks: [], color: task.categoryColor };
    }
    acc[task.category].tasks.push(task);
    return acc;
  }, {} as Record<string, { tasks: MonthlyTask[]; color: string }>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Tasks</h1>
          <p className="text-muted-foreground">
            Plan and track your monthly objectives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
            This Month
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {completedTasks}/{totalTasks} tasks completed
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-2 mt-2" />
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Goals */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Monthly Goals
              </CardTitle>
              <CardDescription>Track your monthly targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockMonthlyGoals.map((goal) => {
                const percentage = Math.round((goal.progress / goal.target) * 100);
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-muted-foreground">
                        {goal.progress}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Category */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(tasksByCategory).map(([category, { tasks: categoryTasks, color }]) => {
            const categoryCompleted = categoryTasks.filter((t) => t.completed).length;
            return (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {category}
                    </CardTitle>
                    <Badge variant="secondary">
                      {categoryCompleted}/{categoryTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <span className={cn(
                        "text-sm",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add task
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
