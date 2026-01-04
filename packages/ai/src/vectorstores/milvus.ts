import {
  MilvusClient,
  DataType,
  IndexType,
  MetricType,
  type ClientConfig,
} from "@zilliz/milvus2-sdk-node";
import { Document } from "@langchain/core/documents";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { BaseVectorStore, VectorStoreErrorHandler } from "./base";
import type {
  VectorStoreConfig,
  SearchResult,
  SearchOptions,
  FullTextSearchOptions,
  FullTextSearchResult,
  HybridSearchOptions,
} from "./types";
import type { Embeddings } from "@langchain/core/embeddings";

export interface MilvusConfig extends VectorStoreConfig {
  address?: string;
  url?: string;
  token?: string;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  enableFullTextSearch?: boolean;
  collection?: string;
  dropOld?: boolean;
  consistencyLevel?: "Strong" | "Session" | "Bounded" | "Eventually";
}

/**
 * Helper function to sanitize IDs by removing hyphens
 * Milvus doesn't handle hyphens well in filter expressions
 */
function sanitizeId(id: string): string {
  return id.replace(/-/g, "");
}

export class MilvusVectorStore extends BaseVectorStore {
  private client: MilvusClient;
  private collectionName: string;
  private enableFullText: boolean;
  private vectorDimension: number = 0;
  private isCloudMode: boolean;
  private dropOld: boolean;
  private consistencyLevel: string;

  constructor(config: MilvusConfig) {
    super(config);

    if (!config.address && !config.url) {
      throw new Error("Either 'address' or 'url' must be provided");
    }

    this.collectionName =
      config.tableName || config.collection || "default_collection";
    this.dropOld = config.dropOld ?? false;
    this.consistencyLevel = config.consistencyLevel || "Strong";

    const address = this.parseAddress(config.address || config.url!);

    // Detect cloud mode
    const hasCloudToken = !!config.token;
    const isCloudUrl =
      address.includes("cloud.zilliz.com") ||
      address.includes("cloud.milvus.io");
    this.isCloudMode = hasCloudToken || isCloudUrl;

    // Build minimal client config
    const clientConfig: ClientConfig = {
      address,
    };

    // Authentication
    if (config.token) {
      clientConfig.token = config.token;
    } else if (config.username && config.password) {
      clientConfig.username = config.username;
      clientConfig.password = config.password;
    } else if (!this.isCloudMode) {
      clientConfig.username = "root";
      clientConfig.password = "Milvus";
    }

    // Database - only set if explicitly provided
    if (config.database && config.database.trim() !== "") {
      clientConfig.database = config.database;
    }

    // SSL
    if (config.ssl === true || config.ssl === false) {
      clientConfig.ssl = config.ssl;
    } else if (this.isCloudMode) {
      clientConfig.ssl = true;
    }

    console.log("🔧 Milvus client config:", {
      address: clientConfig.address,
      hasToken: !!clientConfig.token,
      hasCredentials: !!(clientConfig.username && clientConfig.password),
      ssl: clientConfig.ssl,
      database: clientConfig.database || "default",
      collection: this.collectionName,
      dropOld: this.dropOld,
    });

    this.client = new MilvusClient(clientConfig);
    this.enableFullText = config.enableFullTextSearch === true;
  }

  private parseAddress(addressOrUrl: string): string {
    let address = addressOrUrl
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    if (
      !address.includes(":") &&
      !address.includes("cloud.zilliz.com") &&
      !address.includes("cloud.milvus.io")
    ) {
      address = `${address}:19530`;
    }

    return address;
  }

