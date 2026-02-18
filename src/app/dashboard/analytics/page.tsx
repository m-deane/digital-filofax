"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { TaskCompletionChart } from "@/components/analytics/TaskCompletionChart";
import { HabitStreakChart } from "@/components/analytics/HabitStreakChart";
import { CategoryDistribution } from "@/components/analytics/CategoryDistribution";
import { PriorityBreakdown } from "@/components/analytics/PriorityBreakdown";
import { ProductivityTrend } from "@/components/analytics/ProductivityTrend";
import { FocusTimeChart } from "@/components/analytics/FocusTimeChart";
import { BarChart3, TrendingUp, Target, Clock } from "lucide-react";

type DateRangePreset = "today" | "week" | "month" | "last30" | "last90";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("last30");

  // Query all analytics data
  const { data: summaryStats, isLoading: summaryLoading } = api.analytics.getSummaryStats.useQuery(
    { preset: dateRange }
  );

  const { data: taskStats, isLoading: taskStatsLoading } = api.analytics.getTaskStats.useQuery({
    preset: dateRange,
  });

  const { data: habitStats, isLoading: habitStatsLoading } = api.analytics.getHabitStats.useQuery({
    preset: dateRange,
  });

  const { data: productivityScore, isLoading: productivityLoading } =
    api.analytics.getProductivityScore.useQuery({ preset: dateRange });

  const { data: focusStats, isLoading: focusLoading } = api.analytics.getFocusStats.useQuery({
    preset: dateRange,
  });

  const { data: weeklyTrends, isLoading: trendsLoading } = api.analytics.getWeeklyTrends.useQuery({
    weeks: 4,
  });

  const isLoading =
    summaryLoading ||
    taskStatsLoading ||
    habitStatsLoading ||
    productivityLoading ||
    focusLoading ||
    trendsLoading;

  const getRangeLabel = (preset: DateRangePreset): string => {
    switch (preset) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "last30":
        return "Last 30 Days";
      case "last90":
        return "Last 90 Days";
      default:
        return "Last 30 Days";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your productivity and performance over time
          </p>
        </div>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangePreset)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="last30">Last 30 Days</SelectItem>
            <SelectItem value="last90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalTasks ?? 0}</div>
              <p className="text-xs text-muted-foreground">{getRangeLabel(dateRange)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habit Completion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats?.habitCompletionRate.toFixed(0) ?? 0}%
              </div>
              <p className="text-xs text-muted-foreground">Average completion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.currentStreak ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {summaryStats?.currentStreak === 1 ? "day" : "days"} with habits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.focusHours.toFixed(1) ?? 0}h</div>
              <p className="text-xs text-muted-foreground">Deep work sessions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Completion Trend */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : (
          taskStats && <TaskCompletionChart data={taskStats.tasksByDay} chartType="line" />
        )}

        {/* Productivity Score */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : (
          productivityScore && (
            <ProductivityTrend
              data={productivityScore.scoreByDay}
              averageScore={productivityScore.averageScore}
            />
          )
        )}

        {/* Category Distribution */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : (
          taskStats &&
          taskStats.byCategory.length > 0 && (
            <CategoryDistribution data={taskStats.byCategory} />
          )
        )}

        {/* Priority Breakdown */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : (
          taskStats && <PriorityBreakdown data={taskStats.byPriority} />
        )}

        {/* Habit Streaks */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : (
          habitStats &&
          habitStats.habitStats.length > 0 && (
            <HabitStreakChart data={habitStats.habitStats} />
          )
        )}

        {/* Focus Time */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : (
          focusStats && (
            <FocusTimeChart
              data={focusStats.sessionsByDay}
              totalHours={focusStats.totalHours}
              totalSessions={focusStats.totalSessions}
            />
          )
        )}
      </div>

      {/* Weekly Trends Comparison */}
      {!isLoading && weeklyTrends && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
            <CardDescription>Week-over-week performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Week</th>
                    <th className="text-right p-2">Tasks</th>
                    <th className="text-right p-2">Habits</th>
                    <th className="text-right p-2">Focus Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyTrends.weeks.map((week, index) => {
                    const prevWeek = index > 0 ? weeklyTrends.weeks[index - 1] : null;
                    const taskChange = prevWeek
                      ? week.tasksCompleted - prevWeek.tasksCompleted
                      : 0;
                    const habitChange = prevWeek
                      ? week.habitsCompleted - prevWeek.habitsCompleted
                      : 0;
                    const focusChange = prevWeek ? week.focusHours - prevWeek.focusHours : 0;

                    return (
                      <tr key={week.weekStart} className="border-b">
                        <td className="p-2">
                          {new Date(week.weekStart).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(week.weekEnd).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="text-right p-2">
                          {week.tasksCompleted}
                          {prevWeek && (
                            <span
                              className={`ml-2 text-xs ${
                                taskChange > 0
                                  ? "text-green-600"
                                  : taskChange < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {taskChange > 0 ? "+" : ""}
                              {taskChange}
                            </span>
                          )}
                        </td>
                        <td className="text-right p-2">
                          {week.habitsCompleted}
                          {prevWeek && (
                            <span
                              className={`ml-2 text-xs ${
                                habitChange > 0
                                  ? "text-green-600"
                                  : habitChange < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {habitChange > 0 ? "+" : ""}
                              {habitChange}
                            </span>
                          )}
                        </td>
                        <td className="text-right p-2">
                          {week.focusHours.toFixed(1)}h
                          {prevWeek && (
                            <span
                              className={`ml-2 text-xs ${
                                focusChange > 0
                                  ? "text-green-600"
                                  : focusChange < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {focusChange > 0 ? "+" : ""}
                              {focusChange.toFixed(1)}h
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Section */}
      {!isLoading && taskStats && habitStats && (
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
            <CardDescription>AI-generated tips to improve your productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskStats.completionRate < 50 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="mt-0.5">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Low Task Completion Rate
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Your completion rate is {taskStats.completionRate.toFixed(0)}%. Consider
                      breaking down large tasks into smaller, manageable subtasks.
                    </p>
                  </div>
                </div>
              )}

              {habitStats.overallCompletionRate > 80 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="mt-0.5">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Excellent Habit Consistency
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You&apos;re maintaining {habitStats.overallCompletionRate.toFixed(0)}% habit
                      completion. Great work! Consider adding a new challenging habit.
                    </p>
                  </div>
                </div>
              )}

              {focusStats && focusStats.totalHours < 10 && dateRange === "week" && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="mt-0.5">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Low Focus Time
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You&apos;ve logged {focusStats.totalHours.toFixed(1)} hours of focus time this
                      week. Try to increase deep work sessions for better productivity.
                    </p>
                  </div>
                </div>
              )}

              {taskStats.overdueTasks > 5 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="mt-0.5">
                    <BarChart3 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      High Overdue Tasks
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You have {taskStats.overdueTasks} overdue tasks. Schedule time to tackle these
                      or adjust their due dates to be more realistic.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
