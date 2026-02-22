"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraggableTask } from "./draggable-task";
import type { Task, Category, Tag, Subtask, Context } from "@prisma/client";

const PAGE_SIZE = 20;

interface TaskSidebarProps {
  tasks: (Task & {
    category: Category | null;
    context: Context | null;
    tags: Tag[];
    subtasks: Subtask[];
  })[];
  onTaskClick?: (task: Task) => void;
}

export function TaskSidebar({ tasks, onTaskClick }: TaskSidebarProps) {
  const [showAll, setShowAll] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: "unscheduled-tasks",
    data: {
      type: "unscheduled",
    },
  });

  const visibleTasks = showAll ? tasks : tasks.slice(0, PAGE_SIZE);
  const taskIds = visibleTasks.map((t) => t.id);
  const hiddenCount = tasks.length - PAGE_SIZE;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Inbox className="h-5 w-5" />
          Unscheduled Tasks
          {tasks.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {tasks.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[200px] rounded-lg border-2 border-dashed p-2 transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          )}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  All tasks are scheduled
                </p>
              ) : (
                <>
                  {visibleTasks.map((task) => (
                    <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} />
                  ))}
                  {!showAll && hiddenCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setShowAll(true)}
                    >
                      Show {hiddenCount} more
                    </Button>
                  )}
                </>
              )}
            </div>
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}
