"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Copy, Check, Code } from "lucide-react";
import { ApiKeyTable } from "@/components/tables/api-keys-table";
import { useApiKeys } from "@/hooks/use-apikeys";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import { generateApiKey } from "@/lib/utils";
import { CreateKeyModal } from "@/components/modals/apikey-modal";
import { useCurrentProjectId } from "@/hooks/use-projects";

export default function APIKeyPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { apiKeys, isPending, createMutation, deleteMutation } = useApiKeys();
  const { projectId } = useCurrentProjectId();

  // Get base URL from window location
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}/api/v1`
      : "";

  const handleCreateKey = async (name: string) => {
    const result = await createMutation.mutateAsync({
      name,
      value: generateApiKey(),
      projectId,
    });

    if (result.success && result.apiKey) {
      setNewlyCreatedKey(result.apiKey.value);
    }
  };

  const handleDeleteKey = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setNewlyCreatedKey(null);
  };

  const copyToClipboard = async (text: string, type: "url" | "code") => {
    await navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const exampleCode = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    extra_body={
        "chatId": "your-chat-id"
    }
)

print(response.choices[0].message.content)`;

  if (isPending) {
    return (
      <main className="p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              API Keys
            </h1>
            <p className="mt-0 text-sm text-gray-500">
              Manage your GAIA API keys for accessing the platform through API
            </p>
          </div>
          <TableSkeleton className="w-full" showHeader cells={4} rows={5} />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              API Keys
            </h1>
            <p className="mt-0 text-sm text-gray-500">
              Manage your GAIA API keys for accessing the platform through API
            </p>
          </div>
          {apiKeys && apiKeys.length > 0 && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create New Key
            </Button>
          )}
        </div>

        {/* API Configuration Card */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Base URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono">
                  {baseUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(baseUrl, "url")}
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this base URL with the OpenAI SDK or any OpenAI-compatible
                client
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Example Usage (Python)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(exampleCode, "code")}
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <pre className="px-4 py-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                <code>{exampleCode}</code>
              </pre>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Available Endpoints
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-xs">
                    POST
                  </code>
                  <code className="font-mono text-xs">
                    /ai/chat/completions
                  </code>
                  <span className="text-gray-500 text-xs">
                    - OpenAI-compatible chat
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-xs">
                    POST
                  </code>
                  <code className="font-mono text-xs">
                    /ai/images/generations
                  </code>
                  <span className="text-gray-500 text-xs">
                    - Generate images
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="px-2 py-1 bg-green-50 text-green-700 rounded font-mono text-xs">
                    GET
                  </code>
                  <code className="font-mono text-xs">/ai/models</code>
                  <span className="text-gray-500 text-xs">
                    - List available models
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* API Keys Table */}
        <Card className="shadow-none border">
          <CardContent className="p-6">
            <ApiKeyTable
              keys={apiKeys || []}
              onDelete={handleDeleteKey}
              onCreateNew={() => setIsCreateOpen(true)}
            />
          </CardContent>
        </Card>

        <CreateKeyModal
          open={isCreateOpen}
          onOpenChange={handleCloseCreate}
          onCreate={handleCreateKey}
          newlyCreatedKey={newlyCreatedKey}
        />
      </div>
    </main>
  );
}
