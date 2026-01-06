import { orpcQueryClient } from "@/lib/orpc/client";
import { PROVIDER_CONFIGS } from "@gaia/ai/const";
import { Credential } from "@gaia/db";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * get all available providers and vector stores
 */
export const useAllProviders = () => {
  const { data: providers, isPending } = useQuery(
    orpcQueryClient.authed.ai.getAllProviders.queryOptions({})
  );

  const modelsProviders = useMemo(() => {
    return PROVIDER_CONFIGS.map((config) => {
      const match = providers?.modelsProviders?.find(
        (p) => p.name === config.name
      );

      return {
        ...config,
        name: match?.name ?? config.id,
        models: match?.models ?? [],
        capabilities: match?.capabilities ?? config.capabilities,
      };
    });
  }, [providers]);

  return {
    isPending,
    modelsProviders,
    vectorstoresProviders: providers?.vectorstoresProviders ?? [],
  };
};

/**
 * Helper to get default Ollama base URL
 */
function getDefaultOllamaBaseUrl(): string {
  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  return isDocker
    ? "http://host.docker.internal:11434"
    : "http://localhost:11434";
}

/**
 * Helper to check if a model name is an embedding model
 */
function isEmbeddingModel(modelName: string): boolean {
  return modelName.toLowerCase().includes("embed");
}

/**
 * get user's available models based on valid credentials
 */
