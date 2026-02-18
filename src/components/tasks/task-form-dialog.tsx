"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import type { TaskStatus, Priority, Task, Category, Context, Tag } from "@/types";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task & {
    category: Category | null;
    context: Context | null;
    tags: Tag[];
  };
  defaultValues?: {
    status?: TaskStatus;
    weekOf?: Date;
    monthOf?: Date;
  };
  onSuccess?: () => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultValues,
  onSuccess,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [contextId, setContextId] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const utils = api.useUtils();

  const { data: categories } = api.categories.getAll.useQuery();
  const { data: contexts } = api.contexts.getAll.useQuery();
  const { data: tags } = api.tags.getAll.useQuery();

  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.tasks.getWeeklyTasks.invalidate();
      utils.tasks.getMonthlyTasks.invalidate();
      utils.daily.getDailyView.invalidate();
      onSuccess?.();
      handleClose();
    },
  });

  const updateTask = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.tasks.getById.invalidate();
      utils.tasks.getWeeklyTasks.invalidate();
      utils.tasks.getMonthlyTasks.invalidate();
      utils.daily.getDailyView.invalidate();
      onSuccess?.();
      handleClose();
    },
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setCategoryId(task.categoryId || undefined);
      setContextId(task.contextId || undefined);
      setSelectedTags(task.tags.map((t) => t.id));
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultValues?.status || "TODO");
      setPriority("MEDIUM");
      setDueDate(undefined);
      setCategoryId(undefined);
      setContextId(undefined);
      setSelectedTags([]);
    }
  }, [task, defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate,
      categoryId: categoryId || undefined,
      contextId: contextId || undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      weekOf: defaultValues?.weekOf,
      monthOf: defaultValues?.monthOf,
    };

    if (task) {
      updateTask.mutate({ id: task.id, ...data });
    } else {
      createTask.mutate(data);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setStatus(defaultValues?.status || "TODO");
      setPriority("MEDIUM");
      setDueDate(undefined);
      setCategoryId(undefined);
      setContextId(undefined);
      setSelectedTags([]);
    }, 200);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {task
                ? "Update the task details below"
                : "Add a new task to your list"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as Priority)}>
                  <SelectTrigger id="priority">
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

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setDueDate(undefined)}
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? undefined : val)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No category</span>
                  </SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <Label htmlFor="context">Context</Label>
              <Select value={contextId || "none"} onValueChange={(val) => setContextId(val === "none" ? undefined : val)}>
                <SelectTrigger id="context">
                  <SelectValue placeholder="Select a context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No context</span>
                  </SelectItem>
                  {contexts?.map((ctx) => (
                    <SelectItem key={ctx.id} value={ctx.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ctx.color }}
                        />
                        {ctx.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      style={
                        isSelected
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : undefined
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
                {tags?.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    No tags available
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
