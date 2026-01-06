import { streamToEventIterator } from "@orpc/server";
import type { AppContext } from "../../types";
import {
  streamText,
  createOpenAICompatible,
  createGateway as createAIGateway,
  type CoreMessage,
} from "@gaia/ai";
import { db, chat, credential, eq, and } from "@gaia/db";
import {
  aiGateway,
  ALL_VECTOR_STORES,
  getAllProvidersWithModels as getModelsProviders,
} from "@gaia/ai/models";

/**
 * Get provider configuration for a user's model
 */
async function getProviderConfig(
  userId: string,
  modelId: string,
  provider?: string
) {
  const userCredentials = await db
    .select()
    .from(credential)
    .where(
      and(
        eq(credential.userId, userId),
        eq(credential.isValid, true),
        eq(credential.credentialType, "ai_model")
      )
    );

  if (!userCredentials || userCredentials.length === 0) {
    throw new Error("No valid credentials found for user");
  }

  const matchingCredential = userCredentials.find((cred) => {
    if (provider && cred.provider === provider) {
      return true;
    }
    if (cred.models && Array.isArray(cred.models)) {
      return (cred.models as string[]).includes(modelId);
    }
    return modelId.toLowerCase().includes(cred.provider.toLowerCase());
  });

  if (!matchingCredential) {
    throw new Error(
      `No valid credential found for model: ${modelId}${provider ? ` with provider: ${provider}` : ""}`
    );
  }

  return {
    apiKey: matchingCredential.apiKey,
    baseURL: matchingCredential.baseUrl,
    proxy: matchingCredential.proxy,
    provider: matchingCredential.provider,
    name: matchingCredential.name,
  };
}

/**
 * Create a model instance
 */
function createModelInstance(config: {
  apiKey: string;
  baseURL?: string | null;
  provider: string;
  modelId: string;
  proxy?: string | null;
}) {
  const { apiKey, baseURL, provider, modelId, proxy } = config;

  if (baseURL) {
    const gateway = createAIGateway({
      apiKey,
      baseURL,
      ...(proxy && { headers: { "X-Proxy": proxy } }),
    });
    return gateway(modelId);
  }

  const providerInstance = createOpenAICompatible({
    name: provider,
    apiKey,
    baseURL: baseURL || `https://api.${provider}.com/v1`,
  });

  return providerInstance(modelId);
}

