import type { FullTextSearchProviderId } from "../types";
import type { IFullTextSearch, FullTextSearchConfig } from "./types";

/**
 * Factory function to create full-text search instances
 */
export async function createFullTextSearchInstance(
  config: FullTextSearchConfig
): Promise<IFullTextSearch> {
  const { provider } = config;

  switch (provider) {
    case "flexsearch": {
      const { FlexSearchFullTextSearch } =
        await import("./flexsearch-provider");
      return new FlexSearchFullTextSearch(config);
    }

    case "minisearch": {
      const { MiniSearchFullTextSearch } = await import("./minisearch");
      return new MiniSearchFullTextSearch(config);
    }

    case "orama": {
      const { OramaFullTextSearch } = await import("./orama");
      return new OramaFullTextSearch(config);
    }

    case "native":
      throw new Error(
        "Native FTS should be handled by the vector store implementation"
      );

    default:
      throw new Error(`Unsupported full-text search provider: ${provider}`);
  }
}

/**
 * Get available full-text search providers
 */
export function getAvailableFTSProviders(): FullTextSearchProviderId[] {
  return ["flexsearch", "minisearch", "orama", "native"];
}

/**
 * Check if provider supports specific features
 */
export function getFTSProviderFeatures(provider: FullTextSearchProviderId): {
  supportsFilters: boolean;
  supportsBoost: boolean;
  supportsFuzzy: boolean;
  supportsPhonetic: boolean;
} {
  const features: Record<FullTextSearchProviderId, any> = {
    flexsearch: {
      supportsFilters: true,
      supportsBoost: true,
      supportsFuzzy: true,
      supportsPhonetic: true,
    },
    minisearch: {
      supportsFilters: true,
      supportsBoost: true,
      supportsFuzzy: true,
      supportsPhonetic: false,
    },
    orama: {
      supportsFilters: true,
      supportsBoost: true,
      supportsFuzzy: true,
      supportsPhonetic: false,
    },
    native: {
      supportsFilters: true,
      supportsBoost: false,
      supportsFuzzy: false,
      supportsPhonetic: false,
    },
  };

  return (
    features[provider] || {
      supportsFilters: false,
      supportsBoost: false,
      supportsFuzzy: false,
      supportsPhonetic: false,
    }
  );
}
