// import { os } from "@orpc/server";
// import type { AppContext } from "../types";
// import { z } from "zod";
// import { db, eq, project, prompt, PromptSchema } from "@gaia/db";

// export const getPrompt = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/prompt/{projectId}",
//     operationId: "getPrompt",
//     successDescription: "Prompt retrieved successfully",
//     spec: {
//       summary: "Get prompt for a project",
//       description: "Retrieves the prompt associated with a specific project",
//       tags: ["Prompt"],
//       security: [{ Bearer: [] }],
//       parameters: [
//         {
//           name: "projectId",
//           in: "path",
//           description: "The unique identifier of the project",
//           required: true,
//           schema: {
//             type: "string",
//           },
//         },
//       ],
//       responses: {
//         200: {
//           description: "Prompt retrieved successfully",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     description: "Indicates if the operation was successful",
//                     example: true,
//                   },
//                   prompt: {
//                     type: "object",
//                     description: "The prompt object",
//                     properties: {
//                       id: {
//                         type: "string",
//                         description: "Unique identifier of the prompt",
//                       },
//                       projectId: {
//                         type: "string",
//                         description: "The project identifier",
//                       },
//                       content: {
//                         type: "string",
//                         description: "The prompt content",
//                       },
//                       createdAt: {
//                         type: "string",
//                         format: "date-time",
//                         description: "Creation timestamp",
//                       },
//                       updatedAt: {
//                         type: "string",
//                         format: "date-time",
//                         description: "Last update timestamp",
//                       },
//                     },
//                   },
//                   message: {
//                     type: "string",
//                     description: "Additional message or error information",
//                   },
//                 },
//               },
//             },
//           },
//         },
//         401: {
//           description: "Unauthorized - User not authenticated",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     example: false,
//                   },
//                   message: {
//                     type: "string",
//                     example: "Unauthorized",
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   })
//   .input(
//     z.object({
//       projectId: z
//         .string()
//         .min(1)
//         .describe("The unique identifier of the project"),
//     })
//   )
//   .output(
//     z.object({
//       success: z
//         .boolean()
//         .describe("Indicates if the operation was successful"),
//       prompt: PromptSchema.optional().describe("The prompt object if found"),
//       message: z
//         .string()
//         .optional()
//         .describe("Additional message or error information"),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }
//     // check if project exist
//     const [existProject] = await db
//       .select()
//       .from(project)
//       .where(eq(project.id, input.projectId));

//     if (!existProject) {
//       return {
//         success: false,
//         message: `Project with id ${input.projectId} not found`,
//       };
//     }
//     const [existPrompt] = await db
//       .select()
//       .from(prompt)
//       .where(eq(prompt.projectId, input.projectId));
//     return { success: true, prompt: existPrompt };
//   });

// export const createPrompt = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/prompt",
//     successDescription: "Prompt created successfully",
//     spec: {
//       summary: "Create a new prompt",
//       operationId: "createPrompt",
//       description: "Creates a new prompt for a specific project",
//       tags: ["Prompt"],
//       security: [{ Bearer: [] }],
//       requestBody: {
//         required: true,
//         description: "Prompt creation data",
//         content: {
//           "application/json": {
//             schema: {
//               type: "object",
//               required: ["projectId", "prompt"],
//               properties: {
//                 projectId: {
//                   type: "string",
//                   description: "The unique identifier of the project",
//                   example: "proj_123abc",
//                 },
//                 prompt: {
//                   type: "string",
//                   description: "The prompt content to be created",
//                   example: "You are a helpful AI assistant...",
//                 },
//               },
//             },
//           },
//         },
//       },
//       responses: {
//         200: {
//           description: "Prompt created successfully",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     description: "Indicates if the operation was successful",
//                     example: true,
//                   },
//                   message: {
//                     type: "string",
//                     description: "Success message",
//                     example: "Prompt created successfully",
//                   },
//                 },
//               },
//             },
//           },
//         },
//         400: {
//           description: "Bad Request - Prompt already exists",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     example: false,
//                   },
//                   message: {
//                     type: "string",
//                     example: "Prompt already exists",
//                   },
//                 },
//               },
//             },
//           },
//         },
//         401: {
//           description: "Unauthorized - User not authenticated",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     example: false,
//                   },
//                   message: {
//                     type: "string",
//                     example: "Unauthorized",
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   })
//   .input(
//     z.object({
//       projectId: z
//         .string()
//         .min(1)
//         .describe("The unique identifier of the project"),
//       prompt: z.string().min(1).describe("The prompt content to be created"),
//     })
//   )
//   .output(
//     z.object({
//       success: z
//         .boolean()
//         .describe("Indicates if the operation was successful"),
//       message: z.string().describe("Success or error message"),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     // check if project exist
//     const [existProject] = await db
//       .select()
//       .from(project)
//       .where(eq(project.id, input.projectId));

//     if (!existProject) {
//       return {
//         success: false,
//         message: `Project with id ${input.projectId} not found`,
//       };
//     }

//     const [promptExist] = await db
//       .select()
//       .from(prompt)
//       .where(eq(prompt.projectId, input.projectId));

