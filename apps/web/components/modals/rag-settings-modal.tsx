"use client";
import { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckIcon,
  ChevronsUpDown,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { HoveredTabs } from "../ui/hovered-tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/store/use-app-store";
import { showErrorToast, showInfoToast, showSuccessToast } from "../ui/toast";
import { useRAGStore } from "@/store/use-rag-store";
import { useDialogs } from "@/store/use-dialogs";
import { Skeleton } from "../ui/skeleton";
import { useRAGSettings } from "@/hooks/use-rag-settings";
import { CredentialModal } from "./credential-modal/credential-modal";
import { useCurrentProject } from "@/hooks/use-projects";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProviderIcon } from "./credential-modal/provider-icons";
import { FullTextSearchProviderId } from "@gaia/ai/vectorstores";
import { FULLTEXT_SEARCH_TOOLS } from "@gaia/ai/const";
import { Input } from "../ui/input";

type VectorStore = "faiss" | "chroma" | "pinecone" | "qdrant";
type SearchType = "similarity" | "mmr" | "hybrid";
type ChunkingMethod = "fixed" | "sentence" | "paragraph" | "semantic";

interface RAGSettingsModalProps {
  className?: string;
  contentOnly?: boolean;
  showCancelButton?: boolean;
}

interface ModelSelectorProps {
  value?: string;
  models: Array<{
    id: string;
    name: string;
    specification: { provider: string };
    fromVercel?: boolean;
  }>;
  placeholder: string;
  onSelect: (modelId: string, provider?: string) => void;
  disabled?: boolean;
  className?: string;
}

