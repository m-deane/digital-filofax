"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Heart, Smile, Meh, Frown, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { api } from "@/lib/trpc";
import type { MoodLevel } from "@prisma/client";

const MOOD_CONFIG: Record<MoodLevel, { icon: typeof Smile; color: string; label: string }> = {
  GREAT: { icon: Smile, color: "text-green-500", label: "Great" },
  GOOD: { icon: Smile, color: "text-blue-500", label: "Good" },
  OKAY: { icon: Meh, color: "text-yellow-500", label: "Okay" },
  LOW: { icon: Frown, color: "text-orange-500", label: "Low" },
  BAD: { icon: Frown, color: "text-red-500", label: "Bad" },
};

export default function JournalPage() {
  const utils = api.useUtils();
  const { data: todayJournal, isLoading } = api.journal.getTodayJournal.useQuery();
  const { data: stats } = api.journal.getStats.useQuery({ days: 7 });

  const [gratitudeInputs, setGratitudeInputs] = useState<string[]>(
    todayJournal?.gratitude?.entries ?? ["", "", ""]
  );
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(
    todayJournal?.mood?.mood ?? null
  );
  const [energyLevel, setEnergyLevel] = useState<number>(todayJournal?.mood?.energyLevel ?? 3);
  const [moodNotes, setMoodNotes] = useState<string>(todayJournal?.mood?.notes ?? "");

  const createGratitude = api.journal.createOrUpdateGratitude.useMutation({
    onSuccess: () => {
      utils.journal.getTodayJournal.invalidate();
      utils.journal.getStats.invalidate();
    },
  });

  const createMood = api.journal.createOrUpdateMood.useMutation({
    onSuccess: () => {
      utils.journal.getTodayJournal.invalidate();
      utils.journal.getStats.invalidate();
    },
  });

  const handleGratitudeChange = (index: number, value: string) => {
    const newInputs = [...gratitudeInputs];
    newInputs[index] = value;
    setGratitudeInputs(newInputs);
  };

  const handleSaveGratitude = () => {
    const validEntries = gratitudeInputs.filter((e) => e.trim().length > 0);
    if (validEntries.length === 3) {
      createGratitude.mutate({ entries: validEntries });
    }
  };

  const handleSaveMood = () => {
    if (selectedMood) {
      createMood.mutate({
        mood: selectedMood,
        energyLevel,
        notes: moodNotes,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        <p className="text-muted-foreground">Track your daily gratitude and mood</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.gratitudeStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageEnergy.toFixed(1)}/5</p>
                  <p className="text-xs text-muted-foreground">Avg Energy (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.gratitudeCount}</p>
                  <p className="text-xs text-muted-foreground">Entries (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gratitude Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Today&apos;s Gratitude
          </CardTitle>
          <CardDescription>What are you grateful for today?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium">#{index + 1}</label>
              <Input
                placeholder={`I'm grateful for...`}
                value={gratitudeInputs[index] ?? ""}
                onChange={(e) => handleGratitudeChange(index, e.target.value)}
                maxLength={500}
              />
            </div>
          ))}
          <Button
            onClick={handleSaveGratitude}
            disabled={gratitudeInputs.filter((e) => e.trim()).length !== 3 || createGratitude.isPending}
            className="w-full"
          >
            {createGratitude.isPending ? "Saving..." : "Save Gratitude"}
          </Button>
        </CardContent>
      </Card>

      {/* Mood Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-blue-500" />
            Today&apos;s Mood
          </CardTitle>
          <CardDescription>How are you feeling today?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selector */}
          <div>
            <label className="text-sm font-medium mb-3 block">Select your mood</label>
            <div className="flex gap-3">
              {(Object.entries(MOOD_CONFIG) as [MoodLevel, typeof MOOD_CONFIG[MoodLevel]][]).map(
                ([mood, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(mood)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        selectedMood === mood
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${config.color}`} />
                      <p className="text-xs font-medium">{config.label}</p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <label className="text-sm font-medium mb-3 block">Energy level: {energyLevel}/5</label>
            <Slider
              value={[energyLevel]}
              onValueChange={([value]) => setEnergyLevel(value ?? 3)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
            <Textarea
              placeholder="Any additional thoughts..."
              value={moodNotes}
              onChange={(e) => setMoodNotes(e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveMood}
            disabled={!selectedMood || createMood.isPending}
            className="w-full"
          >
            {createMood.isPending ? "Saving..." : "Save Mood"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