  /**
   * Safely parse dimension from various types
   */
  private parseDimension(dim: any): number {
    if (typeof dim === "number") {
      return dim;
    }
    if (typeof dim === "string") {
      const parsed = parseInt(dim, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    throw new Error(`Invalid dimension value: ${dim}`);
  }

  static getClientConfig(config: Record<string, any>): ClientConfig {
    const address = config.address || config.url;
    if (!address) {
      throw new Error("Address or URL is required");
    }

    const clientConfig: ClientConfig = {
      address,
    };

    if (config.token) {
      clientConfig.token = config.token;
    } else if (config.username && config.password) {
      clientConfig.username = config.username;
      clientConfig.password = config.password;
    }

    if (config.ssl === true || config.ssl === false) {
      clientConfig.ssl = config.ssl;
    }

    if (config.database && config.database.trim() !== "") {
      clientConfig.database = config.database;
    }

    return clientConfig;
  }

  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      const clientConfig = MilvusVectorStore.getClientConfig(config);

      const client = new MilvusClient(clientConfig);
      await client.listCollections();

      console.log("✅ Milvus connection validated");
      return true;
    } catch (err) {
      console.error("❌ Milvus validation failed:", err);
      return VectorStoreErrorHandler.handleError(
        "validate connection",
        err,
        false
      );
    }
  }

  supportsFullTextSearch(): boolean {
    return false;
  }

  protected async storeExists(): Promise<boolean> {
    try {
      const res = await this.client.hasCollection({
        collection_name: this.collectionName,
      });
      return res.value === true;
    } catch (error) {
      console.error("Error checking collection:", error);
      return false;
    }
  }

