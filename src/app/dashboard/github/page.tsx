"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Github,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  GitPullRequest,
  CircleDot,
  RefreshCw,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

interface GitHubRepo {
  id: string;
  repoFullName: string;
  displayName: string | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function RepoCard({
  repo,
  onDelete,
  onToggleActive,
  onSync,
  isDeleting,
  isToggling,
}: {
  repo: GitHubRepo;
  onDelete: () => void;
  onToggleActive: () => void;
  onSync: () => void;
  isDeleting: boolean;
  isToggling: boolean;
  isSyncing: boolean;
}) {
  const { data: stats, isLoading: statsLoading } = api.github.getStats.useQuery(
    { repoId: repo.id },
    { enabled: repo.isActive }
  );

  const displayName = repo.displayName || repo.repoFullName;
  const repoUrl = `https://github.com/${repo.repoFullName}`;

  return (
    <Card className={cn("transition-opacity", !repo.isActive && "opacity-60")}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Github className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1 truncate"
                >
                  {displayName}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">
                {repo.repoFullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={repo.isActive ? "default" : "secondary"}>
              {repo.isActive ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isDeleting || isToggling}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggleActive}>
                  {repo.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSync} disabled={!repo.isActive}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {repo.isActive && (
          <>
            {statsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Open Issues</p>
                      <p className="text-lg font-semibold">{stats.openIssues}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Open PRs</p>
                      <p className="text-lg font-semibold">{stats.openPRs}</p>
                    </div>
                  </div>
                </div>
                {repo.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced {formatDistanceToNow(new Date(repo.lastSyncAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            ) : null}
          </>
        )}
        {!repo.isActive && (
          <p className="text-sm text-muted-foreground">
            This repository is inactive. Activate it to see stats and issues.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function GitHubPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [owner, setOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: repos, isLoading, error } = api.github.getAll.useQuery();

  const createRepo = api.github.create.useMutation({
    onSuccess: () => {
      utils.github.getAll.invalidate();
      setIsCreateOpen(false);
      setOwner("");
      setRepoName("");
      setDisplayName("");
    },
    onError: (error) => {
      console.error("Failed to add repository:", error);
    },
  });

  const deleteRepo = api.github.delete.useMutation({
    onSuccess: () => {
      utils.github.getAll.invalidate();
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const toggleActive = api.github.toggleActive.useMutation({
    onSuccess: () => {
      utils.github.getAll.invalidate();
      setTogglingId(null);
    },
    onError: () => {
      setTogglingId(null);
    },
  });

  const syncRepo = api.github.syncRepo.useMutation({
    onSuccess: () => {
      utils.github.getAll.invalidate();
      setSyncingId(null);
    },
    onError: () => {
      setSyncingId(null);
    },
  });

  const handleCreateRepo = () => {
    if (!owner.trim() || !repoName.trim()) return;
    createRepo.mutate({
      owner: owner.trim(),
      name: repoName.trim(),
      displayName: displayName.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteRepo.mutate({ id });
  };

  const handleToggleActive = (id: string) => {
    setTogglingId(id);
    toggleActive.mutate({ id });
  };

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncRepo.mutate({ id });
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading repositories: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GitHub Integration</h1>
          <p className="text-muted-foreground">
            Connect your GitHub repositories to track issues and pull requests
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add GitHub Repository</DialogTitle>
              <DialogDescription>
                Connect a GitHub repository to track its issues and pull requests
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Repository Owner</Label>
                <Input
                  id="owner"
                  placeholder="e.g., facebook"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repoName">Repository Name</Label>
                <Input
                  id="repoName"
                  placeholder="e.g., react"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (Optional)</Label>
                <Input
                  id="displayName"
                  placeholder="e.g., React Framework"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Example: For https://github.com/facebook/react, enter &quot;facebook&quot; as owner and &quot;react&quot; as name
              </p>
              {createRepo.error && (
                <p className="text-sm text-destructive">{createRepo.error.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRepo}
                disabled={createRepo.isPending || !owner.trim() || !repoName.trim()}
              >
                {createRepo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Repository
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!repos || repos.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Github className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No repositories connected yet. Add your first repository!
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Repository
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Repository List */}
      {!isLoading && repos && repos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo as GitHubRepo}
              onDelete={() => handleDelete(repo.id)}
              onToggleActive={() => handleToggleActive(repo.id)}
              onSync={() => handleSync(repo.id)}
              isDeleting={deletingId === repo.id}
              isToggling={togglingId === repo.id}
              isSyncing={syncingId === repo.id}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      {!isLoading && repos && repos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About GitHub Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The GitHub integration allows you to track issues and pull requests from your repositories.
            </p>
            <p>
              Note: Issue and PR data are currently placeholders. Full GitHub API integration will be available in a future update.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
