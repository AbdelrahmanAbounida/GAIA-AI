"use client";

import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Palette, Globe, Shield, Database } from "lucide-react";
import { useTheme } from "next-themes";

const llmOptions = [
  { value: "openai/gpt-4o", label: "OpenAI GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
  { value: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "anthropic/claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
];

const embeddingOptions = [
  {
    value: "openai/text-embedding-3-small",
    label: "OpenAI text-embedding-3-small",
  },
  {
    value: "openai/text-embedding-3-large",
    label: "OpenAI text-embedding-3-large",
  },
  {
    value: "huggingface/all-MiniLM-L6-v2",
    label: "HuggingFace all-MiniLM-L6-v2",
  },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const { setTheme, theme } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-6 ">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">
          Configure global preferences for RAG Studio
        </p>
      </div>

      {/* Default Models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Default Models
          </CardTitle>
          <CardDescription>Set default models for new projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default LLM</Label>
            <Select
              value={settings.defaultLLM}
              onValueChange={(value) => updateSettings({ defaultLLM: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {llmOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Embedding Model</Label>
            <Select
              value={settings.defaultEmbedding}
              onValueChange={(value) =>
                updateSettings({ defaultEmbedding: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {embeddingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme for the interface
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Network & Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Network & Sharing
          </CardTitle>
          <CardDescription>
            Configure network access and collaboration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Network Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow other users on your network to access the app
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Network Port</Label>
            <Input type="number" placeholder="3000" defaultValue="3000" />
            <p className="text-xs text-muted-foreground">
              Port to use when network access is enabled
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure API endpoints for deployments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Base URL</Label>
            <Input placeholder="https://api.example.com" defaultValue="" />
            <p className="text-xs text-muted-foreground">
              Base URL for deployed RAG APIs
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable API Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require API keys for deployed endpoints
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Clear All Data</Label>
              <p className="text-sm text-muted-foreground">
                Delete all projects, credentials, and settings
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
