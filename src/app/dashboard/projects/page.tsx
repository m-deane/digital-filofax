"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  FolderKanban,
  ListChecks,
  Calendar,
  Loader2,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { format } from "date-fns";

type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
type ProjectType = "KANBAN" | "CHECKLIST";

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

const PRESET_COLORS = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
];

export default function ProjectsPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importContent, setImportContent] = useState("");
  const [importFilename, setImportFilename] = useState("TODO.md");
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "ALL">("ALL");

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<ProjectType>("KANBAN");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] = useState<ProjectStatus>("ACTIVE");

  const utils = api.useUtils();

  const { data: projects, isLoading } = api.projects.getAll.useQuery(
    {
      ...(statusFilter !== "ALL" && { status: statusFilter }),
      ...(typeFilter !== "ALL" && { projectType: typeFilter }),
    },
  );

  const createProject = api.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.getAll.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const importMarkdown = api.import.fromMarkdown.useMutation({
    onSuccess: (data) => {
      utils.projects.getAll.invalidate();
      if (data.success) {
        setImportResult({ success: true, message: `Imported ${data.recordsImported} tasks successfully.` });
        if (data.projectId) {
          setTimeout(() => {
            setIsImportOpen(false);
            setImportContent("");
            setImportFilename("TODO.md");
            setImportResult(null);
            router.push(`/dashboard/projects/${data.projectId}`);
          }, 1500);
        }
      } else {
        setImportResult({ success: false, message: data.errors.join(", ") || "Import failed" });
      }
    },
  });

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormType("KANBAN");
    setFormColor(PRESET_COLORS[0]);
    setFormDueDate("");
    setFormStatus("ACTIVE");
  }

  function handleCreate() {
    if (!formName.trim()) return;
    createProject.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      projectType: formType,
      color: formColor,
      status: formStatus,
      dueDate: formDueDate ? new Date(formDueDate) : undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Organize your work into boards and checklists</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import TODO.md
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "ALL")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as ProjectType | "ALL")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="KANBAN">Kanban</SelectItem>
            <SelectItem value="CHECKLIST">Checklist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Grid */}
      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">Create your first project</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Projects help you organize related tasks into Kanban boards or checklists.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalTasks = project._count.tasks;
            const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;

            return (
              <Card
                key={project.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {/* Colored header bar */}
                <div
                  className="h-2 rounded-t-lg"
                  style={{ backgroundColor: project.color ?? "#6366f1" }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {project.projectType === "KANBAN" ? (
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base">{project.name}</CardTitle>
                    </div>
                    <Badge className={cn("text-xs", STATUS_COLORS[project.status as ProjectStatus])}>
                      {STATUS_LABELS[project.status as ProjectStatus]}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Task count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {totalTasks} {totalTasks === 1 ? "task" : "tasks"} &middot; {doneTasks} done
                    </span>
                    {project.status === "COMPLETED" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>

                  {/* Progress bar */}
                  <Progress value={project.progress} className="h-2" />

                  {/* Due date and goal */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {project.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(project.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                    {project.goal && (
                      <span className="truncate">Goal: {project.goal.title}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                placeholder="Project name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                maxLength={5000}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ProjectType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KANBAN">Kanban Board</SelectItem>
                    <SelectItem value="CHECKLIST">Checklist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProjectStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      formColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-due">Due Date (optional)</Label>
              <Input
                id="project-due"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formName.trim() || createProject.isPending}>
              {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import TODO.md Dialog */}
      <Dialog open={isImportOpen} onOpenChange={(open) => {
        if (!open) { setIsImportOpen(false); setImportContent(""); setImportResult(null); }
      }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Import TODO.md</DialogTitle>
            <DialogDescription>
              Paste the contents of a TODO.md file to import tasks into a project. Re-importing the same filename updates existing tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="import-filename">Filename (used to match project on re-import)</Label>
              <Input
                id="import-filename"
                placeholder="TODO.md"
                value={importFilename}
                onChange={(e) => setImportFilename(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-content">Markdown content</Label>
              <textarea
                id="import-content"
                placeholder={"# My Project\n\n- [ ] First task\n  - [ ] Subtask\n- [x] Done task"}
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>
            {importResult && (
              <p className={`text-sm ${importResult.success ? "text-emerald-600" : "text-destructive"}`}>
                {importResult.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportContent(""); setImportResult(null); }}>
              Cancel
            </Button>
            <Button
              onClick={() => importMarkdown.mutate({ markdownContent: importContent, filename: importFilename || "TODO.md" })}
              disabled={!importContent.trim() || importMarkdown.isPending}
            >
              {importMarkdown.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
