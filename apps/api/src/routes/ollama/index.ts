import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { ollamaHandlers } from "./handler";
import { ollamaSchemas } from "./schema";
import { ollamaSpecs } from "./spec";

export const getModelDetails = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/ollama/show/{name}",
    summary: "Get details of an Ollama model",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.getModelDetails,
  })
  .input(ollamaSchemas.getModelDetailsInput)
  .output(ollamaSchemas.getModelDetailsOutput)
  .handler(ollamaHandlers.getModelDetails);

export const searchOllama = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/ollama/search",
    summary: "Search Ollama models",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.searchOllama,
  })
  .input(ollamaSchemas.searchOllamaInput)
  .output(ollamaSchemas.searchOllamaOutput)
  .handler(ollamaHandlers.searchOllama);

export const pullModel = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/ai/ollama/pull",
    summary: "Pull an Ollama model",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.pullModel,
  })
  .input(ollamaSchemas.pullModelInput)
  .output(ollamaSchemas.pullModelOutput)
  .handler(ollamaHandlers.pullModel);

export const getPullStatus = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/ollama/pull-status",
    summary: "Get the status of a model pull operation",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.getPullStatus,
  })
  .input(ollamaSchemas.pullStatusInput)
  .output(ollamaSchemas.pullStatusOutput)
  .handler(ollamaHandlers.getPullStatus);

export const listModels = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/ollama/list",
    summary: "List installed Ollama models",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.listModels,
  })
  .input(ollamaSchemas.listModelsInput)
  .output(ollamaSchemas.listModelsOutput)
  .handler(ollamaHandlers.listModels);

export const deleteModel = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/ai/ollama/delete",
    summary: "Delete an installed Ollama model",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.deleteModel,
  })
  .input(ollamaSchemas.deleteModelInput)
  .output(ollamaSchemas.deleteModelOutput)
  .handler(ollamaHandlers.deleteModel);

export const checkConnection = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/ai/ollama/check-connection",
    summary: "Check if Ollama is running and accessible",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.checkConnection,
  })
  .input(ollamaSchemas.checkConnectionInput)
  .output(ollamaSchemas.checkConnectionOutput)
  .handler(ollamaHandlers.checkConnection);

export const showModel = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/ai/ollama/show",
    summary: "Show Ollama model capabilities",
    tags: ["AI", "Ollama"],
    spec: ollamaSpecs.showModel,
  })
  .input(ollamaSchemas.showModelInput)
  .output(ollamaSchemas.showModelOutput)
  .handler(ollamaHandlers.showModel);

export const OllamaRouter = os
  .$context<AppContext>()
  .prefix("/ai/ollama")
  .tag("Ollama")
  .router({
    searchForModel: searchOllama,
    pullModel: pullModel,
    getPullStatus: getPullStatus,
    listModels: listModels,
    deleteModel: deleteModel,
    checkConnection: checkConnection,
    getModelDetails,
    showModel,
  });
