"use client";

import React, { useEffect, useState } from "react";
import { Flame, Award, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakStat {
  habitId: string;
  habitName: string;
  color: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

interface StreakDisplayProps {
  stats: StreakStat[];
  className?: string;
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }): React.JSX.Element {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * value);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

export function StreakDisplay({ stats, className }: StreakDisplayProps) {
  // Calculate aggregate stats
  const maxCurrentStreak = stats.length > 0 ? Math.max(...stats.map((s) => s.currentStreak)) : 0;
  const maxLongestStreak = stats.length > 0 ? Math.max(...stats.map((s) => s.longestStreak)) : 0;
  const totalCompletions = stats.reduce((sum, stat) => sum + stat.totalCompletions, 0);

  // Find habit with best current streak
  const bestStreakHabit = stats.length > 0
    ? stats.reduce((best, current) => (current.currentStreak > best.currentStreak ? current : best))
    : null;

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
      {/* Current Streak */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="p-3 rounded-full bg-orange-500/10">
          <Flame className="h-6 w-6 text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold">
            <AnimatedCounter value={maxCurrentStreak} />
            <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
          </div>
          <p className="text-sm text-muted-foreground">Best Current Streak</p>
          {bestStreakHabit && bestStreakHabit.currentStreak > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {bestStreakHabit.habitName}
            </p>
          )}
        </div>
      </div>

      {/* Longest Streak */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="p-3 rounded-full bg-purple-500/10">
          <Award className="h-6 w-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold">
            <AnimatedCounter value={maxLongestStreak} />
            <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
          </div>
          <p className="text-sm text-muted-foreground">Longest Streak Ever</p>
        </div>
      </div>

      {/* Total Completions */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="p-3 rounded-full bg-green-500/10">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold">
            <AnimatedCounter value={totalCompletions} duration={1500} />
          </div>
          <p className="text-sm text-muted-foreground">Total Completions</p>
          {stats.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.length} {stats.length === 1 ? "habit" : "habits"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
