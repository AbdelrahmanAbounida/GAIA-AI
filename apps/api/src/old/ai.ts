// import { os, streamToEventIterator } from "@orpc/server";
// import type { AppContext } from "../types";
// import { z } from "zod";
// import {
//   gatewayLanguageModelEntrySchema,
//   streamText,
//   createOpenAICompatible,
//   createGateway as createAIGateway,
// } from "@gaia/ai";
// import { db, chat, credential, eq, and, CredentialSchema } from "@gaia/db";
// import {
//   aiGateway,
//   ALL_VECTOR_STORES,
//   getAllProvidersWithModels as getModelsProviders,
//   VectorStoreSchema,
// } from "@gaia/ai/models";

// const OpenAIMessageSchema = z.object({
//   role: z.enum(["system", "user", "assistant"]),
//   content: z.string(),
//   name: z.string().optional(),
// });

// const AISdkMessageSchema = z.object({
//   role: z.enum(["system", "user", "assistant"]),
//   content: z.string(),
//   experimental_attachments: z.array(z.any()).optional(),
// });

// /**
//  * Get provider configuration for a user's model
//  * Fetches the user's credential from the database based on model and provider
//  */
// async function getProviderConfig(
//   userId: string,
//   modelId: string,
//   provider?: string
// ) {
//   // Query credentials directly from database for the specific user
//   const userCredentials = await db
//     .select()
//     .from(credential)
//     .where(
//       and(
//         eq(credential.userId, userId),
//         eq(credential.isValid, true),
//         eq(credential.credentialType, "ai_model")
//       )
//     );

//   if (!userCredentials || userCredentials.length === 0) {
//     throw new Error("No valid credentials found for user");
//   }

//   // Find matching credential by provider or by checking if models array contains the modelId
//   const matchingCredential = userCredentials.find((cred) => {
//     // If provider is specified, match by provider
//     if (provider && cred.provider === provider) {
//       return true;
//     }

//     // Check if models array contains the modelId (for local connections like Ollama)
//     if (cred.models && Array.isArray(cred.models)) {
//       return (cred.models as string[]).includes(modelId);
//     }

//     // Otherwise, match by provider name in modelId (e.g., "gpt-4o" contains "openai")
//     return modelId.toLowerCase().includes(cred.provider.toLowerCase());
//   });

//   if (!matchingCredential) {
//     throw new Error(
//       `No valid credential found for model: ${modelId}${provider ? ` with provider: ${provider}` : ""}`
//     );
//   }

//   return {
//     apiKey: matchingCredential.apiKey,
//     baseURL: matchingCredential.baseUrl,
//     proxy: matchingCredential.proxy,
//     provider: matchingCredential.provider,
//     name: matchingCredential.name,
//   };
// }

// /**
//  * Create a model instance using AI SDK Gateway or OpenAI Compatible
//  */
// function createModelInstance(config: {
//   apiKey: string;
//   baseURL?: string | null;
//   provider: string;
//   modelId: string;
//   proxy?: string | null;
// }) {
//   const { apiKey, baseURL, provider, modelId, proxy } = config;

//   // Use AI Gateway if baseURL is provided
//   if (baseURL) {
//     const gateway = createAIGateway({
//       apiKey,
//       baseURL,
//       // Add proxy support if needed
//       ...(proxy && { headers: { "X-Proxy": proxy } }),
//     });
//     return gateway(modelId);
//   }

//   // Fallback to OpenAI-compatible provider
//   const providerInstance = createOpenAICompatible({
//     name: provider,
//     apiKey,
//     baseURL: baseURL || `https://api.${provider}.com/v1`,
//   });

//   return providerInstance(modelId);
// }

// export const AIRouter = os
//   .$context<AppContext>()
//   .prefix("/ai")
//   .tag("AI")
//   .router({
//     getAllProviders: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/providers",
//         summary: "Get all AI providers (Language, Embeddings, Image)",
//         // tags: ["AI Configuration"],
//       })
//       .output(
//         z.object({
//           success: z.boolean(),
//           modelsProviders: z.array(
//             z.object({
//               name: z.string(),
//               capabilities: z.array(z.enum(["embedding", "language", "image"])),
//               models: z.array(gatewayLanguageModelEntrySchema),
//             })
//           ),
//           vectorstoresProviders: z.array(VectorStoreSchema).optional(),
//         })
//       )
//       .handler(async () => {
//         const providers = await getModelsProviders();
//         return {
//           success: true,
//           modelsProviders: providers,
//           vectorstoresProviders: ALL_VECTOR_STORES,
//         };
//       }),

