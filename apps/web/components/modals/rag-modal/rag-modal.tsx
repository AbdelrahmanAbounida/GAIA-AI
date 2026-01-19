"use client";

import * as React from "react";
import {
  FileText,
  FileUp,
  FileJson,
  Loader2,
  Check,
  AlertCircle,
  DatabaseIcon,
  XIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useRAGStore } from "@/store/use-rag-store";
import { orpc, orpcQueryClient } from "@/lib/orpc/client";
import { showSuccessToast, showErrorToast } from "@/components/ui/toast";
import { useParams } from "next/navigation";
import { FileType, sourceType } from "@gaia/ai/types";
import { cn, validateJSON } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { GearIcon } from "@radix-ui/react-icons";
import { RAGSettingsModal } from "../rag-settings-modal";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "../../ui/progress";
import {
  AddEmbeddingEmptyContent,
  FileView,
  JSONView,
  TextView,
} from "./views";

type SidebarSection = "text" | "files" | "json" | "settings";

const sidebarNav = [
  { id: "text" as const, name: "Text Input", icon: FileText },
  { id: "files" as const, name: "File Upload", icon: FileUp },
  { id: "json" as const, name: "JSON Data", icon: FileJson },
  { id: "settings" as const, name: "Settings", icon: GearIcon },
];

type IndexingState = {
  isIndexing: boolean;
  isPaused: boolean;
  status: "idle" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  message: string;
  currentChunk?: number;
  totalChunks?: number;
  documentId?: string;
  abortController?: AbortController;
};

