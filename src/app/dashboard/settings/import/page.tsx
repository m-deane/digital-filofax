"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Clock,
  FileJson,
  FileSpreadsheet,
  Smartphone,
} from "lucide-react";
import { generateCSVTemplate } from "@/lib/import";

type ImportSource = "CSV" | "TODOIST" | "APPLE_REMINDERS" | "JSON";

type ImportResult = {
  success: boolean;
  recordsImported: number;
  errors: string[];
  warnings?: string[];
};

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<ImportSource>("CSV");
  const [fileContent, setFileContent] = useState<string>("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = api.useUtils();
  const { data: importHistory, refetch: refetchHistory } = api.import.getImportHistory.useQuery();
  const { data: stats } = api.import.getImportStats.useQuery();

  const importFromCSV = api.import.importFromCSV.useMutation();
  const importFromTodoist = api.import.importFromTodoist.useMutation();
  const importFromAppleReminders = api.import.importFromAppleReminders.useMutation();
  const importFromJSON = api.import.importFromJSON.useMutation();

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files[0];
      if (!file) return;

      setSelectedFile(file);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !fileContent) {
      alert("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setImportResult(null);

    try {
      let result: ImportResult | undefined;

      switch (importSource) {
        case "CSV":
          result = await importFromCSV.mutateAsync({
            csvContent: fileContent,
            filename: selectedFile.name,
          });
          break;
        case "TODOIST":
          result = await importFromTodoist.mutateAsync({
            jsonContent: fileContent,
            filename: selectedFile.name,
          });
          break;
        case "APPLE_REMINDERS":
          result = await importFromAppleReminders.mutateAsync({
            jsonContent: fileContent,
            filename: selectedFile.name,
          });
          break;
        case "JSON":
          result = await importFromJSON.mutateAsync({
            jsonContent: fileContent,
            filename: selectedFile.name,
          });
          break;
      }

      setImportResult(result ?? null);
      await refetchHistory();
      void utils.import.getImportStats.invalidate();
    } catch (error) {
      setImportResult({
        success: false,
        recordsImported: 0,
        errors: [error instanceof Error ? error.message : "Import failed"],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filofax-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="mt-2 text-muted-foreground">
          Import tasks from CSV files, Todoist, Apple Reminders, or JSON backups
        </p>
      </div>

      {/* Import Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalImports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">From CSV</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bySource.CSV}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">From JSON</CardTitle>
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.bySource.JSON + stats.bySource.TODOIST + stats.bySource.APPLE_REMINDERS}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={importSource} onValueChange={(value) => setImportSource(value as ImportSource)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="CSV">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="TODOIST">
            <FileJson className="mr-2 h-4 w-4" />
            Todoist
          </TabsTrigger>
          <TabsTrigger value="APPLE_REMINDERS">
            <Smartphone className="mr-2 h-4 w-4" />
            Apple Reminders
          </TabsTrigger>
          <TabsTrigger value="JSON">
            <FileText className="mr-2 h-4 w-4" />
            JSON Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="CSV" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from CSV</CardTitle>
              <CardDescription>
                Import tasks from a CSV file. Required column: title. Optional columns: description,
                dueDate, priority, status, category, tags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <FileUploadArea
                onFileSelect={handleFileSelect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                selectedFile={selectedFile}
                accept=".csv"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="TODOIST" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from Todoist</CardTitle>
              <CardDescription>
                Import tasks from a Todoist JSON export. Go to Todoist Settings → Backups → Export as
                JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadArea
                onFileSelect={handleFileSelect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                selectedFile={selectedFile}
                accept=".json"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="APPLE_REMINDERS" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from Apple Reminders</CardTitle>
              <CardDescription>
                Import reminders from an Apple Reminders JSON export. Export your reminders to a JSON
                file first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadArea
                onFileSelect={handleFileSelect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                selectedFile={selectedFile}
                accept=".json"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="JSON" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from JSON Backup</CardTitle>
              <CardDescription>
                Restore tasks from a JSON backup created by this app&apos;s export feature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadArea
                onFileSelect={handleFileSelect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                selectedFile={selectedFile}
                accept=".json"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Button */}
      {selectedFile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Ready to import</p>
                <p className="text-sm text-muted-foreground">
                  File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              </div>
              <Button onClick={handleImport} disabled={isProcessing} size="lg">
                {isProcessing ? "Importing..." : "Import Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Import Successful
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {importResult.recordsImported} {importResult.recordsImported === 1 ? "task" : "tasks"}{" "}
                imported successfully
              </p>

              {importResult.warnings && importResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">Warnings:</p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {importResult.warnings.map((warning, i) => (
                        <li key={i} className="text-sm">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">Errors:</p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i} className="text-sm">
                          {error}
                        </li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-sm italic">
                          ... and {importResult.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Recent imports and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {importHistory && importHistory.length > 0 ? (
            <div className="space-y-4">
              {importHistory.map((log) => (
                <div key={log.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <div className="flex-shrink-0">
                    {log.errors.length === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : log.recordsImported > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{log.filename}</p>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                      <span>Source: {log.source}</span>
                      <span>Records: {log.recordsImported}</span>
                      {log.errors.length > 0 && <span>Errors: {log.errors.length}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No import history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// File Upload Area Component
function FileUploadArea({
  onFileSelect,
  onDrop,
  onDragOver,
  selectedFile,
  accept,
}: {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  selectedFile: File | null;
  accept: string;
}) {
  return (
    <div>
      <Label htmlFor="file-upload" className="block text-sm font-medium">
        Select File
      </Label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 transition-colors hover:border-gray-400"
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={accept}
                onChange={onFileSelect}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">
            {accept === ".csv" ? "CSV files only" : "JSON files only"}
          </p>
          {selectedFile && (
            <p className="mt-2 text-sm font-medium text-green-600">
              Selected: {selectedFile.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
