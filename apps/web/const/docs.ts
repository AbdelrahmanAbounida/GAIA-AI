export const PROVIDER_DOCS: Record<
  string,
  { apiKeyUrl?: string; docsUrl: string }
> = {
  openai: {
    apiKeyUrl: "https://platform.openai.com/api-keys",
    docsUrl: "https://platform.openai.com/docs",
  },
  anthropic: {
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    docsUrl: "https://docs.anthropic.com",
  },
  google: {
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/docs",
  },
  cohere: {
    apiKeyUrl: "https://dashboard.cohere.com/api-keys",
    docsUrl: "https://docs.cohere.com",
  },
  mistral: {
    apiKeyUrl: "https://console.mistral.ai/api-keys",
    docsUrl: "https://docs.mistral.ai",
  },
  deepseek: {
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    docsUrl: "https://platform.deepseek.com/docs",
  },
  xai: {
    apiKeyUrl: "https://console.x.ai",
    docsUrl: "https://docs.x.ai",
  },
  perplexity: {
    apiKeyUrl: "https://www.perplexity.ai/settings/api",
    docsUrl: "https://docs.perplexity.ai",
  },
  voyage: {
    apiKeyUrl: "https://dash.voyageai.com/api-keys",
    docsUrl: "https://docs.voyageai.com",
  },
  nvidia: {
    apiKeyUrl: "https://build.nvidia.com/",
    docsUrl: "https://docs.nvidia.com/nim",
  },
};
