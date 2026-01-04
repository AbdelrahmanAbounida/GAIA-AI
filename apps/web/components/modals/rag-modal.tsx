"use client";

import * as React from "react";
import {
  FileText,
  FileUp,
  FileJson,
  Upload,
  X,
  FileSpreadsheet,
  Database,
  Braces,
  Loader2,
  Check,
  AlertCircle,
  DatabaseIcon,
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
import LogoImage from "@/public/logos/logo.png";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HoveredTabs } from "../ui/hovered-tabs";
import { UploadedFile, useRAGStore } from "@/store/use-rag-store";
import { orpc, orpcQueryClient } from "@/lib/orpc/client";
import { showSuccessToast, showErrorToast } from "@/components/ui/toast";
import { useParams } from "next/navigation";
import { FileType, sourceType } from "@gaia/ai/types";
import { cn, validateJSON } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import Image from "next/image";
import { CredentialModal } from "./credential-modal/credential-modal";
import { useAppStore } from "@/store/use-app-store";
import { GearIcon } from "@radix-ui/react-icons";
import { RAGSettingsModal } from "./rag-settings-modal";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type SidebarSection = "text" | "files" | "json" | "settings";

const sidebarNav = [
  { id: "text" as const, name: "Text Input", icon: FileText },
  { id: "files" as const, name: "File Upload", icon: FileUp },
  { id: "json" as const, name: "JSON Data", icon: FileJson },
  { id: "settings" as const, name: "Settings", icon: GearIcon },
];

const extractFileType = (file: File): FileType => {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx")) return "csv";

  if (type.includes("spreadsheet")) return "csv";
  if (type.includes("document")) return "docx";
  if (type === "application/pdf") return "pdf";

  return "txt";
};

