import type { AppContext } from "../../types";
import type z from "zod";
import {
  db,
  chat,
  message,
  vote,
  stream,
  eq,
  and,
  desc,
  count,
} from "@gaia/db";
import { chatSchemas } from "./schema";

export const chatHandlers = {
  // CHATS
  createChat: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.createChatInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [newChat] = await db
      .insert(chat)
      .values({
        name: input.name,
        userId: context.session.user.id,
        id: input.chatId || undefined,
      })
      .returning();

    return {
      success: true,
      message: "Chat created successfully",
      chat: newChat,
    };
  },

  listChats: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof chatSchemas.listChatsInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, chats: [], hasMore: false, total: 0 };
    }

    const limit = input.limit;
    const conditions = [eq(chat.userId, context.session.user.id)];

    const [chats, totalCount] = await Promise.all([
      db
        .select()
        .from(chat)
        .where(and(...conditions))
        .orderBy(desc(chat.createdAt))
        .limit(limit + 1)
        .offset(input.offset),
      db
        .select({ count: count() })
        .from(chat)
        .where(eq(chat.userId, context.session.user.id)),
    ]);

    const hasMore = chats.length > limit;
    const paginatedChats = hasMore ? chats.slice(0, limit) : chats;

    return {
      success: true,
      chats: paginatedChats,
      nextOffset: hasMore ? input.offset + limit : undefined,
      hasMore,
      total: Number(totalCount[0]?.count ?? 0),
    };
  },

  getChat: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.getChatInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [foundChat] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.id), eq(chat.userId, context.session.user.id))
      );

    if (!foundChat) {
      return { success: false, message: "Chat not found" };
    }

    return { success: true, chat: foundChat };
  },

  updateChat: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.updateChatInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [updatedChat] = await db
      .update(chat)
      .set({ name: input.name })
      .where(
        and(eq(chat.id, input.id), eq(chat.userId, context.session.user.id))
      )
      .returning();

    if (!updatedChat) {
      return { success: false, message: "Chat not found" };
    }

    return {
      success: true,
      message: "Chat updated successfully",
      chat: updatedChat,
    };
  },

  deleteChat: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.deleteChatInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    await Promise.all([
      db.delete(vote).where(eq(vote.chatId, input.id)),
      db.delete(message).where(eq(message.chatId, input.id)),
      db.delete(stream).where(eq(stream.chatId, input.id)),
    ]);

    const result = await db
      .delete(chat)
      .where(
        and(eq(chat.id, input.id), eq(chat.userId, context.session.user.id))
      )
      .returning();

    if (result.length === 0) {
      return { success: false, message: "Chat not found" };
    }

    return { success: true, message: "Chat deleted successfully" };
  },

  // MESSAGES
  createMessage: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.createMessageInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [chatExists] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.chatId), eq(chat.userId, context.session.user.id))
      );

    if (!chatExists) {
      return { success: false, message: "Chat not found" };
    }

    const [newMessage] = await db
      .insert(message)
      .values({
        id: input.id,
        chatId: input.chatId,
        role: input.role,
        parts: input.parts,
        attachments: input.attachments,
        metadata: input.metadata,
      })
      .returning();

    return {
      success: true,
      message: "Message created successfully",
      data: newMessage,
    };
  },

  listMessages: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.listMessagesInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, messages: [], message: "Unauthorized" };
    }

    const [chatExists] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.chatId), eq(chat.userId, context.session.user.id))
      );

    if (!chatExists) {
      return {
        success: false,
        messages: [],
        message: "Chat not found",
      };
    }

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, input.chatId))
      .orderBy(message.createdAt);

    return {
      success: true,
      messages,
      message: "Messages fetched successfully",
    };
  },

  deleteMessage: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.deleteMessageInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [chatExists] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.chatId), eq(chat.userId, context.session.user.id))
      );

    if (!chatExists) {
      return { success: false, message: "Chat not found" };
    }

    const result = await db
      .delete(message)
      .where(
        and(eq(message.id, input.messageId), eq(message.chatId, input.chatId))
      )
      .returning();

    if (result.length === 0) {
      return { success: false, message: "Message not found" };
    }

    return { success: true, message: "Message deleted successfully" };
  },

  // VOTES
  createVote: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.createVoteInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existingVote] = await db
      .select()
      .from(vote)
      .where(
        and(eq(vote.messageId, input.messageId), eq(vote.chatId, input.chatId))
      );

    if (existingVote) {
      const [updatedVote] = await db
        .update(vote)
        .set({ isUpvoted: input.isUpvoted })
        .where(
          and(
            eq(vote.messageId, input.messageId),
            eq(vote.chatId, input.chatId)
          )
        )
        .returning();

      return {
        success: true,
        message: "Vote updated successfully",
        vote: updatedVote,
      };
    }

    const [newVote] = await db.insert(vote).values(input).returning();

    return {
      success: true,
      message: "Vote created successfully",
      vote: newVote,
    };
  },

  listVotes: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.listVotesInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        votes: [],
        message: "Unauthorized",
      };
    }

    const votes = await db
      .select()
      .from(vote)
      .where(eq(vote.chatId, input.chatId));

    return {
      success: true,
      votes,
    };
  },

  // STREAMS
  createStream: async ({
    input,
    context,
  }: {
    input: z.infer<typeof chatSchemas.createStreamInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [chatExists] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.chatId), eq(chat.userId, context.session.user.id))
      );

    if (!chatExists) {
      return { success: false, message: "Chat not found" };
    }

    const [newStream] = await db
      .insert(stream)
      .values({
        userId: context.session.user.id,
        chatId: input.chatId,
      })
      .returning();

    return {
      success: true,
      message: "Stream created successfully",
      stream: newStream,
    };
  },
};
