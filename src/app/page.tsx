import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Calendar,
  Target,
  FileText,
  Lightbulb,
  Github,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="font-bold">Filofax</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              Your Digital
              <span className="text-primary"> Filofax</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              A comprehensive personal organization app that brings your paper
              planner into the digital age. Track tasks, habits, notes, and
              ideas - all in one place.
            </p>
            <div className="space-x-4">
              <Link href="/auth/login">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to stay organized and productive
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Task Management</h3>
                <p className="text-sm text-muted-foreground">
                  Organize tasks by categories, track weekly and monthly
                  to-do lists with full customization.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Weekly & Monthly Planners</h3>
                <p className="text-sm text-muted-foreground">
                  Visual calendar views for planning your week and month
                  with drag-and-drop scheduling.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Habit Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track daily habits with streak tracking, heatmaps, and
                  completion analytics.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Memo Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Capture notes, anecdotes, and quick thoughts with
                  tagging and full-text search.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Idea Board</h3>
                <p className="text-sm text-muted-foreground">
                  Capture and develop ideas with kanban-style organization
                  and status tracking.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Integrations</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with GitHub and Google Calendar for a unified
                  command center experience.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with Next.js, Tailwind CSS, and shadcn/ui.
          </p>
        </div>
      </footer>
    </div>
  );
}
