"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  AtSign,
} from "lucide-react";
import { api } from "@/lib/trpc";
import type { Context } from "@/types";

interface ContextWithCount {
  id: string;
  name: string;
  icon?: string | null;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  activeTaskCount?: number;
}

function ContextCard({
  context,
  onEdit,
  onDelete,
}: {
  context: ContextWithCount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
        style={{ backgroundColor: context.color }}
      >
        {context.icon || <AtSign className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{context.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {context.activeTaskCount || 0} active tasks
          </Badge>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function ContextsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);
  const [contextName, setContextName] = useState("");
  const [contextIcon, setContextIcon] = useState("");
  const [contextColor, setContextColor] = useState("#8b5cf6");

  const utils = api.useUtils();

  const { data: contextsData, isLoading } = api.contexts.getWithTaskCounts.useQuery();
  const contexts = (contextsData ?? []) as ContextWithCount[];

  const createContext = api.contexts.create.useMutation({
    onSuccess: () => {
      utils.contexts.getWithTaskCounts.invalidate();
      setIsCreateOpen(false);
      setContextName("");
      setContextIcon("");
      setContextColor("#8b5cf6");
    },
  });

  const updateContext = api.contexts.update.useMutation({
    onSuccess: () => {
      utils.contexts.getWithTaskCounts.invalidate();
      setIsEditOpen(false);
      setEditingContext(null);
      setContextName("");
      setContextIcon("");
      setContextColor("#8b5cf6");
    },
  });

  const deleteContext = api.contexts.delete.useMutation({
    onSuccess: () => {
      utils.contexts.getWithTaskCounts.invalidate();
    },
  });

  const handleCreateContext = () => {
    if (!contextName.trim()) return;
    createContext.mutate({
      name: contextName.trim(),
      icon: contextIcon || undefined,
      color: contextColor,
    });
  };

  const handleEditContext = () => {
    if (!editingContext || !contextName.trim()) return;
    updateContext.mutate({
      id: editingContext.id,
      name: contextName.trim(),
      icon: contextIcon || undefined,
      color: contextColor,
    });
  };

  const handleDeleteContext = (contextId: string) => {
    if (confirm("Are you sure? This will remove the context from all tasks.")) {
      deleteContext.mutate({ id: contextId });
    }
  };

  const openEditDialog = (context: ContextWithCount) => {
    setEditingContext({
      id: context.id,
      name: context.name,
      icon: context.icon ?? null,
      color: context.color,
      userId: context.userId,
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
    });
    setContextName(context.name);
    setContextIcon(context.icon || "");
    setContextColor(context.color);
    setIsEditOpen(true);
  };

  const resetCreateForm = () => {
    setContextName("");
    setContextIcon("");
    setContextColor("#8b5cf6");
  };

  const defaultContexts = [
    { name: "@work", color: "#3b82f6" },
    { name: "@home", color: "#10b981" },
    { name: "@errands", color: "#f59e0b" },
    { name: "@phone", color: "#8b5cf6" },
    { name: "@computer", color: "#6366f1" },
    { name: "@waiting", color: "#ef4444" },
    { name: "@anywhere", color: "#64748b" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contexts</h1>
          <p className="text-muted-foreground">
            Manage GTD-style contexts for organizing tasks by location or tool
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetCreateForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Context
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Context</DialogTitle>
              <DialogDescription>
                Add a new context to organize your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Input
                  placeholder="Context name (e.g., @work, @home)"
                  value={contextName}
                  onChange={(e) => setContextName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Icon (optional)"
                  value={contextIcon}
                  onChange={(e) => setContextIcon(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <input
                  type="color"
                  value={contextColor}
                  onChange={(e) => setContextColor(e.target.value)}
                  className="w-full h-10 rounded-md border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateContext}
                disabled={createContext.isPending || !contextName.trim()}
              >
                {createContext.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Context
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Add Default Contexts */}
      {contexts.length === 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started with Default Contexts</CardTitle>
            <CardDescription>
              Quick add common GTD contexts to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {defaultContexts.map((ctx) => (
                <Button
                  key={ctx.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    createContext.mutate({
                      name: ctx.name,
                      color: ctx.color,
                    });
                  }}
                  disabled={createContext.isPending}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: ctx.color }}
                  />
                  {ctx.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Contexts List */}
      {!isLoading && contexts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Contexts</CardTitle>
            <CardDescription>{contexts.length} contexts total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {contexts.map((context) => (
              <ContextCard
                key={context.id}
                context={context}
                onEdit={() => openEditDialog(context)}
                onDelete={() => handleDeleteContext(context.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Context</DialogTitle>
            <DialogDescription>
              Update the context details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Context name"
                value={contextName}
                onChange={(e) => setContextName(e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Icon (optional)"
                value={contextIcon}
                onChange={(e) => setContextIcon(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <input
                type="color"
                value={contextColor}
                onChange={(e) => setContextColor(e.target.value)}
                className="w-full h-10 rounded-md border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditContext}
              disabled={updateContext.isPending || !contextName.trim()}
            >
              {updateContext.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Context
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
