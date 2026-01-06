import {
  Component,
  Database,
  Search,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Sun,
} from "lucide-react";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { CopyButton } from "@/components/ui/copy-button";
import { ArtifactCard } from "@/components/artifact";
import { ChatMessage, Artifact, ChatStatus } from "@gaia/ai";
import { useChatOperations } from "@/hooks/use-chat-operations";
import { Skeleton } from "../ui/skeleton";
import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "../logo";

interface MessageListProps {
  messages: ChatMessage[];
  chatId: string;
  status: ChatStatus;
  selectedArtifactId?: string;
  onArtifactClick: (artifact: Artifact, boundingBox: DOMRect) => void;
  onRegenerate?: () => Promise<void>;
}

export const MessageList = ({
  chatId,
  messages,
  status,
  selectedArtifactId,
  onArtifactClick,
  onRegenerate,
}: MessageListProps) => {
  const { isLoadingVotes, votes, voteMessage, isVoting } =
    useChatOperations(chatId);

  return (
    <div className="space-y-6">
      {messages.map((message, messageIndex) => (
        <MessageItem
          key={message.id}
          status={status}
          message={message}
          chatId={chatId}
          isLast={messageIndex === messages.length - 1}
          vote={votes?.find((v) => v.messageId === message.id)}
          isLoadingVotes={isLoadingVotes}
          onVote={voteMessage}
          isVoting={isVoting}
          selectedArtifactId={selectedArtifactId}
          onArtifactClick={onArtifactClick}
          onRegenerate={
            messageIndex === messages.length - 1 ? onRegenerate : undefined
          }
        />
      ))}

      {status === "submitted" && (
        <div className="flex justify-center py-4">
          <Loader className="text-muted size-5" />
        </div>
      )}
    </div>
  );
};

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  status: ChatStatus;
  chatId: string;
  isLast?: boolean;
  vote?: { messageId: string; isUpvoted: boolean } | null;
  isLoadingVotes: boolean;
  selectedArtifactId?: string;
  onArtifactClick?: (artifact: Artifact, boundingBox: DOMRect) => void;
  onRegenerate?: () => Promise<void>;
  onVote: (params: {
    chatId: string;
    messageId: string;
    isUpvoted: boolean;
  }) => void;
  isVoting: boolean;
}

