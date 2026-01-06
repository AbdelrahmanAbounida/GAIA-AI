import { os } from "@orpc/server";
import { authRouter } from "./routes/auth";
import { requiredAuthMiddleware } from "./middleware/auth";
import { feedBackRouter } from "./routes/feedback";
import type { AppContext } from "./types";
import { ChatRouter } from "./routes/chats";
import { AIRouter } from "./routes/ai";
import { OllamaRouter } from "./routes/ollama";
import { ToolsRouter } from "./routes/tools";
import { MCPRouter } from "./routes/mcp";
import { RagRouter } from "./routes/rag";
import { requireApiKeyMiddleware } from "./middleware/apikey";
import { PromptRouter } from "./routes/prompt";
import { ProjectRouter } from "./routes/project";
import { ApiKeyRouter } from "./routes/api-key";
import { CredentialRouter } from "./routes/credentials";

export const publicRouter = os.router({
  auth: authRouter,
});

export const authedRouter = os
  .$context<AppContext>()
  .use(requiredAuthMiddleware)
  .router({
    feedback: feedBackRouter,
    chat: ChatRouter,
    project: ProjectRouter,
    ai: AIRouter,
    credentials: CredentialRouter,
    rag: RagRouter,
    ollama: OllamaRouter,
    tools: ToolsRouter,
    mcp: MCPRouter,
    apiKey: ApiKeyRouter,
    prompt: PromptRouter,
  });

export const appRouter = os.$context<AppContext>().router({
  public: publicRouter,
  authed: authedRouter,
});

export const apiRouterV1 = os
  .$context<AppContext>()
  .use(requireApiKeyMiddleware)
  .router({
    project: ProjectRouter,
    chat: ChatRouter,
    ai: AIRouter,
    credentials: CredentialRouter,
    prompt: PromptRouter,
    mcp: MCPRouter,
    tools: ToolsRouter,
    knowledge: RagRouter,
    ollama: OllamaRouter,
  });

export type AppRouter = typeof appRouter;
export * from "@orpc/openapi";
export * from "@orpc/openapi/node";
export * from "@orpc/zod";
export { OpenAPIHandler as OpenAPIHandlerNode } from "@orpc/openapi/fetch";
