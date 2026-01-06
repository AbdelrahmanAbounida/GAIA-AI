// import { and, apikey, ApiKeySchema, db, eq, project } from "@gaia/db";
// import { os } from "@orpc/server";
// import { z } from "zod";
// import type { AppContext } from "../types";

// export const createApiKey = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/apikey/create",
//     summary: "Create a new API key",
//     tags: ["ApiKeys"],
//   })
//   .input(
//     z.object({
//       name: z.string().min(1).max(255),
//       value: z.string().min(1),
//       projectId: z.string(),
//       expiresAt: z.date().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       apiKey: ApiKeySchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     const dbUser = context.session?.user;

//     if (!dbUser) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     // check project exist
//     const [projectExist] = await db
//       .select()
//       .from(project)
//       .where(eq(project.id, input.projectId))
//       .limit(1);

//     if (!projectExist) {
//       return {
//         success: false,
//         message: "Project not found",
//       };
//     }
//     console.log({ projectExist, dbUser });
//     try {
//       // Insert new API key
//       const [newApiKey] = await db
//         .insert(apikey)
//         .values({
//           name: input.name,
//           value: input.value,
//           projectId: input.projectId,
//           userId: dbUser.id,
//           expiresAt: input.expiresAt,
//         })
//         .returning();

//       return {
//         success: true,
//         message: "API key created successfully",
//         apiKey: newApiKey,
//       };
//     } catch (error) {
//       console.log({ error });
//       return {
//         success: false,
//         message: "Failed to create API key",
//       };
//     }
//   });

// export const deleteApiKey = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/apikey/delete",
//     summary: "Delete an API key",
//     tags: ["ApiKeys"],
//   })
//   .input(
//     z.object({
//       id: z.string().uuid(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     const dbUser = context.session?.user;

//     if (!dbUser) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const result = await db
//         .delete(apikey)
//         .where(and(eq(apikey.id, input.id), eq(apikey.userId, dbUser.id)))
//         .returning();

//       if (result.length === 0) {
//         return {
//           success: false,
//           message: "API key not found or unauthorized",
//         };
//       }

//       return {
//         success: true,
//         message: "API key deleted successfully",
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: "Failed to delete API key",
//       };
//     }
//   });

// export const getApiKeys = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/apikey/list",
//     summary: "Get all API keys for the current user",
//     tags: ["ApiKeys"],
//   })
//   .output(
//     z.object({
//       success: z.boolean(),
//       apiKeys: z.array(ApiKeySchema),
//     })
//   )
//   .handler(async ({ context }) => {
//     const dbUser = context.session?.user;

//     if (!dbUser) {
//       return {
//         success: false,
//         apiKeys: [],
//       };
//     }

//     const keys = await db
//       .select()
//       .from(apikey)
//       .where(eq(apikey.userId, dbUser.id));

//     return {
//       success: true,
//       apiKeys: keys.map((key) => ({
//         ...key,
//         value: `${key.value.slice(0, 4)}...${key.value.slice(-4)}`,
//       })),
//     };
//   });

// export const getApiKey = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/apikey/:id",
//     summary: "Get a specific API key",
//     tags: ["ApiKeys"],
//   })
//   .input(
//     z.object({
//       id: z.string().uuid(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       apiKey: ApiKeySchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     const dbUser = context.session?.user;

//     if (!dbUser) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     const [key] = await db
//       .select()
//       .from(apikey)
//       .where(and(eq(apikey.id, input.id), eq(apikey.userId, dbUser.id)));

//     if (!key) {
//       return {
//         success: false,
//         message: "API key not found",
//       };
//     }

//     return {
//       success: true,
//       message: "API key retrieved successfully",
//       apiKey: key,
//     };
//   });

// export const ApiKeyRouter = os
//   .$context<AppContext>()
//   .prefix("/apikeys")
//   .router({
//     get: getApiKey,
//     create: createApiKey,
//     list: getApiKeys,
//     delete: deleteApiKey,
//   });
