"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, KeyRoundIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { CredentialsTable } from "@/components/tables/credentials-table";
import { useQuery } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { TableSkeleton } from "@/components/tables/table-skeleton";
import { cn } from "@/lib/utils";
import { useDialogs } from "@/store/use-dialogs";
import { CredentialModal } from "@/components/modals/credential-modal/credential-modal";

export default function CredentialsView() {
  const setCredentialDialogOpen = useDialogs((s) => s.setCredentialDialogOpen);
  const [page, setPage] = useState(0);
  const itemsPerPage = 9;

  // Fetch credentials
  const { data, isLoading, isError, error } = useQuery(
    orpcQueryClient.authed.credentials.list.queryOptions({
      input: {
        offset: 0,
        limit: 20,
      },
    })
  );
  const credentials = data?.credentials || [];

  // Fetch provider names for the table
  const { data: providersData, isPending: providersLoading } = useQuery(
    orpcQueryClient.authed.ai.getAllProviders.queryOptions({})
  );

  // Calculate pagination
  const total = credentials.length;
  const pageCount = Math.ceil(total / itemsPerPage);

  // Get paginated credentials
  const paginatedCredentials = useMemo(() => {
    const startIndex = page * itemsPerPage;
    return credentials.slice(startIndex, startIndex + itemsPerPage);
  }, [credentials, page, itemsPerPage]);

  // Reset to first page when credentials change
  useEffect(() => {
    setPage(0);
  }, [credentials.length]);

  if (isLoading || providersLoading) {
    return (
      <TableSkeleton
        className="w-full mx-auto mt-5"
        showHeader
        cells={5}
        rows={5}
      />
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">
          Error loading credentials: {(error as Error)?.message}
        </p>
      </div>
    );
  }

  const providers = [
    ...(providersData?.modelsProviders?.map((p) => p.name) || []),
    ...(providersData?.vectorstoresProviders?.map((p) => p.name) || []),
  ];

  return (
    <div className="space-y-6 mx-auto max-w-6xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">Credentials</h2>
          <p className="text-muted-foreground text-sm">
            Manage API keys for LLM providers, embeddings, and vector stores
          </p>
        </div>
        <CredentialModal />
      </div>

      <Card
        className={cn(
          "shadow-none",
          credentials.length > 0 && "bg-transparent border-none"
        )}
      >
        <CardContent className="p-0 m-0">
          {credentials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <KeyRoundIcon className="mb-4 size-7 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No credentials yet</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground max-w-md">
                Add API keys to connect to LLM providers, embedding services,
                and vector stores.
              </p>
              <Button
                variant="brand"
                size="tiny"
                onClick={() => setCredentialDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Credential
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <CredentialsTable
                credentials={paginatedCredentials}
                providers={providers}
              />

              {pageCount > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * itemsPerPage + 1} to{" "}
                    {Math.min((page + 1) * itemsPerPage, total)} of {total}{" "}
                    credentials
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {page + 1} of {pageCount}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= pageCount - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
