"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  MoreVertical,
  Loader2,
  Flag,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  ABANDONED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  ABANDONED: "Abandoned",
};

function CreateGoalDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const createGoal = api.goals.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate({
      title,
      description: description || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a goal with a clear target and deadline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Learn a new programming language"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this goal important?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline (optional)</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || createGoal.isPending}>
              {createGoal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Goal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMilestoneDialog({
  goalId,
  onSuccess,
}: {
  goalId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const addMilestone = api.goals.addMilestone.useMutation({
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDate("");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestone.mutate({
      goalId,
      title,
      date: new Date(date),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Flag className="h-3 w-3" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Set a checkpoint to track progress
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Milestone</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete first module"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !date || addMilestone.isPending}>
              {addMilestone.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Milestone"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  onUpdate,
}: {
  goal: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    deadline: Date | null;
    progress: number;
    color: string;
    milestones: Array<{
      id: string;
      title: string;
      date: Date;
      completed: boolean;
    }>;
    _count: { tasks: number; milestones: number };
  };
  onUpdate: () => void;
}) {
  const utils = api.useUtils();

  const updateGoal = api.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.getAll.invalidate();
      onUpdate();
    },
  });

  const deleteGoal = api.goals.delete.useMutation({
    onSuccess: () => {
      utils.goals.getAll.invalidate();
      onUpdate();
    },
  });

  const toggleMilestone = api.goals.updateMilestone.useMutation({
    onSuccess: () => {
      utils.goals.getAll.invalidate();
      onUpdate();
    },
  });

  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const milestoneProgress =
    goal.milestones.length > 0
      ? Math.round((completedMilestones / goal.milestones.length) * 100)
      : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="mt-1">{goal.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  updateGoal.mutate({ id: goal.id, status: "IN_PROGRESS" })
                }
              >
                Mark In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateGoal.mutate({ id: goal.id, status: "COMPLETED" })
                }
              >
                Mark Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateGoal.mutate({ id: goal.id, status: "ON_HOLD" })}
              >
                Put On Hold
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteGoal.mutate({ id: goal.id })}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={STATUS_COLORS[goal.status]}>
            {STATUS_LABELS[goal.status]}
          </Badge>
          {goal.deadline && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(goal.deadline), "MMM d, yyyy")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{milestoneProgress}%</span>
          </div>
          <Progress value={milestoneProgress} className="h-2" />
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Milestones ({completedMilestones}/{goal.milestones.length})
            </span>
            <AddMilestoneDialog goalId={goal.id} onSuccess={onUpdate} />
          </div>
          {goal.milestones.length > 0 ? (
            <div className="space-y-1">
              {goal.milestones.slice(0, 4).map((milestone) => (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted/50",
                    milestone.completed && "text-muted-foreground"
                  )}
                  onClick={() =>
                    toggleMilestone.mutate({
                      id: milestone.id,
                      completed: !milestone.completed,
                    })
                  }
                >
                  {milestone.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className={cn(milestone.completed && "line-through")}>
                    {milestone.title}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {format(new Date(milestone.date), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No milestones yet</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {goal._count.tasks} tasks
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const utils = api.useUtils();

  const { data: goals, isLoading } = api.goals.getAll.useQuery(
    statusFilter !== "all" ? { status: statusFilter as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "ABANDONED" } : undefined
  );

  const { data: stats } = api.goals.getStats.useQuery();

  const handleRefresh = () => {
    utils.goals.getAll.invalidate();
    utils.goals.getStats.invalidate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Set and track your long-term objectives
          </p>
        </div>
        <CreateGoalDialog onSuccess={handleRefresh} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 rounded-lg bg-blue-100">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Target className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 rounded-lg bg-gray-100">
                <Circle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.notStarted}</p>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Goals</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals Grid */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && goals && goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No goals yet</h3>
            <p className="text-muted-foreground text-center mt-1">
              Create your first goal to start tracking your progress
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && goals && goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
