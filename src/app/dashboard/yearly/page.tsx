"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Target,
  Trophy,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const QUARTER_COLORS: Record<string, string> = {
  Q1: "bg-blue-100 text-blue-700 border-blue-300",
  Q2: "bg-green-100 text-green-700 border-green-300",
  Q3: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Q4: "bg-purple-100 text-purple-700 border-purple-300",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  DEFERRED: "bg-orange-100 text-orange-700",
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#6b7280", "#f59e0b"];

export default function YearlyOverviewPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);

  const utils = api.useUtils();

  // Queries
  const { data: goals } = api.yearly.goals.getByYear.useQuery({ year: selectedYear });
  const { data: reflection } = api.yearly.reflection.getByYear.useQuery({ year: selectedYear });
  const { data: yearStats } = api.yearly.getYearStats.useQuery({ year: selectedYear });
  const { data: monthlyActivity } = api.yearly.getMonthlyActivity.useQuery({ year: selectedYear });

  // Mutations
  const createGoal = api.yearly.goals.create.useMutation({
    onSuccess: () => {
      utils.yearly.goals.getByYear.invalidate();
      utils.yearly.getYearStats.invalidate();
      setShowGoalDialog(false);
    },
  });

  const updateGoal = api.yearly.goals.update.useMutation({
    onSuccess: () => {
      utils.yearly.goals.getByYear.invalidate();
      utils.yearly.getYearStats.invalidate();
    },
  });

  const deleteGoal = api.yearly.goals.delete.useMutation({
    onSuccess: () => {
      utils.yearly.goals.getByYear.invalidate();
      utils.yearly.getYearStats.invalidate();
    },
  });

  const updateReflection = api.yearly.reflection.update.useMutation({
    onSuccess: () => {
      utils.yearly.reflection.getByYear.invalidate();
      setShowReflectionDialog(false);
    },
  });

  const handleYearChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedYear((prev) => prev + 1);
    }
  };

  const goalsByQuarter = {
    Q1: goals?.filter((g) => g.quarter === "Q1") || [],
    Q2: goals?.filter((g) => g.quarter === "Q2") || [],
    Q3: goals?.filter((g) => g.quarter === "Q3") || [],
    Q4: goals?.filter((g) => g.quarter === "Q4") || [],
    FULL_YEAR: goals?.filter((g) => !g.quarter) || [],
  };

  const chartData = monthlyActivity?.map((m) => ({
    month: new Date(selectedYear, m.month - 1).toLocaleDateString("en-US", { month: "short" }),
    "Tasks Completed": m.tasks,
    "Habit Logs": m.habitLogs,
    "Memos Created": m.memos,
  })) || [];

  const goalsPieData = yearStats?.goals
    ? [
        { name: "Completed", value: yearStats.goals.completed },
        { name: "In Progress", value: yearStats.goals.inProgress },
        { name: "Not Started", value: yearStats.goals.notStarted },
        { name: "Deferred", value: yearStats.goals.deferred },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header with Year Selector */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Yearly Overview</h1>
          <p className="text-muted-foreground">
            Plan your year, track progress, and reflect on your journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 min-w-[100px] items-center justify-center rounded-md border border-input bg-background px-4 text-lg font-semibold">
            {selectedYear}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange("next")}
            disabled={selectedYear >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Year Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearStats?.tasks.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {yearStats?.tasks.completionRate || 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habit Logs</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearStats?.habits.logs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {yearStats?.habits.active || 0} active habits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Goals</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearStats?.goals.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {yearStats?.goals.completed || 0} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memos & Ideas</CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(yearStats?.memos || 0) + (yearStats?.ideas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {yearStats?.memos || 0} memos, {yearStats?.ideas || 0} ideas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>Your productivity throughout the year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tasks Completed" fill="#10b981" />
                <Bar dataKey="Habit Logs" fill="#3b82f6" />
                <Bar dataKey="Memos Created" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals Progress</CardTitle>
            <CardDescription>Status of your yearly goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={goalsPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {goalsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vision & Theme Section */}
      {reflection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Year Vision & Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reflection.themeWord && (
              <div>
                <Label className="text-sm text-muted-foreground">Word of the Year</Label>
                <p className="text-2xl font-bold text-primary">{reflection.themeWord}</p>
              </div>
            )}
            {reflection.visionStatement && (
              <div>
                <Label className="text-sm text-muted-foreground">Vision Statement</Label>
                <p className="text-base leading-relaxed">{reflection.visionStatement}</p>
              </div>
            )}
            <Button variant="outline" onClick={() => setShowReflectionDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Vision
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Yearly Goals by Quarter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Yearly Goals</h2>
          <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Yearly Goal</DialogTitle>
                <DialogDescription>
                  Set a goal for {selectedYear}. Choose a quarter or leave blank for full-year goals.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const quarter = formData.get("quarter") as string;
                  createGoal.mutate({
                    year: selectedYear,
                    title: formData.get("title") as string,
                    description: formData.get("description") as string,
                    category: formData.get("category") as string,
                    quarter: quarter ? (quarter as "Q1" | "Q2" | "Q3" | "Q4") : undefined,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Enter goal title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your goal (optional)"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Health, Career, Personal" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Select name="quarter">
                    <SelectTrigger>
                      <SelectValue placeholder="Full Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Full Year</SelectItem>
                      <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                      <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                      <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                      <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createGoal.isPending}>
                    {createGoal.isPending ? "Creating..." : "Create Goal"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Full Year Goals */}
        {goalsByQuarter.FULL_YEAR.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Full Year Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {goalsByQuarter.FULL_YEAR.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal.mutate} onUpdate={updateGoal.mutate} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quarterly Goals */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(["Q1", "Q2", "Q3", "Q4"] as const).map((quarter) => (
            <Card key={quarter} className={cn("border-2", QUARTER_COLORS[quarter].replace("bg-", "border-").replace("text-", ""))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge className={QUARTER_COLORS[quarter]}>{quarter}</Badge>
                  {quarter === "Q1" && "Jan-Mar"}
                  {quarter === "Q2" && "Apr-Jun"}
                  {quarter === "Q3" && "Jul-Sep"}
                  {quarter === "Q4" && "Oct-Dec"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {goalsByQuarter[quarter].length === 0 ? (
                    <p className="text-sm text-muted-foreground">No goals for this quarter</p>
                  ) : (
                    goalsByQuarter[quarter].map((goal) => (
                      <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal.mutate} onUpdate={updateGoal.mutate} compact />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Year-End Reflection */}
      {selectedYear < currentYear && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Year-End Reflection
            </CardTitle>
            <CardDescription>
              Reflect on your {selectedYear} journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reflection ? (
              <div className="space-y-4">
                {reflection.accomplishments.length > 0 && (
                  <div>
                    <Label className="font-semibold">Accomplishments</Label>
                    <ul className="ml-4 mt-2 list-disc space-y-1">
                      {reflection.accomplishments.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {reflection.challenges.length > 0 && (
                  <div>
                    <Label className="font-semibold">Challenges</Label>
                    <ul className="ml-4 mt-2 list-disc space-y-1">
                      {reflection.challenges.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {reflection.lessonsLearned.length > 0 && (
                  <div>
                    <Label className="font-semibold">Lessons Learned</Label>
                    <ul className="ml-4 mt-2 list-disc space-y-1">
                      {reflection.lessonsLearned.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {reflection.rating && (
                  <div>
                    <Label className="font-semibold">Overall Year Rating</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-3xl font-bold">{reflection.rating}</div>
                      <div className="text-muted-foreground">/ 10</div>
                    </div>
                  </div>
                )}
                <Button variant="outline" onClick={() => setShowReflectionDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Reflection
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-center text-muted-foreground">
                  No reflection yet for {selectedYear}
                </p>
                <Button onClick={() => setShowReflectionDialog(true)}>
                  Start Reflection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reflection Dialog */}
      <Dialog open={showReflectionDialog} onOpenChange={setShowReflectionDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Year Reflection for {selectedYear}</DialogTitle>
            <DialogDescription>
              Take time to reflect on your year and set intentions for the future
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const accomplishments = (formData.get("accomplishments") as string).split("\n").filter((s) => s.trim());
              const challenges = (formData.get("challenges") as string).split("\n").filter((s) => s.trim());
              const lessonsLearned = (formData.get("lessonsLearned") as string).split("\n").filter((s) => s.trim());
              const gratitudes = (formData.get("gratitudes") as string).split("\n").filter((s) => s.trim());
              const nextYearIntentions = (formData.get("nextYearIntentions") as string).split("\n").filter((s) => s.trim());
              const ratingStr = formData.get("rating") as string;

              updateReflection.mutate({
                year: selectedYear,
                accomplishments,
                challenges,
                lessonsLearned,
                gratitudes,
                rating: ratingStr ? parseInt(ratingStr) : undefined,
                nextYearIntentions,
                visionStatement: formData.get("visionStatement") as string,
                themeWord: formData.get("themeWord") as string,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="themeWord">Word of the Year</Label>
              <Input
                id="themeWord"
                name="themeWord"
                placeholder="One word that captures the year"
                defaultValue={reflection?.themeWord || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visionStatement">Vision Statement</Label>
              <Textarea
                id="visionStatement"
                name="visionStatement"
                placeholder="Your vision for the year..."
                rows={3}
                defaultValue={reflection?.visionStatement || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accomplishments">Accomplishments (one per line)</Label>
              <Textarea
                id="accomplishments"
                name="accomplishments"
                placeholder="What did you achieve this year?"
                rows={4}
                defaultValue={reflection?.accomplishments.join("\n") || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenges">Challenges (one per line)</Label>
              <Textarea
                id="challenges"
                name="challenges"
                placeholder="What obstacles did you face?"
                rows={4}
                defaultValue={reflection?.challenges.join("\n") || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonsLearned">Lessons Learned (one per line)</Label>
              <Textarea
                id="lessonsLearned"
                name="lessonsLearned"
                placeholder="What did you learn?"
                rows={4}
                defaultValue={reflection?.lessonsLearned.join("\n") || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gratitudes">Gratitudes (one per line)</Label>
              <Textarea
                id="gratitudes"
                name="gratitudes"
                placeholder="What are you grateful for?"
                rows={4}
                defaultValue={reflection?.gratitudes.join("\n") || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Overall Year Rating (1-10)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="1"
                max="10"
                placeholder="Rate your year"
                defaultValue={reflection?.rating || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextYearIntentions">Intentions for Next Year (one per line)</Label>
              <Textarea
                id="nextYearIntentions"
                name="nextYearIntentions"
                placeholder="What do you intend for next year?"
                rows={4}
                defaultValue={reflection?.nextYearIntentions.join("\n") || ""}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateReflection.isPending}>
                {updateReflection.isPending ? "Saving..." : "Save Reflection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
  };
  onDelete: (input: { id: string }) => void;
  onUpdate: (input: { id: string; status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DEFERRED" }) => void;
  compact?: boolean;
}

function GoalCard({ goal, onDelete, onUpdate, compact }: GoalCardProps) {
  const nextStatus: Record<string, "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DEFERRED"> = {
    NOT_STARTED: "IN_PROGRESS",
    IN_PROGRESS: "COMPLETED",
    COMPLETED: "COMPLETED",
    DEFERRED: "IN_PROGRESS",
  };

  return (
    <div
      className={cn(
        "group flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-accent",
        compact ? "text-sm" : ""
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="font-medium">{goal.title}</p>
            {!compact && goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {goal.category && (
            <Badge variant="outline" className="text-xs">
              {goal.category}
            </Badge>
          )}
          <Badge className={cn("text-xs", STATUS_COLORS[goal.status])}>
            {goal.status.replace("_", " ")}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {goal.status !== "COMPLETED" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdate({ id: goal.id, status: nextStatus[goal.status as keyof typeof nextStatus] })}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onDelete({ id: goal.id })}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