export const aiHandlers: {
  getAllProviders: () => Promise<{
    success: boolean;
    modelsProviders: any;
    vectorstoresProviders: any;
  }>;
  getAllModels: (args: { context: AppContext }) => Promise<{
    success: boolean;
    message?: string;
    models?: { llms: any[]; embeddings: any[]; image: any[] };
    vectorstores?: any;
  }>;
  getUserModels: (args: { context: AppContext }) => Promise<{
    success: boolean;
    message?: string;
    ai_models?: any[];
    embeddings?: any[];
  }>;
  chatCompletions: (args: {
    input: {
      chatId: string;
      messages: Array<{ role: string; content: string; name?: string }>;
      model: string;
      provider?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    };
    context: AppContext;
  }) => AsyncGenerator<any, void, unknown>;
  streamChat: (args: {
    input: {
      chatId: string;
      messages: Array<{ role: string; content: string }>;
      model: string;
      provider?: string;
      system?: string;
    };
    context: AppContext;
  }) => Promise<any>;
  imageGeneration: (args: {
    input: {
      prompt: string;
      model: string;
      provider?: string;
      n?: number;
      stream?: boolean;
    };
    context: AppContext;
  }) => AsyncGenerator<any, void, unknown>;
} = {
  getAllProviders: async () => {
    const providers = await getModelsProviders();
    return {
      success: true,
      modelsProviders: providers,
      vectorstoresProviders: ALL_VECTOR_STORES,
    };
  },

  getAllModels: async ({ context }: { context: AppContext }) => {
    if (!context.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const aiModels = (await aiGateway.getAvailableModels()).models;

    const llms = aiModels.filter((model) => model.modelType === "language");
    const embeddings = aiModels.filter(
      (model) => model.modelType === "embedding"
    );
    const image = aiModels.filter((model) => model.modelType === "image");

    return {
      success: true,
      models: {
        llms,
        embeddings,
        image,
      },
      vectorstores: ALL_VECTOR_STORES,
    };
  },

  getUserModels: async ({ context }: { context: AppContext }) => {
    if (!context.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const userCredentials = await db
      .select()
      .from(credential)
      .where(
        and(
          eq(credential.userId, context.session.user.id),
          eq(credential.isValid, true)
        )
      );

    const ai_models = userCredentials.filter(
      (cred) => cred.credentialType === "ai_model"
    );
    const embeddings = userCredentials.filter(
      (cred) => cred.credentialType === "embedding"
    );

    return {
      success: true,
      ai_models,
      embeddings,
    };
  },

  chatCompletions: async function* ({
    input,
    context,
  }: {
    input: {
      chatId: string;
      messages: Array<{ role: string; content: string; name?: string }>;
      model: string;
      provider?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    };
    context: AppContext;
  }) {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    const [chatExists] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.chatId), eq(chat.userId, context.session.user.id))
      );

    if (!chatExists) {
      throw new Error("Chat not found");
    }

    const providerConfig = await getProviderConfig(
      context.session.user.id,
      input.model,
      input.provider
    );

    const model = createModelInstance({
      ...providerConfig,
      modelId: input.model,
    });

    const messages: CoreMessage[] = input.messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    const systemMessage = input.messages.find((msg) => msg.role === "system");

    const result = streamText({
      model,
      messages,
      system: systemMessage?.content,
      temperature: input.temperature,
      maxOutputTokens: input.max_tokens,
    });

    if (input.stream) {
      for await (const chunk of result.textStream) {
        yield {
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: input.model,
          choices: [
            {
              index: 0,
              delta: {
                content: chunk,
              },
              finish_reason: null,
            },
          ],
        };
      }

      yield {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: input.model,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: "stop",
          },
        ],
      };
    } else {
      const text = await result.text;
      yield {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: input.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: text,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }
  },

  streamChat: async ({
    input,
    context,
  }: {
    input: {
      chatId: string;
      messages: Array<{ role: string; content: string }>;
      model: string;
      provider?: string;
      system?: string;
    };
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    const [chatExists] = await db
      .select()
      .from(chat)
      .where(
        and(eq(chat.id, input.chatId), eq(chat.userId, context.session.user.id))
      );

    if (!chatExists) {
      throw new Error("Chat not found");
    }

    const providerConfig = await getProviderConfig(
      context.session.user.id,
      input.model,
      input.provider
    );

    const model = createModelInstance({
      ...providerConfig,
      modelId: input.model,
    });

    const messages: CoreMessage[] = input.messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    const result = streamText({
      model,
      system: input.system || "You are a helpful assistant.",
      messages,
    });

    return streamToEventIterator(result.toUIMessageStream());
  },

  imageGeneration: async function* ({
    input,
    context,
  }: {
    input: {
      prompt: string;
      model: string;
      provider?: string;
      n?: number;
      stream?: boolean;
    };
    context: AppContext;
  }) {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    // Get provider configuration for the user's model
    const providerConfig = await getProviderConfig(
      context.session.user.id,
      input.model,
      input.provider
    );

    // Create model instance using AI SDK Gateway
    const model = createModelInstance({
      ...providerConfig,
      modelId: input.model,
    });

    // Use AI SDK for image generation with streaming
    const result = streamText({
      model,
      prompt: input.prompt,
    });

    if (input.stream) {
      let textContent = "";
      let files: any[] = [];

      // Stream progress updates
      for await (const delta of result.fullStream) {
        if (delta.type === "text-delta") {
          textContent += delta.text;

          yield {
            type: "progress",
            text: delta.text,
            timestamp: Date.now(),
          };
        }
      }

      // Get final result with generated images
      const finalResult = result;
      files = (await finalResult.files) || [];

      // Final response with images
      yield {
        type: "complete",
        created: Math.floor(Date.now() / 1000),
        data: files.map((file, index) => ({
          index,
          url: file.url,
          base64: file.base64,
          mimeType: file.mimeType,
        })),
        usage: finalResult.usage,
        text: textContent,
      };
    } else {
      const finalResult = result;
      const files = (await finalResult.files) || [];
      yield {
        type: "complete",
        created: Math.floor(Date.now() / 1000),
        data: files.map((file, index) => ({
          index,
          mediaType: file.mediaType,
          base64: file.base64,
          uint8Array: file.uint8Array,
        })),
        usage: finalResult.usage,
      };
    }
  },
};
