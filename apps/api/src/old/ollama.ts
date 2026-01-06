// import { os } from "@orpc/server";
// import type { AppContext } from "../types";
// import z from "zod";
// import {
//   OllamaModelSchema,
//   searchOllamaModels,
//   pullOllamaModel,
//   listInstalledModels,
//   getPullProgress,
//   deleteOllamaModel,
//   checkOllamaConnection,
//   getModelDetails as getOllamaModelDetails,
//   showOllamaModel,
// } from "@gaia/ai/local";
// import { and, credential, db, eq } from "@gaia/db";

// function isDockerEnvironment(): boolean {
//   return (
//     process.env.DOCKER_ENV === "true" ||
//     process.env.IS_DOCKER === "true" ||
//     process.env.DOCKER === "true"
//   );
// }

// // Helper function to get default Ollama base URL
// function getDefaultOllamaBaseUrl(): string {
//   return isDockerEnvironment()
//     ? "http://host.docker.internal:11434"
//     : "http://localhost:11434";
// }

// // Zod schemas for validation
// const CategorySchema = z.enum([
//   "embedding",
//   "cloud",
//   "vision",
//   "tools",
//   "thinking",
// ]);
// const SortOrderSchema = z.enum(["newest", "popular"]);

// async function getOllamaBaseUrl(context: AppContext): Promise<string> {
//   try {
//     const userId = context.session?.user.id;
//     if (!userId) throw new Error("No user ID in session");

//     const userCredentials = await db
//       .select()
//       .from(credential)
//       .where(
//         and(
//           eq(credential.userId, userId),
//           eq(credential.isValid, true),
//           eq(credential.credentialType, "ai_model")
//         )
//       );

//     const ollamaCred = userCredentials.find(
//       (cred) => cred.provider === "ollama"
//     );

//     if (ollamaCred?.baseUrl) {
//       // If in Docker and saved URL is localhost, override with Docker URL
//       if (isDockerEnvironment() && ollamaCred.baseUrl.includes("localhost")) {
//         console.log(
//           "Docker environment detected, overriding localhost with host.docker.internal"
//         );
//         return "http://host.docker.internal:11434";
//       }
//       return ollamaCred.baseUrl;
//     }

//     return getDefaultOllamaBaseUrl();
//   } catch (error) {
//     console.error("Error fetching Ollama baseUrl from DB:", error);
//     return getDefaultOllamaBaseUrl();
//   }
// }

// // Helper to validate and potentially fix base URL in Docker
// async function validateAndFixBaseUrl(
//   baseUrl: string,
//   apiKey?: string
// ): Promise<string> {
//   const isDocker = isDockerEnvironment();

//   // If in Docker and URL contains localhost, try host.docker.internal first
//   if (isDocker && baseUrl.includes("localhost")) {
//     const dockerUrl = baseUrl.replace("localhost", "host.docker.internal");

//     try {
//       const isConnected = await checkOllamaConnection(dockerUrl, apiKey);
//       if (isConnected) {
//         console.log("Successfully connected using host.docker.internal");
//         return dockerUrl;
//       }
//     } catch (error) {
//       console.log(
//         "Failed to connect with host.docker.internal, trying original URL"
//       );
//     }
//   }

//   return baseUrl;
// }

// const SearchOllamaInputSchema = z.object({
//   query: z.string().default(""),
//   categories: z.array(CategorySchema).optional().default([]),
//   order: SortOrderSchema.optional().default("newest"),
// });

// const SearchOllamaOutputSchema = z.object({
//   success: z.boolean(),
//   models: z.array(OllamaModelSchema).optional(),
//   error: z.string().optional(),
// });

// const PullModelInputSchema = z.object({
//   modelName: z.string().min(1, "Model name is required"),
//   baseUrl: z.string().url().optional(),
// });

// const PullModelOutputSchema = z.object({
//   success: z.boolean(),
//   message: z.string().optional(),
//   error: z.string().optional(),
// });

// const PullStatusInputSchema = z.object({
//   modelName: z.string().min(1, "Model name is required"),
//   baseUrl: z.string().url().optional(),
// });

// const PullStatusOutputSchema = z.object({
//   success: z.boolean(),
//   status: z
//     .object({
//       status: z.enum(["pulling", "extracting", "complete", "error"]),
//       progress: z.number(),
//       digest: z.string().optional(),
//       total: z.number().optional(),
//       completed: z.number().optional(),
//     })
//     .optional(),
//   error: z.string().optional(),
// });

// const ListModelsInputSchema = z.object({
//   baseUrl: z.string().url().optional(),
// });

