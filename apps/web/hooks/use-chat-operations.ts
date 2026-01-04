import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { orpc, orpcQueryClient } from "@/lib/orpc/client";
import { useChatStore } from "@/store/use-chat-store";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { convertToUIMessages } from "@/lib/utils";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";

export function useChatOperations(chatId: string) {
  const queryClient = useQueryClient();
  const {
    setMessages,
    setLoadingMessages,
    setLoadingVotes,
    addMessage,
    deleteMessage: removeMessageFromStore,
  } = useChatStore();

  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery(
    orpcQueryClient.authed.chat.listMessages.queryOptions({
      input: { chatId },
      queryKey: ["chats", chatId, "messages"],
    })
  );

  const {
    data: votesResponse,
    isLoading: isLoadingVotes,
    error: votesError,
  } = useQuery(
    orpcQueryClient.authed.chat.listVotes.queryOptions({
      input: { chatId },
      queryKey: ["chats", chatId, "votes"],
    })
  );

  useEffect(() => {
    setLoadingMessages(isLoadingMessages);

    if (messagesResponse) {
      if (!messagesResponse.success) {
        return;
      }
      setMessages(convertToUIMessages(messagesResponse.messages || []));
    }
  }, [messagesResponse, isLoadingMessages, setMessages, setLoadingMessages]);

  useEffect(() => {
    setLoadingVotes(isLoadingVotes);
  }, [isLoadingVotes, setLoadingVotes]);

  const uiMessages = useMemo(
    () => convertToUIMessages(messagesResponse?.messages || []),
    [messagesResponse]
  );

  const { mutate: createMessage, isPending: isCreatingMessage } = useMutation(
    orpcQueryClient.authed.chat.createMessage.mutationOptions({
      onSuccess: (response) => {
        if (!response?.success) {
          showErrorToast({
            title: "Error",
            description: response.message || "Failed to send message",
          });
          return;
        }

        if (response.data) {
          addMessage(convertToUIMessages([response.data])[0]);
        }

        queryClient.invalidateQueries({
          queryKey: ["chats", chatId, "messages"],
        });
      },
      onError: (error) => {
        showErrorToast({
          title: "Error",
          description: "Failed to send message",
        });
        console.error("Create message error:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.chat.listMessages.key(),
        });
      },
    })
  );

  const { mutate: deleteMessage, isPending: isDeletingMessage } = useMutation(
    orpcQueryClient.authed.chat.deleteMessage.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: ["chats", chatId, "messages"],
        });

        const previousMessages = queryClient.getQueryData([
          "chats",
          chatId,
          "messages",
        ]);

        removeMessageFromStore(variables.chatId);

        return { previousMessages };
      },
      onSuccess: (response) => {
        if (!response?.success) {
          showErrorToast({
            title: "Error",
            description: response.message || "Failed to delete message",
          });
          return;
        }
        toast.success("Message deleted");
      },
      onError: (error, variables, context) => {
        if (context?.previousMessages) {
          queryClient.setQueryData(
            ["chats", chatId, "messages"],
            context.previousMessages
          );
        }
        showErrorToast({
          title: "Error",
          description: "Failed to delete message",
        });
        console.error("Delete message error:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: ["chats", chatId, "messages"],
        });
      },
    })
  );

  const { mutate: voteMessage, isPending: isVoting } = useMutation(
    orpcQueryClient.authed.chat.createVote.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: ["chats", chatId, "votes"],
        });

        const previousVotes = queryClient.getQueryData([
          "chats",
          chatId,
          "votes",
        ]);

        queryClient.setQueryData(["chats", chatId, "votes"], (old: any) => {
          if (!old?.success) return old;

          const existingVote = old.votes.find(
            (v: any) => v.messageId === variables.messageId
          );

          if (existingVote) {
            return {
              ...old,
              votes: old.votes.map((v: any) =>
                v.messageId === variables.messageId
                  ? { ...v, isUpvoted: variables.isUpvoted }
                  : v
              ),
            };
          }

          return {
            ...old,
            votes: [
              ...old.votes,
              {
                messageId: variables.messageId,
                chatId: variables.chatId,
                isUpvoted: variables.isUpvoted,
              },
            ],
          };
        });

        return { previousVotes };
      },
      onSuccess: (response) => {
        if (!response?.success) {
          showErrorToast({
            title: "Error",
            description: response.message || "Failed to record vote",
          });
        }
      },
      onError: (error, variables, context) => {
        if (context?.previousVotes) {
          queryClient.setQueryData(
            ["chats", chatId, "votes"],
            context.previousVotes
          );
        }
        showErrorToast({
          title: "Error",
          description: "Failed to record vote",
        });
        console.error("Vote error:", error);
      },
    })
  );

  const deleteChat = useMutation(
    orpcQueryClient.authed.chat.delete.mutationOptions({
      onSuccess: (response) => {
        if (!response?.success) {
          showErrorToast({
            title: "Error",
            description: response.message || "Failed to delete chat",
          });
          return;
        }
        showSuccessToast({
          title: "Success",
          description: "Chat deleted successfully",
        });
      },
      onError: (error) => {
        showErrorToast({
          title: "Error",
          description: "Failed to delete chat",
        });
        console.error("Delete chat error:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.chat.listMessages.key(),
        });
      },
    })
  );

  const chatExists = messagesResponse?.success !== false;

  return {
    // Data
    messages: messagesResponse?.messages || [],
    uiMessages,
    votes: votesResponse?.votes || [],
    chatExists,

    // chat
    deleteChat,

    // Loading states
    isLoadingMessages,
    isLoadingVotes,

    // Errors
    messagesError,
    votesError,

    // Mutations
    createMessage,
    isCreatingMessage,
    deleteMessage,
    isDeletingMessage,
    voteMessage,
    isVoting,
  };
}

export function useChatHistory(limit = 20) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    isPlaceholderData,
    isFetching,
    refetch,
  } = useInfiniteQuery(
    orpcQueryClient.authed.chat.list.infiniteOptions({
      input: (pageParam: number | undefined) => ({
        limit,
        offset: pageParam ?? 0,
      }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextOffset,
      queryKey: ["chats"],
    })
  );

  const chats = data?.pages.flatMap((page) => page.chats) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return {
    data: chats,
    total,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    isPlaceholderData,
    refetch,
  };
}
