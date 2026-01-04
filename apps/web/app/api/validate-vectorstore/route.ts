import { NextRequest, NextResponse } from "next/server";

// TODO:: remove :: Legacy
type VectorStoreProvider =
  | "pinecone"
  | "weaviate"
  | "lancedb"
  | "qdrant"
  | "chroma"
  | "milvus"
  | "pgvector"
  | "faiss";

interface ValidationConfig {
  endpoint: string;
  method: string;
  headers: (params: Record<string, string>) => Record<string, string>;
  validateResponse: (status: number, data?: any) => boolean;
  buildUrl: (baseUrl: string, params: Record<string, string>) => string;
}

const PROVIDER_CONFIGS: Record<VectorStoreProvider, ValidationConfig> = {
  pinecone: {
    endpoint: "/collections",
    method: "GET",
    headers: (params) => ({
      "Api-Key": params["pinecone-api-key"] || "",
      "Content-Type": "application/json",
    }),
    buildUrl: (baseUrl, params) => {
      // Pinecone uses index in the URL
      const index = params["pinecone-index"];
      return `https://${index}.pinecone.io${PROVIDER_CONFIGS.pinecone.endpoint}`;
    },
    validateResponse: (status) => status === 200,
  },
  weaviate: {
    endpoint: "/v1/meta",
    method: "GET",
    headers: (params) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (params["weaviate-api-key"]) {
        headers["Authorization"] = `Bearer ${params["weaviate-api-key"]}`;
      }
      return headers;
    },
    buildUrl: (baseUrl, params) => {
      const url = params["weaviate-url"] || baseUrl;
      return `${url.replace(/\/$/, "")}${PROVIDER_CONFIGS.weaviate.endpoint}`;
    },
    validateResponse: (status) => status === 200,
  },
  lancedb: {
    endpoint: "/v1/table",
    method: "GET",
    headers: (params) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (params["lancedb-api-key"]) {
        headers["x-api-key"] = params["lancedb-api-key"];
      }
      return headers;
    },
    buildUrl: (baseUrl, params) => {
      const uri = params["lancedb-uri"] || baseUrl || "http://localhost:8000";
      return `${uri.replace(/\/$/, "")}${PROVIDER_CONFIGS.lancedb.endpoint}`;
    },
    validateResponse: (status) => status === 200 || status === 404,
  },
  qdrant: {
    endpoint: "/collections",
    method: "GET",
    headers: (params) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (params["qdrant-api-key"]) {
        headers["api-key"] = params["qdrant-api-key"];
      }
      return headers;
    },
    buildUrl: (baseUrl, params) => {
      const url = params["qdrant-url"] || baseUrl;
      return `${url.replace(/\/$/, "")}${PROVIDER_CONFIGS.qdrant.endpoint}`;
    },
    validateResponse: (status) => status === 200,
  },
  chroma: {
    endpoint: "/api/v1/heartbeat",
    method: "GET",
    headers: (params) => ({
      "Content-Type": "application/json",
    }),
    buildUrl: (baseUrl, params) => {
      const host = params["chroma-host"] || "localhost";
      const port = params["chroma-port"] || "8000";
      const ssl = params["ssl"] === "true";
      const protocol = ssl ? "https" : "http";
      return `${protocol}://${host}:${port}${PROVIDER_CONFIGS.chroma.endpoint}`;
    },
    validateResponse: (status) => status === 200,
  },
  milvus: {
    endpoint: "/v1/vector/collections",
    method: "GET",
    headers: (params) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (params["milvus-token"]) {
        headers["Authorization"] = `Bearer ${params["milvus-token"]}`;
      } else if (params["milvus-username"] && params["milvus-password"]) {
        const credentials = Buffer.from(
          `${params["milvus-username"]}:${params["milvus-password"]}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
      }

      return headers;
    },
    buildUrl: (baseUrl, params) => {
      const url = params["milvus-url"] || baseUrl;
      return `${url.replace(/\/$/, "")}${PROVIDER_CONFIGS.milvus.endpoint}`;
    },
    validateResponse: (status) => status === 200,
  },
  pgvector: {
    endpoint: "/",
    method: "GET",
    headers: (params) => ({
      "Content-Type": "application/json",
    }),
    buildUrl: (baseUrl, params) => {
      // pgvector uses connection URL, not HTTP endpoint
      return params["pgvector-connection-url"] || baseUrl;
    },
    validateResponse: (status) => status === 200 || status === 404,
  },
  faiss: {
    endpoint: "/health",
    method: "GET",
    headers: (params) => ({
      "Content-Type": "application/json",
    }),
    buildUrl: (baseUrl, params) => {
      // FAISS is local-only, no URL needed
      return baseUrl || "local";
    },
    validateResponse: (status) => status === 200,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, ...params } = body;

    // Validate input
    if (!provider) {
      return NextResponse.json(
        {
          valid: false,
          error: "Provider is required",
        },
        { status: 400 }
      );
    }

    // Check if provider is supported
    if (!(provider in PROVIDER_CONFIGS)) {
      return NextResponse.json(
        {
          valid: false,
          error: `Unsupported provider: ${provider}. Supported: ${Object.keys(PROVIDER_CONFIGS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Special handling for local-only providers
    if (provider === "faiss") {
      return NextResponse.json({
        valid: true,
        message: "FAISS is local-only and doesn't require validation",
        provider,
      });
    }

    // Special handling for pgvector (PostgreSQL)
    if (provider === "pgvector") {
      return await validatePostgres(params);
    }

    const config = PROVIDER_CONFIGS[provider as VectorStoreProvider];

    // Build the test URL
    const testUrl = config.buildUrl("", params);

    // Validate required parameters based on provider
    const validationResult = validateRequiredParams(provider, params);
    if (!validationResult.valid) {
      return NextResponse.json({
        valid: false,
        error: validationResult.error,
        provider,
      });
    }

    // Make validation request
    const response = await fetch(testUrl, {
      method: config.method,
      headers: config.headers(params),
      signal: AbortSignal.timeout(10000),
    });

    const responseData = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json().catch(() => null)
      : null;

    // Validate based on provider-specific logic
    const isValid = config.validateResponse(response.status, responseData);

    if (isValid) {
      return NextResponse.json({
        valid: true,
        message: `Successfully connected to ${provider}`,
        provider,
      });
    }

    // Handle specific error codes
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        valid: false,
        error: "Invalid API key or unauthorized access",
        provider,
      });
    }

    if (response.status === 404) {
      return NextResponse.json({
        valid: false,
        error: "Endpoint not found - check your URL/index configuration",
        provider,
      });
    }

    return NextResponse.json({
      valid: false,
      error: `Validation failed with status ${response.status}`,
      provider,
    });
  } catch (err) {
    const error = err as Error;

    if (error.name === "AbortError") {
      return NextResponse.json({
        valid: false,
        error: "Request timeout - check your URL and network connectivity",
      });
    }

    return NextResponse.json({
      valid: false,
      error: error.message || "Failed to validate credentials",
    });
  }
}

