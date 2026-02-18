"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Coffee, Timer } from "lucide-react";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type SessionType = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export function FocusTimerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionType, setSessionType] = useState<SessionType>("WORK");
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { data: settings } = api.focus.getSettings.useQuery();
  const { data: todayStats } = api.focus.getTodayStats.useQuery();
  const utils = api.useUtils();

  const startSession = api.focus.startSession.useMutation({
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
    },
  });

  const completeSession = api.focus.completeSession.useMutation({
    onSuccess: () => {
      utils.focus.getTodayStats.invalidate();
      setCurrentSessionId(null);
    },
  });

  const workMinutes = settings?.workMinutes ?? 25;
  const shortBreakMinutes = settings?.shortBreakMinutes ?? 5;
  const longBreakMinutes = settings?.longBreakMinutes ?? 15;
  const sessionsUntilLong = settings?.sessionsUntilLong ?? 4;

  const getDuration = useCallback(
    (type: SessionType) => {
      switch (type) {
        case "WORK":
          return workMinutes * 60;
        case "SHORT_BREAK":
          return shortBreakMinutes * 60;
        case "LONG_BREAK":
          return longBreakMinutes * 60;
      }
    },
    [workMinutes, shortBreakMinutes, longBreakMinutes]
  );

  useEffect(() => {
    setTimeLeft(getDuration(sessionType));
  }, [sessionType, getDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Session completed
      setIsRunning(false);

      if (currentSessionId) {
        completeSession.mutate({ sessionId: currentSessionId });
      }

      if (sessionType === "WORK") {
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);

        // Switch to break
        if (newCompletedSessions % sessionsUntilLong === 0) {
          setSessionType("LONG_BREAK");
        } else {
          setSessionType("SHORT_BREAK");
        }
      } else {
        // After break, go back to work
        setSessionType("WORK");
      }
    }

    return () => clearInterval(interval);
  }, [
    isRunning,
    timeLeft,
    sessionType,
    completedSessions,
    sessionsUntilLong,
    currentSessionId,
    completeSession,
  ]);

  const toggleTimer = () => {
    if (!isRunning && sessionType === "WORK" && !currentSessionId) {
      startSession.mutate({
        type: sessionType,
        duration: workMinutes,
      });
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(sessionType));
    setCurrentSessionId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((getDuration(sessionType) - timeLeft) / getDuration(sessionType)) * 100;

  const getSessionColor = () => {
    switch (sessionType) {
      case "WORK":
        return "text-red-500";
      case "SHORT_BREAK":
        return "text-green-500";
      case "LONG_BREAK":
        return "text-blue-500";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Focus Timer
          </div>
          <Badge variant="outline" className="font-normal">
            {todayStats?.totalSessions ?? 0} sessions today
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Type Indicator */}
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant={sessionType === "WORK" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => !isRunning && setSessionType("WORK")}
          >
            Work
          </Badge>
          <Badge
            variant={sessionType === "SHORT_BREAK" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => !isRunning && setSessionType("SHORT_BREAK")}
          >
            <Coffee className="h-3 w-3 mr-1" />
            Short
          </Badge>
          <Badge
            variant={sessionType === "LONG_BREAK" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => !isRunning && setSessionType("LONG_BREAK")}
          >
            <Coffee className="h-3 w-3 mr-1" />
            Long
          </Badge>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "text-5xl font-bold tabular-nums tracking-tight",
              getSessionColor()
            )}
          >
            {formatTime(timeLeft)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {sessionType === "WORK" ? "Focus time" : "Break time"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-1000",
              sessionType === "WORK"
                ? "bg-red-500"
                : sessionType === "SHORT_BREAK"
                ? "bg-green-500"
                : "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            disabled={!isRunning && timeLeft === getDuration(sessionType)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className={cn(
              "w-24",
              isRunning ? "bg-yellow-500 hover:bg-yellow-600" : ""
            )}
            onClick={toggleTimer}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Session Progress Dots */}
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: sessionsUntilLong }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full",
                i < completedSessions % sessionsUntilLong
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {completedSessions % sessionsUntilLong}/{sessionsUntilLong} until long break
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
