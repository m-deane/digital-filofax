"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Image as ImageIcon,
  Type,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { VisionItem } from "@/components/vision/vision-item";

type Position = { x: number; y: number };
type Size = { width: number; height: number };

interface VisionBoardCanvasProps {
  board: {
    id: string;
    name: string;
    bgColor: string;
    bgImage: string | null;
    items: Array<{
      id: string;
      type: string;
      content: string;
      position: Position;
      size: Size;
      color: string | null;
    }>;
  };
  items: Array<{
    id: string;
    type: string;
    content: string;
    position: Position;
    size: Size;
    color: string | null;
  }>;
  isFullScreen?: boolean;
  onExitFullScreen?: () => void;
}

export function VisionBoardCanvas({
  board,
  items,
  isFullScreen = false,
  onExitFullScreen,
}: VisionBoardCanvasProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<string>("TEXT");

  // Mutations
  const createItem = api.vision.createItem.useMutation({
    onSuccess: () => {
      utils.vision.getBoard.invalidate();
      setIsAddItemOpen(false);
      toast({ title: "Item added to vision board" });
    },
  });

  const deleteItem = api.vision.deleteItem.useMutation({
    onSuccess: () => {
      utils.vision.getBoard.invalidate();
      toast({ title: "Item removed" });
    },
  });

  const updatePosition = api.vision.updatePosition.useMutation({
    onSuccess: () => {
      utils.vision.getBoard.invalidate();
    },
  });

  const updateSize = api.vision.updateSize.useMutation({
    onSuccess: () => {
      utils.vision.getBoard.invalidate();
    },
  });

  const uploadImage = api.vision.uploadImage.useMutation({
    onSuccess: () => {
      utils.vision.getBoard.invalidate();
      setIsAddItemOpen(false);
      toast({ title: "Image added to vision board" });
    },
  });

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const color = formData.get("color") as string;

    // Place new item in center of visible canvas
    const canvas = canvasRef.current;
    const centerX = canvas ? canvas.scrollWidth / 2 - 150 : 400;
    const centerY = canvas ? canvas.scrollHeight / 2 - 100 : 300;

    createItem.mutate({
      boardId: board.id,
      type: selectedItemType as "IMAGE" | "TEXT" | "GOAL" | "AFFIRMATION",
      content,
      position: { x: centerX, y: centerY },
      size: { width: 300, height: 200 },
      color: color || undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      const canvas = canvasRef.current;
      const centerX = canvas ? canvas.scrollWidth / 2 - 150 : 400;
      const centerY = canvas ? canvas.scrollHeight / 2 - 100 : 300;

      uploadImage.mutate({
        boardId: board.id,
        base64,
        position: { x: centerX, y: centerY },
        size: { width: 300, height: 200 },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Remove this item from your vision board?")) {
      deleteItem.mutate({ id: itemId });
    }
  };

  const handlePositionChange = (itemId: string, position: Position) => {
    updatePosition.mutate({ id: itemId, position });
  };

  const handleSizeChange = (itemId: string, size: Size) => {
    updateSize.mutate({ id: itemId, size });
  };

  return (
    <div
      className={`relative ${
        isFullScreen
          ? "fixed inset-0 z-50 bg-background"
          : "rounded-lg border overflow-hidden"
      }`}
    >
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Vision Board</DialogTitle>
                  <DialogDescription>
                    Choose what you&apos;d like to add to your board
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedItemType === "TEXT" ? "default" : "outline"}
                      onClick={() => setSelectedItemType("TEXT")}
                      className="gap-2"
                    >
                      <Type className="h-4 w-4" />
                      Text
                    </Button>
                    <Button
                      variant={selectedItemType === "AFFIRMATION" ? "default" : "outline"}
                      onClick={() => setSelectedItemType("AFFIRMATION")}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Affirmation
                    </Button>
                    <Button
                      variant={selectedItemType === "GOAL" ? "default" : "outline"}
                      onClick={() => setSelectedItemType("GOAL")}
                      className="gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Goal
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {selectedItemType !== "IMAGE" && (
                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="content">
                          {selectedItemType === "AFFIRMATION"
                            ? "Affirmation"
                            : selectedItemType === "GOAL"
                            ? "Goal"
                            : "Text"}
                        </Label>
                        <Textarea
                          id="content"
                          name="content"
                          placeholder={
                            selectedItemType === "AFFIRMATION"
                              ? "I am capable of achieving my dreams"
                              : selectedItemType === "GOAL"
                              ? "Run a marathon by December"
                              : "Enter your text"
                          }
                          required
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Color (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="color"
                            name="color"
                            type="color"
                            defaultValue="#6366f1"
                            className="w-20"
                          />
                          <Input
                            type="text"
                            defaultValue="#6366f1"
                            placeholder="#6366f1"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={createItem.isPending}>
                        Add to Board
                      </Button>
                    </form>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {isFullScreen && onExitFullScreen && (
            <Button variant="outline" size="sm" onClick={onExitFullScreen}>
              <X className="h-4 w-4 mr-2" />
              Exit Full Screen
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative overflow-auto ${
          isFullScreen ? "h-[calc(100vh-80px)]" : "h-[600px]"
        }`}
        style={{
          backgroundColor: board.bgColor,
          backgroundImage: board.bgImage ? `url(${board.bgImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative min-w-[1200px] min-h-[800px] p-8">
          {items.map((item) => (
            <VisionItem
              key={item.id}
              item={item}
              onPositionChange={handlePositionChange}
              onSizeChange={handleSizeChange}
              onDelete={handleDeleteItem}
            />
          ))}

          {items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-8 rounded-lg bg-background/80 backdrop-blur">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Start Your Vision Board</h3>
                  <p className="text-sm text-muted-foreground">
                    Add images, affirmations, and goals to visualize your dreams
                  </p>
                </div>
                <Button onClick={() => setIsAddItemOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