// const ListModelsOutputSchema = z.object({
//   success: z.boolean(),
//   models: z
//     .array(
//       z.object({
//         name: z.string(),
//         size: z.number(),
//         digest: z.string(),
//         modified_at: z.string(),
//       })
//     )
//     .optional(),
//   error: z.string().optional(),
// });

// const DeleteModelInputSchema = z.object({
//   modelName: z.string().min(1, "Model name is required"),
//   baseUrl: z.string().url().optional(),
// });

// const DeleteModelOutputSchema = z.object({
//   success: z.boolean(),
//   message: z.string().optional(),
//   error: z.string().optional(),
// });

// // Get Model Details
// export const getModelDetails = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/ollama/show/:name",
//     summary: "Get details of an Ollama model",
//     tags: ["AI", "Ollama"],
//   })
//   .input(
//     z.object({
//       name: z.string().min(1, "Model name is required"),
//       verbose: z.boolean().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       model: z
//         .object({
//           name: z.string().optional(),
//           summary: z.string().optional(),
//           downloads: z.string().optional(),
//           tags: z.array(z.string()),
//           lastUpdated: z.string(),
//           sizes: z.array(z.string()),
//           variants: z.array(z.any()),
//           readme: z.string().optional(),
//           command: z.string().optional(),
//           url: z.string().optional(),
//         })
//         .optional(),
//       error: z.string().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }
//     try {
//       const { name } = input;
//       const { model: modelDetails } = await getOllamaModelDetails({
//         model: name,
//         verbose: input.verbose,
//       });
//       return {
//         success: true,
//         model: modelDetails,
//       };
//     } catch (error) {
//       console.error("Ollama model details error:", error);

//       return {
//         success: false,
//         error:
//           error instanceof Error ? error.message : "Unknown error occurred",
//       };
//     }
//   });

// // Search route
// export const searchOllama = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/ollama/search",
//     summary: "Search Ollama models",
//     tags: ["AI", "Ollama"],
//   })
//   .input(SearchOllamaInputSchema)
//   .output(SearchOllamaOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }
//     try {
//       const { query, categories, order } = input;
//       const searchResults = await searchOllamaModels({
//         query: query || "",
//         order,
//         categories,
//       });

//       return {
//         success: true,
//         models: searchResults,
//       };
//     } catch (error) {
//       console.error("Ollama search error:", error);

//       return {
//         success: false,
//         error:
//           error instanceof Error ? error.message : "Unknown error occurred",
//       };
//     }
//   });

// // Pull model route
// export const pullModel = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/ai/ollama/pull",
//     summary: "Pull an Ollama model",
//     tags: ["AI", "Ollama"],
//   })
//   .input(PullModelInputSchema)
//   .output(PullModelOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }

//     try {
//       const { modelName, baseUrl: inputBaseUrl } = input;

//       // Use provided baseUrl or get from user database
//       let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));

//       // Validate and potentially fix the URL for Docker
//       baseUrl = await validateAndFixBaseUrl(baseUrl);

//       // Check if Ollama is running first
//       const isConnected = await checkOllamaConnection(baseUrl);
//       if (!isConnected) {
//         return {
//           success: false,
//           error: "Ollama is not running. Please start Ollama and try again.",
//         };
//       }

//       await pullOllamaModel(modelName, baseUrl);

//       return {
//         success: true,
//         message: `Started pulling model: ${modelName}`,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to pull model",
//       };
//     }
//   });

// // Get pull status route
// export const getPullStatus = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/ollama/pull-status",
//     summary: "Get the status of a model pull operation",
//     tags: ["AI", "Ollama"],
//   })
//   .input(PullStatusInputSchema)
//   .output(PullStatusOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }

//     try {
//       const { modelName, baseUrl: inputBaseUrl } = input;

//       // Use provided baseUrl or get from user database
//       let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));

//       // Validate and potentially fix the URL for Docker
//       baseUrl = await validateAndFixBaseUrl(baseUrl);

//       const status = await getPullProgress(modelName, baseUrl);

//       return {
//         success: true,
//         status,
//       };
//     } catch (error) {
//       console.error("Ollama pull status error:", error);

//       return {
//         success: false,
//         error:
//           error instanceof Error ? error.message : "Failed to get pull status",
//       };
//     }
//   });

// // List installed models route
// export const listModels = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/ollama/list",
//     summary: "List installed Ollama models",
//     tags: ["AI", "Ollama"],
//   })
//   .input(ListModelsInputSchema)
//   .output(ListModelsOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }

//     try {
//       const { baseUrl: inputBaseUrl } = input;

//       // Use provided baseUrl or get from user database
//       let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));

//       // Validate and potentially fix the URL for Docker
//       baseUrl = await validateAndFixBaseUrl(baseUrl);

