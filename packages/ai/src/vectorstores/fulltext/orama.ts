import {
  create,
  insert,
  search as oramaSearch,
  remove,
  count,
  save as oramaSave,
  load,
} from "@orama/orama";
import type { Orama, Results, SearchParams } from "@orama/orama";
import * as fs from "fs/promises";
import * as path from "path";
import { BaseFullTextSearch } from "./base";
import type {
  FullTextSearchConfig,
  FullTextSearchResult,
  FullTextSearchOptions,
} from "./types";
import { Document } from "@langchain/core/documents";

export interface OramaConfig extends FullTextSearchConfig {
  schema?: Record<string, any>;
  components?: {
    tokenizer?: any;
    sorter?: any;
  };
}

/**
 * Orama full-text search implementation
 */
export class OramaFullTextSearch extends BaseFullTextSearch {
  private db: Orama<any> | null = null;
  private schema: Record<string, any>;

  constructor(config: OramaConfig) {
    super(config);
    this.schema = config.schema || this.getDefaultSchema();
  }

  /**
   * Get default Orama schema
   */
  private getDefaultSchema(): Record<string, any> {
    return {
      id: "string",
      content: "string",
      metadata: {
        source: "string",
        timestamp: "string",
        indexedAt: "string",
      },
    };
  }

  protected async indexExists(): Promise<boolean> {
    try {
      const indexPath = this.getIndexPath();
      await fs.access(indexPath);
      return true;
    } catch {
      return false;
    }
  }

  protected async loadIndex(): Promise<void> {
    try {
      const indexPath = this.getIndexPath();
      const indexData = await fs.readFile(indexPath, "utf-8");
      const savedIndex = JSON.parse(indexData);

      this.db = await create({
        schema: this.schema,
        language: (this.config as OramaConfig).components?.tokenizer,
      });

      await load(this.db, savedIndex);
    } catch (error) {
      throw this.handleError("load index", error);
    }
  }

  protected async createIndex(): Promise<void> {
    try {
      // FIXED: Added await keyword
      this.db = create({
        schema: this.schema,
        language: this.config.language || "english",
        // components: (this.config as OramaConfig).components, // TODO:: recheck
      });

      // Ensure persist directory exists
      await fs.mkdir(this.persistPath, { recursive: true });
    } catch (error) {
      throw this.handleError("create index", error);
    }
  }

  protected async indexDocuments(
    documents: Document[],
    ids: string[]
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        await insert(this.db, {
          id: ids[i],
          content: doc.pageContent,
          metadata: doc.metadata,
        });
      }
    } catch (error) {
      throw this.handleError("index documents", error);
    }
  }

  async search(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const searchParams: SearchParams<Orama<any>> = {
        term: query,
        limit: options?.topK || 10,
        threshold: options?.minScore || 0,
      };

      if (options?.filters) {
        searchParams.where = options.filters;
      }

      if (options?.boost) {
        searchParams.boost = options.boost;
      }

      const results: Results<any> = await oramaSearch(this.db, searchParams);

      return results.hits.map((hit: any) => ({
        id: hit.document.id,
        content: hit.document.content,
        metadata: hit.document.metadata,
        score: hit.score,
      }));
    } catch (error) {
      throw this.handleError("search", error);
    }
  }

  async delete(ids: string[]): Promise<void> {
    this.ensureInitialized();

    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      for (const id of ids) {
        await remove(this.db, id);
      }
      await this.save();
    } catch (error) {
      throw this.handleError("delete documents", error);
    }
  }

  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      // Recreate the index to clear all data
      await this.createIndex();
      await this.save();
    } catch (error) {
      throw this.handleError("clear index", error);
    }
  }

  async save(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const savedIndex = await oramaSave(this.db);
      const indexPath = this.getIndexPath();

      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      await fs.writeFile(
        indexPath,
        JSON.stringify(savedIndex, null, 2),
        "utf-8"
      );
    } catch (error) {
      throw this.handleError("save index", error);
    }
  }

  protected async getDocumentCount(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      return await count(this.db);
    } catch (error) {
      console.error("Error getting document count:", error);
      return 0;
    }
  }

  /**
   * Get the full path to the index file
   */
  private getIndexPath(): string {
    return path.join(
      "data",
      "vector_stores",
      "orama",
      this.persistPath,
      `${this.indexName}.json`
    );
  }

  /**
   * Get the underlying Orama database instance
   */
  getDatabase(): Orama<any> | null {
    return this.db;
  }
}
