"use client";

import { SuggestionsPanel } from "@/components/dashboard/suggestions-panel";

export default function SuggestionsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Suggestions</h1>
        <p className="text-muted-foreground mt-1">
          Let AI help you stay organized with smart task recommendations
        </p>
      </div>

      <SuggestionsPanel />
    </div>
  );
}
