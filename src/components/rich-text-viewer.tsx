"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextViewerProps {
  content: string;
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const parsedContent = parseContent(content);

  const editor = useEditor({
    extensions: [StarterKit],
    content: parsedContent,
    editable: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      className="prose prose-sm dark:prose-invert max-w-none [&_.tiptap]:outline-none"
    />
  );
}

function parseContent(
  value: string
): string | Record<string, unknown> {
  if (!value) return "";
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return `<p>${value}</p>`;
  }
}