//     if (promptExist) {
//       return { success: false, message: "Prompt already exists" };
//     }

//     await db.insert(prompt).values({
//       projectId: input.projectId,
//       content: input.prompt,
//     });

//     return { success: true, message: "Prompt created successfully" };
//   });

// export const updatePrompt = os
//   .$context<AppContext>()
//   .route({
//     method: "PATCH",
//     path: "/prompt/{projectId}",
//     successDescription: "Prompt updated or created successfully",
//     spec: {
//       operationId: "updatePrompt",
//       summary: "Update a prompt",
//       description:
//         "Updates an existing prompt or creates one if it doesn't exist (upsert operation)",
//       tags: ["Prompt"],
//       security: [{ Bearer: [] }],
//       parameters: [
//         {
//           name: "projectId",
//           in: "path",
//           description: "The unique identifier of the project",
//           required: true,
//           schema: {
//             type: "string",
//           },
//         },
//       ],
//       requestBody: {
//         required: true,
//         description: "Updated prompt content",
//         content: {
//           "application/json": {
//             schema: {
//               type: "object",
//               required: ["prompt"],
//               properties: {
//                 prompt: {
//                   type: "string",
//                   description: "The updated prompt content",
//                   example:
//                     "You are a helpful AI assistant with expertise in...",
//                 },
//               },
//             },
//           },
//         },
//       },
//       responses: {
//         200: {
//           description: "Prompt updated or created successfully",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     description: "Indicates if the operation was successful",
//                     example: true,
//                   },
//                   message: {
//                     type: "string",
//                     description: "Success message",
//                     example: "Prompt updated successfully",
//                   },
//                 },
//               },
//             },
//           },
//         },
//         401: {
//           description: "Unauthorized - User not authenticated",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     example: false,
//                   },
//                   message: {
//                     type: "string",
//                     example: "Unauthorized",
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   })
//   .input(
//     z.object({
//       projectId: z
//         .string()
//         .min(1)
//         .describe("The unique identifier of the project"),
//       prompt: z.string().min(1).describe("The updated prompt content"),
//     })
//   )
//   .output(
//     z.object({
//       success: z
//         .boolean()
//         .describe("Indicates if the operation was successful"),
//       message: z.string().describe("Success or error message"),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     // check if project exist
//     const [existProject] = await db
//       .select()
//       .from(project)
//       .where(eq(project.id, input.projectId));

//     if (!existProject) {
//       return {
//         success: false,
//         message: `Project with id ${input.projectId} not found`,
//       };
//     }

//     const [promptExist] = await db
//       .select()
//       .from(prompt)
//       .where(eq(prompt.projectId, input.projectId));

//     if (!promptExist) {
//       await db.insert(prompt).values({
//         projectId: input.projectId,
//         content: input.prompt,
//       });
//       return { success: true, message: "Prompt created successfully" };
//     }

//     await db
//       .update(prompt)
//       .set({
//         content: input.prompt,
//       })
//       .where(eq(prompt.id, promptExist.id));

//     return { success: true, message: "Prompt updated successfully" };
//   });

// export const deletePrompt = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/prompt/{projectId}",
//     successDescription: "Prompt deleted successfully",
//     spec: {
//       operationId: "deletePrompt",
//       summary: "Delete a prompt",
//       description: "Deletes the prompt associated with a specific project",
//       tags: ["Prompt"],
//       security: [{ Bearer: [] }],
//       parameters: [
//         {
//           name: "projectId",
//           in: "path",
//           description: "The unique identifier of the project",
//           required: true,
//           schema: {
//             type: "string",
//           },
//         },
//       ],
//       responses: {
//         200: {
//           description: "Prompt deleted successfully",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     description: "Indicates if the operation was successful",
//                     example: true,
//                   },
//                   message: {
//                     type: "string",
//                     description: "Success message",
//                     example: "Prompt deleted successfully",
//                   },
//                 },
//               },
//             },
//           },
//         },
//         401: {
//           description: "Unauthorized - User not authenticated",
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   success: {
//                     type: "boolean",
//                     example: false,
//                   },
//                   message: {
//                     type: "string",
//                     example: "Unauthorized",
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   })
//   .input(
//     z.object({
//       projectId: z
//         .string()
//         .min(1)
//         .describe("The unique identifier of the project"),
//     })
//   )
//   .output(
//     z.object({
//       success: z
//         .boolean()
//         .describe("Indicates if the operation was successful"),
//       message: z.string().describe("Success or error message"),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return { success: false, message: "Unauthorized" };
//     }

//     // check if project exist
//     const [existProject] = await db
//       .select()
//       .from(project)
//       .where(eq(project.id, input.projectId));

//     if (!existProject) {
//       return {
//         success: false,
//         message: `Project with id ${input.projectId} not found`,
//       };
//     }

//     await db.delete(prompt).where(eq(prompt.projectId, input.projectId));

//     return { success: true, message: "Prompt deleted successfully" };
//   });

// export const PromptRouter = os.$context<AppContext>().router({
//   get: getPrompt,
//   create: createPrompt,
//   update: updatePrompt,
//   delete: deletePrompt,
// });
