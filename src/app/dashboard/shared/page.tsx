"use client";

import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, CheckSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default function SharedListsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = api.collaboration.getSharedLists.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const utils = api.useUtils();

  const createListMutation = api.collaboration.createSharedList.useMutation({
    onSuccess: () => {
      utils.collaboration.getSharedLists.invalidate();
      setIsCreateDialogOpen(false);
      setName("");
      setDescription("");
    },
  });

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createListMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading shared lists...</div>
      </div>
    );
  }

  const ownedLists = data?.ownedLists || [];
  const memberLists = data?.memberLists || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Lists</h1>
          <p className="text-muted-foreground">
            Collaborate on tasks with your team
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Shared List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shared List</DialogTitle>
              <DialogDescription>
                Create a new list to share tasks with others
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Team Sprint Tasks"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tasks for our current sprint"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createListMutation.isPending}>
                  {createListMutation.isPending ? "Creating..." : "Create List"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Owned Lists */}
      {ownedLists.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Lists</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ownedLists.map((list) => (
              <Link key={list.id} href={`/dashboard/shared/${list.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        {list.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {list.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        Owner
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        <span>{list._count.tasks} tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{list._count.members} members</span>
                      </div>
                    </div>

                    {list.members.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                          {list.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={member.user.image || undefined} />
                              <AvatarFallback className="text-xs">
                                {member.user.name?.[0] || member.user.email?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        {list.members.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{list.members.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lists I'm a Member Of */}
      {memberLists.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Shared With Me</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memberLists.map((list) => (
              <Link key={list.id} href={`/dashboard/shared/${list.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        {list.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {list.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={list.myRole === "EDITOR" ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {list.myRole}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={list.owner.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {list.owner.name?.[0] || list.owner.email?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {list.owner.name || list.owner.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        <span>{list._count.tasks} tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{list._count.members} members</span>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {ownedLists.length === 0 && memberLists.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shared Lists Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create a shared list to collaborate on tasks with your team. You can invite members
              and assign different roles.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Shared List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
