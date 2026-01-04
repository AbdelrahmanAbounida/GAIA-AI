import { Document } from "@langchain/core/documents";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import * as fs from "fs/promises";
import * as path from "path";
import { BaseVectorStore, VectorStoreErrorHandler } from "./base";
import type { VectorStoreConfig, SearchResult, SearchOptions } from "./types";

/**
 * FAISS vector store implementation
 */
export class FaissVectorStore extends BaseVectorStore {
  constructor(config: VectorStoreConfig) {
    super(config);
  }

  protected async storeExists(): Promise<boolean> {
    try {
      const indexFile = path.join(this.persistPath, "faiss.index");
      await fs.access(indexFile);
      return true;
    } catch {
      return false;
    }
  }

  protected async loadStore(): Promise<void> {
    this.store = await FaissStore.load(
      this.persistPath,
      this.config.embeddings
    );
  }

  protected async createStore(): Promise<void> {
    await fs.mkdir(this.persistPath, { recursive: true });

    const dummyDoc = new Document({
      pageContent: "Initialization document",
      metadata: { type: "init" },
    });

    this.store = await FaissStore.fromDocuments(
      [dummyDoc],
      this.config.embeddings
    );
    await (this.store as FaissStore).save(this.persistPath);

    try {
      await this.store.delete({ ids: ["0"] });
    } catch {
      // Ignore deletion errors
    }
  }

  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    this.store = await FaissStore.fromDocuments(
      documents,
      this.config.embeddings
    );
    await this.save();
  }

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const { topK = 5, minScore = 0 } = options;

    try {
      const results =
        (await this.store?.similaritySearchWithScore(query, topK)) || [];

      return results
        .filter(([_, score]) => score >= minScore)
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score,
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search documents", error);
    }
  }

  async save(): Promise<void> {
    this.ensureInitialized();

    try {
      await (this.store as FaissStore).save(this.persistPath);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("save index", error);
    }
  }
}
