import { z } from "zod";
import {
  ChatSchema,
  MessageSchema,
  VoteSchema,
  createMessageSchema,
  createVoteSchema,
} from "@gaia/db";

export const chatSchemas = {
  // CHAT INPUT/OUTPUT SCHEMAS
  createChatInput: z.object({
    name: z.string(),
    chatId: z.string().optional(),
  }),

  listChatsInput: z.object({
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),

  getChatInput: z.object({
    id: z.string(),
  }),

  updateChatInput: z.object({
    id: z.string(),
    name: z.string(),
  }),

  deleteChatInput: z.object({
    id: z.string(),
  }),

  createChatOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    chat: ChatSchema.optional(),
  }),

  listChatsOutput: z.object({
    success: z.boolean(),
    chats: z.array(ChatSchema),
    nextOffset: z.number().optional(),
    hasMore: z.boolean(),
    total: z.number().default(0),
    message: z.string().optional(),
  }),

  getChatOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    chat: ChatSchema.optional(),
  }),

  updateChatOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    chat: ChatSchema.optional(),
  }),

  deleteChatOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  // MESSAGE INPUT/OUTPUT SCHEMAS
  createMessageInput: createMessageSchema.extend({
    id: z.string().optional(),
  }),

  listMessagesInput: z.object({
    chatId: z.string(),
  }),

  deleteMessageInput: z.object({
    chatId: z.string(),
    messageId: z.string(),
  }),

  createMessageOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    data: MessageSchema.optional(),
  }),

  listMessagesOutput: z.object({
    success: z.boolean(),
    messages: z.array(MessageSchema),
    message: z.string().optional(),
  }),

  deleteMessageOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  // VOTE INPUT/OUTPUT SCHEMAS
  createVoteInput: createVoteSchema,

  listVotesInput: z.object({
    chatId: z.string(),
  }),

  createVoteOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    vote: VoteSchema.optional(),
  }),

  listVotesOutput: z.object({
    success: z.boolean(),
    votes: z.array(VoteSchema),
    message: z.string().optional(),
  }),

  // STREAM INPUT/OUTPUT SCHEMAS
  createStreamInput: z.object({
    chatId: z.string(),
  }),

  createStreamOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    stream: z.any().optional(),
  }),
};
