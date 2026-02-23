"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Edit,
  Loader2,
  Calendar,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { format } from "date-fns";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const COLUMN_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const COLUMN_COLORS: Record<TaskStatus, string> = {
  TODO: "border-t-blue-500",
  IN_PROGRESS: "border-t-amber-500",
  DONE: "border-t-emerald-500",
};

// ---- Kanban Drag Components ----

function KanbanCard({ task }: { task: { id: string; title: string; priority: string; dueDate: Date | null; status: string } }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm font-medium", task.status === "DONE" && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge className={cn("text-[10px] px-1.5 py-0", PRIORITY_COLORS[task.priority])}>
          {task.priority}
        </Badge>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: { id: string; title: string; priority: string; dueDate: Date | null; status: string }[];
  onAddTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "column", status },
  });

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className={cn("rounded-t-lg border-t-4 bg-muted/50 p-3", COLUMN_COLORS[status])}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {COLUMN_LABELS[status]} ({tasks.length})
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-b-lg border border-t-0 p-2 min-h-[200px] transition-colors",
          isOver && "bg-primary/5 ring-2 ring-primary ring-inset"
        )}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState<TaskStatus>("TODO");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("MEDIUM");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("ACTIVE");
  const [editDueDate, setEditDueDate] = useState("");

  const utils = api.useUtils();

  const { data: project, isLoading } = api.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  const updateProject = api.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.getAll.invalidate();
      setIsEditOpen(false);
    },
  });

  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.getAll.invalidate();
      setIsAddTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskPriority("MEDIUM");
    },
  });

  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.getAll.invalidate();
    },
  });

  const updateProgress = api.projects.updateProgress.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.getAll.invalidate();
    },
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function openEditDialog() {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditStatus(project.status as ProjectStatus);
    setEditDueDate(project.dueDate ? format(new Date(project.dueDate), "yyyy-MM-dd") : "");
    setIsEditOpen(true);
  }

  function handleEdit() {
    updateProject.mutate({
      id: projectId,
      name: editName.trim(),
      description: editDescription.trim() || null,
      status: editStatus,
      dueDate: editDueDate ? new Date(editDueDate) : null,
    });
  }

  function openAddTask(status: TaskStatus) {
    setAddTaskStatus(status);
    setNewTaskTitle("");
    setNewTaskPriority("MEDIUM");
    setIsAddTaskOpen(true);
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      title: newTaskTitle.trim(),
      status: addTaskStatus,
      priority: newTaskPriority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      projectId,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    if (!overId.startsWith("column-")) return;

    const newStatus = overId.replace("column-", "") as TaskStatus;
    const taskId = active.id as string;
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    updateTask.mutate(
      { id: taskId, status: newStatus },
      {
        onSuccess: () => {
          updateProgress.mutate({ id: projectId });
        },
      }
    );
  }

  function handleChecklistToggle(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    updateTask.mutate(
      { id: taskId, status: newStatus as TaskStatus },
      {
        onSuccess: () => {
          updateProgress.mutate({ id: projectId });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" onClick={() => router.push("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const todoTasks = project.tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = project.tasks.filter((t) => t.status === "DONE");
  const totalTasks = project.tasks.length;
  const doneCount = doneTasks.length;
  const progressPct = totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100);

  const activeTask = project.tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={cn("text-xs", STATUS_COLORS[project.status as ProjectStatus])}>
              {STATUS_LABELS[project.status as ProjectStatus]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {project.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {format(new Date(project.dueDate), "MMM d, yyyy")}
              </span>
            )}
            <span>{totalTasks} tasks &middot; {doneCount} done</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openEditDialog}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Kanban View */}
      {project.projectType === "KANBAN" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn
              status="TODO"
              tasks={todoTasks}
              onAddTask={() => openAddTask("TODO")}
            />
            <KanbanColumn
              status="IN_PROGRESS"
              tasks={inProgressTasks}
              onAddTask={() => openAddTask("IN_PROGRESS")}
            />
            <KanbanColumn
              status="DONE"
              tasks={doneTasks}
              onAddTask={() => openAddTask("DONE")}
            />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rounded-lg border bg-card p-3 shadow-lg">
                <p className="text-sm font-medium">{activeTask.title}</p>
                <Badge className={cn("text-[10px] px-1.5 py-0 mt-1", PRIORITY_COLORS[activeTask.priority])}>
                  {activeTask.priority}
                </Badge>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Checklist View */}
      {project.projectType === "CHECKLIST" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {doneCount} / {totalTasks} complete ({progressPct}%)
                </CardTitle>
                <Button size="sm" onClick={() => openAddTask("TODO")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <Progress value={progressPct} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-1">
              {project.tasks.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No items yet. Add your first checklist item.
                </p>
              )}
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={task.status === "DONE"}
                    onCheckedChange={() => handleChecklistToggle(task.id, task.status)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm",
                        task.status === "DONE" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {task.subtasks.map((st) => (
                          <div key={st.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={cn("h-1.5 w-1.5 rounded-full", st.completed ? "bg-emerald-500" : "bg-gray-300")} />
                            <span className={cn(st.completed && "line-through")}>{st.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-[10px] px-1.5 py-0", PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Add a new task to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                maxLength={500}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim() || createTask.isPending}>
              {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={5000}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ProjectStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due">Due Date</Label>
                <Input
                  id="edit-due"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editName.trim() || updateProject.isPending}>
              {updateProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
