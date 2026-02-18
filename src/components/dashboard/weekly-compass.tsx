"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Target } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { api } from "@/lib/trpc";
import Link from "next/link";

interface WeeklyCompassProps {
  weekOf?: Date;
}

export function WeeklyCompass({ weekOf }: WeeklyCompassProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBigRock, setNewBigRock] = useState({
    title: "",
    roleId: "",
  });

  const currentWeek = weekOf ?? new Date();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const utils = api.useUtils();

  const { data: compassData, isLoading } = api.roles.getWeeklyCompass.useQuery({
    weekOf: currentWeek,
  });

  const createBigRock = api.roles.createBigRock.useMutation({
    onSuccess: () => {
      utils.roles.getWeeklyCompass.invalidate();
      setIsAddOpen(false);
      setNewBigRock({ title: "", roleId: "" });
    },
  });

  const toggleComplete = api.roles.toggleBigRockComplete.useMutation({
    onSuccess: () => {
      utils.roles.getWeeklyCompass.invalidate();
    },
  });

  const deleteBigRock = api.roles.deleteBigRock.useMutation({
    onSuccess: () => {
      utils.roles.getWeeklyCompass.invalidate();
    },
  });

  const handleAddBigRock = () => {
    createBigRock.mutate({
      ...newBigRock,
      weekOf: weekStart,
    });
  };

  const handleToggle = (id: string) => {
    toggleComplete.mutate({ id });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!compassData || compassData.roles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Compass
          </CardTitle>
          <CardDescription>
            Your life roles and weekly big rocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No life roles defined yet. Create your roles to use the Weekly Compass.
            </p>
            <Link href="/dashboard/roles">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Life Roles
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Compass
              </CardTitle>
              <CardDescription>
                Week of {format(compassData.weekStart, "MMM d, yyyy")}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          {compassData.totalBigRocks > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weekly Progress</span>
                <span className="font-medium">
                  {compassData.completedBigRocks} / {compassData.totalBigRocks}
                </span>
              </div>
              <Progress value={compassData.completionRate} className="h-2" />
            </div>
          )}

          {/* Roles with Big Rocks */}
          <div className="space-y-4">
            {compassData.roles.map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-lg">{role.icon}</span>
                  <h4 className="font-semibold">{role.name}</h4>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {role.weeklyBigRocks.filter((br) => br.completed).length} /{" "}
                    {role.weeklyBigRocks.length}
                  </span>
                </div>

                {role.weeklyBigRocks.length === 0 ? (
                  <div className="ml-9 text-sm text-muted-foreground italic">
                    No big rocks this week
                  </div>
                ) : (
                  <div className="ml-9 space-y-2">
                    {role.weeklyBigRocks.map((bigRock) => (
                      <div
                        key={bigRock.id}
                        className="flex items-center gap-2 group"
                      >
                        <Checkbox
                          checked={bigRock.completed}
                          onCheckedChange={() => handleToggle(bigRock.id)}
                          disabled={toggleComplete.isPending}
                        />
                        <span
                          className={`flex-1 text-sm ${
                            bigRock.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {bigRock.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm("Delete this big rock?")) {
                              deleteBigRock.mutate({ id: bigRock.id });
                            }
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {compassData.totalBigRocks === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No big rocks scheduled for this week. Add some to get started!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Big Rock Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Big Rock</DialogTitle>
            <DialogDescription>
              Define a key priority for this week aligned with one of your life roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Life Role</label>
              <Select
                value={newBigRock.roleId}
                onValueChange={(value) =>
                  setNewBigRock({ ...newBigRock, roleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {compassData?.roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <span>{role.icon}</span>
                        <span>{role.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Big Rock</label>
              <Input
                placeholder="What's the most important thing to achieve this week?"
                value={newBigRock.title}
                onChange={(e) =>
                  setNewBigRock({ ...newBigRock, title: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBigRock}
              disabled={
                createBigRock.isPending ||
                !newBigRock.title.trim() ||
                !newBigRock.roleId
              }
            >
              {createBigRock.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Big Rock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