//     getAllModels: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/models",
//         summary: "Get all available AI models",
//         // tags: ["AI Configuration"],
//       })
//       .output(
//         z.object({
//           success: z.boolean(),
//           models: z
//             .object({
//               llms: z.array(gatewayLanguageModelEntrySchema),
//               embeddings: z.array(gatewayLanguageModelEntrySchema),
//               image: z.array(gatewayLanguageModelEntrySchema),
//             })
//             .optional(),
//           vectorstores: z.array(VectorStoreSchema).optional(),
//           message: z.string().optional(),
//         })
//       )
//       .handler(async ({ context }) => {
//         if (!context.session?.user) {
//           return {
//             success: false,
//             message: "Unauthorized",
//           };
//         }

//         const aiModels = (await aiGateway.getAvailableModels()).models;

//         const llms = aiModels.filter((model) => model.modelType === "language");
//         const embeddings = aiModels.filter(
//           (model) => model.modelType === "embedding"
//         );
//         const image = aiModels.filter((model) => model.modelType === "image");

//         return {
//           success: true,
//           models: {
//             llms,
//             embeddings,
//             image,
//           },
//           vectorstores: ALL_VECTOR_STORES,
//         };
//       }),

//     getUserModels: os
//       .$context<AppContext>()
//       .route({
//         method: "GET",
//         path: "/models/user",
//         summary: "Get user's configured AI models",
//         // tags: ["AI Configuration"],
//       })
//       .output(
//         z.object({
//           success: z.boolean(),
//           ai_models: z.array(CredentialSchema).optional(),
//           embeddings: z.array(CredentialSchema).optional(),
//           message: z.string().optional(),
//         })
//       )
//       .handler(async ({ context }) => {
//         if (!context.session?.user) {
//           return {
//             success: false,
//             message: "Unauthorized",
//           };
//         }

//         // Query user's credentials directly from database
//         const userCredentials = await db
//           .select()
//           .from(credential)
//           .where(
//             and(
//               eq(credential.userId, context.session.user.id),
//               eq(credential.isValid, true)
//             )
//           );

//         const ai_models = userCredentials.filter(
//           (cred) => cred.credentialType === "ai_model"
//         );
//         const embeddings = userCredentials.filter(
//           (cred) => cred.credentialType === "embedding"
//         );

//         return {
//           success: true,
//           ai_models,
//           embeddings,
//         };
//       }),

//     chatCompletions: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/chat/completions",
//         summary: "OpenAI-compatible chat completion endpoint",
//         // tags: ["AI Chat"],
//       })
//       .input(
//         z.object({
//           chatId: z.string(),
//           messages: z.array(OpenAIMessageSchema),
//           model: z.string().default("gpt-4o"),
//           provider: z.string().optional(),
//           temperature: z.number().optional().default(0.7),
//           max_tokens: z.number().optional(),
//           stream: z.boolean().optional().default(false),
//         })
//       )
//       .handler(async function* ({ input, context }) {
//         if (!context.session?.user) {
//           throw new Error("Unauthorized");
//         }

//         // Verify chat ownership
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
//           throw new Error("Chat not found");
//         }

//         // Get provider configuration for the user's model
//         const providerConfig = await getProviderConfig(
//           context.session.user.id,
//           input.model,
//           input.provider
//         );

//         // Create model instance using AI SDK
//         const model = createModelInstance({
//           ...providerConfig,
//           modelId: input.model,
//         });

//         // Convert messages to AI SDK format
//         const messages = input.messages
//           .filter((msg) => msg.role !== "system")
//           .map((msg) => ({
//             role: msg.role,
//             content: msg.content,
//           }));

//         // Extract system message if exists
//         const systemMessage = input.messages.find(
//           (msg) => msg.role === "system"
//         );

//         // Use AI SDK for streaming
//         const result = streamText({
//           model,
//           messages,
//           system: systemMessage?.content,
//           temperature: input.temperature,
//           maxOutputTokens: input.max_tokens,
//         });

//         if (input.stream) {
//           // Stream response in OpenAI format
//           for await (const chunk of result.textStream) {
//             yield {
//               id: `chatcmpl-${Date.now()}`,
//               object: "chat.completion.chunk",
//               created: Math.floor(Date.now() / 1000),
//               model: input.model,
//               choices: [
//                 {
//                   index: 0,
//                   delta: {
//                     content: chunk,
//                   },
//                   finish_reason: null,
//                 },
//               ],
//             };
//           }

