// // OLD AI Router to get u idea for how to load models , ...
// import { os } from "@orpc/server";
// import type { AppContext } from "../types";
// import z from "zod";
// import {
//   aiGateway,
//   ALL_VECTOR_STORES,
//   getAllProvidersWithModels as getModelsProviders,
//   VectorStoreSchema,
// } from "@gaia/ai/models";
// import { gatewayLanguageModelEntrySchema } from "@gaia/ai";
// import { getCredentials } from "./credentials";
// import { CredentialSchema } from "@gaia/db";

// export const getAllProviders = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/providers",
//     summary: "Get all AI providers (Language, Embeddings, Image)",
//     tags: ["AI"],
//   })
//   .output(
//     z.object({
//       success: z.boolean(),
//       modelsProviders: z.array(
//         z.object({
//           name: z.string(),
//           capabilities: z.array(z.enum(["embedding", "language", "image"])),
//           models: z.array(gatewayLanguageModelEntrySchema),
//         })
//       ),
//       // vectorstoresProviders: z.array(z.string()),
//       vectorstoresProviders: z.array(VectorStoreSchema).optional(),
//     })
//   )
//   .handler(async ({ context }) => {
//     const providers = await getModelsProviders();

//     return {
//       success: true,
//       modelsProviders: providers,
//       // vectorstoresProviders: ALL_VECTOR_STORES.map((v) => v.name),
//       vectorstoresProviders: ALL_VECTOR_STORES,
//     };
//   });

// export const getAllAIModels = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/models",
//     summary: "Get all AI models",
//     tags: ["AI"],
//   })
//   .output(
//     z.object({
//       success: z.boolean(),
//       models: z
//         .object({
//           llms: z.array(gatewayLanguageModelEntrySchema),
//           embeddings: z.array(gatewayLanguageModelEntrySchema),
//           image: z.array(gatewayLanguageModelEntrySchema),
//         })
//         .optional(),
//       vectorstores: z.array(VectorStoreSchema).optional(),
//     })
//   )
//   .handler(async ({ context }) => {
//     const session = context.session;
//     if (!session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }
//     const aiModels = (await aiGateway.getAvailableModels()).models;

//     const llms = aiModels.filter((model) => model.modelType === "language");
//     const embeddings = aiModels.filter(
//       (model) => model.modelType === "embedding"
//     );
//     const image = aiModels.filter((model) => model.modelType === "image");

//     return {
//       success: true,
//       models: {
//         llms,
//         embeddings,
//         image,
//       },
//       vectorstores: ALL_VECTOR_STORES,
//     };
//   });

// // get all current user models
// export const getAllUserModels = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/models/user",
//     summary: "Get all AI models",
//     tags: ["AI"],
//   })
//   .output(
//     z.object({
//       ai_models: z.array(CredentialSchema).optional(),
//       embeddings: z.array(CredentialSchema).optional(),
//       success: z.boolean(),
//       message: z.string().optional(),
//     })
//   )
//   .handler(async ({ context }) => {
//     const session = context.session;
//     if (!session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     const { success, message, credentials } = await getCredentials({
//       offset: 0,
//       limit: 100,
//     });
//     if (!success) {
//       return {
//         success,
//         message,
//       };
//     }
//     // Filter ai_models and embeddings
//     const ai_models = credentials?.filter(
//       (cred) => cred.isValid && cred.credentialType === "ai_model"
//     );
//     const embeddings = credentials?.filter(
//       (cred) => cred.isValid && cred.credentialType === "embedding"
//     );

//     return {
//       success: true,
//       models: {
//         ai_models,
//         embeddings,
//       },
//     };
//   });

// export const AIRouter = os.$context<AppContext>().router({
//   getAllAIModels,
//   getAllProviders,
//   getAllUserModels,
// });
