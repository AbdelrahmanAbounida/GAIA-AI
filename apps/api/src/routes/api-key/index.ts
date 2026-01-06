import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { apiKeyHandlers } from "./handler";
import { apiKeySchemas } from "./schema";
import { apiKeySpecs } from "./spec";

export const createApiKey = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/apikeys",
    summary: "Create a new API key",
    spec: apiKeySpecs.createApiKey,
  })
  .input(apiKeySchemas.createApiKeyInput)
  .output(apiKeySchemas.createApiKeyOutput)
  .handler(apiKeyHandlers.createApiKey);

export const deleteApiKey = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/apikeys",
    summary: "Delete an API key",
    spec: apiKeySpecs.deleteApiKey,
  })
  .input(apiKeySchemas.deleteApiKeyInput)
  .output(apiKeySchemas.deleteApiKeyOutput)
  .handler(apiKeyHandlers.deleteApiKey);

export const getApiKeys = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/apikeys",
    summary: "Get all API keys for the current user",
    spec: apiKeySpecs.getApiKeys,
  })
  .output(apiKeySchemas.getApiKeysOutput)
  .handler(apiKeyHandlers.getApiKeys);

export const getApiKey = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/apikeys/{id}",
    summary: "Get a specific API key",
    spec: apiKeySpecs.getApiKey,
  })
  .input(apiKeySchemas.getApiKeyInput)
  .output(apiKeySchemas.getApiKeyOutput)
  .handler(apiKeyHandlers.getApiKey);

export const ApiKeyRouter = os
  .$context<AppContext>()
  .prefix("/apikeys")
  .tag("ApiKeys")
  .router({
    create: createApiKey,
    delete: deleteApiKey,
    list: getApiKeys,
    get: getApiKey,
  });
