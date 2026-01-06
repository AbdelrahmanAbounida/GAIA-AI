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
//   count,
//   createVoteSchema,
//   createMessageSchema,
// } from "@gaia/db";

// export const chatsRouter = os
//   .$context<AppContext>()
//   .prefix("/chats")
//   .tag("Chats")
//   .router({
//     // ============================================
//     // CHATS
//     // ============================================
//     create: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/",
//         summary: "Create a new chat",
//         // tags: ["Chats"],
//         tags: ["Chats"],
//       })
//       .input(z.object({ name: z.string(), chatId: z.string().optional() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//           chat: ChatSchema.optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [newChat] = await db
//           .insert(chat)
//           .values({
//             name: input.name,
//             userId: context.session.user.id,
//             id: input.chatId || undefined,
//           })
//           .returning();

//         return {
//           success: true,
//           message: "Chat created successfully",
//           chat: newChat,
//         };
//       }),

//     list: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/",
//         summary: "Get all chats for user",
//         tags: ["Chats"],
//       })
//       .input(
//         z.object({
//           limit: z.number().optional().default(20),
//           offset: z.number().optional().default(0),
//         })
//       )
//       .output(
//         z.object({
//           success: z.boolean(),
//           chats: z.array(ChatSchema),
//           nextOffset: z.number().optional(),
//           hasMore: z.boolean(),
//           total: z.number().default(0),
//           message: z.string().optional(),
//         })
//       )
//       .handler(async ({ context, input }) => {
//         if (!context.session?.user) {
//           return { success: false, chats: [], hasMore: false, total: 0 };
//         }

//         const limit = input.limit;
//         const conditions = [eq(chat.userId, context.session.user.id)];

//         const [chats, totalCount] = await Promise.all([
//           db
//             .select()
//             .from(chat)
//             .where(and(...conditions))
//             .orderBy(desc(chat.createdAt))
//             .limit(limit + 1)
//             .offset(input.offset),
//           db
//             .select({ count: count() })
//             .from(chat)
//             .where(eq(chat.userId, context.session.user.id)),
//         ]);

//         const hasMore = chats.length > limit;
//         const paginatedChats = hasMore ? chats.slice(0, limit) : chats;

//         return {
//           success: true,
//           chats: paginatedChats,
//           nextOffset: hasMore ? input.offset + limit : undefined,
//           hasMore,
//           total: Number(totalCount[0]?.count ?? 0),
//         };
//       }),

//     get: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/:id",
//         summary: "Get a specific chat",
//         tags: ["Chats"],
//       })
//       .input(z.object({ id: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string().optional(),
//           chat: ChatSchema.optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [foundChat] = await db
//           .select()
//           .from(chat)
//           .where(
//             and(eq(chat.id, input.id), eq(chat.userId, context.session.user.id))
//           );

//         if (!foundChat) {
//           return { success: false, message: "Chat not found" };
//         }

//         return { success: true, chat: foundChat };
//       }),

//     update: os
//       .$context<AppContext>()
//       .route({
//         method: "PUT",
//         path: "/:id",
//         summary: "Update a chat",
//         tags: ["Chats"],
//       })
//       .input(z.object({ id: z.string(), name: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//           chat: ChatSchema.optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [updatedChat] = await db
//           .update(chat)
//           .set({ name: input.name })
//           .where(
//             and(eq(chat.id, input.id), eq(chat.userId, context.session.user.id))
//           )
//           .returning();

//         if (!updatedChat) {
//           return { success: false, message: "Chat not found" };
//         }

//         return {
//           success: true,
//           message: "Chat updated successfully",
//           chat: updatedChat,
//         };
//       }),

//     delete: os
//       .$context<AppContext>()
//       .route({
//         method: "DELETE",
//         path: "/:id",
//         summary: "Delete a chat",
//         tags: ["Chats"],
//       })
//       .input(z.object({ id: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         await Promise.all([
//           db.delete(vote).where(eq(vote.chatId, input.id)),
//           db.delete(message).where(eq(message.chatId, input.id)),
//           db.delete(stream).where(eq(stream.chatId, input.id)),
//         ]);

//         const result = await db
//           .delete(chat)
//           .where(
//             and(eq(chat.id, input.id), eq(chat.userId, context.session.user.id))
//           )
//           .returning();

//         if (result.length === 0) {
//           return { success: false, message: "Chat not found" };
//         }

//         return { success: true, message: "Chat deleted successfully" };
//       }),

//     // ============================================
//     // MESSAGES
//     // ============================================
//     createMessage: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/:chatId/messages",
//         summary: "Create a message in a chat",
//         // tags: ["Messages"],
//         tags: ["Chats"],
//       })
//       .input(
//         createMessageSchema.extend({
//           id: z.string().optional(),
//         })
//       )
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//           data: MessageSchema.optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [chatExists] = await db
//           .select()
//           .from(chat)
//           .where(
//             and(
//               eq(chat.id, input.chatId),
//               eq(chat.userId, context.session.user.id)
//             )
//           );

