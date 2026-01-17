"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Plus,
  AlertCircle,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Sparkles,
  Settings2,
  Database,
  CheckCircle2,
  Loader,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { useAppStore } from "@/store/use-app-store";
import { CredentialModal } from "./credential-modal/credential-modal";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import type { VectorStoreProvider } from "@gaia/ai";
import { ProviderIcon } from "./credential-modal/provider-icons";
import { AlertMessage } from "../alert-message";

type SetupStep = "basic" | "configure";

export function CreateProjectModal2({
  children,
}: {
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setActiveProject = useAppStore((state) => state.setActiveProject);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>("basic");
  const [name, setName] = useState("");

  // Model selection state
  const [selectedLLM, setSelectedLLM] = useState<string>("");
  const [selectedEmbedding, setSelectedEmbedding] = useState<string>("");
  const [selectedVectorStore, setSelectedVectorStore] =
    useState<VectorStoreProvider["id"]>("lancedb");

  // Combobox open states
  const [llmOpen, setLLMOpen] = useState(false);
  const [embeddingOpen, setEmbeddingOpen] = useState(false);
  const [vectorStoreOpen, setVectorStoreOpen] = useState(false);

  // Get available models and credentials
  const {
    allModels,
    availableLLMs,
    availableEmbeddings,
    availableVectorstores,
    credentials,
    hasAICredentials,
    hasEmbeddingCredentials,
    isPending: credentialsLoading,
  } = useAvailableModels();

  // Helper to get provider for a model (handles Vercel models)
  const getModelProvider = (modelId: string, model: any) => {
    if (model?.fromVercel) {
      return "vercel";
    }
    return model?.specification?.provider || modelId.split("/")[0];
  };

  // Create project mutation
  const { mutate: create, isPending: isCreating } = useMutation(
    orpcQueryClient.authed.project.create.mutationOptions({
      onSuccess: (data) => {
        if (!data?.success) {
          showErrorToast({
            title: "Failed to create project",
            position: "bottom-right",
            description: data.message || "Something went wrong",
          });
          return;
        }

        showSuccessToast({
          title: "Project created",
          description: "Your project has been created successfully",
          position: "bottom-right",
        });

        // Set active project and navigate
        if (data.project) {
          setActiveProject(data.project.id);
          router.push(`/projects/${data.project.id}/chat`);
          router.refresh();
        }

        // Reset modal state
        handleReset();
      },
      onError: (error) => {
        showErrorToast({
          title: "Failed to create project",
          position: "bottom-right",
          description: error.message || "Something went wrong",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.project.list.key(),
        });
      },
    })
  );

  // Helper to check if provider has credentials
  const providerHasCredential = (provider: string) => {
    const noCredentialProviders = ["local", "ollama", "builtin", "vercel"];
    if (noCredentialProviders.includes(provider.toLowerCase())) return true;

    return (
      credentials?.some(
        (c) =>
          c.provider.toLowerCase() === provider.toLowerCase() &&
          c.isValid &&
          c.credentialType === "ai_model"
      ) ?? false
    );
  };

  // Group models by provider
  const llmsByProvider = useMemo(() => {
    if (!availableLLMs) return {};

    return availableLLMs.reduce(
      (acc, model) => {
        const provider = getModelProvider(model.id, model);
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
      },
      {} as Record<string, typeof availableLLMs>
    );
  }, [availableLLMs]);

  const embeddingsByProvider = useMemo(() => {
    return availableEmbeddings.reduce(
      (acc, model) => {
        const provider = getModelProvider(model.id, model);
        if (!acc[provider]) {
          acc[provider] = [];
        }
        acc[provider].push(model);
        return acc;
      },
      {} as Record<string, typeof availableEmbeddings>
    );
  }, [availableEmbeddings]);

  // Get default models
  const getDefaultLLM = () => {
    const llmWithCred = availableLLMs?.find((m) =>
      providerHasCredential(getModelProvider(m.id, m))
    );
    if (llmWithCred) return llmWithCred.id;
    if (!availableLLMs?.length && !allModels?.success) return null;
    return availableLLMs[0]?.id || allModels?.models?.llms[0]?.id;
  };

  const getDefaultEmbedding = () => {
    const embeddingWithCred = availableEmbeddings?.find((m) =>
      providerHasCredential(getModelProvider(m.id, m))
    );
    if (embeddingWithCred) return embeddingWithCred.id;
    if (!allModels?.success) return null;
    return availableEmbeddings[0]?.id || allModels?.models?.embeddings[0]?.id;
  };

  const getDefaultVectorStore = (): VectorStoreProvider["id"] => {
    return "lancedb";
  };

  // Auto-select defaults when moving to configure step
  useEffect(() => {
    if (step === "configure") {
      if (!selectedLLM) {
        const defaultLLM = getDefaultLLM();
        if (defaultLLM) setSelectedLLM(defaultLLM);
      }

      if (!selectedEmbedding) {
        const defaultEmbedding = getDefaultEmbedding();
        if (defaultEmbedding) setSelectedEmbedding(defaultEmbedding);
      }

      if (!selectedVectorStore) {
        const defaultVectorStore = getDefaultVectorStore();
        if (defaultVectorStore) setSelectedVectorStore(defaultVectorStore);
      }
    }
  }, [step]);

  // Reset modal state
  const handleReset = () => {
    setOpen(false);
    setStep("basic");
    setName("");
    setSelectedLLM("");
    setSelectedEmbedding("");
    setSelectedVectorStore("lancedb");
    setLLMOpen(false);
    setEmbeddingOpen(false);
    setVectorStoreOpen(false);
  };

  // Handle next step
  const handleNext = () => {
    if (!name.trim()) {
      showErrorToast({
        title: "Missing required field",
        position: "bottom-right",
        description: "Please enter a project name",
      });
      return;
    }
    setStep("configure");
  };

  // Handle create with selected models
  const handleCreate = () => {
    if (!name.trim()) {
      showErrorToast({
        title: "Missing required field",
        position: "bottom-right",
        description: "Please enter a project name",
      });
      return;
    }

    if (!selectedLLM || !selectedEmbedding || !selectedVectorStore) {
      showErrorToast({
        title: "Missing configuration",
        position: "bottom-right",
        description: "Please select all required models",
      });
      return;
    }

    // Find the selected models to get their provider info
    const selectedLLMModel = availableLLMs?.find((m) => m.id === selectedLLM);
    const selectedEmbeddingModel = availableEmbeddings?.find(
      (m) => m.id === selectedEmbedding
    );

    // Get providers, handling Vercel models
    const llmProvider = getModelProvider(selectedLLM, selectedLLMModel);
    const embeddingProvider = getModelProvider(
      selectedEmbedding,
      selectedEmbeddingModel
    );

    create({
      name: name.trim(),
      llmModel: selectedLLM,
      llmProvider: llmProvider,
      embeddingModel: selectedEmbedding,
      embeddingProvider: embeddingProvider,
      vectorStore: selectedVectorStore,
    });
  };

  // Handle skip - create with defaults
  const handleSkip = () => {
    if (!name.trim()) {
      showErrorToast({
        title: "Missing required field",
        position: "bottom-right",
        description: "Please enter a project name",
      });
      return;
    }

    const defaultLLM = getDefaultLLM();
    const defaultEmbedding = getDefaultEmbedding();
    const defaultVectorStore = getDefaultVectorStore();

    if (!defaultLLM || !defaultEmbedding) {
      showErrorToast({
        title: "Configuration error",
        position: "bottom-right",
        description:
          "Unable to find default models. Please configure manually.",
      });
      return;
    }

    // Find the default models to get their provider info
    const defaultLLMModel = availableLLMs?.find((m) => m.id === defaultLLM);
    const defaultEmbeddingModel = availableEmbeddings?.find(
      (m) => m.id === defaultEmbedding
    );

    // Get providers, handling Vercel models
    const llmProvider = getModelProvider(defaultLLM, defaultLLMModel);
    const embeddingProvider = getModelProvider(
      defaultEmbedding,
      defaultEmbeddingModel
    );

    create({
      name: name.trim(),
      llmModel: defaultLLM,
      llmProvider: llmProvider,
      embeddingModel: defaultEmbedding,
      embeddingProvider: embeddingProvider,
      vectorStore: defaultVectorStore,
    });
  };

  const canCreate = selectedLLM && selectedEmbedding && selectedVectorStore;
  const isLoading = credentialsLoading || isCreating;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleReset())}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="brand">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-162.5 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "basic" ? "Create New Project" : "Configure Models"}
          </DialogTitle>
          <DialogDescription>
            {step === "basic"
              ? "Give your GAIA project a name to get started."
              : "Select AI models and vector store for your project"}
          </DialogDescription>
        </DialogHeader>

        {step === "basic" && (
          <div className="space-y-6 py-4">
            {!hasAICredentials && !hasEmbeddingCredentials && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll configure AI providers and models in the next step.
                  Default settings will be used if not specified.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My GAIA Project"
                autoFocus
                className="focus:bg-white"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) {
                    handleNext();
                  }
                }}
              />
            </div>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-6 py-4">
            {(!hasAICredentials || !hasEmbeddingCredentials) && (
              <AlertMessage
                title={
                  !hasAICredentials
                    ? "No AI Models Configured"
                    : "Limited Embedding Support"
                }
                description={
                  !hasAICredentials
                    ? "Set up AI models to unlock more providers, or use local models to get started."
                    : "Your AI Provider does not support embedding models. Setup a custom embedding model or add a different provider."
                }
              />
            )}

            {/* LLM Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Language Model
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Primary AI for chat
                    </p>
                  </div>
                </div>

                <CredentialModal
                  activeTab="providers"
                  trigger={
                    <Button
                      variant="outline"
                      size="tiny"
                      // className="h-7 text-xs border dark:border-gaia-700/70 p-2"
                    >
                      <Plus className="size-3" />
                      Add Provider
                    </Button>
                  }
                />
              </div>

              <Popover open={llmOpen} onOpenChange={setLLMOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={llmOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {selectedLLM
                      ? availableLLMs?.find((m) => m.id === selectedLLM)?.name
                      : "Select language model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  onWheel={(e) => e.stopPropagation()}
                  className="w-150  p-0"
                >
                  <Command className="max-h-[40vh] p-0">
                    <CommandInput placeholder="Search models..." />
                    <CommandEmpty>No Language model found.</CommandEmpty>
                    <CommandList>
                      {Object.entries(llmsByProvider).map(
                        ([provider, models]) => {
                          return (
                            <CommandGroup
                              key={provider}
                              heading={
                                <div className="flex items-center justify-start gap-3">
                                  <ProviderIcon provider={provider} />
                                  <span className="capitalize  dark:text-white text-md">
                                    {provider}
                                  </span>
                                </div>
                              }
                            >
                              {models?.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.id}
                                  onSelect={(currentValue) => {
                                    setSelectedLLM(
                                      currentValue === selectedLLM
                                        ? ""
                                        : currentValue
                                    );
                                    setLLMOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedLLM === model.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {model.name}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          );
                        }
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Embedding Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Settings2 className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Embedding Model
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      For document search
                    </p>
                  </div>
                </div>

                <CredentialModal
                  activeTab="embedding"
                  trigger={
                    <Button
                      variant="outline"
                      size="tiny"
                      // className="h-7 text-xs border dark:border-gaia-700/70 p-2"
                    >
                      <Plus className="size-3" />
                      Add Provider
                    </Button>
                  }
                />
              </div>

              <Popover open={embeddingOpen} onOpenChange={setEmbeddingOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={embeddingOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {selectedEmbedding
                      ? availableEmbeddings?.find(
                          (m) => m.id === selectedEmbedding
                        )?.name
                      : "Select embedding model..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  onWheel={(e) => e.stopPropagation()}
                  className="w-150  p-0 "
                >
                  <Command className="max-h-[40vh] p-0">
                    <CommandInput placeholder="Search models..." />
                    <CommandEmpty>No Embedding model found.</CommandEmpty>
                    <CommandList className="overflow-y-scroll! ">
                      {Object.entries(embeddingsByProvider).map(
                        ([provider, models]) => {
                          const hasCredential = providerHasCredential(provider);

                          return (
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
                              {models.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.id}
                                  onSelect={(currentValue) => {
                                    setSelectedEmbedding(
                                      currentValue === selectedEmbedding
                                        ? ""
                                        : currentValue
                                    );
                                    setEmbeddingOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedEmbedding === model.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {model.name}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          );
                        }
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Vector Store Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Database className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Vector Store
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Storage for embeddings
                    </p>
                  </div>
                </div>

                <CredentialModal
                  activeTab="vectorstore"
                  trigger={
                    <Button
                      variant="outline"
                      size="tiny"
                      // className="h-7 text-xs border dark:border-gaia-700/70 p-2"
                    >
                      <Plus className="size-3" />
                      Add Provider
                    </Button>
                  }
                />
              </div>

              <Popover open={vectorStoreOpen} onOpenChange={setVectorStoreOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={vectorStoreOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {selectedVectorStore
                      ? availableVectorstores?.find(
                          (v) => v.id === selectedVectorStore
                        )?.name
                      : "Select vector store..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-150 p-0">
                  <Command className="">
                    <CommandInput placeholder="Search vector stores..." />
                    <CommandEmpty>No vector store found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {availableVectorstores?.map((vs) => (
                          <CommandItem
                            key={vs.id}
                            value={vs.id}
                            onSelect={(currentValue: any) => {
                              setSelectedVectorStore(
                                currentValue === selectedVectorStore
                                  ? ""
                                  : currentValue
                              );
                              setVectorStoreOpen(false);
                            }}
                          >
                            <CheckCircle2
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedVectorStore === vs.id
                                  ? "opacity-100 text-primary rounded-full"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  provider={vs.name}
                                  className="size-3"
                                />
                                <span className="font-medium text-sm">
                                  {vs.name}
                                </span>
                              </div>
                              {vs.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {vs.description}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {step === "basic" ? (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                size="sm"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={handleNext}
                className="pr-2"
                disabled={!name.trim() || isLoading}
              >
                {isLoading && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("basic")}
                size="sm"
                disabled={isLoading}
              >
                Back
              </Button>
              <div className="flex-1" />

              {!hasAICredentials && !hasEmbeddingCredentials && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  {isCreating && (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Skip & Create
                </Button>
              )}

              <Button
                variant="brand"
                size="sm"
                onClick={handleCreate}
                disabled={!canCreate || isLoading}
              >
                {isCreating && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
