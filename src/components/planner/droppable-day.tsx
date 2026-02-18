"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { DraggableTask } from "./draggable-task";
import type { Task, Category, Tag, Subtask, Context } from "@prisma/client";

interface DroppableDayProps {
  date: Date;
  hour: number;
  tasks: (Task & {
    category: Category | null;
    context: Context | null;
    tags: Tag[];
    subtasks: Subtask[];
  })[];
  onTaskClick?: (task: Task) => void;
  onClick?: () => void;
}

export function DroppableDay({ date, hour, tasks, onTaskClick, onClick }: DroppableDayProps) {
  const dropId = `${format(date, "yyyy-MM-dd")}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: {
      type: "timeslot",
      date,
      hour,
    },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative border-r last:border-r-0 h-16 transition-colors",
        isToday(date) && "bg-primary/5",
        isOver && "bg-primary/10 ring-2 ring-primary ring-inset",
        !isOver && "hover:bg-muted/30 cursor-pointer"
      )}
      onClick={onClick}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="absolute inset-0 overflow-y-auto p-1 space-y-1">
          {tasks.map((task) => (
            <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>

      {/* Drop Indicator */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary rounded animate-pulse" />
      )}
    </div>
  );
}
