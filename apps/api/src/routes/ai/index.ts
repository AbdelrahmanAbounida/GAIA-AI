import { os } from "@orpc/server";
import { aiSchemas } from "./schema";
import type { AppContext } from "../../types";
import { aiHandlers } from "./handler";
import { aiSpecs } from "./spec";

export const AIRouter = os
  .$context<AppContext>()
  .tag("AI")
  .router({
    // Get all providers
    getAllProviders: os
      .$context<AppContext>()
      .route({
        method: "GET",
        path: "/providers",
        summary: "Get all AI providers (Language, Embeddings, Image)",
        spec: aiSpecs.getAllProviders,
      })
      .output(aiSchemas.getAllProvidersOutput)
      .handler(aiHandlers.getAllProviders),

    // Get all models
    getAllModels: os
      .$context<AppContext>()
      .route({
        method: "GET",
        path: "/models",
        summary: "Get all available AI models",
        spec: aiSpecs.getAllModels,
      })
      .output(aiSchemas.getAllModelsOutput)
      .handler(aiHandlers.getAllModels),

    // Get user's models
    getUserModels: os
      .$context<AppContext>()
      .route({
        method: "GET",
        path: "/models/user",
        summary: "Get user's configured AI models",
        spec: aiSpecs.getUserModels,
      })
      .output(aiSchemas.getUserModelsOutput)
      .handler(aiHandlers.getUserModels),

    // OpenAI-compatible chat completions
    chatCompletions: os
      .$context<AppContext>()
      .route({
        method: "POST",
        path: "/chat/completions",
        summary: "OpenAI-compatible chat completion endpoint",
        description:
          "Create a chat completion. Compatible with OpenAI's API format. Supports both streaming and non-streaming responses.",
        spec: aiSpecs.chatCompletions,
      })
      .input(aiSchemas.chatCompletionsInput)
      .handler(aiHandlers.openAIChatCompletions),

    // AI SDK compatible streaming (for internal use)
    streamChat: os
      .$context<AppContext>()
      .route({
        method: "POST",
        path: "/stream",
        summary: "AI SDK compatible chat streaming endpoint",
        description: "Internal streaming endpoint using AI SDK format",
        spec: aiSpecs.streamChat,
      })
      .input(aiSchemas.streamChatInput)
      .handler(aiHandlers.streamChat),

    // Image generation
    imageGeneration: os
      .$context<AppContext>()
      .route({
        method: "POST",
        path: "/images/generations",
        summary: "Generate images",
        description:
          "Generate images using AI models. Supports streaming progress updates.",
        spec: aiSpecs.imageGeneration,
      })
      .input(aiSchemas.imageGenerationInput)
      .output(aiSchemas.imageGenerationOutput)
      .handler(aiHandlers.imageGeneration),
  });
