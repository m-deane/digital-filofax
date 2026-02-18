"use client";

import { useState } from "react";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ChevronLeft,
  ChevronRight,
  Award,
  AlertTriangle,
  BookOpen,
  Target,
  Plus,
  X,
  Loader2,
  Star,
} from "lucide-react";
import { api } from "@/lib/trpc";

export default function MonthlyReflectionPage() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [highlights, setHighlights] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState<string[]>([]);
  const [nextMonthGoals, setNextMonthGoals] = useState<string[]>([]);
  const [rating, setRating] = useState<number[]>([3]);
  const [newHighlight, setNewHighlight] = useState("");
  const [newChallenge, setNewChallenge] = useState("");
  const [newLesson, setNewLesson] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const utils = api.useUtils();
  const monthStart = startOfMonth(selectedMonth);

  const { data: reflection, isLoading } = api.reflections.getMonthlyByMonth.useQuery({
    monthOf: monthStart,
  });

  const { data: allReflections } = api.reflections.getAllMonthly.useQuery();

  const saveReflection = api.reflections.createOrUpdateMonthly.useMutation({
    onSuccess: () => {
      utils.reflections.getMonthlyByMonth.invalidate();
      utils.reflections.getAllMonthly.invalidate();
    },
  });

  // Update state when reflection data loads
  useState(() => {
    if (reflection) {
      setHighlights(reflection.highlights ?? []);
      setChallenges(reflection.challenges ?? []);
      setLessonsLearned(reflection.lessonsLearned ?? []);
      setNextMonthGoals(reflection.nextMonthGoals ?? []);
      setRating([reflection.rating ?? 3]);
    }
  });

  const handleSave = () => {
    saveReflection.mutate({
      monthOf: monthStart,
      highlights,
      challenges,
      lessonsLearned,
      nextMonthGoals,
      rating: rating[0] ?? null,
    });
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleAddChallenge = () => {
    if (newChallenge.trim()) {
      setChallenges([...challenges, newChallenge.trim()]);
      setNewChallenge("");
    }
  };

  const handleRemoveChallenge = (index: number) => {
    setChallenges(challenges.filter((_, i) => i !== index));
  };

  const handleAddLesson = () => {
    if (newLesson.trim()) {
      setLessonsLearned([...lessonsLearned, newLesson.trim()]);
      setNewLesson("");
    }
  };

  const handleRemoveLesson = (index: number) => {
    setLessonsLearned(lessonsLearned.filter((_, i) => i !== index));
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setNextMonthGoals([...nextMonthGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const handleRemoveGoal = (index: number) => {
    setNextMonthGoals(nextMonthGoals.filter((_, i) => i !== index));
  };

  const isCurrentMonth = startOfMonth(new Date()).getTime() === monthStart.getTime();
  const isFutureMonth = monthStart > startOfMonth(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Reflection</h1>
          <p className="text-muted-foreground">
            Review your progress and plan ahead
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <span className="text-lg font-semibold">
              {format(selectedMonth, "MMMM yyyy")}
            </span>
            {isCurrentMonth && <Badge>Current</Badge>}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={isFutureMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveReflection.isPending || isFutureMonth}
            className="gap-2"
          >
            {saveReflection.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Reflection
          </Button>
        </div>
      </div>

      {/* Past Reflections Summary */}
      {allReflections && allReflections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reflections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allReflections.slice(0, 6).map((r) => {
                const monthDate = new Date(r.monthOf);
                const isSelected = startOfMonth(monthDate).getTime() === monthStart.getTime();
                return (
                  <Button
                    key={r.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMonth(monthDate)}
                    className="flex-shrink-0"
                  >
                    {format(monthDate, "MMM yyyy")}
                    {r.rating && (
                      <Badge variant="secondary" className="ml-2">
                        {r.rating}/5
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isFutureMonth ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-muted-foreground">
              Cannot reflect on future months
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Month Highlights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>Month Highlights</CardTitle>
                  <CardDescription>What made this month special?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <span className="text-sm">{highlight}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveHighlight(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a highlight..."
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddHighlight()}
                />
                <Button onClick={handleAddHighlight} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle>Challenges Faced</CardTitle>
                  <CardDescription>What obstacles did you overcome?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {challenges.map((challenge, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <span className="text-sm">{challenge}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveChallenge(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a challenge..."
                  value={newChallenge}
                  onChange={(e) => setNewChallenge(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChallenge()}
                />
                <Button onClick={handleAddChallenge} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lessons Learned */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Lessons Learned</CardTitle>
                  <CardDescription>What did this month teach you?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lessonsLearned.map((lesson, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <span className="text-sm">{lesson}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveLesson(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a lesson..."
                  value={newLesson}
                  onChange={(e) => setNewLesson(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                />
                <Button onClick={handleAddLesson} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Month Goals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Goals for Next Month</CardTitle>
                  <CardDescription>What do you want to achieve?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextMonthGoals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <span className="text-sm">{goal}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveGoal(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                />
                <Button onClick={handleAddGoal} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <CardTitle>Overall Month Rating</CardTitle>
              </div>
              <CardDescription>How would you rate this month?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={rating}
                onValueChange={setRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Poor</span>
                <span className="text-lg font-semibold text-foreground">
                  {rating[0]} / 5
                </span>
                <span>Excellent</span>
              </div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < (rating[0] ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
