import { SunMediumIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
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
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
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
    <div className=" ">
      {messages.map((message, messageIndex) => (
        <div key={message.id} className="flex flex-col  gap-4!">
          {/* Sources Section */}
          {message.role === "assistant" &&
            message.parts.filter((part) => part.type === "source-url").length >
              0 && (
              <Sources>
                <SourcesTrigger
                  count={
                    message.parts.filter((part) => part.type === "source-url")
                      .length
                  }
                />
                {message.parts
                  .filter((part) => part.type === "source-url")
                  .map((part, i) => (
                    <SourcesContent key={`${message.id}-source-${i}`}>
                      <Source href={part.url} title={part.url} />
                    </SourcesContent>
                  ))}
              </Sources>
            )}

          {/* Message Item */}
          <MessageItem
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
        </div>
      ))}

      {/* Loading Indicator */}
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
  onRetry,
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

  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate();
    }
  };

  const textContent = message.parts?.find((p) => p.type === "text")?.text || "";
  const attachments = message.metadata?.attachments || [];
  const isLiked = vote?.isUpvoted === true;
  const isDisliked = vote?.isUpvoted === false;
  const isAssistant = message.role === "assistant";
  const isStreaming = status === "submitted" || status === "streaming";

  // Find reasoning parts
  const reasoningParts =
    message.parts?.filter((p) => p.type === "reasoning") || [];

  // Find artifact parts
  const artifactParts =
    message.parts?.filter(
      (p) =>
        p.type === "tool-createCodeArtifact" ||
        p.type == "tool-createImageArtifact"
    ) || [];

  return (
    <>
      {/* Reasoning Section */}
      {isAssistant && reasoningParts.length > 0 && (
        <>
          {reasoningParts.map((part, idx) => (
            <Reasoning
              key={`${message.id}-reasoning-${idx}`}
              className="w-full"
              isStreaming={isStreaming && isLast}
            >
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          ))}
        </>
      )}

      {/* Main Message */}
      <Message from={message.role} className="first:mt-4">
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
          {isAssistant ? (
            <MessageResponse className="">{textContent}</MessageResponse>
          ) : (
            textContent
          )}
        </MessageContent>

        {/* Show actions only for completed assistant messages */}
        {isAssistant && textContent && !isStreaming && (
          <MessageActions>
            {isLoadingVotes ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <MessageAction
                  label="Like"
                  onClick={() => handleVote(true)}
                  tooltip="Like this response"
                >
                  <ThumbsUpIcon
                    className="size-3.5"
                    fill={isLiked ? "currentColor" : "none"}
                  />
                </MessageAction>
                <MessageAction
                  label="Dislike"
                  onClick={() => handleVote(false)}
                  tooltip="Dislike this response"
                >
                  <ThumbsDownIcon
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

      {/* Artifacts Section */}
      {isAssistant && artifactParts.length > 0 && (
        <>
          {artifactParts.map((part) => {
            const { toolCallId, state, output } = part;
            if (state === "output-available" && output?.artifact) {
              return (
                <div
                  key={`${message.id}-artifact-${toolCallId}`}
                  className="my-4"
                >
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
        </>
      )}

      {/* Thinking Indicator */}
      {isStreaming && !isAssistant && isLast && (
        <Message from="assistant">
          <div className="mb-2 animate-pulse text-[12px] text-muted-foreground">
            <SunMediumIcon className="inline-block size-4 mb-0.5 animate-pulse" />
            <span className="pt-2">Thinking</span>
          </div>
        </Message>
      )}
    </>
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
