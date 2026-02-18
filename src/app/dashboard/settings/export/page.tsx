"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, FileJson, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  exportAsJSON,
  exportAsCSV,
  prepareTasksForCSV,
  prepareHabitsForCSV,
  prepareMemosForCSV,
  prepareContactsForCSV,
} from "@/lib/export";

type ExportStatus = "idle" | "loading" | "success" | "error";

export default function ExportPage() {
  const { toast } = useToast();
  const [exportStatuses, setExportStatuses] = useState<Record<string, ExportStatus>>({});

  const setStatus = (key: string, status: ExportStatus) => {
    setExportStatuses((prev) => ({ ...prev, [key]: status }));
  };

  const handleExportComplete = (key: string) => {
    setStatus(key, "success");
    toast({
      title: "Export successful",
      description: "Your data has been downloaded",
    });
    setTimeout(() => setStatus(key, "idle"), 2000);
  };

  const handleExportError = (key: string, error: Error) => {
    setStatus(key, "error");
    toast({
      title: "Export failed",
      description: error.message,
      variant: "destructive",
    });
    setTimeout(() => setStatus(key, "idle"), 2000);
  };

  // Export All Data (JSON)
  const exportAllMutation = api.export.exportAll.useQuery(undefined, {
    enabled: false,
  });

  const handleExportAll = async () => {
    const key = "all";
    setStatus(key, "loading");

    try {
      const data = await exportAllMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-all-data");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Tasks
  const exportTasksMutation = api.export.exportTasks.useQuery(undefined, {
    enabled: false,
  });

  const handleExportTasksJSON = async () => {
    const key = "tasks-json";
    setStatus(key, "loading");

    try {
      const data = await exportTasksMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-tasks");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  const handleExportTasksCSV = async () => {
    const key = "tasks-csv";
    setStatus(key, "loading");

    try {
      const data = await exportTasksMutation.refetch();
      if (data.data) {
        const preparedData = prepareTasksForCSV(data.data);
        exportAsCSV(preparedData, "filofax-tasks");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Habits
  const exportHabitsMutation = api.export.exportHabits.useQuery(undefined, {
    enabled: false,
  });

  const handleExportHabitsJSON = async () => {
    const key = "habits-json";
    setStatus(key, "loading");

    try {
      const data = await exportHabitsMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-habits");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  const handleExportHabitsCSV = async () => {
    const key = "habits-csv";
    setStatus(key, "loading");

    try {
      const data = await exportHabitsMutation.refetch();
      if (data.data) {
        const preparedData = prepareHabitsForCSV(data.data);
        exportAsCSV(preparedData, "filofax-habits");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Memos
  const exportMemosMutation = api.export.exportMemos.useQuery(undefined, {
    enabled: false,
  });

  const handleExportMemosJSON = async () => {
    const key = "memos-json";
    setStatus(key, "loading");

    try {
      const data = await exportMemosMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-memos");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  const handleExportMemosCSV = async () => {
    const key = "memos-csv";
    setStatus(key, "loading");

    try {
      const data = await exportMemosMutation.refetch();
      if (data.data) {
        const preparedData = prepareMemosForCSV(data.data);
        exportAsCSV(preparedData, "filofax-memos");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Ideas
  const exportIdeasMutation = api.export.exportIdeas.useQuery(undefined, {
    enabled: false,
  });

  const handleExportIdeasJSON = async () => {
    const key = "ideas-json";
    setStatus(key, "loading");

    try {
      const data = await exportIdeasMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-ideas");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Contacts
  const exportContactsMutation = api.export.exportContacts.useQuery(undefined, {
    enabled: false,
  });

  const handleExportContactsJSON = async () => {
    const key = "contacts-json";
    setStatus(key, "loading");

    try {
      const data = await exportContactsMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-contacts");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  const handleExportContactsCSV = async () => {
    const key = "contacts-csv";
    setStatus(key, "loading");

    try {
      const data = await exportContactsMutation.refetch();
      if (data.data) {
        const preparedData = prepareContactsForCSV(data.data);
        exportAsCSV(preparedData, "filofax-contacts");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Goals
  const exportGoalsMutation = api.export.exportGoals.useQuery(undefined, {
    enabled: false,
  });

  const handleExportGoalsJSON = async () => {
    const key = "goals-json";
    setStatus(key, "loading");

    try {
      const data = await exportGoalsMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-goals");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Finance
  const exportFinanceMutation = api.export.exportFinance.useQuery(undefined, {
    enabled: false,
  });

  const handleExportFinanceJSON = async () => {
    const key = "finance-json";
    setStatus(key, "loading");

    try {
      const data = await exportFinanceMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-finance");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  // Export Journal
  const exportJournalMutation = api.export.exportJournal.useQuery(undefined, {
    enabled: false,
  });

  const handleExportJournalJSON = async () => {
    const key = "journal-json";
    setStatus(key, "loading");

    try {
      const data = await exportJournalMutation.refetch();
      if (data.data) {
        exportAsJSON(data.data, "filofax-journal");
        handleExportComplete(key);
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      handleExportError(key, error as Error);
    }
  };

  const getButtonContent = (status: ExportStatus, label: string) => {
    switch (status) {
      case "loading":
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Downloaded
          </>
        );
      case "error":
        return (
          <>
            <Download className="h-4 w-4" />
            Retry
          </>
        );
      default:
        return (
          <>
            <Download className="h-4 w-4" />
            {label}
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground">
          Download your data in JSON or CSV format
        </p>
      </div>

      {/* Complete Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Complete Data Export
          </CardTitle>
          <CardDescription>
            Export all your data including tasks, habits, memos, contacts, goals, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExportAll}
            disabled={exportStatuses["all"] === "loading"}
            className="gap-2"
          >
            {getButtonContent(exportStatuses["all"], "Export All Data (JSON)")}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Individual Exports */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              Export all tasks with subtasks, tags, and categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportTasksJSON}
              disabled={exportStatuses["tasks-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["tasks-json"], "Export as JSON")}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportTasksCSV}
              disabled={exportStatuses["tasks-csv"] === "loading"}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {getButtonContent(exportStatuses["tasks-csv"], "Export as CSV")}
            </Button>
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader>
            <CardTitle>Habits</CardTitle>
            <CardDescription>
              Export all habits with tracking logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportHabitsJSON}
              disabled={exportStatuses["habits-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["habits-json"], "Export as JSON")}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportHabitsCSV}
              disabled={exportStatuses["habits-csv"] === "loading"}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {getButtonContent(exportStatuses["habits-csv"], "Export as CSV")}
            </Button>
          </CardContent>
        </Card>

        {/* Memos */}
        <Card>
          <CardHeader>
            <CardTitle>Memos</CardTitle>
            <CardDescription>
              Export all notes and memos with tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportMemosJSON}
              disabled={exportStatuses["memos-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["memos-json"], "Export as JSON")}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportMemosCSV}
              disabled={exportStatuses["memos-csv"] === "loading"}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {getButtonContent(exportStatuses["memos-csv"], "Export as CSV")}
            </Button>
          </CardContent>
        </Card>

        {/* Ideas */}
        <Card>
          <CardHeader>
            <CardTitle>Ideas</CardTitle>
            <CardDescription>
              Export all ideas and brainstorming notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportIdeasJSON}
              disabled={exportStatuses["ideas-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["ideas-json"], "Export as JSON")}
            </Button>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Export all contacts with details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportContactsJSON}
              disabled={exportStatuses["contacts-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["contacts-json"], "Export as JSON")}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportContactsCSV}
              disabled={exportStatuses["contacts-csv"] === "loading"}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {getButtonContent(exportStatuses["contacts-csv"], "Export as CSV")}
            </Button>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>
              Export all goals with milestones and linked tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportGoalsJSON}
              disabled={exportStatuses["goals-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["goals-json"], "Export as JSON")}
            </Button>
          </CardContent>
        </Card>

        {/* Finance */}
        <Card>
          <CardHeader>
            <CardTitle>Finance</CardTitle>
            <CardDescription>
              Export transactions and savings goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportFinanceJSON}
              disabled={exportStatuses["finance-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["finance-json"], "Export as JSON")}
            </Button>
          </CardContent>
        </Card>

        {/* Journal */}
        <Card>
          <CardHeader>
            <CardTitle>Journal & Reflections</CardTitle>
            <CardDescription>
              Export gratitude, mood, and reflections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleExportJournalJSON}
              disabled={exportStatuses["journal-json"] === "loading"}
            >
              <FileJson className="h-4 w-4" />
              {getButtonContent(exportStatuses["journal-json"], "Export as JSON")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-sm">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>JSON Format:</strong> Complete data with all relationships and nested structures.
            Best for backup and data portability.
          </p>
          <p>
            <strong>CSV Format:</strong> Simplified, flat format compatible with spreadsheet applications.
            Nested data is flattened or converted to text.
          </p>
          <p>
            <strong>File Naming:</strong> Exported files include a timestamp in the format YYYY-MM-DD_HH-MM-SS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
