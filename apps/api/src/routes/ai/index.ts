import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { aiHandlers } from "./handler";
import { aiSchemas } from "./schema";
import { aiSpecs } from "./spec";

export const getAllProviders = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/providers",
    summary: "Get all AI providers",
    spec: aiSpecs.getAllProviders,
  })
  .output(aiSchemas.getAllProvidersOutput)
  .handler(aiHandlers.getAllProviders);

export const getAllModels = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/models",
    summary: "Get all available AI models",
    spec: aiSpecs.getAllModels,
  })
  .output(aiSchemas.getAllModelsOutput)
  .handler(aiHandlers.getAllModels);

export const getUserModels = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/models/user",
    summary: "Get user's configured AI models",
    spec: aiSpecs.getUserModels,
  })
  .output(aiSchemas.getUserModelsOutput)
  .handler(aiHandlers.getUserModels);

export const chatCompletions = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/ai/chat/completions",
    summary: "OpenAI-compatible chat completion",
    spec: aiSpecs.chatCompletions,
  })
  .input(aiSchemas.chatCompletionsInput)
  .handler(aiHandlers.chatCompletions);

export const streamChat = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/ai/stream",
    summary: "AI SDK compatible chat streaming",
    spec: aiSpecs.streamChat,
  })
  .input(aiSchemas.streamChatInput)
  .handler(aiHandlers.streamChat);

export const imageGeneration = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/ai/images/generations",
    summary: "AI image generation",
    spec: aiSpecs.imageGeneration,
  })
  .input(aiSchemas.imageGenerationInput)
  .output(aiSchemas.imageGenerationOutput)
  .handler(aiHandlers.imageGeneration);

export const AIRouter = os.$context<AppContext>().prefix("/ai").router({
  getAllProviders,
  getAllModels,
  getUserModels,
  chatCompletions,
  streamChat,
  imageGeneration,
});
