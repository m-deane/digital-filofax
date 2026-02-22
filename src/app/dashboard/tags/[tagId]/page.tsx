"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckSquare,
  FileText,
  Lightbulb,
  Loader2,
  Tag,
  Circle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { isOverdue, isDueToday } from "@/lib/urgency";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const PRIORITY_COLORS: Record<Priority, string> = {
  URGENT: "text-red-600 dark:text-red-400",
  HIGH: "text-orange-600 dark:text-orange-400",
  MEDIUM: "text-yellow-600 dark:text-yellow-400",
  LOW: "text-gray-500 dark:text-gray-400",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "text-gray-400",
  IN_PROGRESS: "text-blue-500",
  DONE: "text-emerald-500",
};

function TaskRow({
  task,
}: {
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority | null;
    dueDate: Date | null;
    createdAt: Date;
  };
}) {
  const overdue = isOverdue(task.dueDate) && task.status !== "DONE";
  const dueToday = isDueToday(task.dueDate) && task.status !== "DONE";

  return (
    <Link
      href="/dashboard/tasks"
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <Circle
        className={cn("h-4 w-4 flex-shrink-0", STATUS_COLORS[task.status])}
        fill={task.status === "DONE" ? "currentColor" : "none"}
      />
      <span
        className={cn(
          "flex-1 text-sm truncate",
          task.status === "DONE" && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.priority && task.priority !== "LOW" && (
          <span className={cn("text-xs font-medium", PRIORITY_COLORS[task.priority])}>
            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
          </span>
        )}
        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              overdue
                ? "text-red-600 dark:text-red-400"
                : dueToday
                ? "text-orange-600 dark:text-orange-400"
                : "text-muted-foreground"
            )}
          >
            <Clock className="h-3 w-3" />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
      </div>
    </Link>
  );
}

function MemoRow({
  memo,
}: {
  memo: { id: string; title: string; memoType: string; createdAt: Date };
}) {
  return (
    <Link
      href="/dashboard/memos"
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 text-sm truncate">{memo.title}</span>
      <Badge variant="outline" className="text-xs shrink-0">
        {memo.memoType.charAt(0) + memo.memoType.slice(1).toLowerCase()}
      </Badge>
    </Link>
  );
}

function IdeaRow({
  idea,
}: {
  idea: { id: string; title: string; status: string; createdAt: Date };
}) {
  return (
    <Link
      href="/dashboard/ideas"
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Lightbulb className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 text-sm truncate">{idea.title}</span>
      <Badge variant="outline" className="text-xs shrink-0">
        {idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}
      </Badge>
    </Link>
  );
}

export default function TagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  const { tagId } = use(params);
  const { data: tag, isLoading } = api.tags.getTagSummary.useQuery({ id: tagId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="text-center py-16">
        <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Tag not found</p>
        <Link href="/dashboard/tags">
          <Button variant="outline" className="mt-4">Back to Tags</Button>
        </Link>
      </div>
    );
  }

  const total = tag.tasks.length + tag.memos.length + tag.ideas.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tags">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: tag.color }}
          />
          <h1 className="text-2xl font-bold tracking-tight">{tag.name}</h1>
          <Badge variant="secondary">{total} item{total !== 1 ? "s" : ""}</Badge>
        </div>
      </div>

      {total === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nothing tagged with &ldquo;{tag.name}&rdquo; yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tag.tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  Tasks
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {tag.tasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {tag.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {tag.memos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Memos
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {tag.memos.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {tag.memos.map((memo) => (
                    <MemoRow key={memo.id} memo={memo} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {tag.ideas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-emerald-500" />
                  Ideas
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {tag.ideas.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {tag.ideas.map((idea) => (
                    <IdeaRow key={idea.id} idea={idea} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Separator />
      <div className="flex gap-2">
        <Link href="/dashboard/tasks">
          <Button variant="outline" size="sm" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Go to Tasks
          </Button>
        </Link>
        <Link href="/dashboard/memos">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Go to Memos
          </Button>
        </Link>
        <Link href="/dashboard/ideas">
          <Button variant="outline" size="sm" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Go to Ideas
          </Button>
        </Link>
      </div>
    </div>
  );
}
