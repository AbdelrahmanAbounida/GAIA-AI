import type { AppContext } from "../../types";
import type z from "zod";
import { and, credential, db, eq } from "@gaia/db";
import {
  searchOllamaModels,
  pullOllamaModel,
  listInstalledModels,
  getPullProgress,
  deleteOllamaModel,
  checkOllamaConnection,
  getModelDetails as getOllamaModelDetails,
  showOllamaModel,
} from "@gaia/ai/local";
import { ollamaSchemas } from "./schema";

function isDockerEnvironment(): boolean {
  return (
    process.env.DOCKER_ENV === "true" ||
    process.env.IS_DOCKER === "true" ||
    process.env.DOCKER === "true"
  );
}

function getDefaultOllamaBaseUrl(): string {
  return isDockerEnvironment()
    ? "http://host.docker.internal:11434"
    : "http://localhost:11434";
}

async function getOllamaBaseUrl(context: AppContext): Promise<string> {
  try {
    const userId = context.session?.user.id;
    if (!userId) throw new Error("No user ID in session");

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

    const ollamaCred = userCredentials.find(
      (cred) => cred.provider === "ollama"
    );

    if (ollamaCred?.baseUrl) {
      if (isDockerEnvironment() && ollamaCred.baseUrl.includes("localhost")) {
        return "http://host.docker.internal:11434";
      }
      return ollamaCred.baseUrl;
    }

    return getDefaultOllamaBaseUrl();
  } catch (error) {
    console.error("Error fetching Ollama baseUrl from DB:", error);
    return getDefaultOllamaBaseUrl();
  }
}

async function validateAndFixBaseUrl(
  baseUrl: string,
  apiKey?: string
): Promise<string> {
  const isDocker = isDockerEnvironment();

  if (isDocker && baseUrl.includes("localhost")) {
    const dockerUrl = baseUrl.replace("localhost", "host.docker.internal");

    try {
      const isConnected = await checkOllamaConnection(dockerUrl, apiKey);
      if (isConnected) {
        return dockerUrl;
      }
    } catch (error) {
      console.error("Error connecting to host.docker.internal:", error);
    }
  }

  return baseUrl;
}

export const ollamaHandlers = {
  getModelDetails: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.getModelDetailsInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    try {
      const { name } = input;
      const { model: modelDetails } = await getOllamaModelDetails({
        model: name,
        verbose: input.verbose,
      });
      return {
        success: true,
        model: modelDetails,
      };
    } catch (error) {
      console.error("Ollama model details error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  searchOllama: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.searchOllamaInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    try {
      const { query, categories, order } = input;
      const searchResults = await searchOllamaModels({
        query: query || "",
        order,
        categories,
      });

      return {
        success: true,
        models: searchResults,
      };
    } catch (error) {
      console.error("Ollama search error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  pullModel: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.pullModelInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    try {
      const { modelName, baseUrl: inputBaseUrl } = input;

      let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
      baseUrl = await validateAndFixBaseUrl(baseUrl);

      const isConnected = await checkOllamaConnection(baseUrl);
      if (!isConnected) {
        return {
          success: false,
          error: "Ollama is not running. Please start Ollama and try again.",
        };
      }

      await pullOllamaModel(modelName, baseUrl);

      return {
        success: true,
        message: `Started pulling model: ${modelName}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to pull model",
      };
    }
  },

  getPullStatus: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.pullStatusInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    try {
      const { modelName, baseUrl: inputBaseUrl } = input;

      let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
      baseUrl = await validateAndFixBaseUrl(baseUrl);

      const status = await getPullProgress(modelName, baseUrl);

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error("Ollama pull status error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get pull status",
      };
    }
  },

  listModels: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.listModelsInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    try {
      const { baseUrl: inputBaseUrl } = input;

      let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
      baseUrl = await validateAndFixBaseUrl(baseUrl);

      const isConnected = await checkOllamaConnection(baseUrl);
      if (!isConnected) {
        return {
          success: false,
          error: "Ollama is not running",
          models: [],
        };
      }

      const models = await listInstalledModels(baseUrl);

      return {
        success: true,
        models,
      };
    } catch (error) {
      console.error("Ollama list models error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list models",
        models: [],
      };
    }
  },

  deleteModel: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.deleteModelInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    try {
      const { modelName, baseUrl: inputBaseUrl } = input;

      let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
      baseUrl = await validateAndFixBaseUrl(baseUrl);

      await deleteOllamaModel(modelName, baseUrl);

      return {
        success: true,
        message: `Successfully deleted model: ${modelName}`,
      };
    } catch (error) {
      console.error("Ollama delete error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete model",
      };
    }
  },

  checkConnection: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.checkConnectionInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        connected: false,
        error: "Unauthorized",
      };
    }

    try {
      const { baseUrl: inputBaseUrl, apiKey } = input;

      let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
      baseUrl = await validateAndFixBaseUrl(baseUrl, apiKey);

      const isConnected = await checkOllamaConnection(baseUrl, apiKey);

      return {
        success: true,
        connected: isConnected || false,
      };
    } catch (error) {
      console.error("Ollama connection check error:", error);
      return {
        success: false,
        connected: false,
        error:
          error instanceof Error ? error.message : "Failed to check connection",
      };
    }
  },

  showModel: async ({
    input,
    context,
  }: {
    input: z.infer<typeof ollamaSchemas.showModelInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    try {
      const { modelName, verbose, baseUrl: inputBaseUrl } = input;

      let baseUrl = inputBaseUrl || (await getOllamaBaseUrl(context));
      baseUrl = await validateAndFixBaseUrl(baseUrl);
      const modelDetails = await showOllamaModel({
        modelName,
        baseUrl,
        verbose,
      });

      return {
        success: true,
        capabilities: modelDetails.capabilities || [],
        details: modelDetails.details,
      };
    } catch (error) {
      console.error("Ollama show model error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get model information",
      };
    }
  },
};
