import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { toolHandlers } from "./handler";
import { toolSchemas } from "./schema";
import { toolSpecs } from "./spec";

export const createTool = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/tools",
    summary: "Create a new tool",
    spec: toolSpecs.createTool,
  })
  .input(toolSchemas.createToolInput)
  .output(toolSchemas.createToolOutput)
  .handler(toolHandlers.createTool);

export const listTools = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/tools",
    summary: "List all tools with pagination",
    spec: toolSpecs.listTools,
  })
  .input(toolSchemas.listToolsInput)
  .output(toolSchemas.listToolsOutput)
  .handler(toolHandlers.listTools);

export const getTool = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/tools/{id}",
    summary: "Get a tool",
    spec: toolSpecs.getTool,
  })
  .input(toolSchemas.getToolInput)
  .output(toolSchemas.getToolOutput)
  .handler(toolHandlers.getTool);

export const updateTool = os
  .$context<AppContext>()
  .route({
    method: "PUT",
    path: "/tools/{id}",
    summary: "Update a tool",
    spec: toolSpecs.updateTool,
  })
  .input(toolSchemas.updateToolInput)
  .output(toolSchemas.updateToolOutput)
  .handler(toolHandlers.updateTool);

export const deleteTool = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/tools/{id}",
    summary: "Delete a tool",
    spec: toolSpecs.deleteTool,
  })
  .input(toolSchemas.deleteToolInput)
  .output(toolSchemas.deleteToolOutput)
  .handler(toolHandlers.deleteTool);

export const triggerToolActivation = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/tools/{id}/activate",
    summary: "Activate a tool",
    spec: toolSpecs.triggerToolActivation,
  })
  .input(toolSchemas.triggerToolActivationInput)
  .output(toolSchemas.triggerToolActivationOutput)
  .handler(toolHandlers.triggerToolActivation);

export const ToolsRouter = os.$context<AppContext>().router({
  createTool,
  listTools,
  getTool,
  updateTool,
  deleteTool,
  triggerToolActivation,
});
