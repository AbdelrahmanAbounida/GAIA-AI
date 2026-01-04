import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Download,
  Loader2,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  UserX,
} from "lucide-react";
import { useOllama } from "@/hooks/use-ollama";
import { useCredentials } from "@/hooks/use-credentials";
import { Progress } from "@/components/ui/progress";
import { showErrorToast } from "@/components/ui/toast";
import { useLocalModelStore } from "@/store/use-local-models";
import { formatBytes } from "@/lib/format";
import { ConfirmModal } from "../../confirm-modal";
import {
  ADDITIONAL_MODELS,
  EMBEDDING_MODELS,
  RECOMMENDED_MODELS,
  RECOMMENDED_EMBEDDING_MODELS,
  ADDITIONAL_EMBEDDING_MODELS,
} from "./const";

export const OllamaView = ({ view }: { view: "ai_models" | "embeddings" }) => {
  const {
    isOllamaRunning,
    cancelPull,
    searchModels,
    getModelDetails,
    installedModels,
    deleteModel,
    activePulls,
  } = useOllama();

  const { credentials, createMutation, deleteModelMutation } = useCredentials();

  const setConfirmDialog = useLocalModelStore((s) => s.setConfirmDownLoadModel);

  const ollamaSearch = useLocalModelStore((s) => s.ollamaSearch);
  const setOllamaSearch = useLocalModelStore((s) => s.setOllamaSearch);
  const customOllamaSearch = useLocalModelStore((s) => s.customOllamaSearch);
  const setCustomOllamaSearch = useLocalModelStore(
    (s) => s.setCustomOllamaSearch
  );
  const showCustomSearch = useLocalModelStore((s) => s.showCustomSearch);
  const setShowCustomSearch = useLocalModelStore((s) => s.setShowCustomSearch);

  const searchResults = useLocalModelStore((s) => s.searchResults);
  const setSearchResults = useLocalModelStore((s) => s.setSearchResults);

  // Track which model is being added to credential
  const [addingToCredential, setAddingToCredential] = useState<string | null>(
    null
  );

  // Get Ollama credential with models
  const ollamaCred = credentials.find((cred) => cred.provider === "ollama");
  const credentialModels = (ollamaCred?.models as string[]) || [];

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

  const organizedModels = useMemo(() => {
    if (ollamaSearch.trim()) {
      return {
        installed: [],
        recommended: [],
        additional: searchResults,
      };
    }

    const installedNames = new Set(filteredInstalledModels.map((m) => m.name));
    const installedRecommended = RECOMMENDED_MODELS.filter((m) =>
      installedNames.has(m.name)
    );
    const notInstalledRecommended = RECOMMENDED_MODELS.filter(
      (m) => !installedNames.has(m.name)
    );

    const otherInstalled = filteredInstalledModels.filter(
      (m) => !RECOMMENDED_MODELS.some((rm) => rm.name === m.name)
    );

    return {
      installed: [...installedRecommended, ...otherInstalled],
      recommended: notInstalledRecommended,
      additional: ADDITIONAL_MODELS.filter((m) => !installedNames.has(m.name)),
    };
  }, [ollamaSearch, searchResults, filteredInstalledModels, credentialModels]);

  const checkDuplicateModel = (modelName: string): boolean => {
    if (credentialModels.includes(modelName)) {
      showErrorToast({
        title: "Model already exists",
        description: `The model "${modelName}" is already in your credential.`,
        position: "bottom-right",
        duration: 4000,
      });
      return true;
    }
    return false;
  };

  const checkModelDownloading = (modelName: string): boolean => {
    const isDownloading = activePulls.some(
      (pull) => pull.modelName === modelName
    );

    if (isDownloading) {
      showErrorToast({
        title: "Download in progress",
        description: `The model "${modelName}" is already being downloaded.`,
        position: "bottom-left",
        duration: 4000,
      });
      return true;
    }
    return false;
  };

  const validateAndAddModel = async (modelName: string) => {
    setAddingToCredential(modelName);
    try {
      const modelDetails = await getModelDetails.mutateAsync({
        name: modelName,
        verbose: false,
      });

      if (!modelDetails?.model) {
        showErrorToast({
          title: "Validation failed",
          description: "Could not validate the model installation.",
          position: "bottom-left",
          duration: 4000,
        });
        return;
      }

      if (checkDuplicateModel(modelName)) {
        return;
      }

      // Add model to credential (will update existing or create new)
      await createMutation.mutateAsync({
        credentialType: "ai_model",
        provider: "ollama",
        name: modelName,
        apiKey: "",
        isValid: true,
        baseUrl: ollamaCred?.baseUrl,
      });
    } catch (error) {
      console.error("Failed to add model:", error);
      showErrorToast({
        title: "Failed to add model",
        description: "Failed to add the model. Please try again.",
        position: "bottom-left",
        duration: 4000,
      });
    } finally {
      setAddingToCredential(null);
    }
  };

  const handleRemoveFromCredential = async (modelName: string) => {
    if (!ollamaCred) return;

    await deleteModelMutation.mutateAsync({
      id: ollamaCred.id,
      modelName,
    });
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!ollamaCred) return;

    // Remove from credential
    await deleteModelMutation.mutateAsync({
      id: ollamaCred.id,
      modelName,
    });

    // Also delete from Ollama
    deleteModel.mutate({ modelName });
  };

  const getModelProgress = (modelName: string) => {
    return activePulls.find((p) => p.modelName === modelName);
  };

  // Listen for completed downloads
  useEffect(() => {
    const completedPulls = activePulls.filter((pull) => pull.progress === 100);

    completedPulls.forEach((pull) => {
      if (!credentialModels.includes(pull.modelName)) {
        validateAndAddModel(pull.modelName);
      }
    });
  }, [activePulls]);

  useEffect(() => {
    const searchOllamaLibrary = async () => {
      if (ollamaSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const result = await searchModels.mutateAsync({
          query: ollamaSearch,
          order: "popular",
          categories: view == "embeddings" ? ["embedding"] : ["tools"], // TODO:: we might need to allow user filter this too in ui
        });
        if (result?.success && result.models) {
          // const filtered =
          //   view === "ai_models"
          //     ? result.models.filter(
          //         (model: any) =>
          //           !EMBEDDING_MODELS.some((em) => model.name.includes(em))
          //       )
          //     : result.models.filter((model: any) =>
          //         EMBEDDING_MODELS.some((em) => model.name.includes(em))
          //       );
          setSearchResults(result.models);
        }
      } catch (error) {
        console.error("Search error:", error);
      }
    };
    const debounce = setTimeout(searchOllamaLibrary, 300);
    return () => clearTimeout(debounce);
  }, [ollamaSearch]);

  const handleSelectOllama = (modelName: string) => {
    const isInstalled = filteredInstalledModels.some(
      (m) => m.name === modelName
    );

    if (isInstalled) {
      if (checkDuplicateModel(modelName)) {
        return;
      }
      validateAndAddModel(modelName);
      return;
    }

    if (checkModelDownloading(modelName)) return;

    setConfirmDialog({ open: true, modelName, isInstalled });
  };

  const handleAddcustomOllamaSearch = async () => {
    if (customOllamaSearch.trim()) {
      const isModelExist = await getModelDetails.mutateAsync({
        name: customOllamaSearch.trim(),
        verbose: false,
      });

      if (!isModelExist?.model) {
        showErrorToast({
          title: "Model not found",
          description:
            "The model you entered does not exist in the Ollama library.",
          position: "bottom-left",
          duration: 4000,
        });
        return;
      }

      handleSelectOllama(customOllamaSearch.trim());
      setCustomOllamaSearch("");
      setShowCustomSearch(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {activePulls?.length! > 0 && (
        <div className="glass-panel rounded-lg p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Downloading Models</Label>
            <p className="text-xs text-muted-foreground">
              You can safely close this page
            </p>
          </div>
          {activePulls.map((pull) => (
            <div key={pull.modelName} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono">{pull.modelName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">
                    {pull.progress.toFixed(0)}%
                  </span>
                  <ConfirmModal
                    onDelete={() => cancelPull(pull.modelName)}
                    description="Are you sure you want to cancel this download?"
                    isPending={deleteModel.isPending}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Cancel download"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </ConfirmModal>
                </div>
              </div>
              <Progress value={pull.progress} />
              <p className="text-xs text-muted-foreground">{pull.status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 glass-panel rounded-lg overflow-hidden min-h-0 max-h-[64%]">
        <Command className="bg-transparent h-full flex flex-col">
          <div className="border-border shrink-0">
            <CommandInput
              placeholder="Search Ollama library..."
              value={ollamaSearch}
              onValueChange={setOllamaSearch}
            />
          </div>
          <CommandList className="mt-2 border rounded-xl overflow-y-auto flex-1 h-full">
            {searchModels.isPending && (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            )}
            {!searchModels.isPending &&
              !ollamaSearch.trim() &&
              organizedModels.installed.length === 0 &&
              organizedModels.recommended.length === 0 &&
              organizedModels.additional.length === 0 && (
                <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                  No models found. Try a different search or use a custom model
                  name.
                </CommandEmpty>
              )}
            {!searchModels.isPending && (
              <>
                {organizedModels.installed.length > 0 && (
                  <CommandGroup heading="Installed Models">
                    {organizedModels.installed.map((model) => (
                      <ModelItem
                        key={model.name}
                        model={model}
                        isInstalled={true}
                        isInCredential={credentialModels.includes(model.name)}
                        isSearch={false}
                        isRecommended={RECOMMENDED_MODELS.some(
                          (rm) => rm.name === model.name
                        )}
                        onSelect={() => handleSelectOllama(model.name)}
                        activePulls={activePulls}
                        getModelProgress={getModelProgress}
                        handleDeleteModel={handleDeleteModel}
                        handleRemoveFromCredential={handleRemoveFromCredential}
                        deleteModelPending={deleteModel.isPending}
                        removeFromCredentialPending={
                          deleteModelMutation.isPending
                        }
                        addingToCredential={addingToCredential === model.name}
                      />
                    ))}
                  </CommandGroup>
                )}
                {organizedModels.recommended.length > 0 && (
                  <CommandGroup heading="Recommended Models">
                    {organizedModels.recommended.map((model) => (
                      <ModelItem
                        key={model.name}
                        model={model}
                        isInstalled={false}
                        isInCredential={false}
                        isSearch={false}
                        isRecommended={true}
                        onSelect={() => handleSelectOllama(model.name)}
                        activePulls={activePulls}
                        getModelProgress={getModelProgress}
                        handleDeleteModel={handleDeleteModel}
                        handleRemoveFromCredential={handleRemoveFromCredential}
                        deleteModelPending={deleteModel.isPending}
                        removeFromCredentialPending={
                          deleteModelMutation.isPending
                        }
                        addingToCredential={false}
                      />
                    ))}
                  </CommandGroup>
                )}
                {ollamaSearch.trim() &&
                  organizedModels.additional.length > 0 && (
                    <CommandGroup heading="Search Results">
                      {organizedModels.additional.map((model) => (
                        <ModelItem
                          key={model.name}
                          model={model}
                          isSearch={true}
                          isInstalled={false}
                          isInCredential={false}
                          isRecommended={RECOMMENDED_MODELS.some(
                            (m) => m.name === model.name
                          )}
                          onSelect={() => handleSelectOllama(model.name)}
                          activePulls={activePulls}
                          getModelProgress={getModelProgress}
                          handleDeleteModel={handleDeleteModel}
                          handleRemoveFromCredential={
                            handleRemoveFromCredential
                          }
                          deleteModelPending={deleteModel.isPending}
                          removeFromCredentialPending={
                            deleteModelMutation.isPending
                          }
                          addingToCredential={false}
                        />
                      ))}
                    </CommandGroup>
                  )}
                {!ollamaSearch.trim() &&
                  organizedModels.additional.length > 0 && (
                    <CommandGroup heading="Additional Models">
                      {organizedModels.additional.map((model) => (
                        <ModelItem
                          key={model.name}
                          model={model}
                          isInstalled={false}
                          isInCredential={false}
                          onSelect={() => handleSelectOllama(model.name)}
                          activePulls={activePulls}
                          getModelProgress={getModelProgress}
                          handleDeleteModel={handleDeleteModel}
                          handleRemoveFromCredential={
                            handleRemoveFromCredential
                          }
                          deleteModelPending={deleteModel.isPending}
                          removeFromCredentialPending={
                            deleteModelMutation.isPending
                          }
                          addingToCredential={false}
                        />
                      ))}
                    </CommandGroup>
                  )}
              </>
            )}
          </CommandList>
        </Command>
      </div>

      <div className="shrink-0">
        {!showCustomSearch ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCustomSearch(true)}
            disabled={!isOllamaRunning}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Model
          </Button>
        ) : (
          <div className="glass-panel rounded-lg p-3 space-y-2">
            <Label className="text-xs text-muted-foreground">
              Enter custom model name
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., llama3.2:70b"
                value={customOllamaSearch}
                onChange={(e) => setCustomOllamaSearch(e.target.value)}
                className="font-mono text-sm flex-1 dark:h-7 dark:placeholder:text-gaia-600"
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAddcustomOllamaSearch()
                }
              />
              <Button
                onClick={handleAddcustomOllamaSearch}
                disabled={
                  !customOllamaSearch.trim() || getModelDetails.isPending
                }
                variant="brand"
                size="sm"
                className="px-3  dark:h-[27px]"
              >
                <Download className="size-3.5! mr-1" />
                Pull
              </Button>
              <Button
                variant="outline"
                size="sm"
                className=""
                onClick={() => {
                  setShowCustomSearch(false);
                  setCustomOllamaSearch("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModelItem = ({
  model,
  onSelect,
  isInstalled = false,
  isInCredential = false,
  isRecommended = false,
  isSearch = false,
  activePulls,
  getModelProgress,
  handleDeleteModel,
  handleRemoveFromCredential,
  deleteModelPending,
  removeFromCredentialPending,
  addingToCredential,
}: {
  model: any;
  onSelect: () => void;
  isInstalled?: boolean;
  isInCredential?: boolean;
  isRecommended?: boolean;
  isSearch?: boolean;
  activePulls: any[];
  getModelProgress: (name: string) => any;
  handleDeleteModel: (name: string) => void;
  handleRemoveFromCredential: (name: string) => void;
  deleteModelPending: boolean;
  removeFromCredentialPending: boolean;
  addingToCredential: boolean;
}) => {
  const progress = getModelProgress(model.name);
  const isPulling = !!progress;

  return (
    <CommandItem
      value={model.name}
      onSelect={() => !isPulling && !addingToCredential && onSelect()}
      disabled={isPulling || addingToCredential}
      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{model.name}</span>
          {isRecommended && !isInstalled && (
            <Star className="size-3 fill-yellow-500 text-yellow-500" />
          )}
        </div>

        {isSearch && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {model.pulls && (
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {model.pulls} pulls
              </span>
            )}
            {model.updated && <span>Updated {model.updated}</span>}
            {model.tags && (
              <span>
                {model.tags} {model.tags === "1" ? "tag" : "tags"}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {model.size && (
          <span className="text-xs text-muted-foreground font-mono min-w-[60px] text-right">
            {formatBytes(model.size)}
          </span>
        )}
        {isPulling ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : addingToCredential ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Adding...</span>
          </div>
        ) : isInstalled && isInCredential ? (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ConfirmModal
              onDelete={() => handleRemoveFromCredential(model.name)}
              description={`Remove "${model.name}" from your credentials? The model will remain installed locally.`}
              isPending={removeFromCredentialPending}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-orange-500/10 hover:text-orange-500"
                title="Remove from credentials"
              >
                <UserX className="w-3.5 h-3.5" />
              </Button>
            </ConfirmModal>
            <ConfirmModal
              onDelete={() => handleDeleteModel(model.name)}
              description={`Delete "${model.name}" permanently? This will remove it from your credentials and delete it from Ollama.`}
              isPending={deleteModelPending}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Delete model"
              >
                <Trash2 className="w-3.5 h-3.5 dark:text-red-800" />
              </Button>
            </ConfirmModal>
            <CheckCircle2 className="w-4 h-4" color="green" />
          </div>
        ) : isInstalled ? (
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Download className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </CommandItem>
  );
};