function validateRequiredParams(
  provider: string,
  params: Record<string, string>
): { valid: boolean; error?: string } {
  switch (provider) {
    case "pinecone":
      if (!params["pinecone-api-key"] || !params["pinecone-index"]) {
        return {
          valid: false,
          error: "Pinecone API Key and Index are required",
        };
      }
      break;
    case "qdrant":
      if (!params["qdrant-url"]) {
        return { valid: false, error: "Qdrant URL is required" };
      }
      break;
    case "chroma":
      if (!params["chroma-host"]) {
        return { valid: false, error: "Chroma host is required" };
      }
      break;
    case "milvus":
      if (!params["milvus-url"] || !params["milvus-collection"]) {
        return {
          valid: false,
          error: "Milvus URL and Collection Name are required",
        };
      }
      break;
    case "pgvector":
      if (!params["pgvector-connection-url"] || !params["pgvector-table"]) {
        return {
          valid: false,
          error: "Connection URL and Table Name are required",
        };
      }
      break;
    case "weaviate":
      if (!params["weaviate-url"] || !params["weaviate-collection"]) {
        return {
          valid: false,
          error: "Weaviate URL and Collection Name are required",
        };
      }
      break;
  }

  return { valid: true };
}

async function validatePostgres(params: Record<string, string>) {
  try {
    const connectionUrl = params["pgvector-connection-url"];

    if (!connectionUrl) {
      return NextResponse.json({
        valid: false,
        error: "Connection URL is required for pgvector",
      });
    }

    // Basic validation of connection string format
    const urlPattern = /^postgresql:\/\/.+/;
    if (!urlPattern.test(connectionUrl)) {
      return NextResponse.json({
        valid: false,
        error: "Invalid PostgreSQL connection URL format",
      });
    }

    // Note: For actual database connection validation, you would need
    // to use a PostgreSQL client library on the server side
    return NextResponse.json({
      valid: true,
      message: "PostgreSQL connection URL format is valid",
      note: "Actual database connection will be tested when querying",
    });
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: "PostgreSQL validation failed",
    });
  }
}
