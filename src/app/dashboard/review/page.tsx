"use client";

import { useState } from "react";
import { startOfWeek, format, subWeeks, addWeeks } from "date-fns";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  Sparkles,
  Save,
  Send,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WIZARD_STEPS = [
  { id: "accomplishments", title: "Accomplishments", icon: CheckCircle2 },
  { id: "wins", title: "What Went Well", icon: Sparkles },
  { id: "challenges", title: "Challenges", icon: AlertCircle },
  { id: "lessons", title: "Lessons Learned", icon: Lightbulb },
  { id: "rating", title: "Rate Your Week", icon: Star },
  { id: "focus", title: "Next Week Focus", icon: Target },
  { id: "gratitude", title: "Gratitude", icon: Sparkles },
];

export default function WeeklyReviewPage() {
  const [selectedWeek, setSelectedWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("new");

  // Form state
  const [wins, setWins] = useState<string[]>([""]);
  const [challenges, setChallenges] = useState<string[]>([""]);
  const [lessonsLearned, setLessonsLearned] = useState<string[]>([""]);
  const [nextWeekFocus, setNextWeekFocus] = useState<string[]>([""]);
  const [gratitudes, setGratitudes] = useState<string[]>(["", "", ""]);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");

  const utils = api.useUtils();

  // Queries
  const { data: existingReview } =
    api.review.getByWeek.useQuery({ weekOf: selectedWeek });

  const { data: weekSummary, isLoading: summaryLoading } =
    api.review.getWeeklySummary.useQuery({ weekOf: selectedWeek });

  const { data: recentReviews } = api.review.getRecent.useQuery({ limit: 10 });

  const { data: stats } = api.review.getStats.useQuery();

  // Mutations
  const createReview = api.review.create.useMutation({
    onSuccess: () => {
      utils.review.getByWeek.invalidate();
      utils.review.getRecent.invalidate();
      utils.review.getStats.invalidate();
      setActiveTab("history");
    },
  });

  const updateReview = api.review.update.useMutation({
    onSuccess: () => {
      utils.review.getByWeek.invalidate();
      utils.review.getRecent.invalidate();
      utils.review.getStats.invalidate();
    },
  });

  // Load existing review into form
  const loadReview = (review: typeof existingReview) => {
    if (review) {
      setWins(review.wins.length > 0 ? review.wins : [""]);
      setChallenges(review.challenges.length > 0 ? review.challenges : [""]);
      setLessonsLearned(review.lessonsLearned.length > 0 ? review.lessonsLearned : [""]);
      setNextWeekFocus(review.nextWeekFocus.length > 0 ? review.nextWeekFocus : [""]);
      setGratitudes(review.gratitudes.length > 0 ? review.gratitudes : ["", "", ""]);
      setRating(review.rating);
      setNotes(review.notes ?? "");
    }
  };

  const handleSaveDraft = () => {
    const data = {
      weekOf: selectedWeek,
      wins: wins.filter((w) => w.trim()),
      challenges: challenges.filter((c) => c.trim()),
      lessonsLearned: lessonsLearned.filter((l) => l.trim()),
      nextWeekFocus: nextWeekFocus.filter((f) => f.trim()),
      gratitudes: gratitudes.filter((g) => g.trim()),
      rating,
      notes,
      isDraft: true,
    };

    if (existingReview) {
      updateReview.mutate({ id: existingReview.id, ...data });
    } else {
      createReview.mutate(data);
    }
  };

  const handleComplete = () => {
    const data = {
      weekOf: selectedWeek,
      wins: wins.filter((w) => w.trim()),
      challenges: challenges.filter((c) => c.trim()),
      lessonsLearned: lessonsLearned.filter((l) => l.trim()),
      nextWeekFocus: nextWeekFocus.filter((f) => f.trim()),
      gratitudes: gratitudes.filter((g) => g.trim()),
      rating,
      notes,
      isDraft: false,
    };

    if (existingReview) {
      updateReview.mutate({ id: existingReview.id, ...data, isDraft: false });
    } else {
      createReview.mutate(data);
    }
  };

  const addItem = (
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setItems([...items, ""]);
  };

  const updateItem = (
    index: number,
    value: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const removeItem = (
    index: number,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const renderStep = () => {
    const step = WIZARD_STEPS[currentStep];

    switch (step.id) {
      case "accomplishments":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                This Week&apos;s Accomplishments
              </h3>
              <p className="text-sm text-muted-foreground">
                Review what you completed this week before reflecting
              </p>
            </div>

            {summaryLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Completed Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weekSummary?.completedTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No tasks completed this week
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {weekSummary?.completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                            <div>
                              <div>{task.title}</div>
                              {task.category && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {task.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Habit Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Average Completion Rate</span>
                        <span className="font-semibold">
                          {weekSummary?.avgHabitCompletion}%
                        </span>
                      </div>
                      {weekSummary?.habitStats.map((habit) => (
                        <div key={habit.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{habit.name}</span>
                            <span className="text-muted-foreground">
                              {habit.completedDays}/{habit.targetDays} days
                            </span>
                          </div>
                          <Progress value={habit.completionRate} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      case "wins":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">What Went Well?</h3>
              <p className="text-sm text-muted-foreground">
                Celebrate your wins, big or small
              </p>
            </div>
            {wins.map((win, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="What went well this week?"
                  value={win}
                  onChange={(e) => updateItem(index, e.target.value, wins, setWins)}
                />
                {wins.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index, wins, setWins)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(wins, setWins)}
            >
              + Add Another Win
            </Button>
          </div>
        );

      case "challenges":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Challenges Faced</h3>
              <p className="text-sm text-muted-foreground">
                What obstacles or difficulties did you encounter?
              </p>
            </div>
            {challenges.map((challenge, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="What challenged you this week?"
                  value={challenge}
                  onChange={(e) =>
                    updateItem(index, e.target.value, challenges, setChallenges)
                  }
                />
                {challenges.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index, challenges, setChallenges)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(challenges, setChallenges)}
            >
              + Add Another Challenge
            </Button>
          </div>
        );

      case "lessons":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Lessons Learned</h3>
              <p className="text-sm text-muted-foreground">
                What insights or lessons did you gain?
              </p>
            </div>
            {lessonsLearned.map((lesson, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="What did you learn this week?"
                  value={lesson}
                  onChange={(e) =>
                    updateItem(index, e.target.value, lessonsLearned, setLessonsLearned)
                  }
                />
                {lessonsLearned.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index, lessonsLearned, setLessonsLearned)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(lessonsLearned, setLessonsLearned)}
            >
              + Add Another Lesson
            </Button>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Rate Your Week</h3>
              <p className="text-sm text-muted-foreground">
                How would you rate this week overall?
              </p>
            </div>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`h-12 w-12 ${
                      value <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{rating}/5</p>
            </div>

            <div className="mt-8">
              <label className="text-sm font-medium mb-2 block">
                Additional Notes (Optional)
              </label>
              <Textarea
                placeholder="Any additional thoughts about your week?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        );

      case "focus":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Next Week&apos;s Focus Areas
              </h3>
              <p className="text-sm text-muted-foreground">
                What do you want to focus on next week?
              </p>
            </div>
            {nextWeekFocus.map((focus, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Focus area for next week"
                  value={focus}
                  onChange={(e) =>
                    updateItem(index, e.target.value, nextWeekFocus, setNextWeekFocus)
                  }
                />
                {nextWeekFocus.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index, nextWeekFocus, setNextWeekFocus)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(nextWeekFocus, setNextWeekFocus)}
            >
              + Add Another Focus Area
            </Button>
          </div>
        );

      case "gratitude":
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Gratitude Moment</h3>
              <p className="text-sm text-muted-foreground">
                What are you grateful for this week?
              </p>
            </div>
            {gratitudes.map((gratitude, index) => (
              <div key={index}>
                <Input
                  placeholder={`Gratitude #${index + 1}`}
                  value={gratitude}
                  onChange={(e) =>
                    updateItem(index, e.target.value, gratitudes, setGratitudes)
                  }
                />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Weekly Review</h1>
        <p className="text-muted-foreground">
          Reflect on your week and plan ahead
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">New Review</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          {/* Week Selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <CardTitle>
                    {format(selectedWeek, "MMMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>
                    Week of {format(selectedWeek, "MMM d")} -{" "}
                    {format(addWeeks(selectedWeek, 1), "MMM d")}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
                  disabled={selectedWeek >= startOfWeek(new Date(), { weekStartsOn: 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {existingReview && !existingReview.isDraft && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">
                  Review Completed
                </CardTitle>
                <CardDescription>
                  You completed this review on{" "}
                  {existingReview.completedAt &&
                    format(existingReview.completedAt, "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => loadReview(existingReview)}>
                  View/Edit Review
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Wizard Progress */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <Progress
                  value={((currentStep + 1) / WIZARD_STEPS.length) * 100}
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Step {currentStep + 1} of {WIZARD_STEPS.length}
                  </span>
                  <span>{WIZARD_STEPS[currentStep].title}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-h-[400px]">{renderStep()}</CardContent>
            <div className="border-t p-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button onClick={() => setCurrentStep(currentStep + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete}>
                    <Send className="h-4 w-4 mr-2" />
                    Complete Review
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {recentReviews?.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {format(review.weekOf, "MMMM d, yyyy")}
                    </CardTitle>
                    <CardDescription>
                      {review.isDraft ? "Draft" : "Completed"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.wins.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Wins</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {review.wins.map((win, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {win}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {review.gratitudes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Gratitudes</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {review.gratitudes.map((g, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Reviews</CardDescription>
                <CardTitle className="text-3xl">
                  {stats?.totalReviews ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Rating</CardDescription>
                <CardTitle className="text-3xl">
                  {stats?.avgRating ?? 0}/5
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Streak</CardDescription>
                <CardTitle className="text-3xl">
                  {stats?.currentStreak ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completion Rate</CardDescription>
                <CardTitle className="text-3xl">
                  {stats?.completionRate ?? 0}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {stats && stats.ratingsTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rating Trend (Last 12 Weeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {stats.ratingsTrend.map((trend, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${(trend.rating / 5) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {format(trend.weekOf, "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