//         if (!chatExists) {
//           return { success: false, message: "Chat not found" };
//         }

//         const [newMessage] = await db
//           .insert(message)
//           .values({
//             id: input.id,
//             chatId: input.chatId,
//             role: input.role,
//             parts: input.parts,
//             attachments: input.attachments,
//             metadata: input.metadata,
//           })
//           .returning();

//         return {
//           success: true,
//           message: "Message created successfully",
//           data: newMessage,
//         };
//       }),

//     listMessages: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/:chatId/messages",
//         summary: "Get all messages in a chat",
//         // tags: ["Messages"],
//         tags: ["Chats"],
//       })
//       .input(z.object({ chatId: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           messages: z.array(MessageSchema),
//           message: z.string().optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, messages: [], message: "Unauthorized" };
//         }

//         const [chatExists] = await db
//           .select()
//           .from(chat)
//           .where(
//             and(
//               eq(chat.id, input.chatId),
//               eq(chat.userId, context.session.user.id)
//             )
//           );

//         if (!chatExists) {
//           return {
//             success: false,
//             messages: [],
//             message: "Chat not found",
//           };
//         }

//         const messages = await db
//           .select()
//           .from(message)
//           .where(eq(message.chatId, input.chatId))
//           .orderBy(message.createdAt);

//         return {
//           success: true,
//           messages,
//           message: "Messages fetched successfully",
//         };
//       }),

//     deleteMessage: os
//       .$context<AppContext>()
//       .route({
//         method: "DELETE",
//         path: "/:chatId/messages/:messageId",
//         summary: "Delete a message",
//         // tags: ["Messages"],
//         tags: ["Chats"],
//       })
//       .input(z.object({ chatId: z.string(), messageId: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [chatExists] = await db
//           .select()
//           .from(chat)
//           .where(
//             and(
//               eq(chat.id, input.chatId),
//               eq(chat.userId, context.session.user.id)
//             )
//           );

//         if (!chatExists) {
//           return { success: false, message: "Chat not found" };
//         }

//         const result = await db
//           .delete(message)
//           .where(
//             and(
//               eq(message.id, input.messageId),
//               eq(message.chatId, input.chatId)
//             )
//           )
//           .returning();

//         if (result.length === 0) {
//           return { success: false, message: "Message not found" };
//         }

//         return { success: true, message: "Message deleted successfully" };
//       }),

//     // ============================================
//     // VOTES
//     // ============================================
//     createVote: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/:chatId/votes",
//         summary: "Create or update a vote",
//         // tags: ["Votes"],
//         tags: ["Chats"],
//       })
//       .input(createVoteSchema)
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//           vote: VoteSchema.optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [existingVote] = await db
//           .select()
//           .from(vote)
//           .where(
//             and(
//               eq(vote.messageId, input.messageId),
//               eq(vote.chatId, input.chatId)
//             )
//           );

//         if (existingVote) {
//           const [updatedVote] = await db
//             .update(vote)
//             .set({ isUpvoted: input.isUpvoted })
//             .where(
//               and(
//                 eq(vote.messageId, input.messageId),
//                 eq(vote.chatId, input.chatId)
//               )
//             )
//             .returning();

//           return {
//             success: true,
//             message: "Vote updated successfully",
//             vote: updatedVote,
//           };
//         }

//         const [newVote] = await db.insert(vote).values(input).returning();

//         return {
//           success: true,
//           message: "Vote created successfully",
//           vote: newVote,
//         };
//       }),

//     listVotes: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/:chatId/votes",
//         summary: "Get votes for a chat",
//         // tags: ["Votes"],
//         tags: ["Chats"],
//       })
//       .input(z.object({ chatId: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           votes: z.array(VoteSchema),
//           message: z.string().optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return {
//             success: false,
//             votes: [],
//             message: "Unauthorized",
//           };
//         }

//         const votes = await db
//           .select()
//           .from(vote)
//           .where(eq(vote.chatId, input.chatId));

//         return {
//           success: true,
//           votes,
//         };
//       }),

//     // ============================================
//     // STREAMS
//     // ============================================
//     createStream: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/:chatId/streams",
//         summary: "Create a stream for a chat",
//         // tags: ["Streams"],
//         tags: ["Chats"],
//       })
//       .input(z.object({ chatId: z.string() }))
//       .output(
//         z.object({
//           success: z.boolean(),
//           message: z.string(),
//           stream: z.any().optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           return { success: false, message: "Unauthorized" };
//         }

//         const [chatExists] = await db
//           .select()
//           .from(chat)
//           .where(
//             and(
//               eq(chat.id, input.chatId),
//               eq(chat.userId, context.session.user.id)
//             )
//           );

//         if (!chatExists) {
//           return { success: false, message: "Chat not found" };
//         }

//         const [newStream] = await db
//           .insert(stream)
//           .values({
//             userId: context.session.user.id,
//             chatId: input.chatId,
//           })
//           .returning();

//         return {
//           success: true,
//           message: "Stream created successfully",
//           stream: newStream,
//         };
//       }),
//   });
