"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Key } from "lucide-react";
import { ApiKeyTable } from "@/components/tables/api-keys-table";
import { useApiKeys } from "@/hooks/use-apikeys";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import { generateApiKey } from "@/lib/utils";
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
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

        <Card className="shadow-none border-none bg-transparent">
          <CardContent className="p-0 m-0">
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
