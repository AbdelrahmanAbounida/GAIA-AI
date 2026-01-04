"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Key, LockIcon, LockKeyhole, KeyRoundIcon } from "lucide-react";
import { ApiKeyTable } from "@/components/tables/api-keys-table";
import { useApiKeys } from "@/hooks/use-apikeys";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import { cn } from "@/lib/utils";
import { CreateKeyModal } from "@/components/modals/apikey-modal";
import { useCurrentProjectId } from "@/hooks/use-projects";

export default function APIKeyPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const { apiKeys, isPending, createMutation, deleteMutation } = useApiKeys();
  const { projectId } = useCurrentProjectId();

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

  if (isPending) {
    return (
      <main className="  p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              API Keys
            </h1>
            <p className="mt-2 text-muted-foreground">
              You can create apikey to use the platform through API (Headless
              mode)
            </p>
          </div>
          <TableSkeleton className="w-full" showHeader cells={4} rows={5} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen  p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            API Keys
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your GAIA API keys for accessing the platform through API
          </p>
        </div>

        <Card
          className={cn(
            "shadow-none!",
            apiKeys && apiKeys.length > 0 && "bg-transparent border-none"
          )}
        >
          <CardContent className="p-0 m-0 ">
            {apiKeys && apiKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="dark:bg-gaia-800 p-3 border border-gaia-600/30 mb-4 rounded-full flex items-center justify-center">
                  <KeyRoundIcon className=" size-7 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No API keys yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground/70 max-w-lg">
                  Create an API key to start using the platform
                  programmatically. Keys allow you to authenticate API requests.
                </p>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg dark:bg-gaia-800 border dark:border-gaia-700">
                      <Key className="h-5 w-5 dark:text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Your API Keys</h2>
                      <p className="text-sm text-muted-foreground">
                        {apiKeys.length} key{apiKeys.length !== 1 ? "s" : ""}{" "}
                        total
                      </p>
                    </div>
                  </div>
                  {apiKeys.length > 0 && (
                    <Button
                      variant={"brand"}
                      size={"sm"}
                      onClick={() => setIsCreateOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create New Key
                    </Button>
                  )}
                </div>
                <ApiKeyTable keys={apiKeys} onDelete={handleDeleteKey} />
              </div>
            )}
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

// Helper function to generate API key
function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "gaia_";
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
