import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { chatHandlers } from "./handler";
import { chatSchemas } from "./schema";
import { chatSpecs } from "./spec";

// CHAT ROUTES
export const createChat = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/chats",
    summary: "Create a new chat",
    spec: chatSpecs.createChat,
  })
  .input(chatSchemas.createChatInput)
  .output(chatSchemas.createChatOutput)
  .handler(chatHandlers.createChat);

export const listChats = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/chats",
    summary: "Get all chats for user",
    spec: chatSpecs.listChats,
  })
  .input(chatSchemas.listChatsInput)
  .output(chatSchemas.listChatsOutput)
  .handler(chatHandlers.listChats);

export const getChat = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/chats/{id}",
    summary: "Get a specific chat",
    spec: chatSpecs.getChat,
  })
  .input(chatSchemas.getChatInput)
  .output(chatSchemas.getChatOutput)
  .handler(chatHandlers.getChat);

export const updateChat = os
  .$context<AppContext>()
  .route({
    method: "PUT",
    path: "/chats/{id}",
    summary: "Update a chat",
    spec: chatSpecs.updateChat,
  })
  .input(chatSchemas.updateChatInput)
  .output(chatSchemas.updateChatOutput)
  .handler(chatHandlers.updateChat);

export const deleteChat = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/chats/{id}",
    summary: "Delete a chat",
    spec: chatSpecs.deleteChat,
  })
  .input(chatSchemas.deleteChatInput)
  .output(chatSchemas.deleteChatOutput)
  .handler(chatHandlers.deleteChat);

// MESSAGE ROUTES
export const createMessage = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/chats/{chatId}/messages",
    summary: "Create a message in a chat",
    spec: chatSpecs.createMessage,
  })
  .input(chatSchemas.createMessageInput)
  .output(chatSchemas.createMessageOutput)
  .handler(chatHandlers.createMessage);

export const listMessages = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/chats/{chatId}/messages",
    summary: "Get all messages in a chat",
    spec: chatSpecs.listMessages,
  })
  .input(chatSchemas.listMessagesInput)
  .output(chatSchemas.listMessagesOutput)
  .handler(chatHandlers.listMessages);

export const deleteMessage = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/chats/{chatId}/messages/{messageId}",
    summary: "Delete a message",
    spec: chatSpecs.deleteMessage,
  })
  .input(chatSchemas.deleteMessageInput)
  .output(chatSchemas.deleteMessageOutput)
  .handler(chatHandlers.deleteMessage);

// VOTE ROUTES

export const createVote = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/chats/{chatId}/votes",
    summary: "Create or update a vote",
    spec: chatSpecs.createVote,
  })
  .input(chatSchemas.createVoteInput)
  .output(chatSchemas.createVoteOutput)
  .handler(chatHandlers.createVote);

export const listVotes = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/chats/{chatId}/votes",
    summary: "Get votes for a chat",
    spec: chatSpecs.listVotes,
  })
  .input(chatSchemas.listVotesInput)
  .output(chatSchemas.listVotesOutput)
  .handler(chatHandlers.listVotes);

// STREAM ROUTES

export const createStream = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/chats/{chatId}/streams",
    summary: "Create a stream for a chat",
    spec: chatSpecs.createStream,
  })
  .input(chatSchemas.createStreamInput)
  .output(chatSchemas.createStreamOutput)
  .handler(chatHandlers.createStream);

// CHAT ROUTER

export const ChatRouter = os
  .$context<AppContext>()
  .prefix("/chats")
  .tag("Chats")
  .router({
    // Chat operations
    create: createChat,
    list: listChats,
    get: getChat,
    update: updateChat,
    delete: deleteChat,

    // Message operations
    createMessage: createMessage,
    listMessages: listMessages,
    deleteMessage: deleteMessage,

    // Vote operations
    createVote: createVote,
    listVotes: listVotes,

    // Stream operations
    createStream: createStream,
  });