const mapFilesToUploadedFiles = (files: File[]): UploadedFile[] => {
  return files.map((file) => ({
    id: file.name,
    name: file.name,
    type: extractFileType(file),
    status: "uploading",
    progress: 0,
    content: "", // TODO:: we wanna load from server to get dile contnet
  }));
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

  // Indexing progress state
  const [indexingProgress, setIndexingProgress] = React.useState<{
    isIndexing: boolean;
    status: string;
    progress: number;
    message?: string;
    documentId?: string;
  }>({
    isIndexing: false,
    status: "idle",
    progress: 0,
  });

  const {
    textContent,
    jsonContent,
    uploadedFiles,
    updateFileStatus,
    clearAll,
  } = useRAGStore();

  const queryClient = useQueryClient();
  const { hasEmbeddingCredentials } = useAvailableModels();

  const createDocumentMutation = useMutation(
    orpcQueryClient.authed.rag.createAndIndexDocument.mutationOptions({
      onSuccess: (data) => {
        if (data.status === "failed") {
          showErrorToast({
            title: "Failed to index documents",
            position: "bottom-left",
            description: data.message || "Something went wrong",
          });
          setIndexingProgress({
            isIndexing: false,
            status: "failed",
            progress: 0,
          });
          clearAll();
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.rag.getRagDocuments.key({}),
        });
      },
    })
  );
  const startIndexing = async (
    content: string,
    fileName: string,
    fileType: FileType,
    sourceType: sourceType
  ) => {
    setIndexingProgress({
      isIndexing: true,
      status: "processing",
      progress: 0,
      message: "Starting indexing...",
    });

    try {
      // Call the unified create-and-index endpoint
      if (!projectId) {
        showErrorToast({
          title: "Failed to index documents",
          position: "bottom-left",
          description: "Please select a project",
        });
        return;
      }

      const data = await createDocumentMutation.mutateAsync({
        projectId,
        content,
        fileName,
        fileType,
        sourceType,
      });

      if (data?.status == "failed") {
        showErrorToast({
          title: "Failed to index documents",
          position: "bottom-left",
          description: data?.message || "Something went wrong",
        });
        setIndexingProgress({
          isIndexing: false,
          status: "failed",
          progress: 0,
        });
        clearAll();
        return;
      }
      setIndexingProgress({
        isIndexing: false,
        status: "completed",
        progress: 100,
      });
      setTimeout(() => {
        setOpen(false);
        clearAll();
        setIndexingProgress({
          isIndexing: false,
          status: "idle",
          progress: 0,
        });
        showSuccessToast({
          title: "Indexing Complete",
          description: "Your document has been successfully indexed",
          position: "bottom-right",
        });
      }, 10);
    } catch (error) {
      showErrorToast({
        title: "Indexing Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        position: "bottom-left",
      });
      setIndexingProgress({
        isIndexing: false,
        status: "failed",
        progress: 0,
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
        // Process files sequentially
        for (const file of uploadedFiles) {
          updateFileStatus(file.id, "uploading");
          try {
            // Read file content >> TODO;: could be here
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
            size="tiny"
            className={cn("bg-brand-800! hover:bg-brand-700!", className)}
          >
            <DatabaseIcon className="size-3!" />
            Add Data
          </Button>
        )}
      </DialogTrigger>

      {hasEmbeddingCredentials ? (
        <DialogContent
          onInteractOutside={(e) => {
            const originalEvent = e.detail?.originalEvent;
            console.log(originalEvent);
            const target = e.target as HTMLElement;
            console.log({
              target,
              closest: target.closest("[data-sonner-toast]"),
              role: target.closest('[role="alert"]'),
            });
          }}
          className="h-[90vh]  max-h-[700px] w-7xl max-w-[90%]! p-4 gap-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">Import Data</DialogTitle>
          <DialogDescription className="sr-only">
            Upload and configure your data sources for RAG processing.
          </DialogDescription>

          <SidebarProvider>
            <Sidebar collapsible="none" className="hidden md:flex ">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {sidebarNav.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={item.id === activeSection}
                          >
                            <button onClick={() => setActiveSection(item.id)}>
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

            <main className="flex flex-1 flex-col overflow-hidden">
              <header className="flex h-16 shrink-0 items-center border-b px-6">
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

              <div className="flex-1 overflow-y-auto p-6">
                {activeSection === "text" && <TextView />}
                {activeSection === "files" && <FileView />}
                {activeSection === "json" && <JSONView />}
                {activeSection === "settings" && (
                  <RAGSettingsModal contentOnly showCancelButton={false} />
                )}

                {/* Progress Indicator */}
                {/* {indexingProgress.isIndexing && (
                  <div className="mt-6 p-4 border rounded-lg bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">
                          {indexingProgress.message || "Processing..."}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {indexingProgress.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${indexingProgress.progress}%` }}
                      />
                    </div>
                    {indexingProgress.documentId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Document ID: {indexingProgress.documentId}
                      </p>
                    )}
                  </div>
                )} */}
              </div>
            </main>
          </SidebarProvider>

          {activeSection !== "settings" && (
            <DialogFooter className="absolute pt-8! right-5 bottom-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={indexingProgress.isIndexing}
                >
                  Close
                </Button>
              </DialogClose>
              <Button
                variant="brand"
                size="sm"
                onClick={handleSaveRAG}
                disabled={!validateRAGContents() || indexingProgress.isIndexing}
              >
                {indexingProgress.isIndexing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {indexingProgress.isIndexing ? "Processing..." : "Save & Index"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      ) : (
        <DialogContent className="h-[90vh]  max-h-[700px] w-7xl max-w-[90%]! p-4 gap-0 overflow-hidden">
          <AddEmbeddingEmptyContent />
        </DialogContent>
      )}
    </Dialog>
  );
}

const TextView = ({}: {}) => {
  const { textContent, setTextContent } = useRAGStore();
  return (
    <div className="space-y-2 h-full max-h-[550px] pb-5! flex flex-col">
      <div>
        <h3 className="text-md font-medium">Paste Text</h3>
        <p className="text-[13px] text-muted-foreground">
          Paste or type your text content directly
        </p>
      </div>

      <div className="space-y-2 flex-1 flex flex-col">
        <Label htmlFor="text-input">Content</Label>
        <Textarea
          id="text-input"
          placeholder="Paste your text here..."
          className="flex-1 resize-none  text-sm placeholder:text-muted-foreground/70 placeholder:text-[13px]"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground mb-9">
        <span>{textContent.length} characters</span>
        <span className="pr-1">
          {textContent.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </div>
  );
};

const FileView = () => {
  const { addFiles, uploadedFiles, removeFile } = useRAGStore();
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files);
      addFiles(mapFilesToUploadedFiles(files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      addFiles(mapFilesToUploadedFiles(files));
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (type: string) => {
    if (type.includes("json")) return <Braces className="h-4 w-4" />;
    if (
      type.includes("csv") ||
      type.includes("excel") ||
      type.includes("spreadsheet")
    )
      return <FileSpreadsheet className="h-4 w-4" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const getFileStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-medium">Upload Files</h3>
        <p className="text-xs text-muted-foreground">
          Supports PDF, CSV, Excel, TXT, JSON and more
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleDropZoneClick}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-accent bg-accent/5"
            : "border-border hover:border-muted-foreground/50"
        }`}
      >
        <div className="flex flex-col items-center gap-4 pointer-events-none">
          <div className="p-4 rounded-full bg-secondary">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, CSV, Excel, TXT, JSON up to 10MB each
            </p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.csv,.xlsx,.xls,.txt,.json"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <Label>Uploaded Files ({uploadedFiles.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded bg-background">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getFileStatusIcon(file.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const JSONView = () => {
  const [currentJsonTab, setCurrentJsonTab] = React.useState<
    "paste" | "upload"
  >("paste");
  const { jsonContent, setJsonContent } = useRAGStore();

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
      showSuccessToast({
        title: "JSON Formatted",
        description: "Your JSON has been formatted successfully",
      });
    } catch {
      showErrorToast({
        title: "Invalid JSON",
        description: "Unable to format invalid JSON",
        position: "bottom-right",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">JSON Data</h3>
        <p className="text-sm text-muted-foreground">
          Paste JSON or upload a JSON file
        </p>
      </div>

      <div className="w-full">
        <div className="border-b">
          <HoveredTabs
            className="w-fit"
            tabs={["paste", "upload"]}
            currentTab={currentJsonTab}
            onChange={setCurrentJsonTab}
          />
        </div>

        {currentJsonTab === "paste" && (
          <div className="mt-6">
            <div className="space-y-2">
              <Label htmlFor="json-input">JSON Content</Label>
              <Textarea
                id="json-input"
                placeholder={'{"key": "value"}'}
                className="min-h-64 resize-none text-sm placeholder:text-xs placeholder:text-muted-foreground/60"
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
              />
            </div>

            <div className="mt-4 flex gap-3">
              <Button variant="outline" size="sm" onClick={formatJSON}>
                Format JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (validateJSON(jsonContent)) {
                    showSuccessToast({
                      title: "Valid JSON",
                      description: "Your JSON is valid",
                    });
                  } else {
                    showErrorToast({
                      title: "Invalid JSON",
                      description: "Please check your JSON syntax",
                      position: "bottom-right",
                    });
                  }
                }}
              >
                Validate
              </Button>
            </div>
          </div>
        )}

        {currentJsonTab === "upload" && (
          <div className="mt-6">
            <label
              htmlFor="json-file-upload"
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex flex-col items-center gap-3">
                <Braces className="size-6 text-muted-foreground" />
                <p className="font-medium">Upload JSON file</p>
                <p className="text-sm text-muted-foreground">
                  .json files only
                </p>
              </div>
              <Input
                id="json-file-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      setJsonContent(content);
                      setCurrentJsonTab("paste");
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

const AddEmbeddingEmptyContent = () => {
  // TODO:: check if the user credential providers has no embedding show provider with embedding and
  // message to tell the user to add embedding before adding data

  return (
    <Empty className="w-full h-full">
      <EmptyHeader className="w-full! max-w-4xl">
        <EmptyMedia variant="icon">
          {/* <FolderCodeIcon /> */}
          <div className="bg-gaia-900! flex items-center">
            <Image src={LogoImage} alt="gaia" width={100} height={100} />
          </div>
        </EmptyMedia>
        <EmptyTitle className="text-[17px]">
          No Embedding Models Found
        </EmptyTitle>
        <EmptyDescription className="w-full text-[14px] max-w-7xl! flex flex-col items-center justify-center gap-1">
          <span className="flex items-center gap-2 w-full">
            Your AI Provider does not support any embedding models. You need to
            setup custom embedding Model or add different AI Provider which
            supports embedding before storing your data
          </span>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <CredentialModal
            activeTab="embedding"
            trigger={
              <Button variant={"brand"} size={"tiny"}>
                {" "}
                Add Embedding Model
              </Button>
            }
          />
        </div>
      </EmptyContent>
    </Empty>
  );
};
