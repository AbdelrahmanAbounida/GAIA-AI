// import { os } from "@orpc/server";
// import type { AppContext } from "../types";
// import { z } from "zod";
// import {
//   db,
//   chat,
//   message,
//   vote,
//   stream,
//   ChatSchema,
//   MessageSchema,
//   VoteSchema,
//   eq,
//   and,
//   desc,
//   createVoteSchema,
//   createMessageSchema,
//   count,
// } from "@gaia/db";

// // This is mine

// // ============================================
// // CHAT OPERATIONS
// // ============================================

// export const createChat = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/chats/create",
//     summary: "Create a new chat",
//     tags: ["Chats"],
//   })
//   .input(z.object({ name: z.string(), chatId: z.string().optional() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       chat: ChatSchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     const [newChat] = await db
//       .insert(chat)
//       .values({
//         name: input.name,
//         userId: context.session?.user.id,
//         id: input.chatId || undefined,
//       })
//       .returning();

//     return {
//       success: true,
//       message: "Chat created successfully",
//       chat: newChat,
//     };
//   });

// export const getChats = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/chats",
//     summary: "Get all chats for user",
//     tags: ["Chats"],
//   })
//   .input(
//     z.object({
//       limit: z.number().optional().default(20),
//       offset: z.number().optional().default(0),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       chats: z.array(ChatSchema),
//       nextCursor: z.string().optional(),
//       nextOffset: z.number().optional(),
//       hasMore: z.boolean(),
//       total: z.number().default(0),
//       message: z.string().optional(),
//     })
//   )
//   .handler(async ({ context, input }) => {
//     if (!context.session?.user) {
//       return { success: false, chats: [], hasMore: false }; // Remove nextCursor from here
//     }

//     const limit = input.limit;

//     const conditions = [eq(chat.userId, context.session?.user.id)];

//     const [chats, totalCount] = await Promise.all([
//       db
//         .select()
//         .from(chat)
//         .where(and(...conditions))
//         .orderBy(desc(chat.createdAt))
//         .limit(limit + 1)
//         .offset(input.offset),
//       db
//         .select({ count: count() })
//         .from(chat)
//         .where(eq(chat.userId, context.session?.user.id)),
//     ]);

//     const hasMore = chats.length > limit;
//     const paginatedChats = hasMore ? chats.slice(0, limit) : chats;

//     return {
//       success: true,
//       chats: paginatedChats,
//       nextOffset: hasMore ? input.offset + limit : undefined,
//       hasMore,
//       total: Number(totalCount[0]?.count ?? 0),
//     };
//   });

// export const getChat = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/chats/:id",
//     summary: "Get a specific chat",
//     tags: ["Chats"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       chat: ChatSchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     const [foundChat] = await db
//       .select()
//       .from(chat)
//       .where(
//         and(eq(chat.id, input.id), eq(chat.userId, context.session?.user.id))
//       );

//     if (!foundChat) {
//       return { success: false, message: "Chat not found" };
//     }

//     return { success: true, chat: foundChat };
//   });

// export const updateChat = os
//   .$context<AppContext>()
//   .route({
//     method: "PUT",
//     path: "/chats/:id",
//     summary: "Update a chat",
//     tags: ["Chats"],
//   })
//   .input(z.object({ id: z.string(), name: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       chat: ChatSchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     const [updatedChat] = await db
//       .update(chat)
//       .set({ name: input.name })
//       .where(
//         and(eq(chat.id, input.id), eq(chat.userId, context.session?.user.id))
//       )
//       .returning();

//     if (!updatedChat) {
//       return { success: false, message: "Chat not found" };
//     }

//     return {
//       success: true,
//       message: "Chat updated successfully",
//       chat: updatedChat,
//     };
//   });

// export const deleteChat = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/chats/:id",
//     summary: "Delete a chat",
//     tags: ["Chats"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     // delete votes
//     await db.delete(vote).where(eq(vote.chatId, input.id));

//     // delete messages
//     await db.delete(message).where(eq(message.chatId, input.id));

//     // delte stream
//     await db.delete(stream).where(eq(stream.chatId, input.id));

//     const result = await db
//       .delete(chat)
//       .where(
//         and(eq(chat.id, input.id), eq(chat.userId, context.session?.user.id))
//       )
//       .returning();

//     if (result.length === 0) {
//       return { success: false, message: "Chat not found" };
//     }

//     return { success: true, message: "Chat deleted successfully" };
//   });

// // ============================================
// // MESSAGE OPERATIONS
// // ============================================

// export const createMessage = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/chats/:chatId/messages",
//     summary: "Create a message in a chat",
//     tags: ["Messages"],
//   })
//   .input(
//     createMessageSchema.extend({
//       id: z.string().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       data: MessageSchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     // Verify chat ownership
//     const [chatExists] = await db
//       .select()
//       .from(chat)
//       .where(
//         and(
//           eq(chat.id, input.chatId),
//           eq(chat.userId, context.session?.user.id)
//         )
//       );