//       // Check if Ollama is running first
//       const isConnected = await checkOllamaConnection(baseUrl);
//       if (!isConnected) {
//         return {
//           success: false,
//           error: "Ollama is not running",
//           models: [],
//         };
//       }

//       const models = await listInstalledModels(baseUrl);

//       return {
//         success: true,
//         models,
//       };
//     } catch (error) {
//       console.error("Ollama list models error:", error);

//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Failed to list models",
//         models: [],
//       };
//     }
//   });

// // Delete model route
// export const deleteModel = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/ai/ollama/delete",
//     summary: "Delete an installed Ollama model",
//     tags: ["AI", "Ollama"],
//   })
//   .input(DeleteModelInputSchema)
//   .output(DeleteModelOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }

//     try {
//       const { modelName, baseUrl: inputBaseUrl } = input;

//       // Use provided baseUrl or get from user database
//       let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));

//       // Validate and potentially fix the URL for Docker
//       baseUrl = await validateAndFixBaseUrl(baseUrl);

//       await deleteOllamaModel(modelName, baseUrl);

//       return {
//         success: true,
//         message: `Successfully deleted model: ${modelName}`,
//       };
//     } catch (error) {
//       console.error("Ollama delete error:", error);

//       return {
//         success: false,
//         error:
//           error instanceof Error ? error.message : "Failed to delete model",
//       };
//     }
//   });

// // Check connection route
// const CheckConnectionInputSchema = z.object({
//   baseUrl: z.string().url().optional(),
//   apiKey: z.string().optional(),
// });

// const CheckConnectionOutputSchema = z.object({
//   success: z.boolean(),
//   connected: z.boolean().optional(),
//   version: z.string().optional(),
//   error: z.string().optional(),
// });

// export const checkConnection = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/ai/ollama/check-connection",
//     summary: "Check if Ollama is running and accessible",
//     tags: ["AI", "Ollama"],
//   })
//   .input(CheckConnectionInputSchema)
//   .output(CheckConnectionOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         connected: false,
//         error: "Unauthorized",
//       };
//     }

//     try {
//       const { baseUrl: inputBaseUrl, apiKey } = input;

//       // Use provided baseUrl or get from user database
//       let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));

//       // Validate and potentially fix the URL for Docker
//       baseUrl = await validateAndFixBaseUrl(baseUrl, apiKey);

//       const isConnected = await checkOllamaConnection(baseUrl, apiKey);

//       return {
//         success: true,
//         connected: isConnected || false,
//       };
//     } catch (error) {
//       console.error("Ollama connection check error:", error);

//       return {
//         success: false,
//         connected: false,
//         error:
//           error instanceof Error ? error.message : "Failed to check connection",
//       };
//     }
//   });

// const ShowModelInputSchema = z.object({
//   modelName: z.string().min(1, "Model name is required"),
//   verbose: z.boolean().optional().default(false),
//   baseUrl: z.string().url().optional(),
// });

// const ShowModelOutputSchema = z.object({
//   success: z.boolean(),
//   capabilities: z.array(z.string()).optional(),
//   details: z
//     .object({
//       parent_model: z.string().optional(),
//       format: z.string().optional(),
//       family: z.string().optional(),
//       families: z.array(z.string()).optional(),
//       parameter_size: z.string().optional(),
//       quantization_level: z.string().optional(),
//     })
//     .optional(),
//   error: z.string().optional(),
// });

// // Show model capabilities
// export const showModel = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/ai/ollama/show",
//     summary: "Show Ollama model capabilities",
//     tags: ["AI", "Ollama"],
//   })
//   .input(ShowModelInputSchema)
//   .output(ShowModelOutputSchema)
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       return {
//         success: false,
//         error: "Unauthorized",
//       };
//     }

//     try {
//       const { modelName, verbose, baseUrl: inputBaseUrl } = input;

//       let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
//       baseUrl = await validateAndFixBaseUrl(baseUrl);
//       const modelDetails = await showOllamaModel({
//         modelName,
//         baseUrl,
//         verbose,
//       });

//       return {
//         success: true,
//         capabilities: modelDetails.capabilities || [],
//         details: modelDetails.details,
//       };
//     } catch (error) {
//       console.error("Ollama show model error:", error);

//       return {
//         success: false,
//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to get model information",
//       };
//     }
//   });

// export const OllamaRouter = os.$context<AppContext>().router({
//   searchForModel: searchOllama,
//   pullModel: pullModel,
//   getPullStatus: getPullStatus,
//   listModels: listModels,
//   deleteModel: deleteModel,
//   checkConnection: checkConnection,
//   getModelDetails,
//   showModel, // LEGACY
// });
