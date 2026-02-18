"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sunrise,
  Sunset,
  Sparkles,
  TrendingDown,
  Target,
  Calendar as CalendarIcon,
  Loader2,
  Plus,
  X,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

export default function DailyReflectionPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [morningIntention, setMorningIntention] = useState("");
  const [eveningReflection, setEveningReflection] = useState("");
  const [wins, setWins] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [tomorrowFocus, setTomorrowFocus] = useState("");
  const [energyLevel, setEnergyLevel] = useState<number[]>([3]);
  const [productivityRating, setProductivityRating] = useState<number[]>([3]);
  const [newWin, setNewWin] = useState("");
  const [newImprovement, setNewImprovement] = useState("");

  const utils = api.useUtils();
  const dateOnly = startOfDay(selectedDate);

  const { data: reflection, isLoading } = api.reflections.getDailyByDate.useQuery({
    date: dateOnly,
  });

  const { data: morningPrompts } = api.reflections.getRandomPrompts.useQuery({
    type: "morning",
    count: 1,
  });

  const { data: eveningPrompts } = api.reflections.getRandomPrompts.useQuery({
    type: "evening",
    count: 1,
  });

  const saveReflection = api.reflections.createOrUpdateDaily.useMutation({
    onSuccess: () => {
      utils.reflections.getDailyByDate.invalidate();
      utils.reflections.getReflectionStreaks.invalidate();
    },
  });

  const { data: streaks } = api.reflections.getReflectionStreaks.useQuery();

  // Update state when reflection data loads
  useState(() => {
    if (reflection) {
      setMorningIntention(reflection.morningIntention ?? "");
      setEveningReflection(reflection.eveningReflection ?? "");
      setWins(reflection.wins ?? []);
      setImprovements(reflection.improvements ?? []);
      setTomorrowFocus(reflection.tomorrowFocus ?? "");
      setEnergyLevel([reflection.energyLevel ?? 3]);
      setProductivityRating([reflection.productivityRating ?? 3]);
    }
  });

  const handleSave = () => {
    saveReflection.mutate({
      date: dateOnly,
      morningIntention: morningIntention || null,
      eveningReflection: eveningReflection || null,
      wins,
      improvements,
      tomorrowFocus: tomorrowFocus || null,
      energyLevel: energyLevel[0] ?? null,
      productivityRating: productivityRating[0] ?? null,
    });
  };

  const handleAddWin = () => {
    if (newWin.trim()) {
      setWins([...wins, newWin.trim()]);
      setNewWin("");
    }
  };

  const handleRemoveWin = (index: number) => {
    setWins(wins.filter((_, i) => i !== index));
  };

  const handleAddImprovement = () => {
    if (newImprovement.trim()) {
      setImprovements([...improvements, newImprovement.trim()]);
      setNewImprovement("");
    }
  };

  const handleRemoveImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  const isToday = startOfDay(new Date()).getTime() === dateOnly.getTime();
  const isPast = dateOnly < startOfDay(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Reflection</h1>
          <p className="text-muted-foreground">
            Take a moment to reflect on your day
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={handleSave}
            disabled={saveReflection.isPending}
            className="gap-2"
          >
            {saveReflection.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Reflection
          </Button>
        </div>
      </div>

      {/* Streak Stats */}
      {streaks && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{streaks.currentStreak} days</p>
                </div>
                <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                  <Sparkles className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{streaks.completionRate}%</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reflections</p>
                  <p className="text-2xl font-bold">{streaks.totalReflections}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Morning Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                    <Sunrise className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle>Morning Intention</CardTitle>
                    <CardDescription>Start your day with purpose</CardDescription>
                  </div>
                </div>
                {!isToday && isPast && <Badge variant="secondary">Past</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {morningPrompts && morningPrompts[0] && (
                <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground italic">
                    {morningPrompts[0]}
                  </p>
                </div>
              )}
              <Textarea
                placeholder="What is your intention for today?"
                value={morningIntention}
                onChange={(e) => setMorningIntention(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Evening Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
                    <Sunset className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Evening Reflection</CardTitle>
                    <CardDescription>Review your day</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {eveningPrompts && eveningPrompts[0] && (
                <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground italic">
                    {eveningPrompts[0]}
                  </p>
                </div>
              )}
              <Textarea
                placeholder="How did your day go? What did you learn?"
                value={eveningReflection}
                onChange={(e) => setEveningReflection(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Wins */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <CardTitle>Today&apos;s Wins</CardTitle>
              </div>
              <CardDescription>Celebrate your accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {wins.map((win, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <span className="text-sm">{win}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveWin(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a win..."
                  value={newWin}
                  onChange={(e) => setNewWin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWin()}
                />
                <Button onClick={handleAddWin} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                <CardTitle>Areas for Improvement</CardTitle>
              </div>
              <CardDescription>Opportunities to grow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {improvements.map((improvement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <span className="text-sm">{improvement}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveImprovement(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add an improvement..."
                  value={newImprovement}
                  onChange={(e) => setNewImprovement(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddImprovement()}
                />
                <Button onClick={handleAddImprovement} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tomorrow Focus */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <CardTitle>Tomorrow&apos;s Focus</CardTitle>
              </div>
              <CardDescription>Plan for success</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What will you focus on tomorrow?"
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Energy & Productivity */}
          <Card>
            <CardHeader>
              <CardTitle>Energy Level</CardTitle>
              <CardDescription>How energized did you feel?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={energyLevel}
                onValueChange={setEnergyLevel}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span className="text-base font-semibold text-foreground">
                  {energyLevel[0]} / 5
                </span>
                <span>High</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productivity Rating</CardTitle>
              <CardDescription>How productive were you?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={productivityRating}
                onValueChange={setProductivityRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span className="text-base font-semibold text-foreground">
                  {productivityRating[0]} / 5
                </span>
                <span>High</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
