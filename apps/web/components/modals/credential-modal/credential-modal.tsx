"use client";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CpuIcon,
  Database,
  Puzzle,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "../../ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllProviders,
  useAvailableModels,
} from "@/hooks/use-availabele-models";
import { Button } from "../../ui/button";
import { ProviderIcon } from "./provider-icons";
import { ProviderSetupForm } from "./provider-setup-form";
import { VectorStoreSetupForm } from "./vectorstore-setup-form";
import { HoveredTabs } from "@/components/ui/hovered-tabs";
import { LocalModelsView } from "./local-models-view";

type SettingsTab = "providers" | "embedding" | "vectorstore";

interface CredentialDialogProps {
  trigger?: React.ReactNode;
  className?: string;
  open?: boolean;
  activeTab?: SettingsTab;
  activeProvider?: string;
}

export function CredentialModal({
  trigger,
  className,
  open: openProp,
  activeTab: activeTabProp = "providers",
  activeProvider,
}: CredentialDialogProps) {
  const [open, onOpenChange] = useState(openProp || false);
  const [activeTab, setActiveTab] = useState<SettingsTab>(activeTabProp);
  const { aiCredentials, vectorstoreCredentials } = useAvailableModels();

  const aiConfiguredCount = aiCredentials?.length || 0;
  const vectorstoreConfiguredCount = vectorstoreCredentials?.length || 0;

  const sidebarItems = [
    {
      id: "providers" as const,
      label: "AI Providers",
      icon: CpuIcon,
      badge: aiConfiguredCount > 0 ? aiConfiguredCount.toString() : undefined,
    },
    {
      id: "embedding" as const,
      label: "Embedding",
      icon: Puzzle,
      badge: aiConfiguredCount > 0 ? aiConfiguredCount.toString() : undefined,
    },
    {
      id: "vectorstore" as const,
      label: "Vector Store",
      icon: Database,
      badge:
        vectorstoreConfiguredCount > 0
          ? vectorstoreConfiguredCount.toString()
          : undefined,
    },
  ];

  useEffect(() => {
    setActiveTab(activeTabProp);
  }, [activeTabProp]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="tiny"
            className={cn("h-9", className)}
          >
            Add Credential
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        // onInteractOutside={(e) => {
        //   e.preventDefault();
        // }}
        className="overflow-hidden z-9999 p-0 w-[90%]! max-w-7xl! max-h-[90vh] h-200"
      >
        <DialogTitle className="sr-only">Credential Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your AI providers, embedding models, and vector stores
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex pt-2">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeTab === item.id}
                        >
                          <button
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors",
                              "hover:bg-gaia-200 dark:hover:bg-gaia-800/80",
                              activeTab === item.id
                                ? "bg-gaia-200! border text-accent-foreground border-gaia-300! dark:border-gaia-800! h-9  dark:bg-gaia-700!"
                                : "",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1 text-left">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex h-full flex-1 flex-col overflow-hidden">
            {activeTab === "providers" && (
              <AIProvidersContent activeProvider={activeProvider} />
            )}
            {activeTab === "embedding" && (
              <EmbeddingContent activeProvider={activeProvider} />
            )}
            {activeTab === "vectorstore" && (
              <VectorStoreContent activeProvider={activeProvider} />
            )}
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

function AIProvidersContent({ activeProvider }: { activeProvider?: string }) {
  const [deploymentMode, setDeploymentMode] = useState<"cloud" | "local">(
    "cloud",
  );
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    activeProvider || "openai",
  );
  const { isPending, modelsProviders } = useAllProviders();
  const { aiCredentials } = useAvailableModels();

  const selectedProviderData = modelsProviders.find(
    (p) => p.name.toLowerCase() === selectedProvider,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex pt-6 shrink-0 flex-col gap-4 border-b border-border px-6 pb-0">
        <div>
          <h2 className="text-lg font-semibold">AI Providers</h2>
          <p className="text-sm text-muted-foreground">
            Configure cloud or local AI models
          </p>
        </div>
        <HoveredTabs
          currentTab={deploymentMode}
          onChange={(v) => setDeploymentMode(v as "cloud" | "local")}
          tabs={["cloud", "local"]}
          className="w-fit"
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {deploymentMode === "cloud" ? (
          <>
            <aside className="hidden md:flex w-60 flex-col border-r border-border overflow-hidden pb-32.5">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-1">
                  {isPending ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full mb-2" />
                      ))}
                    </>
                  ) : (
                    modelsProviders.map((provider) => {
                      const isConfigured = aiCredentials?.some(
                        (cred) =>
                          cred.provider.toLowerCase() ===
                          provider.name.toLowerCase(),
                      );
                      const isActive =
                        selectedProvider === provider.name.toLowerCase();

                      return (
                        <button
                          key={provider.name}
                          onClick={() =>
                            setSelectedProvider(provider.name.toLowerCase())
                          }
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors",
                            "hover:bg-gaia-200 dark:hover:bg-gaia-800/80",
                            isActive
                              ? "bg-gaia-200 dark:bg-gaia-800/50 border text-accent-foreground dark:border-gaia-700/40"
                              : "",
                          )}
                        >
                          <ProviderIcon provider={provider.name} />
                          <span className="flex-1 text-left truncate">
                            {provider.name}
                          </span>
                          {isConfigured && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </aside>
            <ScrollArea className="flex-1">
              <div className="p-6">
                {isPending ? (
                  <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : selectedProviderData ? (
                  <ProviderSetupForm
                    provider={selectedProviderData}
                    mode="ai"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a provider to configure
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <LocalModelsView />
        )}
      </div>
    </div>
  );
}
function EmbeddingContent({ activeProvider }: { activeProvider?: string }) {
  const [deploymentMode, setDeploymentMode] = useState<"cloud" | "local">(
    "cloud",
  );
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    activeProvider || "openai",
  );
  const { isPending, modelsProviders } = useAllProviders();
  const { aiCredentials } = useAvailableModels();

  const embeddingProviders = modelsProviders.filter((p) =>
    p.capabilities.includes("embedding"),
  );
  const selectedProviderData = embeddingProviders.find(
    (p) => p.name.toLowerCase() === selectedProvider,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex pt-6 shrink-0 flex-col gap-4 border-b border-border px-6 pb-0">
        <div>
          <h2 className="text-lg font-semibold">Embedding Providers</h2>
          <p className="text-sm text-muted-foreground">
            Configure embeddings for semantic search and RAG
          </p>
        </div>

        <HoveredTabs
          currentTab={deploymentMode}
          onChange={(v) => setDeploymentMode(v as "cloud" | "local")}
          tabs={["cloud", "local"]}
          className="w-fit"
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {deploymentMode === "cloud" ? (
          <>
            <aside className="hidden md:flex w-60 flex-col border-r border-border">
              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-3 space-y-1">
                  {isPending ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full mb-2" />
                      ))}
                    </>
                  ) : (
                    embeddingProviders.map((provider) => {
                      const isConfigured = aiCredentials?.some(
                        (cred) =>
                          cred.provider.toLowerCase() ===
                          provider.name.toLowerCase(),
                      );
                      const isActive =
                        selectedProvider === provider.name.toLowerCase();

                      return (
                        <button
                          key={provider.name}
                          onClick={() =>
                            setSelectedProvider(provider.name.toLowerCase())
                          }
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors",
                            "hover:bg-gaia-200 dark:hover:bg-gaia-800/80",
                            isActive
                              ? "bg-gaia-200 border text-accent-foreground dark:border-gaia-700/40 dark:bg-gaia-800/50"
                              : "",
                          )}
                        >
                          <ProviderIcon provider={provider.name} />
                          <span className="flex-1 text-left truncate">
                            {provider.name}
                          </span>
                          {isConfigured && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </aside>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {isPending ? (
                  <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : selectedProviderData ? (
                  <ProviderSetupForm
                    provider={selectedProviderData}
                    mode="embedding"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select an embedding provider to configure
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <LocalModelsView view="embeddings" />
        )}
      </div>
    </div>
  );
}

function VectorStoreContent({ activeProvider }: { activeProvider?: string }) {
  const [selectedVectorStore, setSelectedVectorStore] = useState<string | null>(
    activeProvider || "faiss",
  );
  const { isPending, vectorstoresProviders } = useAllProviders();
  const { vectorstoreCredentials } = useAvailableModels();

  const selectedVectorStoreData = vectorstoresProviders.find(
    (v) => v.id === selectedVectorStore,
  );

  const vectorHasNoCredentialsRequred = (
    vec: (typeof vectorstoresProviders)[number],
  ) => {
    return (
      vec?.credentials?.length === 0 ||
      vec?.credentials?.every((cred) => !cred.isRequired)
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex pt-6 shrink-0 flex-col gap-2 border-b border-border px-6 pb-2">
        <h2 className="text-lg font-semibold">Vector Store Providers</h2>
        <p className="text-sm text-muted-foreground">
          Configure vector databases for document storage
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-60 flex-col border-r border-border">
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-3 space-y-1">
              {isPending ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full mb-2" />
                  ))}
                </>
              ) : (
                vectorstoresProviders.map((vectorStore) => {
                  const isConfigured = vectorstoreCredentials?.some(
                    (cred) => cred.provider.toLowerCase() === vectorStore.id,
                  );
                  const isActive = selectedVectorStore === vectorStore.id;

                  return (
                    <button
                      key={vectorStore.id}
                      onClick={() => setSelectedVectorStore(vectorStore.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors",
                        "hover:bg-gaia-200 dark:hover:bg-gaia-800/80",
                        isActive
                          ? "bg-gaia-200 border text-accent-foreground dark:border-gaia-700/40 dark:bg-gaia-800/50"
                          : "",
                      )}
                    >
                      <ProviderIcon provider={vectorStore.name} />
                      <span className="flex-1 text-left truncate">
                        {vectorStore.name}
                      </span>
                      {(isConfigured ||
                        vectorHasNoCredentialsRequred(vectorStore)) && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {isPending ? (
              <div className="space-y-6">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : selectedVectorStoreData ? (
              <VectorStoreSetupForm vectorStore={selectedVectorStoreData} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a vector store to configure
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
