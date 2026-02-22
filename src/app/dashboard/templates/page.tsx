"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Copy,
  Play,
  FileText,
  CheckSquare,
  Clock,
  Calendar,
  Users,
  ListChecks,
  Loader2,
  Star,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { TemplateType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

const TEMPLATE_ICONS: Record<TemplateType, React.ReactNode> = {
  TASK_LIST: <CheckSquare className="h-5 w-5" />,
  PROJECT: <FileText className="h-5 w-5" />,
  DAILY_ROUTINE: <Clock className="h-5 w-5" />,
  WEEKLY_PLAN: <Calendar className="h-5 w-5" />,
  MEETING_NOTES: <Users className="h-5 w-5" />,
  CHECKLIST: <ListChecks className="h-5 w-5" />,
};

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  TASK_LIST: "Task List",
  PROJECT: "Project",
  DAILY_ROUTINE: "Daily Routine",
  WEEKLY_PLAN: "Weekly Plan",
  MEETING_NOTES: "Meeting Notes",
  CHECKLIST: "Checklist",
};

interface Template {
  id: string;
  name: string;
  description?: string | null;
  type: TemplateType;
  content: unknown;
  isPublic: boolean;
  usageCount: number;
  userId: string;
  createdAt: Date;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TemplateType | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>("TASK_LIST");

  const utils = api.useUtils();

  // Fetch user's templates
  const { data: userTemplates, isLoading: isLoadingUser } = api.templates.getAll.useQuery({
    type: selectedType === "ALL" ? undefined : selectedType,
    search: searchQuery || undefined,
  });

  // Fetch public templates
  const { data: publicTemplates, isLoading: isLoadingPublic } = api.templates.getPublicTemplates.useQuery({
    type: selectedType === "ALL" ? undefined : selectedType,
  });

  // Fetch current user preferences to know which templates are defaults
  const { data: prefs } = api.preferences.get.useQuery();
  const defaultTemplates = (prefs?.defaultTemplates as Record<string, string> | null | undefined) ?? {};

  // Set / clear default template mutation
  const updateDefaultTemplate = api.preferences.updateDefaultTemplate.useMutation({
    onSuccess: () => utils.preferences.get.invalidate(),
  });

  const handleSetDefault = (templateType: TemplateType, templateId: string) => {
    const isAlreadyDefault = defaultTemplates[templateType] === templateId;
    updateDefaultTemplate.mutate({
      templateType,
      templateId: isAlreadyDefault ? null : templateId,
    });
  };

  // Create template mutation
  const createTemplate = api.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.getAll.invalidate();
      setIsCreateOpen(false);
      setNewTemplateName("");
      setNewTemplateDescription("");
      setNewTemplateType("TASK_LIST");
    },
  });

  // Delete template mutation
  const deleteTemplate = api.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.getAll.invalidate();
    },
  });

  // Duplicate template mutation
  const duplicateTemplate = api.templates.duplicate.useMutation({
    onSuccess: () => {
      utils.templates.getAll.invalidate();
    },
  });

  // Apply template mutation
  const applyTemplate = api.templates.applyTemplate.useMutation({
    onSuccess: () => {
      router.push("/dashboard/tasks");
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;

    // Default content structure based on type
    const defaultContent = getDefaultContent(newTemplateType);

    createTemplate.mutate({
      name: newTemplateName,
      description: newTemplateDescription || undefined,
      type: newTemplateType,
      content: defaultContent,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplate.mutate({ id });
    }
  };

  const handleDuplicateTemplate = (id: string, name: string) => {
    duplicateTemplate.mutate({ id, name: `${name} (Copy)` });
  };

  const handleApplyTemplate = (id: string) => {
    applyTemplate.mutate({ id });
  };

  const filteredUserTemplates = userTemplates || [];
  const filteredPublicTemplates = publicTemplates || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Reusable templates for tasks, projects, and routines
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for recurring tasks or routines
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                rows={3}
              />
              <Select value={newTemplateType} onValueChange={(v) => setNewTemplateType(v as TemplateType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Template type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_LABELS).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {TEMPLATE_ICONS[type as TemplateType]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending || !newTemplateName.trim()}>
                {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as TemplateType | "ALL")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {Object.entries(TEMPLATE_LABELS).map(([type, label]) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Tabs */}
      <Tabs defaultValue="my-templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-templates">
            My Templates ({filteredUserTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="public-templates">
            Built-in Templates ({filteredPublicTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="space-y-4">
          {isLoadingUser && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingUser && filteredUserTemplates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <p className="text-muted-foreground mb-4">
                  No templates yet. Create your first template!
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUserTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={handleDeleteTemplate}
                onDuplicate={handleDuplicateTemplate}
                onApply={handleApplyTemplate}
                onSetDefault={handleSetDefault}
                isDefault={defaultTemplates[template.type] === template.id}
                isOwner={true}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="public-templates" className="space-y-4">
          {isLoadingPublic && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPublicTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDuplicate={handleDuplicateTemplate}
                onApply={handleApplyTemplate}
                isOwner={false}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onDelete?: (id: string) => void;
  onDuplicate: (id: string, name: string) => void;
  onApply: (id: string) => void;
  onSetDefault?: (templateType: TemplateType, templateId: string) => void;
  isDefault?: boolean;
  isOwner: boolean;
}

function TemplateCard({ template, onDelete, onDuplicate, onApply, onSetDefault, isDefault, isOwner }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {TEMPLATE_ICONS[template.type]}
            <Badge variant="outline" className="text-xs">
              {TEMPLATE_LABELS[template.type]}
            </Badge>
            {isDefault && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                Default
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onApply(template.id)}>
                <Play className="h-4 w-4 mr-2" />
                Use Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template.id, template.name)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {isOwner && onSetDefault && (
                <DropdownMenuItem onClick={() => onSetDefault(template.type, template.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {isDefault ? "Remove as Default" : "Set as Default"}
                </DropdownMenuItem>
              )}
              {isOwner && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(template.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        {template.description && (
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Used {template.usageCount} times</span>
          {template.isPublic && (
            <Badge variant="secondary" className="text-xs">
              Public
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getDefaultContent(type: TemplateType): Record<string, unknown> {
  switch (type) {
    case "TASK_LIST":
    case "CHECKLIST":
      return {
        tasks: [
          { title: "Task 1", priority: "MEDIUM" },
          { title: "Task 2", priority: "MEDIUM" },
        ],
      };
    case "PROJECT":
      return {
        title: "Project Name",
        description: "Project description",
        milestones: [
          {
            title: "Milestone 1",
            tasks: [
              { title: "Task 1", priority: "HIGH" },
              { title: "Task 2", priority: "MEDIUM" },
            ],
          },
        ],
      };
    case "DAILY_ROUTINE":
    case "WEEKLY_PLAN":
      return {
        tasks: [
          { title: "Morning routine", priority: "MEDIUM" },
          { title: "Evening routine", priority: "MEDIUM" },
        ],
      };
    case "MEETING_NOTES":
      return {
        title: "Meeting Title",
        sections: [
          { heading: "Agenda", content: "" },
          { heading: "Notes", content: "" },
          { heading: "Action Items", content: "" },
        ],
      };
    default:
      return {};
  }
}