export const MessageItem = ({
  message,
  status,
  chatId,
  isLast = false,
  vote,
  isLoadingVotes,
  selectedArtifactId,
  onArtifactClick,
  onRegenerate,
  onVote,
  isVoting,
}: MessageItemProps) => {
  const handleVote = (isUpvoted: boolean) => {
    if (isVoting) return;
    onVote({
      chatId,
      messageId: message.id,
      isUpvoted,
    });
  };

  const isAssistant = message.role === "assistant";

  if (!isAssistant) {
    const textContent =
      message.parts?.find((p) => p.type === "text")?.text || "";
    const attachments = message.metadata?.attachments || [];

    return (
      <motion.div
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Message from={message.role}>
          {attachments.length > 0 && (
            <MessageAttachments className="mb-2">
              {attachments.map((attachment: any, idx: number) => (
                <MessageAttachment
                  key={idx}
                  data={{
                    type: "file",
                    url: attachment.url || URL.createObjectURL(attachment),
                    mediaType: attachment.type,
                    filename: attachment.name,
                  }}
                />
              ))}
            </MessageAttachments>
          )}
          <MessageContent className="max-w-xl w-full">
            {textContent}
          </MessageContent>
        </Message>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <TabsWithLine
        message={message}
        status={status}
        isLast={isLast}
        selectedArtifactId={selectedArtifactId}
        onArtifactClick={onArtifactClick}
        vote={vote}
        isLoadingVotes={isLoadingVotes}
        onVote={handleVote}
        isVoting={isVoting}
      />
    </motion.div>
  );
};

// Smart source extraction
interface Source {
  type: "rag" | "mcp" | "dynamic" | "unknown";
  toolName: string;
  content: any;
  metadata?: Record<string, any>;
}

function extractSources(message: ChatMessage): Source[] {
  const sources: Source[] = [];

  message.parts?.forEach((part: any) => {
    // Handle dynamic-tool type (new format from your actual data)
    if (part.type === "dynamic-tool" && part.state === "output-available") {
      const toolName = part.toolName;
      const output = part.output;

      console.log("Found dynamic tool:", toolName, output);

      // Check if this is RAG tool by name
      if (toolName === "ragTool" && output?.documents?.length > 0) {
        output.documents.forEach((doc: any) => {
          sources.push({
            type: "rag",
            toolName: "Knowledge Base",
            content: doc.content,
            metadata: doc.metadata || {},
          });
        });
        return;
      }

      // Check for MCP tools (contains underscore in name)
      if (toolName.includes("_")) {
        const [serverName, actualToolName] = toolName.split("_");

        // Handle content array format
        if (output?.content && Array.isArray(output.content)) {
          output.content.forEach((item: any, idx: number) => {
            const contentText =
              item.text || item.content || JSON.stringify(item);
            sources.push({
              type: "mcp",
              toolName: `${serverName.replace("_", " ")} (${actualToolName.replace("_", " ")})`,
              content: contentText,
              metadata: {
                server: serverName,
                tool: actualToolName,
                type: item.type || "text",
                index: idx,
              },
            });
          });
        }
        // Handle single content string/object
        else if (output?.content) {
          sources.push({
            type: "mcp",
            toolName: `${serverName.replace("_", " ")} (${actualToolName.replace("_", " ")})`,
            content:
              typeof output.content === "string"
                ? output.content
                : JSON.stringify(output.content, null, 2),
            metadata: { server: serverName, tool: actualToolName },
          });
        }
        // Handle resources
        else if (output?.resources) {
          sources.push({
            type: "mcp",
            toolName: `${serverName.replace("_", " ")} (${actualToolName.replace("_", " ")})`,
            content: JSON.stringify(output.resources, null, 2),
            metadata: {
              server: serverName,
              tool: actualToolName,
              type: "resources",
            },
          });
        }
        // Generic MCP output
        else if (output && !output.isError) {
          sources.push({
            type: "mcp",
            toolName: `${serverName.replace("_", " ")} (${actualToolName.replace("_", " ")})`,
            content: JSON.stringify(output, null, 2),
            metadata: { server: serverName, tool: actualToolName },
          });
        }
        return;
      }

      // Handle other dynamic tools
      if (output && !output.isError) {
        let content = "";

        if (output.answer) {
          content = output.answer;
        } else if (output.result) {
          content =
            typeof output.result === "string"
              ? output.result
              : JSON.stringify(output.result, null, 2);
        } else if (output.data) {
          content = JSON.stringify(output.data, null, 2);
        } else if (output.content) {
          content = Array.isArray(output.content)
            ? output.content
                .map((c: any) => c.text || c.content || JSON.stringify(c))
                .join("\n\n")
            : typeof output.content === "string"
              ? output.content
              : JSON.stringify(output.content, null, 2);
        } else {
          content = JSON.stringify(output, null, 2);
        }

        sources.push({
          type: "dynamic",
          toolName: toolName.replace(/_/g, " "),
          content,
          metadata: { toolType: "custom", originalToolName: toolName },
        });
      }
      return;
    }

    // Legacy format: tool-* types
    if (part.type?.startsWith("tool-") && part.state === "output-available") {
      const toolName = part.type.replace("tool-", "");
      const output = part.output;

      // RAG Tool - has documents array
      if (toolName === "ragTool" && output?.documents?.length > 0) {
        output.documents.forEach((doc: any) => {
          sources.push({
            type: "rag",
            toolName: "Knowledge Base",
            content: doc.content,
            metadata: doc.metadata || {},
          });
        });
        return;
      }

      // MCP Tools - detect by naming pattern (serverName_toolName)
      if (toolName.includes("_")) {
        const [serverName, actualToolName] = toolName.split("_");

        if (output?.content) {
          if (Array.isArray(output.content)) {
            output.content.forEach((item: any) => {
              if (item.text || item.content) {
                sources.push({
                  type: "mcp",
                  toolName: `${serverName} (${actualToolName})`,
                  content: item.text || item.content,
                  metadata: {
                    server: serverName,
                    tool: actualToolName,
                    ...item,
                  },
                });
              }
            });
          } else {
            sources.push({
              type: "mcp",
              toolName: `${serverName} (${actualToolName})`,
              content:
                typeof output.content === "string"
                  ? output.content
                  : JSON.stringify(output.content, null, 2),
              metadata: { server: serverName, tool: actualToolName },
            });
          }
        } else if (output?.resources) {
          sources.push({
            type: "mcp",
            toolName: `${serverName} (${actualToolName})`,
            content: JSON.stringify(output.resources, null, 2),
            metadata: {
              server: serverName,
              tool: actualToolName,
              type: "resources",
            },
          });
        } else if (output) {
          sources.push({
            type: "mcp",
            toolName: `${serverName} (${actualToolName})`,
            content: JSON.stringify(output, null, 2),
            metadata: { server: serverName, tool: actualToolName },
          });
        }
        return;
      }

      // Dynamic/Custom Tools
      if (output) {
        let content = "";

        if (output.answer) {
          content = output.answer;
        } else if (output.result) {
          content =
            typeof output.result === "string"
              ? output.result
              : JSON.stringify(output.result, null, 2);
        } else if (output.data) {
          content = JSON.stringify(output.data, null, 2);
        } else {
          content = JSON.stringify(output, null, 2);
        }

        sources.push({
          type: "dynamic",
          toolName: toolName.replace(/_/g, " "),
          content,
          metadata: { toolType: "custom" },
        });
      }
    }
  });

  return sources;
}

interface TabsWithLineProps {
  message: ChatMessage;
  status: ChatStatus;
  isLast: boolean;
  selectedArtifactId?: string;
  onArtifactClick?: (artifact: Artifact, boundingBox: DOMRect) => void;
  vote?: { messageId: string; isUpvoted: boolean } | null;
  isLoadingVotes: boolean;
  onVote: (isUpvoted: boolean) => void;
  isVoting: boolean;
}

const TabsWithLine = ({
  message,
  status,
  isLast,
  selectedArtifactId,
  onArtifactClick,
  vote,
  isLoadingVotes,
  onVote,
  isVoting,
}: TabsWithLineProps) => {
  const [activeTab, setActiveTab] = useState("Answer");
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Extract sources intelligently
  const sources = useMemo(() => extractSources(message), [message]);

  // Always show both tabs
  const tabs = ["Answer", "Sources"];

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement) {
      setLineStyle({
        width: activeTabElement.offsetWidth,
        left: activeTabElement.offsetLeft,
      });
    }
  }, [activeTab]);

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Tab Navigation - Always visible */}
        <div className="relative">
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gaia-700">
            {tabs.map((tab) => (
              <button
                key={tab}
                // ref={(el) => (tabRefs.current[tab] = el)}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm cursor-pointer font-medium transition-colors duration-200 relative z-10 hover:bg-gaia-200 rounded-lg dark:hover:bg-gaia-800",
                  activeTab === tab
                    ? "text-zinc-700 dark:text-gaia-300 border-b rounded-b-none border-gaia-600 dark:border-gaia-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gaia-500 dark:hover:text-gaia-400"
                )}
              >
                <div className="flex items-center gap-2">
                  {tab === "Sources" ? (
                    <>
                      <Database className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Logo isIcon isLink={false} className="size-5" />
                    </>
                  )}
                  {tab}
                  {tab === "Sources" && sources.length > 0 && (
                    <span className="size-5.5 flex items-center justify-center text-gaia-800 text-xs rounded-full bg-white border-gaia-300 dark:border-gaia-600 border dark:bg-gaia-800 dark:text-white">
                      {sources.length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <motion.div
            className="absolute bottom-0 h-0.5 bg-gaia-700 dark:bg-gaia-500"
            initial={false}
            animate={{
              width: lineStyle.width,
              left: lineStyle.left,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "Answer" && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnswerSection
                message={message}
                status={status}
                isLast={isLast}
                selectedArtifactId={selectedArtifactId}
                onArtifactClick={onArtifactClick}
                vote={vote}
                isLoadingVotes={isLoadingVotes}
                onVote={onVote}
                isVoting={isVoting}
              />
            </motion.div>
          )}
          {activeTab === "Sources" && (
            <motion.div
              key="sources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SourcesSection sources={sources} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface AnswerSectionProps {
  message: ChatMessage;
  status: ChatStatus;
  isLast: boolean;
  selectedArtifactId?: string;
  onArtifactClick?: (artifact: Artifact, boundingBox: DOMRect) => void;
  vote?: { messageId: string; isUpvoted: boolean } | null;
  isLoadingVotes: boolean;
  onVote: (isUpvoted: boolean) => void;
  isVoting: boolean;
}

const AnswerSection = ({
  message,
  status,
  isLast,
  selectedArtifactId,
  onArtifactClick,
  vote,
  isLoadingVotes,
  onVote,
  isVoting,
}: AnswerSectionProps) => {
  const isStreaming = status === "submitted" || status === "streaming";
  const reasoningParts =
    message.parts?.filter((p) => p.type === "reasoning") || [];
  const textContent = message.parts?.find((p) => p.type === "text")?.text || "";
  const artifactParts =
    message.parts?.filter(
      (p) =>
        p.type === "tool-createCodeArtifact" ||
        p.type === "tool-createImageArtifact"
    ) || [];

  const isCallingTool =
    isLast &&
    isStreaming &&
    message.parts?.some(
      (p: any) =>
        p.type === "step-start" ||
        (p.type.startsWith("tool-") &&
          p.state !== "output-available" &&
          p.state !== "done") ||
        (p.type === "dynamic-tool" &&
          p.state !== "output-available" &&
          p.state !== "done")
    );

  const isLiked = vote?.isUpvoted === true;
  const isDisliked = vote?.isUpvoted === false;

  return (
    <div className="space-y-4">
      {reasoningParts.map((part, idx) => (
        <Reasoning
          key={`reasoning-${idx}`}
          className="w-full"
          isStreaming={isStreaming && isLast}
        >
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      ))}

      {isCallingTool && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="size-4" />
          <span>Using tools...</span>
        </div>
      )}

      {textContent && (
        <Message from="assistant">
          <MessageContent className="max-w-xl w-full">
            <MessageResponse>{textContent}</MessageResponse>
          </MessageContent>

          {!isStreaming && (
            <MessageActions>
              {isLoadingVotes ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <MessageAction
                    label="Like"
                    onClick={() => onVote(true)}
                    tooltip="Like this response"
                  >
                    <ThumbsUp
                      className="size-3.5"
                      fill={isLiked ? "currentColor" : "none"}
                    />
                  </MessageAction>
                  <MessageAction
                    label="Dislike"
                    onClick={() => onVote(false)}
                    tooltip="Dislike this response"
                  >
                    <ThumbsDown
                      className="size-3.5"
                      fill={isDisliked ? "currentColor" : "none"}
                    />
                  </MessageAction>
                  <CopyButton
                    className="rounded-md"
                    iconClassName="size-3.5 text-autofounder-600"
                    content={textContent}
                  />
                </>
              )}
            </MessageActions>
          )}
        </Message>
      )}

      {artifactParts.map((part) => {
        const { toolCallId, state, output } = part;
        if (state === "output-available" && output?.artifact) {
          return (
            <div key={`artifact-${toolCallId}`} className="my-4">
              <ArtifactCard
                artifact={output.artifact}
                onClick={(boundingBox) =>
                  onArtifactClick?.(output.artifact, boundingBox)
                }
                isSelected={selectedArtifactId === output.artifact.id}
              />
            </div>
          );
        }
        return null;
      })}

      {isStreaming && isLast && !textContent && !isCallingTool && (
        <Message from="assistant">
          <div className="mb-2 animate-pulse text-[12px] text-muted-foreground">
            <Sun className="inline-block size-4 mb-0.5 animate-pulse" />
            <span className="ml-2">Thinking</span>
          </div>
        </Message>
      )}
    </div>
  );
};

interface SourcesSectionProps {
  sources: Source[];
}

const SourcesSection = ({ sources }: SourcesSectionProps) => {
  if (sources.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-gaia-300 dark:border-zinc-700">
        <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          No sources used for this response
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          The assistant answered from its knowledge
        </p>
      </div>
    );
  }

  // Group sources by type
  const groupedSources = sources.reduce(
    (acc, source) => {
      if (!acc[source.type]) acc[source.type] = [];
      acc[source.type].push(source);
      return acc;
    },
    {} as Record<string, Source[]>
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rag":
        return <Database className="w-4 h-4" />;
      case "mcp":
        return <Component className="w-4 h-4" />;
      case "dynamic":
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "rag":
        return "Knowledge Base";
      case "mcp":
        return "MCP Tools";
      case "dynamic":
        return "Custom Tools";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedSources).map(([type, typeSources]) => (
        <div key={type} className="space-y-3">
          {/* Type Header */}
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {getTypeIcon(type)}
            <span>{getTypeLabel(type)}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gaia-200 dark:bg-gaia-800">
              {typeSources.length}
            </span>
          </div>

          {/* Sources */}
          {typeSources.map((source, idx) => (
            <motion.div
              key={`${type}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-2xl border border-gaia-300/70 bg-gaia-200 hover:bg-gaia-200/80 dark:bg-gaia-950/10 dark:hover:bg-gaia-800 dark:border-zinc-700/70 cursor-pointer transition-colors"
            >
              {/* Tool Name */}
              <div className="text-xs font-medium text-gaia-700 dark:text-gaia-400 mb-2">
                {source.toolName}
              </div>

              {/* Content */}
              <div className="text-sm dark:text-zinc-300 text-zinc-700 whitespace-pre-wrap wrap-break-word max-w-full overflow-x-auto">
                {typeof source.content === "string"
                  ? source.content
                  : JSON.stringify(source.content, null, 2)}
              </div>

              {/* Metadata */}
              {source.metadata && Object.keys(source.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gaia-400/30 dark:border-zinc-700/50">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {Object.entries(source.metadata)
                      .filter(([key]) => !key.startsWith("_"))
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium">{key}:</span>
                          <span className="truncate">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const MessageSkeleton = () => {
  return (
    <div className="flex gap-4 w-full p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};
