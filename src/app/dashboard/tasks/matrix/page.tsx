"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { isOverdue, isDueToday, isDueSoon, getPriorityColor } from "@/lib/urgency";
import { format } from "date-fns";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority | null;
  dueDate: Date | null;
}

// Eisenhower quadrant logic
// Important = HIGH or URGENT priority
// Urgent = overdue, due today, or due within 3 days
function getQuadrant(task: Task): "q1" | "q2" | "q3" | "q4" {
  const important = task.priority === "HIGH" || task.priority === "URGENT";
  const urgent =
    isOverdue(task.dueDate) || isDueToday(task.dueDate) || isDueSoon(task.dueDate, 3);

  if (important && urgent) return "q1";
  if (important && !urgent) return "q2";
  if (!important && urgent) return "q3";
  return "q4";
}

const QUADRANTS = [
  {
    id: "q1" as const,
    label: "Do Now",
    sublabel: "Important + Urgent",
    description: "These demand your immediate attention.",
    color: "border-red-500",
    headerColor: "bg-red-50 dark:bg-red-950/20",
    badgeColor: "bg-red-500 text-white",
    dotColor: "bg-red-500",
  },
  {
    id: "q2" as const,
    label: "Schedule",
    sublabel: "Important, Not Urgent",
    description: "Plan time to focus on these.",
    color: "border-blue-500",
    headerColor: "bg-blue-50 dark:bg-blue-950/20",
    badgeColor: "bg-blue-500 text-white",
    dotColor: "bg-blue-500",
  },
  {
    id: "q3" as const,
    label: "Delegate",
    sublabel: "Urgent, Not Important",
    description: "If possible, hand these off.",
    color: "border-yellow-500",
    headerColor: "bg-yellow-50 dark:bg-yellow-950/20",
    badgeColor: "bg-yellow-500 text-white",
    dotColor: "bg-yellow-500",
  },
  {
    id: "q4" as const,
    label: "Eliminate",
    sublabel: "Not Important, Not Urgent",
    description: "Question whether these need doing at all.",
    color: "border-gray-300 dark:border-gray-700",
    headerColor: "bg-muted/40",
    badgeColor: "bg-muted text-muted-foreground",
    dotColor: "bg-gray-400",
  },
];

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string, done: boolean) => void }) {
  const isDone = task.status === "DONE";

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors group",
        isDone && "opacity-50"
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) => onToggle(task.id, !!checked)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.priority && (
            <span className={cn("text-xs", getPriorityColor(task.priority))}>
              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "text-xs",
                isOverdue(task.dueDate) && !isDone
                  ? "text-red-600 dark:text-red-400"
                  : isDueToday(task.dueDate) && !isDone
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-muted-foreground"
              )}
            >
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MatrixQuadrant({
  quadrant,
  tasks,
  onToggle,
}: {
  quadrant: (typeof QUADRANTS)[number];
  tasks: Task[];
  onToggle: (id: string, done: boolean) => void;
}) {
  return (
    <Card className={cn("border-2 h-full", quadrant.color)}>
      <CardHeader className={cn("pb-2 rounded-t-md", quadrant.headerColor)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span
                className={cn("inline-block h-2 w-2 rounded-full", quadrant.dotColor)}
              />
              {quadrant.label}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">{quadrant.sublabel}</CardDescription>
          </div>
          <Badge className={cn("text-xs", quadrant.badgeColor)}>{tasks.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground italic mt-1">{quadrant.description}</p>
      </CardHeader>
      <CardContent className="pt-2 overflow-y-auto max-h-72">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 italic">
            No tasks here
          </p>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EisenhowerMatrixPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.tasks.getAll.useQuery(
    { status: ["TODO", "IN_PROGRESS"], limit: 100 },
    { staleTime: 30000 }
  );

  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => utils.tasks.getAll.invalidate(),
  });

  const handleToggle = (id: string, done: boolean) => {
    updateTask.mutate({ id, status: done ? "DONE" : "TODO" });
  };

  const tasks: Task[] = (data?.tasks ?? []) as Task[];

  const quadrantMap = tasks.reduce<Record<string, Task[]>>(
    (acc, task) => {
      const q = getQuadrant(task);
      acc[q] = [...(acc[q] ?? []), task];
      return acc;
    },
    { q1: [], q2: [], q3: [], q4: [] }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Priority Matrix</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Eisenhower matrix — sort your tasks by what truly matters
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUADRANTS.map((q) => (
              <MatrixQuadrant
                key={q.id}
                quadrant={q}
                tasks={quadrantMap[q.id] ?? []}
                onToggle={handleToggle}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
            <p>
              Showing {tasks.length} active task{tasks.length !== 1 ? "s" : ""}.
              Completed tasks are hidden.
            </p>
            <Link href="/dashboard/tasks" className="hover:underline">
              View all tasks →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
