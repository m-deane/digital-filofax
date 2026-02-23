"use client";

import React from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  Copy,
  Mail,
  Plus,
  Trash2,
  UserMinus,
  LogOut,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { SharedListRole } from "@prisma/client";

export default function SharedListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<SharedListRole>("VIEWER");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const { data: list, isLoading } = api.collaboration.getSharedListById.useQuery(
    { id: unwrappedParams.id },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: myTasks } = api.tasks.getAll.useQuery({ status: ["TODO" as const] });

  const utils = api.useUtils();

  const inviteMutation = api.collaboration.inviteToList.useMutation({
    onSuccess: (data) => {
      utils.collaboration.getSharedListById.invalidate({ id: unwrappedParams.id });
      setInviteLink(`${window.location.origin}/invite/${data.token}`);
      setInviteEmail("");
      setInviteRole("VIEWER");
    },
  });

  const addTaskMutation = api.collaboration.addTaskToList.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedListById.invalidate({ id: unwrappedParams.id });
      setIsAddTaskDialogOpen(false);
      setSelectedTaskId("");
    },
  });

  const removeTaskMutation = api.collaboration.removeTaskFromList.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedListById.invalidate({ id: unwrappedParams.id });
    },
  });

  const removeMemberMutation = api.collaboration.removeFromList.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedListById.invalidate({ id: unwrappedParams.id });
    },
  });

  const updateRoleMutation = api.collaboration.updateMemberRole.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedListById.invalidate({ id: unwrappedParams.id });
    },
  });

  const leaveListMutation = api.collaboration.leaveList.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedLists.invalidate();
      router.push("/dashboard/shared");
    },
  });

  const deleteListMutation = api.collaboration.deleteSharedList.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedLists.invalidate();
      router.push("/dashboard/shared");
    },
  });

  const updateTaskMutation = api.tasks.update.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedListById.invalidate({ id: unwrappedParams.id });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    inviteMutation.mutate({
      listId: unwrappedParams.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    addTaskMutation.mutate({
      listId: unwrappedParams.id,
      taskId: selectedTaskId,
    });
  };

  const handleRemoveTask = (taskId: string) => {
    removeTaskMutation.mutate({
      listId: unwrappedParams.id,
      taskId,
    });
  };

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate({
      listId: unwrappedParams.id,
      userId,
    });
  };

  const handleUpdateRole = (userId: string, role: SharedListRole) => {
    updateRoleMutation.mutate({
      listId: unwrappedParams.id,
      userId,
      role,
    });
  };

  const handleLeaveList = () => {
    leaveListMutation.mutate({ listId: unwrappedParams.id });
  };

  const handleDeleteList = () => {
    deleteListMutation.mutate({ id: unwrappedParams.id });
  };

  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    updateTaskMutation.mutate({
      id: taskId,
      status: newStatus as "TODO" | "IN_PROGRESS" | "DONE",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading shared list...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">List Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This shared list doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button asChild>
            <Link href="/dashboard/shared">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shared Lists
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = list.myRole === "OWNER";
  const canEdit = list.myRole === "OWNER" || list.myRole === "EDITOR";

  const availableTasks = myTasks?.tasks?.filter(
    (task) => !list.tasks.some((st) => st.taskId === task.id)
  ) || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/shared">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
              <Badge>{list.myRole}</Badge>
            </div>
            {list.description && (
              <p className="text-muted-foreground">{list.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={list.owner.image || undefined} />
                <AvatarFallback className="text-xs">
                  {list.owner.name?.[0] || list.owner.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span>Created by {list.owner.name || list.owner.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => setIsAddTaskDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Invite
            </Button>
          )}
          {!isOwner && (
            <Button variant="destructive" onClick={handleLeaveList}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave List
            </Button>
          )}
          {isOwner && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete List
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tasks Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({list.tasks.length})</CardTitle>
              <CardDescription>
                {canEdit ? "Add and manage shared tasks" : "View shared tasks"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {list.tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks in this list yet</p>
                  {canEdit && (
                    <Button
                      variant="link"
                      onClick={() => setIsAddTaskDialogOpen(true)}
                      className="mt-2"
                    >
                      Add your first task
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {list.tasks.map((sharedTask) => (
                    <div
                      key={sharedTask.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={sharedTask.task.status === "DONE"}
                        onCheckedChange={() =>
                          handleToggleTaskStatus(
                            sharedTask.task.id,
                            sharedTask.task.status
                          )
                        }
                        disabled={!canEdit}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={`font-medium ${
                                sharedTask.task.status === "DONE"
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {sharedTask.task.title}
                            </h4>
                            {sharedTask.task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {sharedTask.task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={sharedTask.task.user.image || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {sharedTask.task.user.name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {sharedTask.task.user.name}
                              </span>
                              {sharedTask.task.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {sharedTask.task.category.name}
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  sharedTask.task.priority === "URGENT"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {sharedTask.task.priority}
                              </Badge>
                            </div>
                          </div>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTask(sharedTask.task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Members ({list.members.length + 1})</CardTitle>
              <CardDescription>People with access to this list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Owner */}
                <div className="flex items-center gap-3 p-2 rounded-lg">
                  <Avatar>
                    <AvatarImage src={list.owner.image || undefined} />
                    <AvatarFallback>
                      {list.owner.name?.[0] || list.owner.email?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {list.owner.name || list.owner.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {list.owner.email}
                    </p>
                  </div>
                  <Badge>Owner</Badge>
                </div>

                {/* Members */}
                {list.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                  >
                    <Avatar>
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {member.user.name?.[0] || member.user.email?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value: SharedListRole) =>
                            handleUpdateRole(member.userId, value)
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary">{member.role}</Badge>
                    )}
                  </div>
                ))}

                {/* Pending Invites */}
                {isOwner && list.invites.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      Pending Invites
                    </p>
                    {list.invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-2 p-2 text-sm"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{invite.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {invite.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog
        open={isInviteDialogOpen}
        onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (!open) {
            setInviteLink(null);
            setLinkCopied(false);
          }
        }}
      >
        <DialogContent>
          {inviteLink ? (
            <>
              <DialogHeader>
                <DialogTitle>Invite link created!</DialogTitle>
                <DialogDescription>
                  Share this link with the person you want to invite
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input value={inviteLink} readOnly />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsInviteDialogOpen(false);
                      setInviteLink(null);
                      setLinkCopied(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                  Invite someone to collaborate on this shared list
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value: SharedListRole) => setInviteRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">Viewer - Can view tasks</SelectItem>
                      <SelectItem value="EDITOR">Editor - Can add and edit tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to List</DialogTitle>
            <DialogDescription>
              Select a task from your personal tasks to share
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddTaskDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addTaskMutation.isPending}>
                {addTaskMutation.isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shared List?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shared list and remove all members. The
              original tasks will remain in each member&apos;s personal lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
