import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { promptHandlers } from "./handler";
import { promptSchemas } from "./schema";
import { promptSpecs } from "./spec";

export const getPrompt = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/prompt/{projectId}",
    operationId: "getPrompt",
    successDescription: "Prompt retrieved successfully",
    spec: promptSpecs.getPrompt,
  })
  .input(promptSchemas.getPromptInput)
  .output(promptSchemas.getPromptOutput)
  .handler(promptHandlers.getPrompt);

export const createPrompt = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/prompt",
    operationId: "createPrompt",
    successDescription: "Prompt created successfully",
    spec: promptSpecs.createPrompt,
  })
  .input(promptSchemas.createPromptInput)
  .output(promptSchemas.mutationOutput)
  .handler(promptHandlers.createPrompt);

export const updatePrompt = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/prompt/{projectId}",
    operationId: "updatePrompt",
    successDescription: "Prompt updated or created successfully",
    spec: promptSpecs.updatePrompt,
  })
  .input(promptSchemas.updatePromptInput)
  .output(promptSchemas.mutationOutput)
  .handler(promptHandlers.updatePrompt);

export const deletePrompt = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/prompt/{projectId}",
    operationId: "deletePrompt",
    successDescription: "Prompt deleted successfully",
    spec: promptSpecs.deletePrompt,
  })
  .input(promptSchemas.deletePromptInput)
  .output(promptSchemas.mutationOutput)
  .handler(promptHandlers.deletePrompt);

export const PromptRouter = os.$context<AppContext>().router({
  get: getPrompt,
  create: createPrompt,
  update: updatePrompt,
  delete: deletePrompt,
});
