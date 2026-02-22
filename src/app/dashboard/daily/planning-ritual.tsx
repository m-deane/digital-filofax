"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Sunrise,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

interface PlanningRitualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
}

const STEPS = [
  { id: 1, label: "Yesterday", icon: RotateCcw },
  { id: 2, label: "Today's Calendar", icon: Calendar },
  { id: 3, label: "Priorities", icon: Star },
  { id: 4, label: "Intention", icon: BookOpen },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case "URGENT": return "text-red-500";
    case "HIGH": return "text-orange-500";
    case "MEDIUM": return "text-yellow-500";
    default: return "text-gray-400";
  }
}

export function PlanningRitualDialog({ open, onOpenChange, date }: PlanningRitualDialogProps) {
  const [step, setStep] = useState(1);
  const [carryForwardIds, setCarryForwardIds] = useState<Set<string>>(new Set());
  const [selectedPriorityIds, setSelectedPriorityIds] = useState<Set<string>>(new Set());
  const [intention, setIntention] = useState("");

  const utils = api.useUtils();

  const { data: unfinished = [], isLoading: unfinishedLoading } =
    api.tasks.getYesterdaysUnfinished.useQuery(undefined, { enabled: open });

  const { data: dailyView, isLoading: dailyLoading } =
    api.daily.getDailyView.useQuery({ date }, { enabled: open });

  const updateDueDate = api.tasks.update.useMutation();
  const setDailyPriorities = api.daily.setDailyPriorities.useMutation({
    onSuccess: () => utils.daily.getDailyView.invalidate(),
  });
  const createMemo = api.memos.create.useMutation();

  const allTasks = dailyView
    ? [...(dailyView.priorityTasks ?? []), ...(dailyView.unscheduledTasks ?? [])]
    : [];
  const uniqueTasks = Array.from(new Map(allTasks.map((t) => [t.id, t])).values());

  const toggleCarryForward = (id: string) => {
    setCarryForwardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const togglePriority = (id: string) => {
    setSelectedPriorityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const handleFinish = async () => {
    const today = new Date();

    // Carry forward selected tasks to today
    if (carryForwardIds.size > 0) {
      const carryDate = new Date(today);
      carryDate.setHours(0, 0, 0, 0);
      await Promise.all(
        Array.from(carryForwardIds).map((taskId) =>
          updateDueDate.mutateAsync({ id: taskId, dueDate: carryDate })
        )
      );
    }

    // Set daily priorities
    if (selectedPriorityIds.size > 0) {
      await setDailyPriorities.mutateAsync({
        taskIds: Array.from(selectedPriorityIds),
      });
    }

    // Save intention as a journal memo
    if (intention.trim()) {
      await createMemo.mutateAsync({
        title: `Daily intention — ${format(date, "EEEE, MMMM d")}`,
        content: intention.trim(),
        memoType: "JOURNAL",
      });
    }

    utils.tasks.getAll.invalidate();
    utils.daily.getDailyView.invalidate();
    onOpenChange(false);
    setStep(1);
    setCarryForwardIds(new Set());
    setSelectedPriorityIds(new Set());
    setIntention("");
  };

  const isFinalising =
    updateDueDate.isPending || setDailyPriorities.isPending || createMemo.isPending;

  const canGoNext = step < 4;
  const canFinish = step === 4;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" />
            Morning Planning Ritual
          </DialogTitle>
          <DialogDescription>
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        {/* Step progress */}
        <div className="flex items-center gap-1">
          {STEPS.map(({ id, label, icon: Icon }) => (
            <div key={id} className="flex items-center gap-1 flex-1">
              <button
                className={cn(
                  "flex items-center gap-1.5 text-xs rounded px-2 py-1 transition-colors w-full",
                  step === id
                    ? "bg-primary text-primary-foreground font-medium"
                    : step > id
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                )}
                onClick={() => step > id && setStep(id)}
              >
                {step > id ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{label}</span>
              </button>
              {id < 4 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Yesterday's unfinished */}
        {step === 1 && (
          <div className="space-y-3 min-h-[200px]">
            <p className="text-sm text-muted-foreground">
              Check off tasks you want to carry forward to today.
            </p>
            {unfinishedLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : unfinished.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="text-sm">Clean slate — nothing left from yesterday!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unfinished.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer",
                      carryForwardIds.has(task.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                    onClick={() => toggleCarryForward(task.id)}
                  >
                    <Checkbox
                      checked={carryForwardIds.has(task.id)}
                      onCheckedChange={() => toggleCarryForward(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      {task.category && (
                        <p className="text-xs text-muted-foreground">{task.category.name}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Today's calendar */}
        {step === 2 && (
          <div className="space-y-3 min-h-[200px]">
            <p className="text-sm text-muted-foreground">
              Review what&apos;s already scheduled for today.
            </p>
            {dailyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (dailyView?.events ?? []).length === 0 && (dailyView?.scheduledTasks ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Calendar className="h-8 w-8" />
                <p className="text-sm">No events or scheduled tasks today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(dailyView?.events ?? []).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <div
                      className="w-2 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color || "#6366f1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.startDate), "h:mm a")} – {format(new Date(event.endDate), "h:mm a")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Event</Badge>
                  </div>
                ))}
                {(dailyView?.scheduledTasks ?? []).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <div
                      className="w-2 h-8 rounded-full flex-shrink-0 bg-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      {task.scheduledStart && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.scheduledStart), "h:mm a")}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">Task</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pick 3 priorities */}
        {step === 3 && (
          <div className="space-y-3 min-h-[200px]">
            <p className="text-sm text-muted-foreground">
              Select up to <strong>3 tasks</strong> as your top priorities for today.{" "}
              <span className="text-primary font-medium">{selectedPriorityIds.size}/3 selected</span>
            </p>
            {dailyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : uniqueTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Star className="h-8 w-8" />
                <p className="text-sm">No tasks yet — add some from the Daily Planner.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {uniqueTasks.map((task) => {
                  const isSelected = selectedPriorityIds.has(task.id);
                  const isDisabled = !isSelected && selectedPriorityIds.size >= 3;
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "",
                        isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"
                      )}
                      onClick={() => !isDisabled && togglePriority(task.id)}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isSelected ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.title}</p>
                        {task.category && (
                          <p className="text-xs text-muted-foreground">{task.category.name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Daily intention */}
        {step === 4 && (
          <div className="space-y-3 min-h-[200px]">
            <p className="text-sm text-muted-foreground">
              Set an intention for the day. This will be saved as a journal entry.
            </p>
            <Textarea
              placeholder="Today I want to focus on… / I will feel successful if… / One thing I'm grateful for…"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              rows={5}
              className="resize-none"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
          >
            {step > 1 ? <ChevronLeft className="h-4 w-4 mr-1" /> : null}
            {step > 1 ? "Back" : "Skip"}
          </Button>
          {canGoNext && (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {canFinish && (
            <Button onClick={handleFinish} disabled={isFinalising}>
              {isFinalising && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start My Day
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
