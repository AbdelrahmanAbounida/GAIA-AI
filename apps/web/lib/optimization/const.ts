export const ALL_VECTOR_STORES = [
  {
    id: "faiss",
    name: "FAISS",
    description: "Local vector store, fast and efficient",
  },
  {
    id: "chroma",
    name: "Chroma",
    description: "Open-source embedding database",
  },
  { id: "pinecone", name: "Pinecone", description: "Managed vector database" },
  { id: "weaviate", name: "Weaviate", description: "Vector search engine" },
];

export const ALL_SEARCH_TYPES = [
  { id: "similarity", name: "Similarity Search" },
  { id: "mmr", name: "MMR (Maximal Marginal Relevance)" },
  { id: "hybrid", name: "Hybrid Search" },
];
