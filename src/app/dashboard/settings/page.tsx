"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Palette,
  Bell,
  Link2,
  Shield,
  Download,
  Github,
  Calendar,
  Plus,
  Check,
  Puzzle,
} from "lucide-react";
import Link from "next/link";

const settingsSections = [
  {
    title: "Profile",
    description: "Manage your account settings",
    icon: User,
    href: "/dashboard/settings/profile",
  },
  {
    title: "Modules",
    description: "Enable or disable app features",
    icon: Puzzle,
    href: "/dashboard/settings/modules",
  },
  {
    title: "Appearance",
    description: "Customize the look and feel",
    icon: Palette,
    href: "/dashboard/settings/appearance",
  },
  {
    title: "Notifications",
    description: "Configure notification preferences",
    icon: Bell,
    href: "/dashboard/settings/notifications",
  },
  {
    title: "Integrations",
    description: "Connect external services",
    icon: Link2,
    href: "/dashboard/settings/integrations",
  },
  {
    title: "Privacy & Security",
    description: "Manage security settings",
    icon: Shield,
    href: "/dashboard/settings/security",
  },
  {
    title: "Data Export",
    description: "Export your data",
    icon: Download,
    href: "/dashboard/settings/export",
  },
];

const integrations = [
  {
    name: "GitHub",
    description: "Connect your GitHub account to sync issues and PRs",
    icon: Github,
    connected: true,
  },
  {
    name: "Google Calendar",
    description: "Sync events with Google Calendar",
    icon: Calendar,
    connected: false,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Quick Settings */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Separator />

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage task and habit categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>Work</span>
              </div>
              <Badge variant="secondary">12 tasks</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>Personal</span>
              </div>
              <Badge variant="secondary">8 tasks</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span>Learning</span>
              </div>
              <Badge variant="secondary">5 tasks</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span>Health</span>
              </div>
              <Badge variant="secondary">3 tasks</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </CardContent>
      </Card>

      {/* Integrations Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>
            External integrations and connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <integration.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {integration.description}
                  </div>
                </div>
              </div>
              {integration.connected ? (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Export All Data</div>
              <div className="text-sm text-muted-foreground">
                Download all your data as JSON
              </div>
            </div>
            <Button variant="outline">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-destructive">Delete Account</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </div>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
