"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sunrise, Sunset, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc";

export function ReflectionWidget() {
  const [morningIntention, setMorningIntention] = useState("");
  const [eveningReflection, setEveningReflection] = useState("");

  const today = startOfDay(new Date());
  const utils = api.useUtils();

  const { data: reflection, isLoading } = api.reflections.getDailyByDate.useQuery({
    date: today,
  });

  const { data: streaks } = api.reflections.getReflectionStreaks.useQuery();

  const saveReflection = api.reflections.createOrUpdateDaily.useMutation({
    onSuccess: () => {
      utils.reflections.getDailyByDate.invalidate();
      utils.reflections.getReflectionStreaks.invalidate();
    },
  });

  const handleQuickSave = (type: "morning" | "evening") => {
    if (type === "morning" && morningIntention.trim()) {
      saveReflection.mutate({
        date: today,
        morningIntention: morningIntention.trim(),
      });
      setMorningIntention("");
    } else if (type === "evening" && eveningReflection.trim()) {
      saveReflection.mutate({
        date: today,
        eveningReflection: eveningReflection.trim(),
      });
      setEveningReflection("");
    }
  };

  const currentHour = new Date().getHours();
  const isMorning = currentHour < 12;
  const isEvening = currentHour >= 17;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Daily Reflection</CardTitle>
              <CardDescription>{format(new Date(), "EEEE, MMMM d")}</CardDescription>
            </div>
          </div>
          {streaks && streaks.currentStreak > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {streaks.currentStreak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Morning Section */}
            {(isMorning || !reflection?.morningIntention) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-amber-100 p-1.5 dark:bg-amber-900">
                    <Sunrise className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium">Morning Intention</span>
                </div>
                {reflection?.morningIntention ? (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm">{reflection.morningIntention}</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="What is your intention for today?"
                      value={morningIntention}
                      onChange={(e) => setMorningIntention(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleQuickSave("morning")}
                      disabled={!morningIntention.trim() || saveReflection.isPending}
                      className="w-full"
                    >
                      {saveReflection.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                      Set Intention
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Evening Section */}
            {(isEvening || reflection?.eveningReflection) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-indigo-100 p-1.5 dark:bg-indigo-900">
                    <Sunset className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium">Evening Reflection</span>
                </div>
                {reflection?.eveningReflection ? (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm">{reflection.eveningReflection}</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="How did your day go?"
                      value={eveningReflection}
                      onChange={(e) => setEveningReflection(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleQuickSave("evening")}
                      disabled={!eveningReflection.trim() || saveReflection.isPending}
                      className="w-full"
                    >
                      {saveReflection.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                      Save Reflection
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Stats */}
            {streaks && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Completion: </span>
                  <span className="font-semibold">{streaks.completionRate}%</span>
                </div>
                <Link href="/dashboard/reflect/daily">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Full Reflection
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
