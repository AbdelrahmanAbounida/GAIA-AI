"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Copy,
  Download,
  Check,
  FileText,
  Eye,
  Maximize2,
  Minimize2,
  Code,
  Image,
  Video,
  Music,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Artifact } from "@gaia/ai";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ArtifactCardProps {
  artifact: Artifact;
  onClick: (boundingBox: DOMRect) => void;
  isSelected: boolean;
}

const languageIcons: Record<string, string> = {
  tsx: "⚛️",
  typescript: "📘",
  javascript: "📒",
  python: "🐍",
  css: "🎨",
  markdown: "📝",
};

const getArtifactIcon = (artifact: Artifact) => {
  switch (artifact.type) {
    case "image":
      return <Image className="w-5 h-5 text-brand-500" />;
    case "video":
      return <Video className="w-5 h-5 text-brand-500" />;
    case "audio":
      return <Music className="w-5 h-5 text-brand-500" />;
    case "code":
      return <Code className="w-5 h-5 text-brand-500" />;
    default:
      return <FileText className="w-5 h-5 text-brand-500" />;
  }
};

const getArtifactTypeLabel = (artifact: Artifact) => {
  switch (artifact.type) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "code":
      return artifact.language || "Code";
    default:
      return artifact.language || "Markdown";
  }
};

