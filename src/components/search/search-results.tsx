"use client";

import { CheckSquare, FileText, Lightbulb, Target, Calendar, Users, Clock, MapPin, Mail, Phone, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/server/api/routers/search";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onResultClick?: () => void;
  className?: string;
}

const getResultIcon = (type: SearchResult["type"]) => {
  switch (type) {
    case "task":
      return CheckSquare;
    case "memo":
      return FileText;
    case "idea":
      return Lightbulb;
    case "habit":
      return Target;
    case "event":
      return Calendar;
    case "contact":
      return Users;
    default:
      return FileText;
  }
};

const getResultLink = (result: SearchResult): string => {
  switch (result.type) {
    case "task":
      return "/dashboard/tasks";
    case "memo":
      return "/dashboard/memos";
    case "idea":
      return "/dashboard/ideas";
    case "habit":
      return "/dashboard/habits";
    case "event":
      return "/dashboard/planner/weekly";
    case "contact":
      return "/dashboard/contacts";
    default:
      return "/dashboard";
  }
};

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "default";
    case "MEDIUM":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "DONE":
    case "COMPLETED":
    case "IMPLEMENTED":
      return "default";
    case "IN_PROGRESS":
    case "EXPLORING":
      return "secondary";
    default:
      return "outline";
  }
};

const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

interface TaskResultProps {
  result: SearchResult & { type: "task" };
  query: string;
  onResultClick?: () => void;
}

function TaskResult({ result, query, onResultClick }: TaskResultProps) {
  const Icon = getResultIcon(result.type);

  return (
    <Link href={getResultLink(result)} onClick={onResultClick}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">
                  {highlightMatch(result.title, query)}
                </h4>
                <Badge variant={getPriorityVariant(result.priority)} className="text-xs">
                  {result.priority}
                </Badge>
                <Badge variant={getStatusVariant(result.status)} className="text-xs">
                  {result.status}
                </Badge>
              </div>
              {result.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {highlightMatch(result.snippet, query)}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {result.category && (
                  <span className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: result.metadata?.categoryColor as string ?? "#6366f1" }}
                    />
                    {result.category}
                  </span>
                )}
                {result.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(result.dueDate), "MMM d")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface MemoResultProps {
  result: SearchResult & { type: "memo" };
  query: string;
  onResultClick?: () => void;
}

function MemoResult({ result, query, onResultClick }: MemoResultProps) {
  const Icon = getResultIcon(result.type);

  return (
    <Link href={getResultLink(result)} onClick={onResultClick}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">
                  {highlightMatch(result.title, query)}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {result.memoType}
                </Badge>
                {result.isPinned && (
                  <Badge variant="secondary" className="text-xs">
                    Pinned
                  </Badge>
                )}
              </div>
              {result.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {highlightMatch(result.snippet, query)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface IdeaResultProps {
  result: SearchResult & { type: "idea" };
  query: string;
  onResultClick?: () => void;
}

function IdeaResult({ result, query, onResultClick }: IdeaResultProps) {
  const Icon = getResultIcon(result.type);

  return (
    <Link href={getResultLink(result)} onClick={onResultClick}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">
                  {highlightMatch(result.title, query)}
                </h4>
                <Badge variant={getStatusVariant(result.status)} className="text-xs">
                  {result.status}
                </Badge>
              </div>
              {result.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {highlightMatch(result.snippet, query)}
                </p>
              )}
              {result.category && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: result.metadata?.categoryColor as string ?? "#6366f1" }}
                  />
                  {result.category}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface HabitResultProps {
  result: SearchResult & { type: "habit" };
  query: string;
  onResultClick?: () => void;
}

function HabitResult({ result, query, onResultClick }: HabitResultProps) {
  const Icon = getResultIcon(result.type);

  return (
    <Link href={getResultLink(result)} onClick={onResultClick}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">
                  {highlightMatch(result.title, query)}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {result.frequency}
                </Badge>
              </div>
              {result.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {highlightMatch(result.snippet, query)}
                </p>
              )}
              {result.category && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: result.metadata?.categoryColor as string ?? "#6366f1" }}
                  />
                  {result.category}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface EventResultProps {
  result: SearchResult & { type: "event" };
  query: string;
  onResultClick?: () => void;
}

function EventResult({ result, query, onResultClick }: EventResultProps) {
  const Icon = getResultIcon(result.type);

  return (
    <Link href={getResultLink(result)} onClick={onResultClick}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-medium">
                {highlightMatch(result.title, query)}
              </h4>
              {result.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {highlightMatch(result.snippet, query)}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(result.startDate), "MMM d, h:mm a")}
                </span>
                {result.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {result.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ContactResultProps {
  result: SearchResult & { type: "contact" };
  query: string;
  onResultClick?: () => void;
}

function ContactResult({ result, query, onResultClick }: ContactResultProps) {
  const Icon = getResultIcon(result.type);

  return (
    <Link href={getResultLink(result)} onClick={onResultClick}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-medium">
                {highlightMatch(result.title, query)}
              </h4>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {result.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {result.company}
                    {(result.metadata as { jobTitle?: string })?.jobTitle && ` - ${(result.metadata as { jobTitle?: string }).jobTitle}`}
                  </span>
                )}
                {result.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {result.email}
                  </span>
                )}
                {result.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {result.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SearchResultItem({ result, query, onResultClick }: { result: SearchResult; query: string; onResultClick?: () => void }) {
  switch (result.type) {
    case "task":
      return <TaskResult result={result} query={query} onResultClick={onResultClick} />;
    case "memo":
      return <MemoResult result={result} query={query} onResultClick={onResultClick} />;
    case "idea":
      return <IdeaResult result={result} query={query} onResultClick={onResultClick} />;
    case "habit":
      return <HabitResult result={result} query={query} onResultClick={onResultClick} />;
    case "event":
      return <EventResult result={result} query={query} onResultClick={onResultClick} />;
    case "contact":
      return <ContactResult result={result} query={query} onResultClick={onResultClick} />;
    default:
      return null;
  }
}

export function SearchResults({ results, query, onResultClick, className }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No results found for &quot;{query}&quot;
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<SearchResult["type"], string> = {
    task: "Tasks",
    memo: "Memos",
    idea: "Ideas",
    habit: "Habits",
    event: "Events",
    contact: "Contacts",
  };

  return (
    <ScrollArea className={cn("h-[400px]", className)}>
      <div className="space-y-4 p-4">
        {Object.entries(groupedResults).map(([type, typeResults]) => (
          <div key={type}>
            <h3 className="text-sm font-semibold mb-2 px-1">
              {typeLabels[type as SearchResult["type"]]} ({typeResults.length})
            </h3>
            <div className="space-y-2">
              {typeResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  query={query}
                  onResultClick={onResultClick}
                />
              ))}
            </div>
            <Separator className="mt-4" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
