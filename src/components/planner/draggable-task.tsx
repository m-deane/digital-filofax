"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, Category, Tag, Subtask, Context } from "@prisma/client";

interface DraggableTaskProps {
  task: Task & {
    category: Category | null;
    context: Context | null;
    tags: Tag[];
    subtasks: Subtask[];
  };
  onTaskClick?: (task: Task) => void;
}

export function DraggableTask({ task, onTaskClick }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const priorityColors = {
    LOW: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    MEDIUM: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
    HIGH: "border-orange-200 bg-orange-50 hover:bg-orange-100",
    URGENT: "border-red-200 bg-red-50 hover:bg-red-100",
  };

  const statusIcons = {
    TODO: null,
    IN_PROGRESS: <Clock className="h-3 w-3 text-blue-500" />,
    DONE: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border-l-4 p-2 shadow-sm transition-all cursor-move",
        priorityColors[task.priority],
        isDragging && "opacity-50 shadow-lg scale-105 z-50",
        task.status === "DONE" && "opacity-60"
      )}
      onClick={() => onTaskClick?.(task)}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Task Content */}
      <div className="pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {statusIcons[task.status]}
              <h4
                className={cn(
                  "text-sm font-medium truncate",
                  task.status === "DONE" && "line-through"
                )}
              >
                {task.title}
              </h4>
            </div>
            {task.scheduledStart && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(task.scheduledStart), "h:mm a")}
                {task.scheduledEnd &&
                  ` - ${format(new Date(task.scheduledEnd), "h:mm a")}`}
              </p>
            )}
          </div>
        </div>

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {task.category && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${task.category.color}20`,
                color: task.category.color,
              }}
            >
              {task.category.name}
            </span>
          )}
          {task.context && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              @{task.context.name}
            </span>
          )}
        </div>

        {/* Subtasks Progress */}
        {task.subtasks.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length} subtasks
          </div>
        )}
      </div>
    </div>
  );
}
