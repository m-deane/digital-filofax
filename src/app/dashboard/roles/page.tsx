"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, MoreVertical, Edit, Trash2, Target } from "lucide-react";
import { api } from "@/lib/trpc";
import type { LifeRole } from "@/types";

const ROLE_ICONS = [
  { value: "👨‍💼", label: "Professional" },
  { value: "👨‍👩‍👧‍👦", label: "Family" },
  { value: "💪", label: "Health" },
  { value: "📚", label: "Learning" },
  { value: "💰", label: "Financial" },
  { value: "🤝", label: "Social" },
  { value: "🙏", label: "Spiritual" },
  { value: "🎨", label: "Creative" },
];

const ROLE_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#14b8a6", // teal
];

const DEFAULT_ROLES = [
  { name: "Professional", description: "Career, work projects, and professional development", icon: "👨‍💼", color: "#6366f1" },
  { name: "Family", description: "Relationships with family members, quality time", icon: "👨‍👩‍👧‍👦", color: "#ec4899" },
  { name: "Health", description: "Physical fitness, nutrition, and mental wellbeing", icon: "💪", color: "#10b981" },
  { name: "Personal Development", description: "Learning, growth, and self-improvement", icon: "📚", color: "#8b5cf6" },
  { name: "Financial", description: "Money management, savings, and investments", icon: "💰", color: "#f59e0b" },
  { name: "Social", description: "Friendships, community, and social connections", icon: "🤝", color: "#3b82f6" },
  { name: "Spiritual", description: "Faith, values, and inner peace", icon: "🙏", color: "#14b8a6" },
];

export default function RolesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<LifeRole | null>(null);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🎯",
    color: "#6366f1",
  });

  const utils = api.useUtils();

  const { data: roles, isLoading } = api.roles.getAllRoles.useQuery();

  const createRole = api.roles.createRole.useMutation({
    onSuccess: () => {
      utils.roles.getAllRoles.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateRole = api.roles.updateRole.useMutation({
    onSuccess: () => {
      utils.roles.getAllRoles.invalidate();
      setIsEditOpen(false);
      setEditingRole(null);
      resetForm();
    },
  });

  const deleteRole = api.roles.deleteRole.useMutation({
    onSuccess: () => {
      utils.roles.getAllRoles.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "🎯",
      color: "#6366f1",
    });
  };

  const handleCreate = () => {
    createRole.mutate(formData);
  };

  const handleEdit = (role: LifeRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      icon: role.icon || "🎯",
      color: role.color,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRole) return;
    updateRole.mutate({
      id: editingRole.id,
      ...formData,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this role? This will also delete all associated Big Rocks.")) {
      deleteRole.mutate({ id });
    }
  };

  const handleLoadDefaults = async () => {
    setIsLoadingDefaults(true);
    for (const role of DEFAULT_ROLES) {
      await createRole.mutateAsync(role).catch(() => {});
    }
    setIsLoadingDefaults(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Life Roles</h1>
          <p className="text-muted-foreground">
            Define your key life roles to organize your priorities and goals
          </p>
        </div>
        <div className="flex gap-2">
          {(!roles || roles.length === 0) && (
            <Button
              variant="outline"
              onClick={handleLoadDefaults}
              disabled={isLoadingDefaults}
            >
              {isLoadingDefaults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Defaults
            </Button>
          )}
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!roles || roles.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No life roles yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Start by defining your key life roles. These help you balance priorities and set meaningful weekly goals.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleLoadDefaults} variant="outline">
                Load Default Roles
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                Create Your First Role
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Grid */}
      {!isLoading && roles && roles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: role.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{role.icon || "🎯"}</div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {role._count?.weeklyBigRocks || 0} big rocks
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(role)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(role.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              {role.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {role.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Life Role</DialogTitle>
            <DialogDescription>
              Define a key area of your life that requires focus and attention.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="e.g., Professional, Family, Health"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="What does this role encompass?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="grid grid-cols-8 gap-2">
                {ROLE_ICONS.map((icon) => (
                  <Button
                    key={icon.value}
                    variant={formData.icon === icon.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, icon: icon.value })}
                    className="text-xl p-2 h-auto"
                  >
                    {icon.value}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 rounded border-2 transition-all ${
                      formData.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createRole.isPending || !formData.name.trim()}
            >
              {createRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Life Role</DialogTitle>
            <DialogDescription>
              Update the details of this life role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="e.g., Professional, Family, Health"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="What does this role encompass?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="grid grid-cols-8 gap-2">
                {ROLE_ICONS.map((icon) => (
                  <Button
                    key={icon.value}
                    variant={formData.icon === icon.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, icon: icon.value })}
                    className="text-xl p-2 h-auto"
                  >
                    {icon.value}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 rounded border-2 transition-all ${
                      formData.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateRole.isPending || !formData.name.trim()}
            >
              {updateRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
