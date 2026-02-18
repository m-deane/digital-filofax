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
  ChevronRight,
  Mountain,
  Calendar as CalendarIcon,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const GOAL_TYPE_LABELS: Record<string, string> = {
  LIFETIME: "Lifetime Vision",
  THREE_YEAR: "3-Year Goal",
  ANNUAL: "Annual Goal",
  QUARTERLY: "Quarterly Goal",
  MONTHLY: "Monthly Goal",
};

const GOAL_TYPE_COLORS: Record<string, string> = {
  LIFETIME: "bg-purple-100 text-purple-700 border-purple-200",
  THREE_YEAR: "bg-blue-100 text-blue-700 border-blue-200",
  ANNUAL: "bg-green-100 text-green-700 border-green-200",
  QUARTERLY: "bg-yellow-100 text-yellow-700 border-yellow-200",
  MONTHLY: "bg-orange-100 text-orange-700 border-orange-200",
};

const GOAL_TYPE_ICONS: Record<string, React.ReactNode> = {
  LIFETIME: <Mountain className="h-4 w-4" />,
  THREE_YEAR: <Trophy className="h-4 w-4" />,
  ANNUAL: <CalendarIcon className="h-4 w-4" />,
  QUARTERLY: <TrendingUp className="h-4 w-4" />,
  MONTHLY: <Target className="h-4 w-4" />,
};

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

type GoalType = "LIFETIME" | "THREE_YEAR" | "ANNUAL" | "QUARTERLY" | "MONTHLY";

function CreateGoalDialog({ onSuccess, parentGoal }: { onSuccess: () => void; parentGoal?: { id: string; title: string; type: string } }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalType>("ANNUAL");
  const [targetDate, setTargetDate] = useState("");

  const createGoal = api.goals.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      setType("ANNUAL");
      setTargetDate("");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate({
      title,
      description: description || undefined,
      type,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      parentGoalId: parentGoal?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size={parentGoal ? "sm" : "default"} variant={parentGoal ? "outline" : "default"}>
          <Plus className="h-4 w-4" />
          {parentGoal ? "Add Sub-Goal" : "New Goal"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{parentGoal ? `Add Sub-Goal to "${parentGoal.title}"` : "Create New Goal"}</DialogTitle>
            <DialogDescription>
              {parentGoal ? "Break down your goal into smaller, actionable steps" : "Set a clear target with a timeline for success"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Master TypeScript programming"
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
              <label className="text-sm font-medium">Goal Type</label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIFETIME">Lifetime Vision</SelectItem>
                  <SelectItem value="THREE_YEAR">3-Year Goal</SelectItem>
                  <SelectItem value="ANNUAL">Annual Goal</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly Goal</SelectItem>
                  <SelectItem value="MONTHLY">Monthly Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date (optional)</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoalData = any;

function GoalHierarchyItem({
  goal,
  onUpdate,
  level = 0,
}: {
  goal: GoalData;
  onUpdate: () => void;
  level?: number;
}) {
  const utils = api.useUtils();

  const updateGoal = api.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.getHierarchy.invalidate();
      onUpdate();
    },
  });

  const deleteGoal = api.goals.delete.useMutation({
    onSuccess: () => {
      utils.goals.getHierarchy.invalidate();
      onUpdate();
    },
  });

  const toggleMilestone = api.goals.updateMilestone.useMutation({
    onSuccess: () => {
      utils.goals.getHierarchy.invalidate();
      onUpdate();
    },
  });

  const completedMilestones = goal.milestones?.filter((m: { completed: boolean }) => m.completed).length || 0;
  const milestoneProgress =
    (goal.milestones?.length || 0) > 0
      ? Math.round((completedMilestones / (goal.milestones?.length || 1)) * 100)
      : 0;

  const hasChildren = goal.childGoals && goal.childGoals.length > 0;

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6 border-l-2 pl-4 border-muted")}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("gap-1", GOAL_TYPE_COLORS[goal.type])}>
                  {GOAL_TYPE_ICONS[goal.type]}
                  {GOAL_TYPE_LABELS[goal.type]}
                </Badge>
                <Badge className={STATUS_COLORS[goal.status]}>
                  {STATUS_LABELS[goal.status]}
                </Badge>
                {goal.targetDate && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(goal.targetDate), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              {goal.description && (
                <CardDescription>{goal.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <CreateGoalDialog onSuccess={onUpdate} parentGoal={{ id: goal.id, title: goal.title, type: goal.type }} />
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
                {goal.milestones.slice(0, 4).map((milestone: { id: string; title: string; date: Date; completed: boolean }) => (
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
              {goal._count?.tasks ?? 0} tasks
            </div>
            {hasChildren && (
              <div className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                {goal.childGoals.length} sub-goals
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Render child goals */}
      {hasChildren && (
        <div className="space-y-2 mt-2">
          {goal.childGoals.map((childGoal: GoalData) => (
            <GoalHierarchyItem
              key={childGoal.id}
              goal={childGoal}
              onUpdate={onUpdate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<"hierarchy" | "grid">("hierarchy");
  const utils = api.useUtils();

  const { data: hierarchyGoals, isLoading: isLoadingHierarchy } = api.goals.getHierarchy.useQuery();

  const { data: gridGoals, isLoading: isLoadingGrid } = api.goals.getAll.useQuery(
    view === "grid" && (statusFilter !== "all" || typeFilter !== "all")
      ? {
          ...(statusFilter !== "all" && { status: statusFilter as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "ABANDONED" }),
          ...(typeFilter !== "all" && { type: typeFilter as "LIFETIME" | "THREE_YEAR" | "ANNUAL" | "QUARTERLY" | "MONTHLY" }),
        }
      : undefined
  );

  const { data: stats } = api.goals.getStats.useQuery();

  const handleRefresh = () => {
    utils.goals.getAll.invalidate();
    utils.goals.getHierarchy.invalidate();
    utils.goals.getStats.invalidate();
  };

  const isLoading = view === "hierarchy" ? isLoadingHierarchy : isLoadingGrid;

  // Apply filters to hierarchy view
  const filteredHierarchyGoals = hierarchyGoals?.filter((goal) => {
    if (statusFilter !== "all" && goal.status !== statusFilter) return false;
    if (typeFilter !== "all" && goal.type !== typeFilter) return false;
    return true;
  });

  const goalsToDisplay = view === "hierarchy" ? filteredHierarchyGoals : gridGoals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Cascade your vision into actionable objectives
          </p>
        </div>
        <CreateGoalDialog onSuccess={handleRefresh} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <div className="p-2 rounded-lg bg-purple-100">
                <Mountain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.byType.lifetime}</p>
                <p className="text-xs text-muted-foreground">Lifetime</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 rounded-lg bg-orange-100">
                <CalendarIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.byType.annual}</p>
                <p className="text-xs text-muted-foreground">Annual</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Tabs and Filters */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={view} onValueChange={(v) => setView(v as "hierarchy" | "grid")}>
          <TabsList>
            <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LIFETIME">Lifetime</SelectItem>
              <SelectItem value="THREE_YEAR">3-Year</SelectItem>
              <SelectItem value="ANNUAL">Annual</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Goals Display */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && goalsToDisplay && goalsToDisplay.length === 0 && (
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

      {!isLoading && goalsToDisplay && goalsToDisplay.length > 0 && (
        <div className="space-y-4">
          {goalsToDisplay.map((goal: GoalData) => (
            <GoalHierarchyItem key={goal.id} goal={goal} onUpdate={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
