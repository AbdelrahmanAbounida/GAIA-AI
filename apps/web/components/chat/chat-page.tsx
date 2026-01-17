"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";
import { useCredentials } from "@/hooks/use-credentials";
import { showErrorToast } from "@/components/ui/toast";
import { ChatMessage, Artifact } from "@gaia/ai";
import { ChatView } from "@/components/chat/chat-view";
import { ArtifactView } from "@/components/chat/artifact-view";
import { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

interface ChatPageProps {
  id: string;
  initialMessages?: ChatMessage[];
  initialChatModel?: string;
  autoResume?: boolean;
  isHome?: boolean;
  errorMessage?: string;
}

export const ChatPageView = ({
  id,
  initialMessages = [],
  initialChatModel,
  autoResume = false,
  isHome = false,
  errorMessage,
}: ChatPageProps) => {
  const [chatId, setChatId] = useState(id);
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const queryClient = useQueryClient();
  const [artifactBoundingBox, setArtifactBoundingBox] =
    useState<DOMRect | null>(null);
  const { id: paramProjectId } = useParams<{ id: string }>();
  const { activeProjectId } = useAppStore();
  const projectId = activeProjectId ?? paramProjectId!;

  const { credentials, isLoading: isPending } = useCredentials();

  const { messages, sendMessage, status, regenerate } = useChat<ChatMessage>({
    id: chatId || uuidv4(),
    messages: initialMessages,
    experimental_throttle: 100,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            chatId,
            messages,
            message: messages.at(-1),
            userDescription: input,
            projectId: projectId,
            ...body,
          },
        };
      },
    }),

    onData: (dataPart: any) => {},
    onFinish: (message) => {
      if (message.isError) {
        showErrorToast({
          title: "Error",
          description: "Something went wrong",
        });
        queryClient.invalidateQueries({
          queryKey: ["chats"],
        });
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
    },
    onError: (error) => {
      showErrorToast({
        title: "Error",
        description: error?.message || "Something went wrong",
      });
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (!isPending && credentials?.length === 0) {
      showErrorToast({
        title: "No AI Models Configured",
        description: "Please add AI Provider to start chatting",
        position: "top-right",
      });
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          webSearch: webSearch,
        },
      }
    );
    setInput("");
    window.history.replaceState(
      {},
      "",
      `/projects/${projectId}/chat/${chatId}`
    );
  };

  const handleArtifactClick = (artifact: Artifact, boundingBox: DOMRect) => {
    setSelectedArtifact(artifact);
    setArtifactBoundingBox(boundingBox);
  };

  const handleCloseArtifact = () => {
    setSelectedArtifact(null);
    setArtifactBoundingBox(null);
  };

  return (
    <div className="h-full w-full max-h-[calc(100dvh-59px)] overflow-hidden! ">
      <AnimatePresence mode="wait">
        {selectedArtifact ? (
          <ArtifactView
            key="artifact-view"
            chatId={chatId}
            messages={messages}
            status={status}
            input={input}
            projectId={projectId!}
            selectedArtifact={selectedArtifact}
            artifactBoundingBox={artifactBoundingBox}
            onSubmit={handleSubmit}
            onInputChange={setInput}
            onArtifactClick={handleArtifactClick}
            onCloseArtifact={handleCloseArtifact}
            onRegenerate={regenerate}
          />
        ) : (
          <ChatView
            key="chat-view"
            chatId={chatId}
            messages={messages}
            status={status}
            input={input}
            projectId={projectId!}
            onSubmit={handleSubmit}
            onInputChange={setInput}
            onArtifactClick={handleArtifactClick}
            onRegenerate={regenerate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
