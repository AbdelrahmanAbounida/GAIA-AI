import { motion } from "framer-motion";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputHeader,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { LLMSelector } from "@/components/llms-selector";
import { EmptyRAG } from "@/components/rag/empty-rag";
import { MessageList } from "@/components/chat/message-list";
import { ChatMessage, Artifact, ChatStatus } from "@gaia/ai";

interface ChatViewProps {
  chatId: string;
  messages: ChatMessage[];
  status: ChatStatus;
  input: string;
  projectId: string;
  onSubmit: (message: PromptInputMessage) => void;
  onInputChange: (value: string) => void;
  onArtifactClick: (artifact: Artifact, boundingBox: DOMRect) => void;
  onRegenerate: () => Promise<void>;
}

export const ChatView = ({
  messages,
  status,
  input,
  projectId,
  onSubmit,
  onInputChange,
  onArtifactClick,
  onRegenerate,
  chatId,
}: ChatViewProps) => {
  const hasMessages = messages?.length > 0;

  console.log({ messages });
  return (
    <motion.div
      className="flex flex-col h-full w-full "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Messages Area - Takes remaining space and scrolls */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {hasMessages ? (
          <Conversation className="h-full overflow-hidden text-wrap">
            <ConversationContent className="flex flex-col gap-6 max-w-4xl mx-auto px-2 sm:px-4">
              <MessageList
                chatId={chatId}
                messages={messages}
                status={status}
                onArtifactClick={onArtifactClick}
                onRegenerate={onRegenerate}
              />
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : (
          <div className="flex items-center justify-center h-full">
            <EmptyRAG projectId={projectId} />
          </div>
        )}
      </div>

      <div className="shrink-0 w-full max-w-4xl mx-auto px-2 sm:px-4 pb-2 sm:pb-4 pt-2">
        <PromptInput
          onSubmit={onSubmit}
          className="border bg-white dark:bg-gaia-950 border-gaia-400 dark:border-none rounded-2xl sm:rounded-3xl dark:shadow-sm"
          globalDrop
          multiple
        >
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              className="outline-none ring-0 text-sm sm:text-base"
              onChange={(e) => onInputChange(e.target.value)}
              value={input}
              placeholder="Type a message..."
              disabled={status === "submitted" || status === "streaming"}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex-wrap gap-2">
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <LLMSelector />
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input?.trim()}
              status={status}
              className="bg-brand-light9 border-green-600 text-white hover:bg-brand-light8"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </motion.div>
  );
};
