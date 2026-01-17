"use client";

import * as React from "react";
import {
  FileText,
  Upload,
  X,
  FileSpreadsheet,
  Database,
  Braces,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoImage from "@/public/logos/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HoveredTabs } from "../../ui/hovered-tabs";
import { UploadedFile, useRAGStore } from "@/store/use-rag-store";
import { showSuccessToast, showErrorToast } from "@/components/ui/toast";
import { FileType } from "@gaia/ai/types";
import { validateJSON } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../ui/empty";
import Image from "next/image";
import { CredentialModal } from "../credential-modal/credential-modal";
import { FileParser } from "@/lib/file-parser";

const mapFilesToUploadedFiles = async (
  files: File[]
): Promise<UploadedFile[]> => {
  const processedFiles = await Promise.all(
    files.map(async (file) => {
      let content = "";
      try {
        // Use your FileParser to extract content
        const processed = await FileParser.processFile(file);
        content = processed.content;
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Fallback to basic text reading if FileParser fails
        try {
          content = await file.text();
        } catch {
          content = "";
        }
      }

      return {
        id: file.name,
        name: file.name,
        type: extractFileType(file),
        status: "uploading" as const,
        progress: 0,
        content,
      };
    })
  );

  return processedFiles;
};

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

export const TextView = ({}: {}) => {
  const { textContent, setTextContent } = useRAGStore();
  return (
    <div className="space-y-2 h-full  flex flex-col">
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

export const FileView = () => {
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files);
      const processedFiles = await mapFilesToUploadedFiles(files);
      addFiles(processedFiles);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      const processedFiles = await mapFilesToUploadedFiles(files);
      addFiles(processedFiles);
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
        className={`border-2 border-dashed  rounded-lg p-12 text-center transition-colors cursor-pointer ${
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

export const JSONView = () => {
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

export const AddEmbeddingEmptyContent = () => {
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
