"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  MoreHorizontal,
  CheckSquare,
  FileText,
  Lightbulb,
  Trash2,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

export default function InboxPage() {
  const { data: items, isLoading } = api.inbox.getAll.useQuery();
  const { data: count } = api.inbox.getCount.useQuery();
  const utils = api.useUtils();

  const invalidateInbox = () => {
    utils.inbox.getAll.invalidate();
    utils.inbox.getCount.invalidate();
  };

  const processAsTask = api.inbox.processAsTask.useMutation({
    onSuccess: () => {
      invalidateInbox();
      utils.tasks.getAll.invalidate();
    },
  });

  const processAsMemo = api.inbox.processAsMemo.useMutation({
    onSuccess: () => {
      invalidateInbox();
      utils.memos.getAll.invalidate();
    },
  });

  const processAsIdea = api.inbox.processAsIdea.useMutation({
    onSuccess: () => {
      invalidateInbox();
      utils.ideas.getAll.invalidate();
    },
  });

  const deleteItem = api.inbox.delete.useMutation({
    onSuccess: () => {
      invalidateInbox();
    },
  });

  const isPending =
    processAsTask.isPending ||
    processAsMemo.isPending ||
    processAsIdea.isPending ||
    deleteItem.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
        {count != null && count > 0 && (
          <Badge variant="secondary" className="text-sm">
            {count}
          </Badge>
        )}
      </div>

      {/* Items list */}
      {!items || items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Your inbox is clear
            </h3>
            <p className="mt-2 text-sm text-muted-foreground/70 max-w-xs">
              Capture ideas, tasks, and notes with{" "}
              <kbd className="inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground shadow-sm">
                {typeof navigator !== "undefined" &&
                navigator.platform?.includes("Mac")
                  ? "\u2318"
                  : "Ctrl+"}
                J
              </kbd>
              {" "}&mdash; they&apos;ll appear here for processing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.content && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.content.length > 100
                        ? item.content.slice(0, 100) + "..."
                        : item.content}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => processAsTask.mutate({ id: item.id })}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Create Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => processAsMemo.mutate({ id: item.id })}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create Memo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => processAsIdea.mutate({ id: item.id })}
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Create Idea
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteItem.mutate({ id: item.id })}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