  protected async loadStore(): Promise<void> {
    try {
      console.log(`📂 Loading collection: ${this.collectionName}`);

      const desc = await this.client.describeCollection({
        collection_name: this.collectionName,
      });

      // Find vector field with multiple fallbacks
      const vectorField = desc.schema.fields.find(
        (field: any) =>
          field.data_type === DataType.FloatVector ||
          field.data_type === DataType.Float16Vector ||
          field.data_type === DataType.BFloat16Vector ||
          field.name === "vector"
      );

      if (!vectorField) {
        throw new Error(
          `No vector field found. Available fields: ${desc.schema.fields
            .map((f: any) => f.name)
            .join(", ")}`
        );
      }

      // Safely parse dimension (handles both string and number)
      if (vectorField.dim === undefined || vectorField.dim === null) {
        throw new Error(
          `Vector field "${vectorField.name}" has no dimension property`
        );
      }

      this.vectorDimension = this.parseDimension(vectorField.dim);

      // Load collection into memory
      await this.client.loadCollection({
        collection_name: this.collectionName,
      });

      console.log(
        `✅ Collection loaded (field: ${vectorField.name}, dim: ${this.vectorDimension})`
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("load collection", error);
    }
  }

  protected async createStore(): Promise<void> {
    try {
      console.log(`🆕 Creating collection: ${this.collectionName}`);

      const sampleEmbedding = await this.config.embeddings.embedQuery("sample");
      this.vectorDimension = sampleEmbedding.length;

      await this.createSimpleCollection();
      console.log(`✅ Collection created successfully`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("create collection", error);
    }
  }

  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    try {
      console.log(`🆕 Creating collection with ${documents.length} docs`);

      if (documents.length > 0) {
        const embedding = await this.config.embeddings.embedQuery(
          documents[0].pageContent
        );
        this.vectorDimension = embedding.length;
      } else {
        const embedding = await this.config.embeddings.embedQuery("sample");
        this.vectorDimension = embedding.length;
      }

      await this.createSimpleCollection();

      if (documents.length > 0) {
        await this.insertDocuments(documents);
      }

      console.log(`✅ Collection created with documents`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "create collection with docs",
        error
      );
    }
  }

  private async createSimpleCollection(): Promise<void> {
    const fields = [
      {
        name: "id",
        data_type: DataType.Int64,
        is_primary_key: true,
        autoID: true,
      },
      {
        name: "vector",
        data_type: DataType.FloatVector,
        dim: this.vectorDimension,
      },
      {
        name: "text",
        data_type: DataType.VarChar,
        max_length: 65535,
      },
      {
        name: "metadata",
        data_type: DataType.JSON,
      },
    ];

    const index_params = [
      {
        field_name: "vector",
        index_type: IndexType.AUTOINDEX,
        metric_type: MetricType.COSINE,
      },
    ];

    console.log("📝 Creating collection with schema:", {
      collection_name: this.collectionName,
      vector_dim: this.vectorDimension,
      fields: fields.length,
    });

    await this.client.createCollection({
      collection_name: this.collectionName,
      schema: fields,
      index_params: index_params,
    });

    await this.client.loadCollection({
      collection_name: this.collectionName,
    });

    console.log("✅ Collection created and loaded");
  }

  private async insertDocuments(documents: Document[]): Promise<string[]> {
    if (documents.length === 0) return [];

    try {
      console.log(`📝 Inserting ${documents.length} documents...`);

      const texts = documents.map((doc) => doc.pageContent);
      const embeddings = await this.config.embeddings.embedDocuments(texts);

      const data = documents.map((doc, i) => ({
        vector: embeddings[i],
        text: doc.pageContent,
        metadata: doc.metadata || {},
      }));

      const res = await this.client.insert({
        collection_name: this.collectionName,
        data,
      });

      const count = typeof res.insert_cnt === "number" ? res.insert_cnt : 0;
      console.log(`✅ Inserted ${count} documents`);

      return Array.from({ length: count }, (_, i) => i.toString());
    } catch (error) {
      console.error("❌ Insert failed:", error);
      throw VectorStoreErrorHandler.handleError("insert documents", error);
    }
  }

  async addDocuments(
    documents: Document[],
    ids?: string[]
  ): Promise<string[] | void> {
    this.ensureInitialized();

    if (documents.length === 0) return [];

    try {
      const normalized = this.normalizeDocuments(documents);
      return await this.insertDocuments(normalized);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("add documents", error);
    }
  }

  async addTexts(
    texts: string[],
    metadatas?: Record<string, any>[],
    ids?: string[]
  ): Promise<string[] | void> {
    this.ensureInitialized();

    if (texts.length === 0) return [];

    try {
      console.log(`📝 Adding ${texts.length} texts with custom IDs...`);

      // Sanitize IDs if provided
      const sanitizedIds = ids?.map((id) => sanitizeId(id));

      console.log("Original IDs:", ids?.slice(0, 3));
      console.log("Sanitized IDs:", sanitizedIds?.slice(0, 3));

      const embeddings = await this.config.embeddings.embedDocuments(texts);

      const data = texts.map((text, i) => ({
        vector: embeddings[i],
        text: text,
        metadata: metadatas?.[i] || {},
      }));

      const res = await this.client.insert({
        collection_name: this.collectionName,
        data,
      });

      const count = typeof res.insert_cnt === "number" ? res.insert_cnt : 0;
      console.log(`✅ Inserted ${count} texts`);

      // Return sanitized IDs if provided, otherwise return generated IDs
      return (
        sanitizedIds || Array.from({ length: count }, (_, i) => i.toString())
      );
    } catch (error) {
      console.error("❌ Add texts failed:", error);
      throw VectorStoreErrorHandler.handleError("add texts", error);
    }
  }

  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      const queryEmbedding = await this.config.embeddings.embedQuery(query);

      const searchParams: any = {
        collection_name: this.collectionName,
        data: [queryEmbedding],
        anns_field: "vector",
        limit: topK,
        output_fields: ["text", "metadata"],
        params: { nprobe: 10 },
      };

      if (options?.filter) {
        searchParams.filter = this.buildFilterExpression(options.filter);
      }

      const results = await this.client.search(searchParams);

      return results.results
        .map((result: any) => ({
          content: result.text,
          metadata: result.metadata || {},
          score: result.score,
        }))
        .filter(
          (result: SearchResult) => !minScore || result.score >= minScore
        );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  async fullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    throw new Error(
      "Full-text search not available. Use vector search instead."
    );
  }

  async hybridSearch(
    query: string,
    options?: HybridSearchOptions
  ): Promise<FullTextSearchResult[]> {
    throw new Error("Hybrid search not available. Use vector search instead.");
  }

  async searchWithFilter(
    query: string,
    filter: Record<string, any>,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    return this.search(query, { ...options, filter });
  }