export const useAvailableModels = () => {
  const { data: aiModels, isPending: aiModelsLoading } = useQuery(
    orpcQueryClient.authed.ai.getAllModels.queryOptions({})
  );
  const { data: credentialsData, isPending: credentialsLoading } = useQuery(
    orpcQueryClient.authed.credentials.list.queryOptions({
      input: {
        offset: 0,
        limit: 20,
      },
    })
  );
  const credentials = credentialsData?.credentials;

  // Get Ollama credential
  const ollamaCred = credentials?.find((cred) => cred.provider === "ollama");

  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  let ollamaBaseUrl = ollamaCred?.baseUrl || getDefaultOllamaBaseUrl();

  // Override localhost with Docker URL if in Docker
  if (isDocker && ollamaBaseUrl.includes("localhost")) {
    ollamaBaseUrl = "http://host.docker.internal:11434";
  }

  // Fetch Ollama models if Ollama credential exists and is valid
  const { data: ollamaModelsData, isPending: ollamaModelsLoading } = useQuery({
    ...orpcQueryClient.authed.ollama.listModels.queryOptions({
      input: { baseUrl: ollamaBaseUrl },
    }),
    // enabled: !!ollamaCred?.isValid,
    // retry: false,
  });

  // Transform Ollama installed model to model schema
  const transformOllamaModelToSchema = (
    ollamaModel: any,
    credential: Credential
  ) => ({
    id: "ollama",
    name: ollamaModel.name,
    specification: {
      provider: "ollama",
      baseUrl: credential.baseUrl,
      apiKey: credential.apiKey,
      credentialId: credential.id,
      modelName: ollamaModel.name,
    },
    description: `Ollama model: ${ollamaModel.name}`,
    pricing: null,
    modelType: isEmbeddingModel(ollamaModel.name)
      ? ("embedding" as const)
      : ("language" as const),
  });

  // Transform OpenAI-compatible credential to model schema for LLMs
  const transformOpenAICompatibleToLLM = (credential: Credential) => ({
    id: "openai-compatible",
    name: credential.name || "OpenAI Compatible (Chat)",
    specification: {
      provider: "openai-compatible",
      baseUrl: credential.baseUrl,
      apiKey: credential.apiKey,
      credentialId: credential.id,
    },
    description: `Local OpenAI-compatible chat model`,
    pricing: null,
    modelType: "language" as const,
  });

  // Transform OpenAI-compatible credential to model schema for Embeddings
  const transformOpenAICompatibleToEmbedding = (credential: Credential) => ({
    id: "openai-compatible",
    name: credential.name || "OpenAI Compatible (Embedding)",
    specification: {
      provider: "openai-compatible",
      baseUrl: credential.baseUrl,
      apiKey: credential.apiKey,
      credentialId: credential.id,
    },
    description: `Local OpenAI-compatible embedding model`,
    pricing: null,
    modelType: "embedding" as const,
  });

  const availableModels = useMemo(() => {
    if (!aiModels || !credentials) {
      return { llms: [], embeddings: [], image: [] };
    }

    // if vercel return all models (but filter out embedding models from LLMs)
    if (
      credentials?.filter((cred) => cred.isValid && cred.provider === "vercel")
        .length > 0
    ) {
      return {
        llms:
          aiModels.models?.llms
            ?.filter((m) => !isEmbeddingModel(m.name))
            ?.map((m) => ({ ...m, fromVercel: true })) ?? [],
        embeddings:
          aiModels.models?.embeddings?.map((m) => ({
            ...m,
            fromVercel: true,
          })) ?? [],
        image:
          aiModels.models?.image?.map((m) => ({ ...m, fromVercel: true })) ??
          [],
      };
    }

    const validAIProviders = credentials
      .filter((cred) => cred.isValid && cred.credentialType === "ai_model")
      .map((cred) => cred.provider);

    // Get standard LLMs from aiModels (filter out embedding models)
    const standardLlms =
      aiModels.models?.llms?.filter(
        (model) =>
          validAIProviders.includes(model.id) && !isEmbeddingModel(model.name)
      ) ?? [];

    // Add Ollama LLM models (filter out embedding models)
    const ollamaLlms =
      ollamaCred?.isValid && ollamaModelsData?.models
        ? ollamaModelsData.models
            .filter((model) => !isEmbeddingModel(model.name))
            .map((model) => transformOllamaModelToSchema(model, ollamaCred))
        : [];

    // Get OpenAI-compatible credentials
    const openaiCompatibleCreds = credentials.filter(
      (cred) =>
        cred.isValid &&
        cred.credentialType === "ai_model" &&
        cred.provider === "openai-compatible"
    );

    // Add OpenAI-compatible LLMs
    const openaiCompatibleLlms = openaiCompatibleCreds.map(
      transformOpenAICompatibleToLLM
    );

    const llms = [...standardLlms, ...ollamaLlms, ...openaiCompatibleLlms];

    // Get standard embeddings from aiModels
    const standardEmbeddings =
      aiModels.models?.embeddings?.filter((model) =>
        validAIProviders.includes(model.id)
      ) ?? [];

    // Add Ollama embedding models (models that contain "embed" in name)
    const ollamaEmbeddings =
      ollamaCred?.isValid && ollamaModelsData?.models
        ? ollamaModelsData.models
            .filter((model) => isEmbeddingModel(model.name))
            .map((model) => transformOllamaModelToSchema(model, ollamaCred))
        : [];

    // Add OpenAI-compatible embeddings
    const openaiCompatibleEmbeddings = openaiCompatibleCreds.map(
      transformOpenAICompatibleToEmbedding
    );

    const embeddings = [
      ...standardEmbeddings,
      ...ollamaEmbeddings,
      ...openaiCompatibleEmbeddings,
    ];

    const image =
      aiModels.models?.image?.filter((model) =>
        validAIProviders.includes(model.id)
      ) ?? [];

    return { llms, embeddings, image };
  }, [aiModels, credentials, ollamaModelsData, ollamaCred]);

  // Filter vector stores by valid credentials
  const availableVectorstores = useMemo(() => {
    if (!aiModels || !credentials) {
      return aiModels?.vectorstores?.filter((vs) => !vs.needsCredentials) ?? [];
    }
    const validVectorStoreProviders = credentials
      .filter((cred) => cred.isValid && cred.credentialType === "vectorstore")
      .map((cred) => cred.provider);
    return (
      aiModels.vectorstores?.filter(
        (vs) =>
          !vs.needsCredentials ||
          validVectorStoreProviders.includes(vs.id) ||
          vs.credentials.length === 0
      ) ?? []
    );
  }, [aiModels, credentials]);

  // Get credentials by type
  const aiCredentials = useMemo(() => {
    return credentials?.filter((c) => c.credentialType === "ai_model") ?? [];
  }, [credentials]);

  const vectorstoreCredentials = useMemo(() => {
    return credentials?.filter((c) => c.credentialType === "vectorstore") ?? [];
  }, [credentials]);

  // Capability checks
  const hasAICredentials = useMemo(() => {
    return (
      credentials?.some(
        (cred) => cred.credentialType === "ai_model" && cred.isValid
      ) ?? false
    );
  }, [credentials]);

  const hasEmbeddingProvider = useMemo(() => {
    return availableModels.embeddings.length > 0;
  }, [availableModels.embeddings]);

  const hasVectorStoreCredentials = useMemo(() => {
    return (
      credentials?.some(
        (cred) => cred.credentialType === "vectorstore" && cred.isValid
      ) ?? false
    );
  }, [credentials]);

  const isPending =
    aiModelsLoading || credentialsLoading || ollamaModelsLoading;

  return {
    isPending,
    // All available options
    allModels: aiModels,
    allVectorstores: aiModels?.vectorstores ?? [],
    // User's valid credentials
    credentials,
    aiCredentials,
    vectorstoreCredentials,
    // Filtered by user's credentials
    availableLLMs: availableModels.llms,
    availableEmbeddings: availableModels.embeddings,
    availableImages: availableModels.image,
    availableVectorstores,
    // Capability checks
    hasAICredentials,
    hasEmbeddingCredentials: hasEmbeddingProvider,
    hasVectorStoreCredentials,
  };
};

/**
 * get user's available models which run locally (ollama, openai-compatible)
 */
export const useAvailableLocalModels = () => {
  const { data: credentialsData, isPending: credentialsLoading } = useQuery(
    orpcQueryClient.authed.credentials.list.queryOptions({
      input: {
        offset: 0,
        limit: 20,
      },
    })
  );
  const credentials = credentialsData?.credentials;

  // Filter models by valid AI credentials
  const availableModels = useMemo(() => {
    if (!credentials) {
      return { llms: [], embeddings: [] };
    }
    const validLocalAIProviders = credentials.filter(
      (cred) =>
        cred.isValid &&
        cred.credentialType === "ai_model" &&
        new Set(["ollama", "openai-compatible"]).has(cred.provider)
    );

    const validLocalEmbeddingProviders = credentials.filter(
      (cred) =>
        cred.isValid &&
        cred.credentialType === "ai_model" &&
        new Set(["ollama", "openai-compatible"]).has(cred.provider)
    );

    return {
      llms: validLocalAIProviders,
      embeddings: validLocalEmbeddingProviders,
    };
  }, [credentials]);

  const isPending = credentialsLoading;

  return {
    isPending,
    localAIModels: availableModels.llms,
    localEmbeddings: availableModels.embeddings,
  };
};