export function RAGModal({
  className,
  disabled,
  children,
}: {
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const params = useParams<{ id: string }>();
  const projectId = params.id || activeProjectId;

  const [open, setOpen] = React.useState(false);
  const [activeSection, setActiveSection] =
    React.useState<SidebarSection>("text");

  const [indexingState, setIndexingState] = React.useState<IndexingState>({
    isIndexing: false,
    isPaused: false,
    status: "idle",
    progress: 0,
    message: "",
  });

  const { updateFileStatus, clearAll } = useRAGStore();
  const textContent = useRAGStore((state) => state.textContent);
  const jsonContent = useRAGStore((state) => state.jsonContent);
  const uploadedFiles = useRAGStore((state) => state.uploadedFiles);

  const queryClient = useQueryClient();
  const { hasEmbeddingCredentials } = useAvailableModels();

  const startIndexing = async (
    content: string,
    fileName: string,
    fileType: FileType,
    sourceType: sourceType,
  ) => {
    if (!projectId) {
      showErrorToast({
        title: "Failed to index documents",
        position: "bottom-left",
        description: "Please select a project",
      });
      return;
    }

    const abortController = new AbortController();

    setIndexingState({
      isIndexing: true,
      isPaused: false,
      status: "processing",
      progress: 0,
      message: "Starting indexing...",
      abortController,
    });

    try {
      if (!content) {
        showErrorToast({
          title: "No content to index",
          position: "bottom-left",
          description: "The provided content is empty.",
        });
      }
      const iterator = await orpc.authed.rag.createAndIndexDocumentStreaming(
        {
          projectId,
          content,
          fileName,
          fileType,
          sourceType,
        },
        {
          signal: abortController.signal,
        },
      );

      for await (const event of iterator) {
        if (event.type === "progress") {
          setIndexingState((prev) => ({
            ...prev,
            progress: event.progress,
            message: event.message,
            currentChunk: event.currentChunk,
            totalChunks: event.totalChunks,
          }));
        } else if (event.type === "completed") {
          setIndexingState({
            isIndexing: false,
            isPaused: false,
            status: "completed",
            progress: 100,
            message: event.message,
            documentId: event.documentId,
            totalChunks: event.totalChunks,
          });

          queryClient.invalidateQueries({
            queryKey: orpcQueryClient.authed.rag.getRagDocuments.key({}),
          });

          setTimeout(() => {
            showSuccessToast({
              title: "Indexing Complete",
              description: `Indexed ${event.totalChunks} chunks successfully`,
              position: "bottom-right",
            });
            setOpen(false);
            clearAll();
            setIndexingState({
              isIndexing: false,
              isPaused: false,
              status: "idle",
              progress: 0,
              message: "",
            });
          }, 1000);
        } else if (event.type === "error") {
          setIndexingState({
            isIndexing: false,
            isPaused: false,
            status: "failed",
            progress: 0,
            message: event.message,
          });

          showErrorToast({
            title: "Indexing Failed",
            description: event.message,
            position: "bottom-left",
          });
        } else if (event.type === "cancelled") {
          setIndexingState({
            isIndexing: false,
            isPaused: false,
            status: "cancelled",
            progress: 0,
            message: event.message,
          });

          showErrorToast({
            title: "Indexing Cancelled",
            description: event.message,
            position: "bottom-left",
          });
        } else if (event.type === "paused") {
          setIndexingState((prev) => ({
            ...prev,
            isPaused: true,
            message: event.message,
          }));
        }
      }
    } catch (error) {
      console.error("Indexing error:", error);
      setIndexingState({
        isIndexing: false,
        isPaused: false,
        status: "failed",
        progress: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      showErrorToast({
        title: "Indexing Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        position: "bottom-left",
      });
    }
  };

  const handleSaveRAG = async () => {
    if (!validateRAGContents()) return;

    try {
      if (activeSection === "text" && textContent.trim()) {
        await startIndexing(textContent, "Text Input", "txt", "text");
      } else if (activeSection === "json" && jsonContent.trim()) {
        if (!validateJSON(jsonContent)) {
          throw new Error("Invalid JSON format");
        }
        await startIndexing(jsonContent, "JSON Data", "json", "json");
      } else if (activeSection === "files" && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          updateFileStatus(file.id, "uploading");
          try {
            const content = file.content;
            await startIndexing(content, file.name, file.type as any, "file");
            updateFileStatus(file.id, "success");
          } catch (error) {
            updateFileStatus(file.id, "error");
            throw error;
          }
        }
      }
    } catch (error) {
      showErrorToast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Failed to import data",
        position: "bottom-left",
      });
    }
  };

  const validateRAGContents = () => {
    if (activeSection === "text") return textContent.trim().length > 0;
    if (activeSection === "files") return uploadedFiles.length > 0;
    if (activeSection === "json") {
      return jsonContent.trim().length > 0 && validateJSON(jsonContent);
    }
    return false;
  };

  const getSectionTitle = (section: SidebarSection) => {
    switch (section) {
      case "text":
        return "Text Input";
      case "files":
        return "File Upload";
      case "json":
        return "JSON Data";
    }
  };

  if (!projectId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children ?? (
          <Button
            disabled={disabled}
            variant="brand"
            size="sm"
            className={cn("", className)}
          >
            <DatabaseIcon className="size-3!" />
            Add Data
          </Button>
        )}
      </DialogTrigger>

      {hasEmbeddingCredentials ? (
        <DialogContent className="h-[90vh] z-1000 max-h-175 w-full max-w-[90vw] md:max-w-6xl lg:max-w-7xl p-0 gap-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Import Data</DialogTitle>
          <DialogDescription className="sr-only">
            Upload and configure your data sources for RAG processing.
          </DialogDescription>

          <SidebarProvider className="flex-1 min-h-0 overflow-hidden">
            <div className="flex h-full w-full overflow-hidden">
              <Sidebar collapsible="none" className="hidden md:flex border-r">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {sidebarNav.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={item.id === activeSection}
                              disabled={indexingState.isIndexing}
                            >
                              <button
                                onClick={() => setActiveSection(item.id)}
                                className={cn(
                                  "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition-colors",
                                  "hover:bg-gaia-200 dark:hover:bg-gaia-800/80",
                                  activeSection === item.id
                                    ? "bg-gaia-200! border text-accent-foreground border-gaia-300! h-9 dark:bg-gaia-800/50"
                                    : "",
                                )}
                              >
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </button>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>

              <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
                {/* Header */}
                <header className="flex h-14 md:h-16 shrink-0 items-center border-b px-4 md:px-6">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">Import Data</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {getSectionTitle(activeSection)}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </header>

                {/* Content Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
                  <div className="h-full min-h-0 flex flex-col">
                    {activeSection === "text" && <TextView />}
                    {activeSection === "files" && <FileView />}
                    {activeSection === "json" && <JSONView />}
                    {activeSection === "settings" && (
                      <RAGSettingsModal contentOnly showCancelButton={false} />
                    )}

                    {activeSection !== "settings" && (
                      <ProgressIndicator
                        indexingState={indexingState}
                        setIndexingState={setIndexingState}
                      />
                    )}
                  </div>
                </div>

                {/* Footer */}
                {activeSection !== "settings" && (
                  <div className="shrink-0 border-t px-4 md:px-6 py-4">
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={indexingState.isIndexing}
                          className="w-full sm:w-auto"
                        >
                          Close
                        </Button>
                      </DialogClose>
                      <Button
                        variant="brand"
                        size="sm"
                        onClick={handleSaveRAG}
                        disabled={
                          !validateRAGContents() || indexingState.isIndexing
                        }
                        className="w-full sm:w-auto"
                      >
                        {indexingState.isIndexing && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {indexingState.isIndexing
                          ? "Processing..."
                          : "Save & Index"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SidebarProvider>
        </DialogContent>
      ) : (
        <DialogContent className="h-[90vh] max-h-175 w-full max-w-[90vw] md:max-w-6xl lg:max-w-7xl p-4 gap-0 overflow-hidden">
          <AddEmbeddingEmptyContent />
        </DialogContent>
      )}
    </Dialog>
  );
}

const ProgressIndicator = ({
  indexingState,
  setIndexingState,
}: {
  indexingState: IndexingState;
  setIndexingState: React.Dispatch<React.SetStateAction<IndexingState>>;
}) => {
  const handleCancelIndexing = () => {
    if (indexingState.abortController) {
      indexingState.abortController.abort();
      setIndexingState((prev) => ({
        ...prev,
        isIndexing: false,
        isPaused: false,
        status: "cancelled",
        message: "Indexing cancelled by user",
      }));
    }
  };

  if (!indexingState.isIndexing && indexingState.status === "idle") return null;

  if (indexingState.status === "completed" || indexingState.status === "failed")
    return (
      <div
        className={cn(
          "mt-6 p-4 border rounded-lg shrink-0",
          indexingState.status === "completed"
            ? "bg-green-500/10 border-green-500/20"
            : "bg-red-500/10 border-red-500/20",
        )}
      >
        <div className="flex items-center gap-2">
          {indexingState.status === "completed" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">{indexingState.message}</span>
        </div>
      </div>
    );

  return (
    <div className="mt-6 space-y-2 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span className="text-sm font-medium truncate">
            {indexingState.message}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
          <span className="text-sm text-muted-foreground">
            {indexingState.progress}%
          </span>
          <Button
            variant="outline"
            className="w-6 h-6 p-0"
            size="icon"
            onClick={handleCancelIndexing}
          >
            <XIcon className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <Progress value={indexingState.progress} className="h-2" />

      {indexingState.currentChunk !== undefined &&
        indexingState.totalChunks !== undefined && (
          <p className="text-xs text-muted-foreground">
            Processing chunk {indexingState.currentChunk} of{" "}
            {indexingState.totalChunks}
          </p>
        )}
    </div>
  );
};