export function ArtifactCard({
  artifact,
  onClick,
  isSelected,
}: ArtifactCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (cardRef.current) {
      const boundingBox = cardRef.current.getBoundingClientRect();
      onClick(boundingBox);
    }
  };

  const renderPreview = () => {
    switch (artifact.type) {
      case "image":
        return (
          <div className="mt-3 rounded-lg bg-muted p-2 overflow-hidden flex items-center justify-center min-h-[120px]">
            <img
              src={`data:image/png;base64,${artifact.content}`}
              alt={artifact.title}
              className=" max-w-full object-contain rounded"
            />
          </div>
        );
      case "video":
        return (
          <div className="mt-3 rounded-lg bg-muted p-2 overflow-hidden flex items-center justify-center min-h-[120px]">
            <Video className="w-12 h-12 text-muted-foreground/50" />
          </div>
        );
      case "audio":
        return (
          <div className="mt-3 rounded-lg bg-muted p-2 overflow-hidden flex items-center justify-center min-h-20">
            <Music className="w-10 h-10 text-muted-foreground/50" />
          </div>
        );
      default:
        return (
          <div className="mt-3 rounded-lg bg-muted p-3 overflow-hidden">
            <pre className="text-xs text-muted-foreground font-mono line-clamp-3">
              {artifact.content.split("\n").slice(0, 3).join("\n")}
            </pre>
          </div>
        );
    }
  };

  return (
    <motion.button
      ref={cardRef}
      onClick={handleClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "w-full text-left rounded-xl border p-4 cursor-pointer transition-all",
        "dark:border-gaia-700 dark:bg-gaia-800/50 dark:hover:bg-gaia-800/40",
        "border-border bg-card hover:bg-accent/50",
        isSelected && "border dark:border-green-900/90 border-green-600/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 size-9 rounded-md bg-gaia-700/40 border dark:border-gaia-700 border-border flex items-center justify-center text-lg">
            {getArtifactIcon(artifact)}
          </div>
          <div>
            <h4 className="font-medium text-sm dark:text-gaia-300">
              {artifact.title}
            </h4>
            <p className="text-xs dark:text-gaia-400 text-muted-foreground capitalize">
              {getArtifactTypeLabel(artifact)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span className="text-xs">Preview</span>
        </div>
      </div>

      {renderPreview()}
    </motion.button>
  );
}

interface ArtifactPanelProps {
  artifact: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
  boundingBox: DOMRect | null;
}

export function ArtifactPanel({
  artifact,
  isOpen,
  onClose,
  boundingBox,
}: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTab, setCurrentTab] = useState<"code" | "preview">("preview");

  const handleCopy = async () => {
    if (artifact) {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (artifact) {
      const extensions: Record<string, string> = {
        tsx: ".tsx",
        typescript: ".ts",
        javascript: ".js",
        python: ".py",
        css: ".css",
        markdown: ".md",
        image: ".png",
        video: ".mp4",
        audio: ".mp3",
      };
      const ext =
        extensions[artifact.type] ||
        extensions[artifact.language || "markdown"] ||
        ".txt";
      const blob = new Blob([artifact.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${artifact.title.toLowerCase().replace(/\s+/g, "-")}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const shouldShowTabs = () => {
    return ["code", "text", "markdown"].includes(artifact?.type || "");
  };

  const renderContent = () => {
    if (!artifact) return null;

    switch (artifact.type) {
      case "image":
        return (
          <div className="h-full flex items-center justify-center p-8 bg-muted/10">
            <img
              src={`data:image/png;base64,${artifact.content}`}
              alt={artifact.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        );
      case "video":
        return (
          <div className="h-full flex items-center justify-center p-8 bg-muted/10">
            <video
              src={artifact.content}
              controls
              className="max-w-full max-h-full rounded-lg shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/10">
            <div className="mb-8">
              <Music className="w-24 h-24 text-muted-foreground/30" />
            </div>
            <audio src={artifact.content} controls className="w-full max-w-md">
              Your browser does not support the audio tag.
            </audio>
            <p className="mt-4 text-sm text-muted-foreground">
              {artifact.title}
            </p>
          </div>
        );
      default:
        if (currentTab === "code") {
          return (
            <div className="p-4">
              <CodeBlock
                code={artifact.content}
                language={artifact.language || "markdown"}
              />
            </div>
          );
        } else {
          return (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Preview Mode</p>
                <p className="text-sm mt-2">
                  Preview functionality coming soon
                </p>
              </div>
            </div>
          );
        }
    }
  };

  if (!artifact || !isOpen) return null;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: boundingBox?.left || 0,
        y: boundingBox?.top || 0,
        width: boundingBox?.width || 300,
        height: boundingBox?.height || 200,
        borderRadius: 12,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        width: "100%",
        height: "100%",
        borderRadius: 0,
        transition: {
          type: "spring",
          stiffness: 170,
          damping: 26,
        },
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
        transition: {
          delay: 0.05,
          duration: 0.15,
          ease: "easeInOut",
        },
      }}
      className="flex flex-col h-full bg-background border-l border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 h-[60px] flex flex-row justify-between items-center bg-muted/30 border-b border-border">
        {/* Left side - Tabs or Title */}
        {shouldShowTabs() ? (
          <Tabs
            value={currentTab}
            onValueChange={(value) =>
              setCurrentTab(value as "code" | "preview")
            }
            className="w-auto"
          >
            <TabsList className="grid w-fit grid-cols-2 h-9 bg-background">
              <TabsTrigger
                value="code"
                className="px-6 h-7 data-[state=active]:bg-muted"
              >
                Code
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="px-6 h-7 data-[state=active]:bg-muted"
              >
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div className="flex items-center gap-2">
            {getArtifactIcon(artifact)}
            <h3 className="font-medium text-sm">{artifact.title}</h3>
          </div>
        )}

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-1">
          {artifact.type === "code" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-9 w-9"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-9 w-9"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-muted/10">{renderContent()}</div>
    </motion.div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

const syntaxColors: Record<string, string> = {
  keyword: "text-pink-400",
  string: "text-green-400",
  comment: "text-gray-500",
  function: "text-blue-400",
  number: "text-orange-400",
  operator: "text-cyan-400",
  type: "text-green-400",
  property: "text-purple-400",
};

function CodeBlock({ code, language }: CodeBlockProps) {
  const highlightCode = (code: string, lang: string) => {
    const lines = code.split("\n");

    return lines.map((line, lineIndex) => {
      const highlighted = line
        .replace(
          /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|try|catch|throw|new|this|super|static|public|private|protected|readonly|def|self|None|True|False|and|or|not|in|is|lambda|with|as|yield|raise|pass|break|continue|global|nonlocal)\b/g,
          `<span class="${syntaxColors.keyword}">$1</span>`
        )
        .replace(
          /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
          `<span class="${syntaxColors.string}">$&</span>`
        )
        .replace(
          /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/gm,
          `<span class="${syntaxColors.comment}">$1</span>`
        )
        .replace(
          /\b(\d+\.?\d*)\b/g,
          `<span class="${syntaxColors.number}">$1</span>`
        )
        .replace(
          /\b([A-Z][a-zA-Z0-9]*)\b(?=\s*[<({:]|\s+\w)/g,
          `<span class="${syntaxColors.type}">$1</span>`
        );

      return (
        <div key={lineIndex} className="flex hover:bg-muted/50">
          <span className="w-12 shrink-0 pr-3 text-right text-muted-foreground/50 select-none py-0.5">
            {lineIndex + 1}
          </span>

          <span
            className="flex-1 py-0.5 whitespace-pre-wrap wrap-break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
          />
        </div>
      );
    });
  };

  return (
    <div className="rounded-lg bg-[oklch(0.12_0.01_260)] dark:bg-[oklch(0.12_0.01_260)] border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {language}
        </span>
      </div>

      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-foreground">
          <code className="table w-full">{highlightCode(code, language)}</code>
        </pre>
      </div>
    </div>
  );
}
