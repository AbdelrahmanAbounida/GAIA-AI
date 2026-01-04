import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  Box,
  Cpu,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useOllama } from "@/hooks/use-ollama";
import { useCredentials } from "@/hooks/use-credentials";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import { useLocalModelStore } from "@/store/use-local-models";
import { EMBEDDING_MODELS } from "./const";
import { ConfirmModal } from "../../confirm-modal";
import { ButtonGroup } from "@/components/ui/button-group";

export const AllView = ({ view }: { view?: "ai_models" | "embeddings" }) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  const activeTab = useLocalModelStore((s) => s.currentActiveTab);
  const setActiveTab = useLocalModelStore((s) => s.setCurrentActiveTab);
  const searchQuery = useLocalModelStore((s) => s.searchQuery);
  const setSearchQuery = useLocalModelStore((s) => s.setSearchQuery);

  const {
    connectionChecking,
    checkConnection,
    isLoading: modelsLoading,
    refetchModels,
    installedModels,
  } = useOllama();
  const { credentials, isLoading: credentialsLoading } = useCredentials(7);

  const handleRefresh = () => {
    checkConnection();
    refetchModels();
  };

  const localAICredentials = credentials.filter(
    (c) =>
      c.credentialType === "ai_model" &&
      ["ollama", "openai-compatible"].includes(c.provider)
  );

  // Expand Ollama credential to show individual models
  const expandedCredentials = useMemo(() => {
    const expanded: any[] = [];

    localAICredentials.forEach((cred) => {
      if (cred.provider === "ollama" && cred.models) {
        const models = cred.models as string[];
        models.forEach((modelName) => {
          const installedModel = installedModels.find(
            (m) => m.name === modelName
          );
          expanded.push({
            ...cred,
            name: modelName,
            modelData: installedModel,
          });
        });
      } else {
        expanded.push(cred);
      }
    });

    return expanded;
  }, [localAICredentials, installedModels]);

  const filteredCredentials = useMemo(() => {
    let filtered = expandedCredentials;
    if (activeTab === "ollama") {
      filtered = filtered.filter((c) => c.provider === "ollama");
    } else if (activeTab === "openai-compatible") {
      filtered = filtered.filter((c) => c.provider === "openai-compatible");
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.provider.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [expandedCredentials, activeTab, searchQuery]);

  const total = filteredCredentials.length;
  const pageCount = Math.ceil(total / itemsPerPage);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const isLoadingCredentialsOrModels = credentialsLoading || modelsLoading;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden ">
      {isLoadingCredentialsOrModels && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoadingCredentialsOrModels && filteredCredentials.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 w-full">
            <Box className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No local models connected yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-lg">
              Get started by installing your first Ollama local model or connect
              to an OpenAI compatible model
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingCredentialsOrModels || connectionChecking}
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4",
                    (isLoadingCredentialsOrModels || connectionChecking) &&
                      "animate-spin"
                  )}
                />
                Refresh
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={() => setActiveTab("ollama")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingCredentialsOrModels && filteredCredentials.length > 0 && (
        <div className="flex flex-col h-full gap-4">
          <div className="flex gap-3 items-center justify-between shrink-0">
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <ButtonGroup>
                <Button
                  className="p-3"
                  size={"sm"}
                  variant={viewMode === "cards" ? "brand" : "outline"}
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  className="p-3"
                  size={"sm"}
                  variant={viewMode === "table" ? "brand" : "outline"}
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto ">
            {viewMode === "cards" ? (
              <CardsView view={view} page={page} itemsPerPage={itemsPerPage} />
            ) : (
              <TableView page={page} itemsPerPage={itemsPerPage} />
            )}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-2 shrink-0  ">
              <div className="text-sm text-muted-foreground">
                Showing {page * itemsPerPage + 1} to{" "}
                {Math.min((page + 1) * itemsPerPage, total)} of {total} models
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
    </div>
  );
};

