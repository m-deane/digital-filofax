"use client";

import { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  TrendingUp,
  Flame,
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { startOfDay, subDays, isSameDay } from "date-fns";
import { SortDropdown } from "@/components/ui/sort-dropdown";
import { HabitHeatmap } from "@/components/habits/habit-heatmap";
import { StreakDisplay } from "@/components/habits/streak-display";

type HabitType = "BOOLEAN" | "NUMERIC" | "DURATION";

interface HabitLog {
  id: string;
  date: Date;
  value: number | null;
}

interface HabitCategory {
  id: string;
  name: string;
  color: string;
}

interface Habit {
  id: string;
  name: string;
  description: string | null;
  habitType: HabitType;
  targetValue: number | null;
  unit: string | null;
  color: string;
  logs: HabitLog[];
  completedToday?: boolean;
  categoryId?: string | null;
  category?: HabitCategory | null;
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function calculateStreakInfo(logs: HabitLog[]) {
  const logDates = logs.map((log) => startOfDay(new Date(log.date)));
  const today = startOfDay(new Date());

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today;

  const todayCompleted = logDates.some((d) => isSameDay(d, today));
  const yesterdayCompleted = logDates.some((d) => isSameDay(d, subDays(today, 1)));

  if (todayCompleted) {
    currentStreak = 1;
    checkDate = subDays(today, 1);
  } else if (yesterdayCompleted) {
    currentStreak = 1;
    checkDate = subDays(today, 2);
  }

  if (currentStreak > 0) {
    while (logDates.some((d) => isSameDay(d, checkDate))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...logDates].sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diff = Math.round(
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Calculate completion rate for last 30 days
  const thirtyDaysAgo = subDays(today, 30);
  const last30DaysLogs = logDates.filter((d) => d >= thirtyDaysAgo);
  const completionRate = Math.round((last30DaysLogs.length / 30) * 100);

  return { currentStreak, longestStreak, completionRate };
}

function getWeekData(logs: HabitLog[]): boolean[] {
  const today = startOfDay(new Date());
  const dayOfWeek = today.getDay();
  // Convert to Monday-based week (0 = Monday, 6 = Sunday)
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = subDays(today, mondayOffset);

  const weekData: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const checkDate = subDays(monday, -i); // Add days
    const completed = logs.some((log) => isSameDay(startOfDay(new Date(log.date)), checkDate));
    weekData.push(completed);
  }
  return weekData;
}

function HabitCard({
  habit,
  onToggle,
  onDelete,
  isToggling
}: {
  habit: Habit;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
}) {
  const streakInfo = calculateStreakInfo(habit.logs);
  const weekData = getWeekData(habit.logs);
  const completedToday = habit.completedToday ?? weekData[weekData.length - 1];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={completedToday}
              onCheckedChange={onToggle}
              disabled={isToggling}
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
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
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
                  weekData[i]
                    ? "text-white"
                    : "bg-muted text-muted-foreground"
                )}
                style={{ backgroundColor: weekData[i] ? habit.color : undefined }}
              >
                {weekData[i] ? "✓" : ""}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{streakInfo.currentStreak}</span>
              <span className="text-muted-foreground">day streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-green-500" />
              <span className="font-medium">{streakInfo.completionRate}%</span>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Best: {streakInfo.longestStreak}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TodayOverview({ habits }: { habits: Habit[] }) {
  const completed = habits.filter((h) => {
    const weekData = getWeekData(h.logs);
    return h.completedToday ?? weekData[weekData.length - 1];
  }).length;
  const total = habits.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const streakInfos = habits.map((h) => calculateStreakInfo(h.logs));
  const bestStreak = streakInfos.length > 0
    ? Math.max(...streakInfos.map((s) => s.currentStreak))
    : 0;
  const avgCompletion = streakInfos.length > 0
    ? Math.round(streakInfos.reduce((acc, s) => acc + s.completionRate, 0) / streakInfos.length)
    : 0;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-orange-500">
              {bestStreak}
            </div>
            <div className="text-xs text-muted-foreground">Best Active Streak</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-green-500">
              {avgCompletion}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Completion</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HabitsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [newHabitType, setNewHabitType] = useState<HabitType>("BOOLEAN");
  const [newHabitColor, setNewHabitColor] = useState("#10b981");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [togglingHabitId, setTogglingHabitId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(undefined);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sortHabitsBy, setSortHabitsBy] = useState<string>(() =>
    typeof window !== "undefined" ? (localStorage.getItem("filofax-sort-habits") ?? "alpha-asc") : "alpha-asc"
  );

  const utils = api.useUtils();

  // Fetch habits from API
  const { data, isLoading, error } = api.habits.getAll.useQuery({});

  // Fetch categories for grouping
  const { data: categories } = api.categories.getAll.useQuery();

  // Fetch heatmap data
  const { data: heatmapData = [], isLoading: isLoadingHeatmap } = api.habits.getHeatmapData.useQuery(
    selectedHabitId ? { habitId: selectedHabitId } : undefined
  );

  // Fetch streak stats
  const { data: streakStats = [], isLoading: isLoadingStats } = api.habits.getStreakStats.useQuery();

  // Create category mutation (for inline group creation)
  const createCategory = api.categories.create.useMutation({
    onSuccess: (newCat) => {
      utils.categories.getAll.invalidate();
      setSelectedCategoryId(newCat.id);
      setNewGroupName("");
    },
  });

  // Create habit mutation
  const createHabit = api.habits.create.useMutation({
    onSuccess: () => {
      utils.habits.getAll.invalidate();
      setIsCreateOpen(false);
      setNewHabitName("");
      setNewHabitDescription("");
      setNewHabitType("BOOLEAN");
      setNewHabitColor("#10b981");
      setSelectedCategoryId("");
      setNewGroupName("");
    },
  });

  // Delete habit mutation
  const deleteHabit = api.habits.delete.useMutation({
    onSuccess: () => {
      utils.habits.getAll.invalidate();
    },
  });

  // Log completion mutation (for checking off today)
  const logCompletion = api.habits.logCompletion.useMutation({
    onSuccess: () => {
      utils.habits.getAll.invalidate();
      setTogglingHabitId(null);
    },
    onError: () => {
      setTogglingHabitId(null);
    },
  });

  // Remove log mutation (for unchecking today)
  const removeLog = api.habits.removeLog.useMutation({
    onSuccess: () => {
      utils.habits.getAll.invalidate();
      setTogglingHabitId(null);
    },
    onError: () => {
      setTogglingHabitId(null);
    },
  });

  const handleCreateHabit = () => {
    if (!newHabitName.trim()) return;
    createHabit.mutate({
      name: newHabitName,
      description: newHabitDescription || undefined,
      habitType: newHabitType,
      color: newHabitColor,
      categoryId: selectedCategoryId || undefined,
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createCategory.mutate({ name: newGroupName });
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleToggleHabit = (habit: Habit) => {
    setTogglingHabitId(habit.id);
    const today = new Date();
    const weekData = getWeekData(habit.logs);
    const completedToday = habit.completedToday ?? weekData[weekData.length - 1];

    if (completedToday) {
      // Uncomplete - remove today's log
      removeLog.mutate({
        habitId: habit.id,
        date: today,
      });
    } else {
      // Complete - add today's log
      logCompletion.mutate({
        habitId: habit.id,
        date: today,
      });
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit.mutate({ id: habitId });
  };

  const habits = useMemo(() => (data ?? []) as Habit[], [data]);

  // Group habits by category
  const grouped = useMemo(() => {
    const groups = new Map<string, { category: HabitCategory | null; habits: Habit[] }>();
    for (const habit of habits) {
      const key = habit.categoryId ?? "__none";
      const existing = groups.get(key);
      if (existing) {
        existing.habits.push(habit);
      } else {
        groups.set(key, {
          category: habit.category ?? null,
          habits: [habit],
        });
      }
    }
    // Sort habits within each group
    for (const [, group] of groups) {
      group.habits.sort((a, b) => {
        switch (sortHabitsBy) {
          case "alpha-desc":
            return b.name.localeCompare(a.name);
          case "streak":
            return (b.logs?.length ?? 0) - (a.logs?.length ?? 0);
          case "alpha-asc":
          default:
            return a.name.localeCompare(b.name);
        }
      });
    }
    // Sort: categorized groups first (alphabetically), then uncategorized last
    const sorted = Array.from(groups.entries()).sort(([keyA, a], [keyB, b]) => {
      if (keyA === "__none") return 1;
      if (keyB === "__none") return -1;
      return (a.category?.name ?? "").localeCompare(b.category?.name ?? "");
    });
    return sorted;
  }, [habits, sortHabitsBy]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading habits: {error.message}</p>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <SortDropdown
            value={sortHabitsBy}
            onChange={(v) => { setSortHabitsBy(v); localStorage.setItem("filofax-sort-habits", v); }}
            options={[
              { label: "A → Z", value: "alpha-asc" },
              { label: "Z → A", value: "alpha-desc" },
              { label: "Most logs", value: "streak" },
            ]}
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
              <Input
                placeholder="Habit name"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
              />
              <Select value={newHabitType} onValueChange={(v) => setNewHabitType(v as HabitType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Habit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOLEAN">Yes/No (Simple)</SelectItem>
                  <SelectItem value="NUMERIC">Numeric (Count)</SelectItem>
                  <SelectItem value="DURATION">Duration (Time)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Color:</label>
                <input
                  type="color"
                  value={newHabitColor}
                  onChange={(e) => setNewHabitColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Group (optional)</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No group</SelectItem>
                    {(categories ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New group name..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateGroup();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || createCategory.isPending}
                  >
                    {createCategory.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateHabit} disabled={createHabit.isPending || !newHabitName.trim()}>
                {createHabit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Habit
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && habits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No habits yet. Create your first habit!</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Heatmap Section */}
      {!isLoading && habits.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Habit Activity</CardTitle>
                  <CardDescription>Your habit completion history over the past year</CardDescription>
                </div>
                <Select
                  value={selectedHabitId ?? "all"}
                  onValueChange={(value) => setSelectedHabitId(value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Habits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Habits</SelectItem>
                    {habits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        {habit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHeatmap ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HabitHeatmap data={heatmapData} />
              )}
            </CardContent>
          </Card>

          {/* Streak Stats */}
          {isLoadingStats ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <StreakDisplay stats={streakStats} />
          )}

          {/* Overview and Habits Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TodayOverview habits={habits} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              {grouped.map(([groupKey, group]) => {
                const isCollapsed = collapsedGroups.has(groupKey);
                const groupName = group.category?.name ?? "Other";
                const groupColor = group.category?.color ?? "#9ca3af";
                const completedCount = group.habits.filter((h) => {
                  const wd = getWeekData(h.logs);
                  return h.completedToday ?? wd[wd.length - 1];
                }).length;

                return (
                  <div key={groupKey} className="space-y-2">
                    <button
                      onClick={() => toggleGroupCollapse(groupKey)}
                      className="flex items-center gap-2 w-full text-left py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: groupColor }}
                      />
                      <span className="font-medium text-sm">{groupName}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {completedCount}/{group.habits.length} today
                      </Badge>
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-3 pl-2">
                        {group.habits.map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            onToggle={() => handleToggleHabit(habit)}
                            onDelete={() => handleDeleteHabit(habit.id)}
                            isToggling={togglingHabitId === habit.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
