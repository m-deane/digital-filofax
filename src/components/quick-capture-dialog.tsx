"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckSquare,
  FileText,
  Lightbulb,
  Inbox,
  Loader2,
  Calendar,
  Tag,
  AlertCircle,
  Mic,
  MicOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import {
  parseTaskInput,
  hasNlpTokens,
  formatParsedPreview,
} from "@/lib/nlp-parser";

type CaptureType = "task" | "memo" | "idea" | "inbox";

// Minimal typings for Web Speech API (not always included in lib.dom)
interface SpeechRecognitionResult {
  readonly 0: { readonly transcript: string };
}
interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

const captureTypes: {
  type: CaptureType;
  label: string;
  icon: typeof CheckSquare;
  placeholder: string;
}[] = [
  { type: "inbox", label: "Inbox", icon: Inbox, placeholder: "What's on your mind? File it later." },
  {
    type: "task",
    label: "Task",
    icon: CheckSquare,
    placeholder: 'What needs to be done? Try "Call dentist tomorrow !high #health"',
  },
  { type: "memo", label: "Note", icon: FileText, placeholder: "Quick note..." },
  { type: "idea", label: "Idea", icon: Lightbulb, placeholder: "What's on your mind?" },
];

interface QuickCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCaptureDialog({ open, onOpenChange }: QuickCaptureDialogProps) {
  const [captureType, setCaptureType] = useState<CaptureType>("inbox");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  // Check Web Speech API support on mount
  useEffect(() => {
    setVoiceSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    type SRConstructor = new () => MinimalSpeechRecognition;
    const win = window as unknown as Record<string, unknown>;
    const SR = (win["SpeechRecognition"] ?? win["webkitSpeechRecognition"]) as SRConstructor | undefined;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) setTitle(transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const toggleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const createTask = api.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.tasks.getDueSoon.invalidate();
      handleClose();
    },
  });

  const createMemo = api.memos.create.useMutation({
    onSuccess: () => {
      utils.memos.getAll.invalidate();
      handleClose();
    },
  });

  const createIdea = api.ideas.create.useMutation({
    onSuccess: () => {
      utils.ideas.getAll.invalidate();
      handleClose();
    },
  });

  const createInboxItem = api.inbox.create.useMutation({
    onSuccess: () => {
      utils.inbox.getAll.invalidate();
      utils.inbox.getCount.invalidate();
      handleClose();
    },
  });

  const isPending = createTask.isPending || createMemo.isPending || createIdea.isPending || createInboxItem.isPending;

  // NLP parsing (only for task type)
  const parsed = useMemo(() => {
    if (captureType !== "task" || !hasNlpTokens(title)) return null;
    return parseTaskInput(title);
  }, [captureType, title]);

  const nlpPreview = parsed ? formatParsedPreview(parsed) : null;

  // Auto-focus input when dialog opens; stop recording when it closes
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      stopRecording();
    }
  }, [open, stopRecording]);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setCaptureType("inbox");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    switch (captureType) {
      case "task": {
        const taskTitle = parsed?.title || title.trim();
        createTask.mutate({
          title: taskTitle,
          description: description.trim() || undefined,
          priority: parsed?.priority ?? "MEDIUM",
          status: "TODO",
          dueDate: parsed?.dueDate ?? undefined,
        });
        break;
      }
      case "memo":
        createMemo.mutate({
          title: title.trim(),
          content: description.trim(),
          memoType: "NOTE",
        });
        break;
      case "idea":
        createIdea.mutate({
          title: title.trim(),
          description: description.trim() || undefined,
        });
        break;
      case "inbox":
        createInboxItem.mutate({
          title: title.trim(),
          content: description.trim() || undefined,
        });
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl+Enter to submit
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentType = captureTypes.find((t) => t.type === captureType)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Quick Capture</DialogTitle>
          <DialogDescription>
            Jot it down now, organize later
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input field + optional mic button */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRecording ? "Listening…" : currentType.placeholder}
              className={cn("text-base flex-1", isRecording && "border-red-400 ring-1 ring-red-400")}
              autoComplete="off"
            />
            {voiceSupported && (
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                className="flex-shrink-0"
                onClick={toggleVoice}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* NLP preview (task type only) */}
          {captureType === "task" && nlpPreview && (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <div className="min-w-0">
                {parsed?.title && parsed.title !== title.trim() && (
                  <p className="font-medium text-foreground truncate">{parsed.title}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {parsed?.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {parsed.dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      {parsed.dueTime && ` at ${parsed.dueTime}`}
                    </span>
                  )}
                  {parsed?.priority && (
                    <span className={cn("font-medium", {
                      "text-red-500": parsed.priority === "URGENT",
                      "text-orange-500": parsed.priority === "HIGH",
                      "text-yellow-500": parsed.priority === "MEDIUM",
                      "text-gray-400": parsed.priority === "LOW",
                    })}>
                      {parsed.priority.charAt(0) + parsed.priority.slice(1).toLowerCase()}
                    </span>
                  )}
                  {parsed?.categories.map((cat) => (
                    <span key={cat} className="flex items-center gap-0.5">
                      <Tag className="h-3 w-3" />
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional description */}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details (optional)"
            rows={2}
            className="resize-none"
          />

          {/* Type selector - secondary */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Save as:</span>
            {captureTypes.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                type="button"
                variant={captureType === type ? "default" : "outline"}
                size="sm"
                className={cn("gap-1.5 h-8", captureType === type && "shadow-sm")}
                onClick={() => setCaptureType(type)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <kbd className="text-xs text-muted-foreground">
              <span className="rounded border bg-muted px-1 py-0.5 font-mono">
                {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+Enter
              </span>
              {" "}to save
            </kbd>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {currentType.label}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
