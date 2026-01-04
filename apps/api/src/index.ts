import { os } from "@orpc/server";
import { authRouter } from "./routes/auth";
import { requiredAuthMiddleware } from "./middleware/auth";
import { feedBackRouter } from "./routes/feedback";
import type { AppContext } from "./types";
import { chatsRouter } from "./routes/chats";
import { ProjectRouter } from "./routes/project";
import { AIRouter } from "./routes/ai";
import { CredentialRouter } from "./routes/credentials";
import { OllamaRouter } from "./routes/ollama";
import { ToolsRouter } from "./routes/tools";
import { MCPRouter } from "./routes/mcp";
import { RagRouter } from "./routes/rag";
import { requireApiKeyMiddleware } from "./middleware/apikey";
import { ApiKeyRouter } from "./routes/apikey";
import { PromptRouter } from "./routes/prompt";
import { demoRouter } from "./routes/demo";

export const publicRouter = os.router({
  auth: authRouter,
});

export const authedRouter = os
  .$context<AppContext>()
  .use(requiredAuthMiddleware)
  .router({
    feedback: feedBackRouter,
    chat: chatsRouter,
    project: ProjectRouter,
    ai: AIRouter,
    credentials: CredentialRouter,
    rag: RagRouter,
    ollama: OllamaRouter,
    tools: ToolsRouter,
    mcp: MCPRouter,
    apiKey: ApiKeyRouter,
    prompt: PromptRouter,
    demo: demoRouter,
  });

export const appRouter = os.$context<AppContext>().router({
  public: publicRouter,
  authed: authedRouter,
});

// TODO::  mcp - tools - rag - ollama
export const apiRouterV1 = os
  .$context<AppContext>()
  .use(requireApiKeyMiddleware)
  .router({
    project: ProjectRouter,
    chat: chatsRouter,
    ai: AIRouter,
    credentials: CredentialRouter,
    apiKeys: ApiKeyRouter,
    Credentials: CredentialRouter,
    prompt: PromptRouter,
  });

export type AppRouter = typeof appRouter;
export * from "@orpc/openapi";
export * from "@orpc/openapi/node";
export * from "@orpc/zod";
export { OpenAPIHandler as OpenAPIHandlerNode } from "@orpc/openapi/fetch";
