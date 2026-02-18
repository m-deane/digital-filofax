"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Download,
  Loader2,
  Star,
  Maximize2,
} from "lucide-react";
import { VisionBoardCanvas } from "@/components/vision/vision-board-canvas";

export default function VisionBoardPage() {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Fetch boards
  const { data: boards, isLoading: loadingBoards } = api.vision.getBoards.useQuery();

  // Fetch current board
  const { data: currentBoard } = api.vision.getBoard.useQuery(
    { id: selectedBoardId! },
    { enabled: !!selectedBoardId }
  );

  // Set initial board
  if (!selectedBoardId && boards && boards.length > 0) {
    const defaultBoard = boards.find((b) => b.isDefault) || boards[0];
    if (defaultBoard) {
      setSelectedBoardId(defaultBoard.id);
    }
  }

  // Mutations
  const createBoard = api.vision.createBoard.useMutation({
    onSuccess: (newBoard) => {
      utils.vision.getBoards.invalidate();
      setSelectedBoardId(newBoard.id);
      setIsCreateBoardOpen(false);
      toast({ title: "Board created successfully" });
    },
  });

  const deleteBoard = api.vision.deleteBoard.useMutation({
    onSuccess: () => {
      utils.vision.getBoards.invalidate();
      setSelectedBoardId(null);
      toast({ title: "Board deleted" });
    },
  });

  const setDefaultBoard = api.vision.setDefaultBoard.useMutation({
    onSuccess: () => {
      utils.vision.getBoards.invalidate();
      toast({ title: "Default board updated" });
    },
  });

  const handleCreateBoard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const year = formData.get("year") as string;
    const bgColor = formData.get("bgColor") as string;

    createBoard.mutate({
      name,
      year: year ? parseInt(year) : undefined,
      bgColor: bgColor || "#ffffff",
      isDefault: boards?.length === 0,
    });
  };

  const handleDeleteBoard = () => {
    if (!selectedBoardId) return;
    if (confirm("Are you sure you want to delete this board? All items will be removed.")) {
      deleteBoard.mutate({ id: selectedBoardId });
    }
  };

  const handleSetDefault = () => {
    if (!selectedBoardId) return;
    setDefaultBoard.mutate({ id: selectedBoardId });
  };

  const handleExportAsImage = () => {
    toast({ title: "Export feature", description: "Coming soon!" });
  };

  if (loadingBoards) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vision Board</h1>
          <p className="text-muted-foreground">
            Create visual boards to manifest your goals and dreams
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Vision Boards</CardTitle>
            <CardDescription>
              Create your first vision board to start visualizing your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Vision Board</DialogTitle>
                  <DialogDescription>
                    Give your vision board a name and theme
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBoard} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Board Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="My 2026 Vision"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year (Optional)</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      placeholder="2026"
                      min="2020"
                      max="2100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bgColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bgColor"
                        name="bgColor"
                        type="color"
                        defaultValue="#ffffff"
                        className="w-20"
                      />
                      <Input
                        type="text"
                        defaultValue="#ffffff"
                        placeholder="#ffffff"
                        onChange={(e) => {
                          const colorInput = document.getElementById(
                            "bgColor"
                          ) as HTMLInputElement;
                          if (colorInput) colorInput.value = e.target.value;
                        }}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createBoard.isPending}>
                    {createBoard.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Board
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vision Board</h1>
          <p className="text-muted-foreground">
            Visualize your goals, dreams, and aspirations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Vision Board</DialogTitle>
                <DialogDescription>
                  Give your vision board a name and theme
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Board Name</Label>
                  <Input id="name" name="name" placeholder="My 2026 Vision" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year (Optional)</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="2026"
                    min="2020"
                    max="2100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      name="bgColor"
                      type="color"
                      defaultValue="#ffffff"
                      className="w-20"
                    />
                    <Input type="text" defaultValue="#ffffff" placeholder="#ffffff" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createBoard.isPending}>
                  {createBoard.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Board
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Board Selector & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedBoardId || ""} onValueChange={setSelectedBoardId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a board" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                  {board.isDefault && " ⭐"}
                  {board.year && ` (${board.year})`}
                  {board._count && ` - ${board._count.items} items`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedBoardId && (
          <>
            {!currentBoard?.isDefault && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleSetDefault}
              >
                <Star className="h-4 w-4" />
                Set Default
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportAsImage}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsFullScreen(!isFullScreen)}
            >
              <Maximize2 className="h-4 w-4" />
              Full Screen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDeleteBoard}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Vision Board Canvas */}
      {selectedBoardId && currentBoard && (
        <VisionBoardCanvas
          board={{
            id: currentBoard.id,
            name: currentBoard.name,
            bgColor: currentBoard.bgColor,
            bgImage: currentBoard.bgImage,
            items: (currentBoard.items || []).map((item) => ({
              id: item.id,
              type: item.type,
              content: item.content,
              position: item.position as { x: number; y: number },
              size: item.size as { width: number; height: number },
              color: item.color,
            })),
          }}
          items={(currentBoard.items || []).map((item) => ({
            id: item.id,
            type: item.type,
            content: item.content,
            position: item.position as { x: number; y: number },
            size: item.size as { width: number; height: number },
            color: item.color,
          }))}
          isFullScreen={isFullScreen}
          onExitFullScreen={() => setIsFullScreen(false)}
        />
      )}
    </div>
  );
}