  private buildFilterExpression(filter: Record<string, any>): string {
    const conditions = Object.entries(filter).map(([key, value]) => {
      if (typeof value === "string") {
        return `metadata["${key}"] == "${value}"`;
      } else if (typeof value === "number") {
        return `metadata["${key}"] == ${value}`;
      } else if (Array.isArray(value)) {
        const vals = value
          .map((v) => (typeof v === "string" ? `"${v}"` : v))
          .join(", ");
        return `metadata["${key}"] in [${vals}]`;
      }
      return "";
    });

    return conditions.filter(Boolean).join(" && ");
  }

  async delete(ids: string[], documentId?: string): Promise<void> {
    console.log(`🗑️ Deleting ${ids.length} documents...`);

    let store = this.store;
    if (!store) {
      const clientConfig = MilvusVectorStore.getClientConfig(this.config);
      store = await Milvus.fromDocuments([], this.config.embeddings, {
        collectionName: this.collectionName!,
        clientConfig: {
          ...clientConfig,
        },
      });
    }
    try {
      await store.delete({
        filter: `metadata["documentId"] in ${JSON.stringify([documentId])}`,
      });
    } catch (error) {
      console.error("❌ Delete operation failed:", error);
      throw VectorStoreErrorHandler.handleError("delete", error);
    }
  }

  async save(): Promise<void> {
    return Promise.resolve();
  }

  async getStats() {
    const baseStats = await super.getStats();
    return {
      ...baseStats,
      provider: "milvus",
      mode: this.isCloudMode ? "cloud" : "local",
      collectionName: this.collectionName,
      vectorDimension: this.vectorDimension,
    };
  }

  protected normalizeDocuments(documents: Document[]): Document[] {
    return documents.map(
      (doc) =>
        new Document({
          pageContent: doc.pageContent || "",
          metadata: doc.metadata || {},
        })
    );
  }

  async deleteCollection(): Promise<void> {
    try {
      await this.client.dropCollection({
        collection_name: this.collectionName,
      });
      this.store = null;
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete collection", error);
    }
  }

  async close(): Promise<void> {
    await super.close();
  }

  protected getResultKey(result: SearchResult | FullTextSearchResult): string {
    return result.metadata?.id || result.content.substring(0, 100);
  }

  async initialize(): Promise<void> {
    try {
      console.log("✅ Initializing milvus vector store...");

      const exists = await this.storeExists();

      if (exists) {
        if (this.dropOld) {
          console.log("🗑️ Dropping existing collection (dropOld=true)...");
          await this.deleteCollection();
          await this.createStore();
        } else {
          try {
            await this.loadStore();
          } catch (loadError) {
            console.warn(
              "⚠️ Failed to load existing collection, recreating...",
              loadError
            );
            await this.deleteCollection();
            await this.createStore();
          }
        }
      } else {
        await this.createStore();
      }

      console.log("✅ Vector store initialized successfully");
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "initialize vector store",
        error,
        undefined,
        this.config
      );
    }
  }

  static async fromDocuments(
    documents: Document[],
    embeddings: Embeddings,
    config: Omit<MilvusConfig, "embeddings">
  ): Promise<MilvusVectorStore> {
    const store = new MilvusVectorStore({
      ...config,
      embeddings,
      dropOld: config.dropOld ?? true,
      collection: config.collectionName,
      persistDirectory: config.persistDirectory,
      provider: config.provider,
    });

    const exists = await store.storeExists();

    if (exists && store.dropOld) {
      await store.deleteCollection();
    }

    if (!exists || store.dropOld) {
      await store.createStoreWithDocuments(documents);
    } else {
      await store.loadStore();
      if (documents.length > 0) {
        await store.addDocuments(documents);
      }
    }

    return store;
  }

  async inspectCollection(): Promise<void> {
    try {
      const desc = await this.client.describeCollection({
        collection_name: this.collectionName,
      });

      console.log("🔍 Collection Schema:");
      console.log("Name:", desc.collection_name);
      console.log("Fields:");
      desc.schema.fields.forEach((field: any) => {
        console.log(
          `  - ${field.name}: ${field.data_type}`,
          field.dim ? `(dim: ${field.dim})` : ""
        );
      });
    } catch (error) {
      console.error("Inspection failed:", error);
    }
  }
}
