import { motion } from "framer-motion";
import { FileCode2 } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { LLMSelector } from "@/components/llms-selector";
import { EmptyRAG } from "@/components/rag/empty-rag";
import { ArtifactPanel } from "@/components/artifact";
import { MessageList } from "@/components/chat/message-list";
import { ChatMessage, Artifact, ChatStatus } from "@gaia/ai";
import useWindowSize from "@/store/use-window-size";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ArtifactViewProps {
  chatId: string;
  messages: ChatMessage[];
  status: ChatStatus;
  input: string;
  projectId: string;
  selectedArtifact: Artifact | null;
  artifactBoundingBox: DOMRect | null;
  onSubmit: (message: PromptInputMessage) => void;
  onInputChange: (value: string) => void;
  onArtifactClick: (artifact: Artifact, boundingBox: DOMRect) => void;
  onCloseArtifact: () => void;
  onRegenerate: () => Promise<void>;
}

export const ArtifactView = ({
  messages,
  status,
  input,
  projectId,
  selectedArtifact,
  artifactBoundingBox,
  onSubmit,
  onInputChange,
  onArtifactClick,
  onCloseArtifact,
  onRegenerate,
  chatId,
}: ArtifactViewProps) => {
  const windowSize = useWindowSize();
  const HIDE_ARTIFACT_PANEL = windowSize < 1030;
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sync sheet state with selected artifact
  useEffect(() => {
    if (HIDE_ARTIFACT_PANEL && selectedArtifact) {
      setSheetOpen(true);
    } else if (!selectedArtifact) {
      setSheetOpen(false);
    }
  }, [selectedArtifact, HIDE_ARTIFACT_PANEL]);

  // Handle sheet close - only update local state
  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      onCloseArtifact();
    }
  };

  // Extracted PromptInput component to avoid duplication
  const renderPromptInput = () => (
    <PromptInput
      onSubmit={onSubmit}
      className="border bg-white dark:bg-gaia-950 border-gaia-400 dark:border-none rounded-2xl sm:rounded-3xl"
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
          <div className="hidden sm:block">
            <LLMSelector />
          </div>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!input && !status}
          status={status}
          className="bg-brand-light9 border-green-600 text-white hover:bg-brand-light8"
        />
      </PromptInputFooter>
    </PromptInput>
  );

  // Extracted conversation content to avoid duplication
  const renderConversation = (isMobile = false) => (
    <Conversation className="h-full w-full overflow-y-hidden">
      {messages?.length === 0 ? (
        <div className="flex items-center justify-center h-full px-2 sm:px-4">
          <EmptyRAG projectId={projectId} />
        </div>
      ) : (
        <ConversationContent className="px-2 sm:px-4 h-full">
          <MessageList
            chatId={chatId}
            messages={messages}
            status={status}
            selectedArtifactId={selectedArtifact?.id}
            onArtifactClick={
              isMobile
                ? (artifact, boundingBox) => {
                    onArtifactClick(artifact, boundingBox);
                  }
                : onArtifactClick
            }
            onRegenerate={onRegenerate}
          />
        </ConversationContent>
      )}
      <ConversationScrollButton />
    </Conversation>
  );

  return (
    <div className="h-full overflow-hidden">
      {/* Desktop Layout - Resizable Panels */}
      <ResizablePanelGroup
        direction="horizontal"
        className={cn(
          "h-full w-full overflow-hidden",
          HIDE_ARTIFACT_PANEL ? "hidden" : "flex"
        )}
      >
        {/* Chat Panel */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: {
                delay: 0.1,
                type: "spring",
                stiffness: 200,
                damping: 30,
              },
            }}
            exit={{
              opacity: 0,
              x: -10,
              transition: { duration: 0.2 },
            }}
          >
            {/* Scrollable Messages Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderConversation()}
            </div>

            {/* Fixed Input Area */}
            <div className="shrink-0 px-2 sm:px-4 pb-2 sm:pb-4 pt-2 border-t border-gaia-200 dark:border-gaia-800 bg-white dark:bg-transparent">
              {renderPromptInput()}
            </div>
          </motion.div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize={70}
          minSize={50}
          className={cn(HIDE_ARTIFACT_PANEL ? "hidden!" : "flex")}
        >
          <ArtifactPanel
            artifact={selectedArtifact}
            isOpen={!!selectedArtifact}
            onClose={onCloseArtifact}
            boundingBox={artifactBoundingBox}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile Layout - Sheet */}
      <div
        className={cn(
          "relative h-full w-full flex flex-col",
          HIDE_ARTIFACT_PANEL ? "flex" : "hidden"
        )}
      >
        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderConversation(true)}
        </div>

        {/* Fixed Input Area */}
        <div className="shrink-0 px-2 sm:px-4 pb-2 sm:pb-4 pt-2 border-t border-gaia-200 dark:border-gaia-800 bg-white dark:bg-transparent">
          {renderPromptInput()}
        </div>

        {/* Sheet for Mobile Artifact View */}
        <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <ArtifactPanel
              artifact={selectedArtifact}
              isOpen={true}
              onClose={() => handleSheetOpenChange(false)}
              boundingBox={null}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
