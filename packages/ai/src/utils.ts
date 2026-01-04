import type { DynamicField, ProviderConfig, UIModel } from "./types";
import { PROVIDER_CONFIGS } from "./const";
import type { GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import type { VectorStoreProvider } from "./vectorstores";

export function getProviderConfig(
  provider: string
): ProviderConfig | undefined {
  const normalizedProvider = provider.toLowerCase().trim();

  return PROVIDER_CONFIGS.find((config) =>
    config.matchPatterns.some((pattern) =>
      normalizedProvider.includes(pattern.toLowerCase())
    )
  );
}

export function getProviderBaseUrl(provider: string): string | undefined {
  const config = getProviderConfig(provider);
  return config?.baseUrl;
}

export function getProviderFields(provider: string): DynamicField[] {
  const config = getProviderConfig(provider);
  return config?.fields || [];
}

export function buildProvidersListForUI(
  aiModels: {
    models: {
      llms: Array<GatewayLanguageModelEntry>;
      embeddings: Array<GatewayLanguageModelEntry>;
      image: Array<GatewayLanguageModelEntry>;
    };
    vectorstores: Array<VectorStoreProvider>;
  },
  credentialType: "ai_model" | "vectorstore"
): Array<UIModel> {
  if (!aiModels) return [];

  let list: Array<{
    value: string;
    label: string;
    recommended?: boolean;
    fields: DynamicField[];
  }> = [];

  if (credentialType === "ai_model") {
    // Add recommended providers first
    const recommendedProviders = PROVIDER_CONFIGS.filter((p) => p.recommended);
    list.push(
      ...recommendedProviders.map((p) => ({
        value: p.id,
        label: p.name,
        recommended: true,
        fields: p.fields,
      }))
    );

    // Add other providers from configs
    const otherProviders = PROVIDER_CONFIGS.filter((p) => !p.recommended);
    list.push(
      ...otherProviders.map((p) => ({
        value: p.id,
        label: p.name,
        recommended: false,
        fields: p.fields,
      }))
    );

    // Add any additional LLM providers from server that aren't in configs
    if (aiModels.models?.llms) {
      aiModels.models.llms.forEach((model: any) => {
        if (!list.find((p) => p.value === model.id)) {
          // Check if we have a config for this provider
          const config = getProviderConfig(model.id);

          list.push({
            value: model.id,
            label: model.name,
            recommended: false,
            fields: config?.fields || [
              {
                id: "apiKey",
                name: "API Key",
                isRequired: true,
                type: "password",
                placeholder: "Enter your API key",
              },
            ],
          });
        }
      });
    }
  } else if (credentialType === "vectorstore") {
    // Add vectorstore providers from server with their dynamic credentials
    if (aiModels.vectorstores) {
      aiModels.vectorstores.forEach((vs) => {
        const fields: DynamicField[] = vs.credentials.map((cred: any) => ({
          id: cred.id,
          name: cred.name,
          isRequired: cred.isRequired,
          type: cred.id.toLowerCase().includes("key") ? "password" : "text",
          placeholder: `Enter ${cred.name.toLowerCase()}`,
          cloudOnly: cred.cloudOnly,
        }));

        list.push({
          value: vs.id,
          label: vs.name,
          recommended: false,
          fields,
        });
      });
    }
  }

  return list;
}
