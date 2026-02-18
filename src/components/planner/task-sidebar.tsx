"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraggableTask } from "./draggable-task";
import type { Task, Category, Tag, Subtask, Context } from "@prisma/client";

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
  const { setNodeRef, isOver } = useDroppable({
    id: "unscheduled-tasks",
    data: {
      type: "unscheduled",
    },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Inbox className="h-5 w-5" />
          Unscheduled Tasks
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
                tasks.map((task) => (
                  <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}