//           // Final chunk
//           yield {
//             id: `chatcmpl-${Date.now()}`,
//             object: "chat.completion.chunk",
//             created: Math.floor(Date.now() / 1000),
//             model: input.model,
//             choices: [
//               {
//                 index: 0,
//                 delta: {},
//                 finish_reason: "stop",
//               },
//             ],
//           };
//         } else {
//           // Non-streaming response
//           const text = await result.text;
//           yield {
//             id: `chatcmpl-${Date.now()}`,
//             object: "chat.completion",
//             created: Math.floor(Date.now() / 1000),
//             model: input.model,
//             choices: [
//               {
//                 index: 0,
//                 message: {
//                   role: "assistant",
//                   content: text,
//                 },
//                 finish_reason: "stop",
//               },
//             ],
//             usage: {
//               prompt_tokens: 0,
//               completion_tokens: 0,
//               total_tokens: 0,
//             },
//           };
//         }
//       }),

//     streamChat: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/stream",
//         summary: "AI SDK compatible chat streaming endpoint",
//         // tags: ["AI Chat"],
//       })
//       .input(
//         z.object({
//           chatId: z.string(),
//           messages: z.array(AISdkMessageSchema),
//           model: z.string().optional().default("gpt-4o"),
//           provider: z.string().optional(),
//           system: z.string().optional(),
//         })
//       )
//       .handler(async ({ input, context }) => {
//         if (!context.session?.user) {
//           throw new Error("Unauthorized");
//         }

//         // Verify chat ownership
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
//           throw new Error("Chat not found");
//         }

//         // Get provider configuration for the user's model
//         const providerConfig = await getProviderConfig(
//           context.session.user.id,
//           input.model,
//           input.provider
//         );

//         // Create model instance using AI SDK
//         const model = createModelInstance({
//           ...providerConfig,
//           modelId: input.model,
//         });

//         // Convert messages to AI SDK format
//         const messages = input.messages
//           .filter((msg) => msg.role !== "system")
//           .map((msg) => ({
//             role: msg.role as "user" | "assistant",
//             content: msg.content,
//           }));

//         const result = streamText({
//           model,
//           system: input.system || "You are a helpful assistant.",
//           messages,
//         });

//         // Convert to event iterator for oRPC
//         return streamToEventIterator(result.toUIMessageStream());
//       }),

//     // Image generation
//     imageGeneration: os
//       .$context<AppContext>()
//       .route({
//         method: "POST",
//         path: "/images/generations",
//         summary: "AI SDK compatible image generation endpoint",
//       })
//       .input(
//         z.object({
//           prompt: z.string(),
//           model: z.string().optional().default("google/gemini-2.5-flash-image"),
//           provider: z.string().optional(),
//           n: z.number().optional().default(1),
//           stream: z.boolean().optional().default(false),
//         })
//       )
//       .output(
//         z.any()
//       )
//       .handler(async function* ({ input, context }) {
//         if (!context.session?.user) {
//           throw new Error("Unauthorized");
//         }

//         // Get provider configuration for the user's model
//         const providerConfig = await getProviderConfig(
//           context.session.user.id,
//           input.model,
//           input.provider
//         );

//         // Create model instance using AI SDK Gateway
//         const model = createModelInstance({
//           ...providerConfig,
//           modelId: input.model,
//         });

//         // Use AI SDK for image generation with streaming
//         const result = streamText({
//           model,
//           prompt: input.prompt,
//         });

//         if (input.stream) {
//           let textContent = "";
//           let files: any[] = [];

//           // Stream progress updates
//           for await (const delta of result.fullStream) {
//             if (delta.type === "text-delta") {
//               textContent += delta.text;

//               yield {
//                 type: "progress",
//                 text: delta.text,
//                 timestamp: Date.now(),
//               };
//             }
//           }

//           // Get final result with generated images
//           const finalResult = result;
//           files = (await finalResult.files) || [];

//           // Final response with images
//           yield {
//             type: "complete",
//             created: Math.floor(Date.now() / 1000),
//             data: files.map((file, index) => ({
//               index,
//               url: file.url,
//               base64: file.base64,
//               mimeType: file.mimeType,
//             })),
//             usage: finalResult.usage,
//             text: textContent,
//           };
//         } else {
//           const finalResult = result;
//           const files = (await finalResult.files) || [];
//           yield {
//             type: "complete",
//             created: Math.floor(Date.now() / 1000),
//             data: files.map((file, index) => ({
//               index,
//               mediaType: file.mediaType,
//               base64: file.base64,
//               uint8Array: file.uint8Array,
//             })),
//             usage: finalResult.usage,
//           };
//         }
//       }),
//   });