function ModelSelector({
  value,
  models,
  placeholder,
  onSelect,
  disabled,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const modelsByProvider = useMemo(() => {
    return models.reduce(
      (acc, model) => {
        const provider = model.specification.provider;
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
      },
      {} as Record<string, typeof models>
    );
  }, [models]);

  const selectedModel = models.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedModel ? selectedModel.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onWheel={(e) => e.stopPropagation()}
        className="p-0 overflow-auto"
      >
        <Command className="p-0">
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandList className="max-h-[40vh] overflow-y-auto">
            {Object.entries(modelsByProvider).map(
              ([provider, providerModels]) => (
                <CommandGroup
                  key={provider}
                  heading={
                    <div className="flex items-center justify-start gap-2">
                      <ProviderIcon provider={provider} />
                      <span className="capitalize text-white text-md">
                        {provider}
                      </span>
                    </div>
                  }
                >
                  {providerModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={`${provider} ${model.name} ${model.id}`}
                      keywords={[provider, model.name, model.id]}
                      onSelect={() => {
                        onSelect(
                          model.id,
                          model.fromVercel ? "vercel" : undefined
                        );
                        setOpen(false);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === model.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{model.name}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ChunkingTabProps {
  chunkingMethod?: ChunkingMethod;
  chunkSize?: number;
  chunkOverlap?: number;
  onChunkingMethodChange: (method: ChunkingMethod) => void;
  onChunkSizeChange: (size: number) => void;
  onChunkOverlapChange: (overlap: number) => void;
}

function ChunkingTab({
  chunkingMethod = "fixed",
  chunkSize = 4000,
  chunkOverlap = 200,
  onChunkingMethodChange,
  onChunkSizeChange,
  onChunkOverlapChange,
}: ChunkingTabProps) {
  return (
    <div className="space-y-9 pt-10">
      <div className="space-y-2">
        <Label>Chunking Strategy</Label>
        <Select value={chunkingMethod} onValueChange={onChunkingMethodChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="sentence">Sentence</SelectItem>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="semantic">Semantic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Chunk Size: {chunkSize}</Label>
        <Slider
          value={[chunkSize]}
          onValueChange={([v]) => onChunkSizeChange(v)}
          min={200}
          max={50000}
          step={100}
        />
      </div>

      <div className="space-y-2">
        <Label>Chunk Overlap: {chunkOverlap}</Label>
        <Slider
          value={[chunkOverlap]}
          onValueChange={([v]) => onChunkOverlapChange(v)}
          min={0}
          max={1500}
          step={50}
        />
      </div>
    </div>
  );
}

interface EmbeddingTabProps {
  vectorStore?: string;
  embeddingModel?: string;
  availableVectorstores: any[];
  availableEmbeddings: any[];
  isLoading?: boolean;
  onVectorstoreChange: (store: VectorStore) => void;
  onEmbeddingModelChange: (modelId: string, provider?: string) => void;
}

function EmbeddingTab({
  vectorStore = "faiss",
  embeddingModel,
  availableVectorstores,
  availableEmbeddings,
  isLoading,
  onVectorstoreChange,
  onEmbeddingModelChange,
}: EmbeddingTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <Alert
        variant="default"
        className="border-blue-500/50 dark:bg-blue-950/20"
      >
        <AlertCircle className="h-4 w-4 text-blue-500!" />
        <AlertDescription className="text-xs text-muted-foreground dark:text-white/80">
          <strong className="dark:text-white">Note:</strong> Changing the
          embedding model after indexing has started will require setting up a
          new project.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Vectorstore</Label>
        <Select value={vectorStore} onValueChange={onVectorstoreChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableVectorstores.map((vec) => (
              <SelectItem key={vec.id} value={vec.id}>
                <div className="flex items-center gap-2">
                  <ProviderIcon provider={vec.name} />
                  {vec.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Embedding Model</Label>
        <ModelSelector
          value={embeddingModel}
          models={availableEmbeddings}
          placeholder="Select embedding model..."
          onSelect={(modelId, provider) =>
            onEmbeddingModelChange(modelId, provider)
          }
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

interface FullTextSearchSelectorProps {
  value?: string;
  vectorStoreConfig: any;
  ftsConfig?: Record<string, string>;
  onToolChange: (tool: string) => void;
  onConfigChange: (config: Record<string, string>) => void;
}

function FullTextSearchSelector({
  value = "minisearch",
  vectorStoreConfig,
  ftsConfig = {},
  onToolChange,
  onConfigChange,
}: FullTextSearchSelectorProps) {
  const handleToolChange = (newTool: string) => {
    onToolChange(newTool);
    if (newTool === "minisearch" || newTool === "flexsearch") {
      onConfigChange({});
    }
  };

  const handleConfigChange = (newConfig: Record<string, string>) => {
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Full-Text Search Tool</Label>
        <Select value={value} onValueChange={handleToolChange}>
          <SelectTrigger>
            <SelectValue>
              {value === "minisearch"
                ? "Minisearch"
                : value === "flexsearch"
                  ? "Flexsearch"
                  : value === "orama"
                    ? "Orama"
                    : value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FULLTEXT_SEARCH_TOOLS.map((tool) => (
              <SelectItem key={tool.id} value={tool.id}>
                <div className="flex items-center gap-2">
                  {tool.id?.toLowerCase()?.includes("native") && (
                    <ProviderIcon provider={tool.id} />
                  )}
                  <div className="flex flex-col items-start">
                    <span>{tool.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tool.bestFor}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}

            {/* Future::  */}
            {/* {vectorStoreConfig?.fullTextSearchConfig && (
              <SelectItem value="provider-native">
                <div className="flex items-center gap-2">
                  <ProviderIcon provider={vectorStoreConfig.id} />
                  <div className="flex flex-col items-start">
                    <span>{vectorStoreConfig.name} Native Full-Text</span>
                    <span className="text-xs text-muted-foreground">
                      Use provider's built-in search
                    </span>
                  </div>
                </div>
              </SelectItem>
            )} */}
          </SelectContent>
        </Select>
      </div>

      {vectorStoreConfig?.fullTextSearchConfig?.nativeAlgorithm &&
        vectorStoreConfig?.fullTextSearchConfig?.requiresSetup &&
        value?.toLowerCase()?.includes("native") && (
          <Alert
            variant="default"
            className="border-blue-500/50 dark:bg-blue-950/20"
          >
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs">
              <strong>Setup Required:</strong>{" "}
              {vectorStoreConfig.fullTextSearchConfig.setupInstructions}
              {vectorStoreConfig.fullTextSearchConfig.setupDocUrl && (
                <>
                  {" "}
                  <a
                    href={vectorStoreConfig.fullTextSearchConfig.setupDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-500"
                  >
                    View docs
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

      {/* {vectorStoreConfig?.fullTextSearchConfig?.configFields?.map(
        (field: any) => (
          <div key={field?.id} className="space-y-2">
            <Label>{field?.name}</Label>
            <Input
              placeholder={field?.placeholder}
              value={ftsConfig?.[field?.id!] || field?.default || ""}
              onChange={(e) => {
                handleConfigChange({
                  ...ftsConfig,
                  [field?.id!]: e.target.value,
                });
              }}
            />
            {field?.description && (
              <p className="text-xs text-muted-foreground">
                {field?.description}
              </p>
            )}
          </div>
        )
      )} */}
    </div>
  );
}

interface RetrievalTabProps {
  llmModel?: string;
  searchType?: SearchType;
  fullTextSearchTool?: string;
  ftsConfig?: Record<string, string>;
  topK?: number;
  useReranker?: boolean;
  availableLLMs: any[];
  vectorStoreConfig: any;
  isLoading?: boolean;
  needsExternalFullTextTool: boolean;
  onLLMModelChange: (modelId: string) => void;
  onSearchTypeChange: (type: SearchType) => void;
  onFullTextSearchToolChange: (tool: string) => void;
  onFtsConfigChange: (config: Record<string, string>) => void;
  onTopKChange: (k: number) => void;
  onRerankerToggle: () => void;
}

function RetrievalTab({
  llmModel,
  searchType = "similarity",
  fullTextSearchTool,
  ftsConfig,
  topK = 5,
  useReranker,
  availableLLMs,
  vectorStoreConfig,
  isLoading,
  needsExternalFullTextTool,
  onLLMModelChange,
  onSearchTypeChange,
  onFullTextSearchToolChange,
  onFtsConfigChange,
  onTopKChange,
  onRerankerToggle,
}: RetrievalTabProps) {
  return (
    <div className="space-y-4 mt-7 ">
      <div className="space-y-2">
        <Label>Default Retrieval LLM</Label>
        <ModelSelector
          value={llmModel}
          models={availableLLMs}
          placeholder="Select retrieval model..."
          onSelect={onLLMModelChange}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">Search Type</Label>
        <Select
          value={searchType}
          onValueChange={(v) => {
            const type = v === "semantic" ? "similarity" : (v as SearchType);
            onSearchTypeChange(type);
          }}
        >
          <SelectTrigger className="p-4">
            <SelectValue>
              {searchType === "mmr" && "Lexical"}
              {searchType === "similarity" && "Semantic"}
              {searchType === "hybrid" && "Hybrid"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mmr">
              <div className="flex flex-col items-start">
                <span>Lexical</span>
                <span className="text-xs text-muted-foreground">
                  Keyword-based search (like traditional search)
                </span>
              </div>
            </SelectItem>
            <SelectItem value="semantic">
              <div className="flex flex-col items-start">
                <span>Semantic</span>
                <span className="text-xs text-muted-foreground">
                  Meaning-based search using AI embeddings
                </span>
              </div>
            </SelectItem>
            <SelectItem value="hybrid">
              <div className="flex flex-col items-start">
                <span>Hybrid</span>
                <span className="text-xs text-muted-foreground">
                  Best of both: combines keywords and meaning
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {["mmr", "hybrid"].includes(searchType) && (
        <FullTextSearchSelector
          value={fullTextSearchTool}
          vectorStoreConfig={vectorStoreConfig}
          ftsConfig={ftsConfig}
          onToolChange={onFullTextSearchToolChange}
          onConfigChange={onFtsConfigChange}
        />
      )}

      <div className="space-y-2">
        <Label>Top K: {topK}</Label>
        <Slider
          value={[topK]}
          onValueChange={([v]) => onTopKChange(v)}
          min={1}
          max={20}
          step={1}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch checked={!!useReranker} onCheckedChange={onRerankerToggle} />
        <Label>Use Reranker</Label>
      </div>
    </div>
  );
}

export const RAGSettingsView = ({ className }: { className?: string }) => {
  const [currentSettingsTab, setCurrentSettingsTab] = useState<
    "chunking" | "embedding" | "retrieval"
  >("chunking");
  const [pendingVectorstore, setPendingVectorstore] = useState<string>("");

  const { settings, updateSettings } = useRAGStore();
  const {
    availableEmbeddings,
    availableVectorstores,
    allVectorstores,
    availableLLMs,
  } = useAvailableModels();
  const { project, isLoading } = useCurrentProject();

  const currentVectorStoreConfig = useMemo(() => {
    if (!settings?.vectorStore) return null;
    return allVectorstores?.find((v) => v.id === settings.vectorStore);
  }, [settings?.vectorStore, allVectorstores]);

  const needsExternalFullTextTool = useMemo(() => {
    if (!settings?.vectorStore) return false;
    const vectorStore = allVectorstores?.find(
      (v) => v.id === settings.vectorStore
    );
    if (!vectorStore) return false;
    const needsLexical = ["mmr", "hybrid"].includes(settings.searchType || "");
    const requiresExternal =
      vectorStore?.fullTextSearchConfig?.searchType === "external";
    return needsLexical && requiresExternal;
  }, [settings?.vectorStore, settings?.searchType, allVectorstores]);

  const handleVectorstoreChange = (vec: VectorStore) => {
    if (!availableVectorstores.find((v) => v.id === vec)) {
      setPendingVectorstore(vec);
      showErrorToast({
        title: "Vectorstore Credentials Required",
        description: `Please enter credentials for ${vec} vectorstore.`,
        position: "bottom-right",
        duration: 5000,
      });
      return;
    }
    updateSettings("vectorStore", vec);
  };

  const handleSearchTypeChange = (type: SearchType) => {
    updateSettings("searchType", type);
    if ((type === "hybrid" || type === "mmr") && needsExternalFullTextTool) {
      const defaultTool =
        settings?.topK && settings.topK > 5000 ? "flexsearch" : "minisearch";
      updateSettings("fullTextSearchTool", defaultTool);
    }
  };

  const handleFullTextSearchToolChange = (tool: string) => {
    updateSettings("fullTextSearchTool", tool as any);
  };

  const handleFtsConfigChange = (config: Record<string, string>) => {
    updateSettings("ftsConfig", config);
  };

  const availableTabs = project?.totalDocuments
    ? ["chunking", "retrieval"]
    : ["chunking", "embedding", "retrieval"];

  return (
    <div className={cn("w-full", className)}>
      <div className="mt-4">
        <div className="border-b">
          <HoveredTabs
            className="w-fit"
            tabs={availableTabs}
            currentTab={currentSettingsTab}
            onChange={setCurrentSettingsTab}
          />
        </div>

        {currentSettingsTab === "chunking" && (
          <ChunkingTab
            chunkingMethod={settings?.chunkingMethod}
            chunkSize={settings?.chunkSize}
            chunkOverlap={settings?.chunkOverlap}
            onChunkingMethodChange={(method) =>
              updateSettings("chunkingMethod", method)
            }
            onChunkSizeChange={(size) => updateSettings("chunkSize", size)}
            onChunkOverlapChange={(overlap) =>
              updateSettings("chunkOverlap", overlap)
            }
          />
        )}

        {!isLoading &&
          project?.totalDocuments === 0 &&
          currentSettingsTab === "embedding" && (
            <EmbeddingTab
              vectorStore={settings?.vectorStore}
              embeddingModel={settings?.embeddingModel}
              availableVectorstores={allVectorstores || []}
              availableEmbeddings={availableEmbeddings}
              isLoading={isLoading}
              onVectorstoreChange={handleVectorstoreChange}
              onEmbeddingModelChange={(modelId, provider) => {
                updateSettings("embeddingModel", modelId);
                if (provider) {
                  updateSettings("embeddingProvider", provider);
                }
              }}
            />
          )}

        {currentSettingsTab === "retrieval" && (
          <RetrievalTab
            llmModel={settings?.llmModel}
            searchType={settings?.searchType}
            fullTextSearchTool={settings?.fullTextSearchTool}
            ftsConfig={settings?.ftsConfig}
            topK={settings?.topK}
            useReranker={settings?.useReranker}
            availableLLMs={availableLLMs}
            vectorStoreConfig={currentVectorStoreConfig}
            isLoading={isLoading}
            needsExternalFullTextTool={needsExternalFullTextTool}
            onLLMModelChange={(modelId) => updateSettings("llmModel", modelId)}
            onSearchTypeChange={handleSearchTypeChange}
            onFullTextSearchToolChange={handleFullTextSearchToolChange}
            onFtsConfigChange={handleFtsConfigChange}
            onTopKChange={(k) => updateSettings("topK", k)}
            onRerankerToggle={() =>
              showInfoToast({
                title: "Reranker not available",
                description: "Reranker is not available in this GAIA version",
              })
            }
          />
        )}
      </div>

      {pendingVectorstore && (
        <CredentialModal
          activeTab="vectorstore"
          activeProvider={pendingVectorstore}
          open={!!pendingVectorstore}
        />
      )}
    </div>
  );
};

export function RAGSettingsModal({
  className,
  contentOnly = false,
  showCancelButton = true,
}: RAGSettingsModalProps) {
  const openRAGSettingsModal = useDialogs(
    (state) => state.openRAGSettingsDialog
  );
  const setOpenRAGSettingsModal = useDialogs(
    (state) => state.setOpenRAGSettingsDialog
  );
  const { activeProjectId: projectId } = useAppStore();
  const { settings } = useRAGStore();
  const { isLoadingSettings, ragSettings } = useRAGSettings();
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation(
    orpcQueryClient.authed.rag.updateRAGSettings?.mutationOptions({
      mutationKey: ["rag-settings"],
      onSuccess: (output) => {
        if (!output.success) {
          showErrorToast({
            title: "Failed to update settings",
            description: output.message || "Something went wrong",
          });
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["rag-settings"] });
        showSuccessToast({
          title: "Success",
          description: output.message || "RAG settings updated successfully",
        });
      },
      onError: (error) => {
        showErrorToast({
          title: "Failed to update settings",
          description: error.message || "Something went wrong",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["rag-settings"] });
      },
    })
  );

  const handleSave = () => {
    if (!settings) {
      console.error("No settings to save");
      return;
    }

    updateSettingsMutation.mutate({
      projectId: projectId!,
      settings: settings,
    });
    setOpenRAGSettingsModal(false);
  };

  const handleCancel = () => {
    setOpenRAGSettingsModal(false);
  };

  const content = (
    <>
      {isLoadingSettings ? (
        <div className="flex items-start justify-center py-8 w-full">
          <div className="text-sm text-muted-foreground w-full space-y-5">
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="w-full h-9" />
              <Skeleton className="w-full h-9" />
              <Skeleton className="w-full h-9" />
            </div>
            <Skeleton className="w-full h-11" />
            <Skeleton className="w-full h-9" />
            <Skeleton className="w-full h-9" />
          </div>
        </div>
      ) : (
        <RAGSettingsView />
      )}
      <DialogFooter className="mt-6 absolute bottom-4 right-6">
        <Button
          size="tiny"
          variant="outline"
          className={cn("h-7", !showCancelButton && "hidden")}
          onClick={handleCancel}
          disabled={updateSettingsMutation.isPending || isLoadingSettings}
        >
          Cancel
        </Button>
        <Button
          variant="brand"
          size="tiny"
          onClick={handleSave}
          className="mr-4"
          disabled={updateSettingsMutation.isPending || isLoadingSettings}
        >
          {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </DialogFooter>
    </>
  );

  if (contentOnly) {
    return <div className={cn("w-full", className)}>{content}</div>;
  }

  return (
    <Dialog open={openRAGSettingsModal} onOpenChange={setOpenRAGSettingsModal}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="tiny"
          className={cn("dark:h-7!", className)}
        >
          <Settings2 className="size-3!" />
          RAG Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-3xl h-[400px] max-h-[80vh]">
        <DialogTitle className="sr-only">RAG Settings</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
