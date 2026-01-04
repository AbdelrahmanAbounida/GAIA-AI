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

  const LOCAL_PROVIDERS = new Set(["ollama", "openai-compatible"]);

  // Transform local credential to model schema
  const transformLocalCredentialToModel = (credential: Credential) => ({
    id: credential.provider,
    name: credential.name || credential.provider,
    specification: {
      provider: credential.provider,
      baseUrl: credential.baseUrl,
      apiKey: credential.apiKey,
      credentialId: credential.id,
    },
    description: `Local ${credential.provider} connection`,
    pricing: null,
    modelType: "language" as const,
  });

  const availableModels = useMemo(() => {
    if (!aiModels || !credentials) {
      return { llms: [], embeddings: [], image: [] };
    }

    // if vercel return all models
    if (
      credentials?.filter((cred) => cred.isValid && cred.provider === "vercel")
        .length > 0
    ) {
      return {
        llms:
          aiModels.models?.llms?.map((m) => ({ ...m, fromVercel: true })) ?? [],
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

    // Get standard LLMs from aiModels
    const standardLlms =
      aiModels.models?.llms?.filter((model) =>
        validAIProviders.includes(model.id)
      ) ?? [];

    // Add local provider models (ollama, openai-compatible)
    const localLlms = credentials
      .filter(
        (cred) =>
          cred.isValid &&
          cred.credentialType === "ai_model" &&
          LOCAL_PROVIDERS.has(cred.provider)
      )
      .map(transformLocalCredentialToModel);

    const llms = [...standardLlms, ...localLlms];

    const embeddings =
      aiModels.models?.embeddings?.filter((model) =>
        validAIProviders.includes(model.id)
      ) ?? [];

    const image =
      aiModels.models?.image?.filter((model) =>
        validAIProviders.includes(model.id)
      ) ?? [];

    return { llms, embeddings, image };
  }, [aiModels, credentials]);

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

  const isPending = aiModelsLoading || credentialsLoading;

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
