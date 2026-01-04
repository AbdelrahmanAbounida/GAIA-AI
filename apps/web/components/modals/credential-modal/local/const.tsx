export const RECOMMENDED_MODELS = [
  {
    name: "llama3.1:8b",
    desc: "Llama 3.1 8B - Better reasoning, efficient on mid-range machines",
    size: "4.7GB",
    recommended: true,
  },
  {
    name: "qwen2.5:7b",
    desc: "Qwen 2.5 7B - Strong reasoning and excellent coding",
    size: "4.7GB",
    recommended: true,
  },
  {
    name: "phi3:3.8b",
    desc: "Phi-3 Mini - Extremely efficient and lightweight",
    size: "2.2GB",
    recommended: true,
  },
  {
    name: "mistral:7b",
    desc: "Mistral 7B - Reliable and balanced",
    size: "4.1GB",
    recommended: true,
  },
];
export const RECOMMENDED_EMBEDDING_MODELS = [
  {
    name: "nomic-embed-text",
    desc: "Nomic Embed Text - High-quality general-purpose embeddings",
    size: "274MB",
    recommended: true,
  },
  {
    name: "bge-small",
    desc: "BGE Small - Fast, accurate, and lightweight for semantic search",
    size: "133MB",
    recommended: true,
  },
  {
    name: "all-minilm",
    desc: "MiniLM - Extremely efficient embeddings for local usage",
    size: "120MB",
    recommended: true,
  },
];

export const ADDITIONAL_EMBEDDING_MODELS = [
  {
    name: "bge-base",
    desc: "BGE Base - Better accuracy with moderate size",
    size: "400MB",
  },
  {
    name: "bge-large",
    desc: "BGE Large - High-quality embeddings, more memory usage",
    size: "1.2GB",
  },
  {
    name: "e5-small",
    desc: "E5 Small - Optimized for retrieval tasks",
    size: "110MB",
  },
  {
    name: "e5-base",
    desc: "E5 Base - Strong retrieval and semantic similarity",
    size: "420MB",
  },
];
export const ADDITIONAL_MODELS = [
  { name: "llama3.2", desc: "Meta Llama 3.2 - Latest", size: "4.7GB" },
  { name: "llama3.2:1b", desc: "Llama 3.2 1B - Lightweight", size: "1.3GB" },
  { name: "codellama", desc: "Code Llama - Code generation", size: "3.8GB" },
  { name: "gemma2", desc: "Google Gemma 2", size: "5.4GB" },
  { name: "deepseek-coder-v2", desc: "DeepSeek Coder V2", size: "8.9GB" },
];
export const EMBEDDING_MODELS = ["nomic-embed-text", "all-minilm", "bge-small"];
