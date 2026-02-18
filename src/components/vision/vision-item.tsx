"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Maximize2 } from "lucide-react";

type Position = { x: number; y: number };
type Size = { width: number; height: number };

interface VisionItemProps {
  item: {
    id: string;
    type: string;
    content: string;
    position: Position;
    size: Size;
    color: string | null;
  };
  onPositionChange: (itemId: string, position: Position) => void;
  onSizeChange: (itemId: string, size: Size) => void;
  onDelete: (itemId: string) => void;
}

export function VisionItem({
  item,
  onPositionChange,
  onSizeChange,
  onDelete,
}: VisionItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ size: Size; mouse: Position }>({
    size: { width: 0, height: 0 },
    mouse: { x: 0, y: 0 },
  });
  const [localPosition, setLocalPosition] = useState<Position>(
    item.position as Position
  );
  const [localSize, setLocalSize] = useState<Size>(item.size as Size);

  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalPosition(item.position as Position);
    setLocalSize(item.size as Size);
  }, [item.position, item.size]);

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - localPosition.x,
      y: e.clientY - localPosition.y,
    });
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, e.clientX - dragStart.x);
    const newY = Math.max(0, e.clientY - dragStart.y);
    setLocalPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(item.id, localPosition);
    }
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      size: { ...localSize },
      mouse: { x: e.clientX, y: e.clientY },
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStart.mouse.x;
    const deltaY = e.clientY - resizeStart.mouse.y;
    const newWidth = Math.max(150, resizeStart.size.width + deltaX);
    const newHeight = Math.max(100, resizeStart.size.height + deltaY);
    setLocalSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    if (isResizing) {
      setIsResizing(false);
      onSizeChange(item.id, localSize);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing]);

  const getItemStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: `${localPosition.x}px`,
      top: `${localPosition.y}px`,
      width: `${localSize.width}px`,
      height: `${localSize.height}px`,
      cursor: isDragging ? "grabbing" : "grab",
      userSelect: "none",
    };

    if (item.type === "IMAGE") {
      return baseStyle;
    }

    return {
      ...baseStyle,
      backgroundColor: item.color || "#6366f1",
    };
  };

  const renderContent = () => {
    if (item.type === "IMAGE") {
      return (
        <div className="w-full h-full relative">
          <Image
            src={item.content}
            alt="Vision board item"
            fill
            className="object-cover rounded-lg"
            draggable={false}
          />
        </div>
      );
    }

    const textColor =
      item.color && parseInt(item.color.replace("#", ""), 16) > 0xffffff / 2
        ? "text-gray-900"
        : "text-white";

    return (
      <div className={`p-4 h-full flex flex-col justify-center items-center ${textColor}`}>
        <p
          className={`text-center ${
            item.type === "AFFIRMATION"
              ? "text-2xl font-bold"
              : item.type === "GOAL"
              ? "text-xl font-semibold"
              : "text-lg"
          }`}
        >
          {item.content}
        </p>
        {item.type === "AFFIRMATION" && (
          <span className="text-sm opacity-80 mt-2">✨</span>
        )}
        {item.type === "GOAL" && <span className="text-sm opacity-80 mt-2">🎯</span>}
      </div>
    );
  };

  return (
    <Card
      ref={itemRef}
      className="group shadow-lg hover:shadow-xl transition-shadow border-2"
      style={getItemStyle()}
      onMouseDown={handleDragStart}
    >
      {/* Control buttons */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="icon"
          variant="destructive"
          className="h-6 w-6 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Drag handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
      </div>

      {/* Content */}
      <div className="w-full h-full rounded-lg overflow-hidden">{renderContent()}</div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeStart}
      >
        <Maximize2 className="h-3 w-3 text-muted-foreground" />
      </div>
    </Card>
  );
}
