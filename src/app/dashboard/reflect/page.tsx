"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/trpc";
import Link from "next/link";
import { format, subDays, startOfDay } from "date-fns";
import { useMemo } from "react";

export default function ReflectPage() {
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    return { startDate: subDays(today, 7), endDate: today };
  }, []);

  const { data: streaks, isLoading: streaksLoading } = api.reflections.getReflectionStreaks.useQuery();
  const { data: recentDaily, isLoading: dailyLoading } = api.reflections.getDailyRange.useQuery(dateRange);
  const { data: recentMonthly, isLoading: monthlyLoading } = api.reflections.getAllMonthly.useQuery({
    limit: 3,
  });

  const isLoading = streaksLoading || dailyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reflections</h1>
        <p className="text-muted-foreground">
          Capture your thoughts, track your progress, and grow through self-reflection
        </p>
      </div>

      {/* Stats Cards */}
      {streaks && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streaks.totalReflections}</p>
                  <p className="text-xs text-muted-foreground">Total Reflections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streaks.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streaks.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate (30d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Reflections */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Daily Reflections</CardTitle>
                  <CardDescription>Morning intentions, evening reflections, and daily wins</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recent Daily Stats */}
            {recentDaily && recentDaily.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recent entries (7 days)</span>
                  <Badge variant="secondary">{recentDaily.length}</Badge>
                </div>
                <div className="space-y-1">
                  {recentDaily.slice(0, 3).map((reflection) => (
                    <div
                      key={reflection.id}
                      className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                    >
                      <span className="font-medium">
                        {format(new Date(reflection.date), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-2">
                        {reflection.morningIntention && (
                          <Badge variant="outline" className="text-xs">
                            Morning
                          </Badge>
                        )}
                        {reflection.eveningReflection && (
                          <Badge variant="outline" className="text-xs">
                            Evening
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentDaily && recentDaily.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No daily reflections yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start your reflection journey today</p>
              </div>
            )}

            <Link href="/dashboard/reflect/daily">
              <Button className="w-full gap-2">
                View Daily Reflections
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Monthly Reflections */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Monthly Reflections</CardTitle>
                  <CardDescription>Monthly highlights, challenges, and lessons learned</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recent Monthly Stats */}
            {recentMonthly && recentMonthly.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recent months</span>
                  <Badge variant="secondary">{recentMonthly.length}</Badge>
                </div>
                <div className="space-y-1">
                  {recentMonthly.map((reflection) => (
                    <div
                      key={reflection.id}
                      className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                    >
                      <span className="font-medium">
                        {format(new Date(reflection.monthOf), "MMMM yyyy")}
                      </span>
                      {reflection.rating && (
                        <Badge variant="outline" className="text-xs">
                          {reflection.rating}/5
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentMonthly && recentMonthly.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No monthly reflections yet</p>
                <p className="text-xs text-muted-foreground mt-1">Review your month and capture key insights</p>
              </div>
            )}

            <Link href="/dashboard/reflect/monthly">
              <Button className="w-full gap-2">
                View Monthly Reflections
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Build a Reflection Practice</h3>
              <p className="text-sm text-muted-foreground">
                Regular reflection helps you learn from experiences, track your growth, and make intentional
                progress toward your goals. Start with daily morning intentions and evening reflections, then
                add monthly reviews to see the bigger picture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