const TableView = ({
  page,
  itemsPerPage,
}: {
  page: number;
  itemsPerPage: number;
}) => {
  const activeTab = useLocalModelStore((s) => s.currentActiveTab);
  const searchQuery = useLocalModelStore((s) => s.searchQuery);
  const { credentials, deleteModelMutation, deleteMutation } =
    useCredentials(7);
  const { installedModels } = useOllama();

  const localAICredentials = credentials.filter(
    (c) =>
      c.credentialType === "ai_model" &&
      ["ollama", "openai-compatible"].includes(c.provider)
  );

  const expandedCredentials = useMemo(() => {
    const expanded: any[] = [];

    localAICredentials.forEach((cred) => {
      if (cred.provider === "ollama" && cred.models) {
        const models = cred.models as string[];
        models.forEach((modelName) => {
          const installedModel = installedModels.find(
            (m) => m.name === modelName
          );
          expanded.push({
            ...cred,
            name: modelName,
            modelData: installedModel,
          });
        });
      } else {
        expanded.push(cred);
      }
    });

    return expanded;
  }, [localAICredentials, installedModels]);

  const filteredCredentials = useMemo(() => {
    let filtered = expandedCredentials;
    if (activeTab === "ollama") {
      filtered = filtered.filter((c) => c.provider === "ollama");
    } else if (activeTab === "openai-compatible") {
      filtered = filtered.filter((c) => c.provider === "openai-compatible");
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.provider.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [expandedCredentials, activeTab, searchQuery]);

  const paginatedCredentials = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredCredentials.slice(start, start + itemsPerPage);
  }, [filteredCredentials, page, itemsPerPage]);

  const handleDeleteModel = async (credential: any) => {
    if (credential.provider === "ollama") {
      await deleteModelMutation.mutateAsync({
        id: credential.id,
        modelName: credential.name,
      });
    } else {
      await deleteMutation.mutateAsync({ id: credential.id });
    }
  };

  return (
    <div className="rounded-lg border h-full max-h-[48vh] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCredentials.map((credential, idx) => {
            const isOllama = credential.provider === "ollama";
            return (
              <TableRow key={`${credential.id}-${idx}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {isOllama ? (
                      <Box className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Cpu className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="font-medium">
                      {credential.name || credential.provider}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="brand" className="capitalize">
                    {isOllama ? "Ollama" : "OpenAI Compatible"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    {credential.isValid ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Connected</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-muted-foreground">
                          Disconnected
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ConfirmModal
                        onDelete={() => handleDeleteModel(credential)}
                        description="Deleting this model will remove it completely from your local models"
                        isPending={
                          deleteModelMutation.isPending ||
                          deleteMutation.isPending
                        }
                      >
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => e.preventDefault()}
                          disabled={
                            deleteModelMutation.isPending ||
                            deleteMutation.isPending
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </ConfirmModal>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const CardsView = ({
  view,
  page,
  itemsPerPage,
}: {
  view?: "ai_models" | "embeddings";
  page: number;
  itemsPerPage: number;
}) => {
  const activeTab = useLocalModelStore((s) => s.currentActiveTab);
  const searchQuery = useLocalModelStore((s) => s.searchQuery);
  const { installedModels } = useOllama();
  const { credentials, deleteModelMutation, deleteMutation } =
    useCredentials(7);

  const filteredInstalledModels = useMemo(() => {
    if (view === "ai_models") {
      return installedModels.filter(
        (model) => !EMBEDDING_MODELS.some((em) => model.name.includes(em))
      );
    }
    return installedModels.filter((model) =>
      EMBEDDING_MODELS.some((em) => model.name.includes(em))
    );
  }, [installedModels, view]);

  const localAICredentials = credentials.filter(
    (c) =>
      c.credentialType === "ai_model" &&
      ["ollama", "openai-compatible"].includes(c.provider)
  );

  const expandedCredentials = useMemo(() => {
    const expanded: any[] = [];

    localAICredentials.forEach((cred) => {
      if (cred.provider === "ollama" && cred.models) {
        const models = cred.models as string[];
        models.forEach((modelName) => {
          const installedModel = filteredInstalledModels.find(
            (m) => m.name === modelName
          );
          expanded.push({
            ...cred,
            name: modelName,
            modelData: installedModel,
          });
        });
      } else {
        expanded.push(cred);
      }
    });

    return expanded;
  }, [localAICredentials, filteredInstalledModels]);

  const filteredCredentials = useMemo(() => {
    let filtered = expandedCredentials;
    if (activeTab === "ollama") {
      filtered = filtered.filter((c) => c.provider === "ollama");
    } else if (activeTab === "openai-compatible") {
      filtered = filtered.filter((c) => c.provider === "openai-compatible");
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.provider.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [expandedCredentials, activeTab, searchQuery]);

  const paginatedCredentials = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredCredentials.slice(start, start + itemsPerPage);
  }, [filteredCredentials, page, itemsPerPage]);

  const handleDeleteModel = async (credential: any) => {
    if (credential.provider === "ollama") {
      await deleteModelMutation.mutateAsync({
        id: credential.id,
        modelName: credential.name,
      });
    } else {
      await deleteMutation.mutateAsync({ id: credential.id });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4 h-full max-h-[calc(100vh-29rem)]">
      {paginatedCredentials.map((credential, idx) => {
        const isOllama = credential.provider === "ollama";
        const installedModel = credential.modelData;
        return (
          <Card key={`${credential.id}-${idx}`} className="relative group">
            <CardHeader className="">
              <div className="flex items-start justify-between gap-2">
                <div className="w-full">
                  <CardTitle className="text-base truncate mb-1">
                    <div className="flex items-center gap-1">
                      {isOllama ? (
                        <Box className="w-5 h-5 text-muted-foreground shrink-0" />
                      ) : (
                        <Cpu className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      {credential.name || credential.provider}
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isOllama ? "Ollama" : "OpenAI Compatible"}
                  </CardDescription>
                </div>
                <ConfirmModal
                  onDelete={() => handleDeleteModel(credential)}
                  description="Deleting this model will remove it completely from your local models"
                  isPending={
                    deleteModelMutation.isPending || deleteMutation.isPending
                  }
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </ConfirmModal>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                {credential.isValid ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Disconnected</span>
                  </>
                )}
              </div>
              {isOllama && installedModel && (
                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-mono">
                      {formatBytes(installedModel.size)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modified</span>
                    <span className="font-mono">
                      {new Date(
                        installedModel.modified_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              {!isOllama && credential.baseUrl && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">
                    Base URL
                  </div>
                  <div className="text-xs font-mono truncate">
                    {credential.baseUrl}
                  </div>
                </div>
              )}
              {credential.maskedApiKey && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  API Key configured
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