//     if (!chatExists) {
//       return { success: false, message: "Chat not found" };
//     }

//     const [newMessage] = await db
//       .insert(message)
//       .values({
//         id: input.id, // important
//         chatId: input.chatId,
//         role: input.role,
//         parts: input.parts,
//         attachments: input.attachments,
//         metadata: input.metadata,
//       })
//       .returning();

//     return {
//       success: true,
//       message: "Message created successfully",
//       data: newMessage,
//     };
//   });

// export const getChatMessages = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/chats/:chatId/messages",
//     summary: "Get all messages in a chat",
//     tags: ["Messages"],
//   })
//   .input(z.object({ chatId: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       messages: z.array(MessageSchema),
//       message: z.string().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, messages: [], message: "Unauthorized" };
//     }

//     // Verify chat ownership
//     const [chatExists] = await db
//       .select()
//       .from(chat)
//       .where(
//         and(
//           eq(chat.id, input.chatId),
//           eq(chat.userId, context.session?.user.id)
//         )
//       );

//     if (!chatExists) {
//       return { success: false, messages: [], message: "Chat not found" };
//     }

//     const messages = await db
//       .select()
//       .from(message)
//       .where(eq(message.chatId, input.chatId))
//       .orderBy(message.createdAt);

//     return {
//       success: true,
//       messages,
//       message: "Messages fetched successfully",
//     };
//   });

// export const deleteMessage = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/chats/:chatId/messages/:id",
//     summary: "Delete a message",
//     tags: ["Messages"],
//   })
//   .input(z.object({ chatId: z.string(), id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     // Verify chat ownership
//     const [chatExists] = await db
//       .select()
//       .from(chat)
//       .where(
//         and(
//           eq(chat.id, input.chatId),
//           eq(chat.userId, context.session?.user.id)
//         )
//       );

//     if (!chatExists) {
//       return { success: false, message: "Chat not found" };
//     }

//     const result = await db
//       .delete(message)
//       .where(and(eq(message.id, input.id), eq(message.chatId, input.chatId)))
//       .returning();

//     if (result.length === 0) {
//       return { success: false, message: "Message not found" };
//     }

//     return { success: true, message: "Message deleted successfully" };
//   });

// // ============================================
// // STREAM OPERATIONS
// // ============================================

// export const createStream = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/chats/:chatId/stream",
//     summary: "Create a stream for a chat",
//     tags: ["Streams"],
//   })
//   .input(z.object({ chatId: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       stream: z.any().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     const [chatExists] = await db
//       .select()
//       .from(chat)
//       .where(
//         and(
//           eq(chat.id, input.chatId),
//           eq(chat.userId, context.session?.user.id)
//         )
//       );

//     if (!chatExists) {
//       return { success: false, message: "Chat not found" };
//     }

//     const [newStream] = await db
//       .insert(stream)
//       .values({
//         userId: context.session?.user.id,
//         chatId: input.chatId,
//       })
//       .returning();

//     return {
//       success: true,
//       message: "Stream created successfully",
//       stream: newStream,
//     };
//   });

// // ============================================
// // Votes
// // ============================================

// const voteMessage = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/votes/create",
//     summary: "Create a vote for a chat",
//     tags: ["Votes"],
//   })
//   .input(createVoteSchema)
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       vote: VoteSchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     const [existingVote] = await db
//       .select()
//       .from(vote)
//       .where(
//         and(eq(vote.messageId, input.messageId), eq(vote.chatId, input.chatId))
//       );

//     if (existingVote) {
//       await db
//         .update(vote)
//         .set({
//           isUpvoted: input.isUpvoted,
//         })
//         .where(
//           and(
//             eq(vote.messageId, input.messageId),
//             eq(vote.chatId, input.chatId)
//           )
//         )
//         .returning();

//       return {
//         success: true,
//         message: "Vote updated successfully",
//         // vote: updatedVote,
//       };
//     }

//     const [newVote] = await db
//       .insert(vote)
//       .values({
//         ...input,
//       })
//       .returning();

//     return {
//       success: true,
//       message: "Vote created successfully",
//       vote: newVote,
//     };
//   });

// const getChatVotes = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/votes/:chatId",
//     summary: "Get votes for a chat",
//     tags: ["Votes"],
//   })
//   .input(z.object({ chatId: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       votes: z.array(VoteSchema).optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     const votes = await db
//       .select()
//       .from(vote)
//       .where(eq(vote.chatId, input.chatId));

//     return {
//       success: true,
//       votes,
//     };
//   });

// export const chatsRouter = os.$context<AppContext>().prefix("/chats").router({
//   // Chats
//   createChat,
//   getChats,
//   getChat,
//   updateChat,
//   deleteChat,

//   // Messages
//   createMessage,
//   getChatMessages,
//   deleteMessage,

//   // Streams
//   createStream,

//   // Votes (keeping existing functionality)
//   voteMessage,
//   getChatVotes,
// });
