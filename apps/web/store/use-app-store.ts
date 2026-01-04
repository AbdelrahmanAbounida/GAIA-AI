"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// TODO:: clean
export interface Project {
  id: string;
  name: string;
  description?: string;
  llmProvider: string;
  llmModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  vectorStore: string;
  reranker: string;
  searchType: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  useReranker: boolean;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Credential {
  id: string;
  provider: string;
  apiKey: string;
  isValid: boolean;
  addedAt: string;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: "connected" | "disconnected" | "error";
  tools: string[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: "builtin" | "custom" | "mcp";
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface Optimization {
  name: string;
  runId?: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt?: Date;
  progress?: number;
  trials?: number;
  bestScore?: number;
}

interface AppState {
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;

  openProjectSheet: string;
  setOpenProjectSheet: (id: string) => void;

  // tab views in credential (local providers)
  currentLocalProviderView: "main" | "ollama" | "openai-compatible";
  setCurrentLocalProviderView: (
    view: "main" | "ollama" | "openai-compatible"
  ) => void;

  // Legacy
  projects: Project[];
  credentials: Credential[];
  mcpServers: MCPServer[];
  tools: Tool[];
  settings: {
    defaultLLM: string;
    defaultEmbedding: string;
    theme: "dark" | "light";
  };
  optimizations: Optimization[];

  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addCredential: (credential: Credential) => void;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  addMCPServer: (server: MCPServer) => void;
  updateMCPServer: (id: string, updates: Partial<MCPServer>) => void;
  deleteMCPServer: (id: string) => void;
  addTool: (tool: Tool) => void;
  updateTool: (id: string, updates: Partial<Tool>) => void;
  deleteTool: (id: string) => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;

  // optimiation
  addOptimization: (optimization: Optimization) => void;
  addDemoOptimization: () => void;
  deleteOptimization: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      openProjectSheet: "",
      setOpenProjectSheet: (id) => set({ openProjectSheet: id }),

      currentLocalProviderView: "main",
      setCurrentLocalProviderView: (view) =>
        set({ currentLocalProviderView: view }),

      optimizations: [],
      projects: [],
      activeProjectId: null,
      credentials: [],
      mcpServers: [],
      tools: [
        {
          id: "web-search",
          name: "Web Search",
          description: "Search the web for information",
          type: "builtin",
          enabled: true,
        },
        {
          id: "calculator",
          name: "Calculator",
          description: "Perform mathematical calculations",
          type: "builtin",
          enabled: true,
        },
      ],
      settings: {
        defaultLLM: "openai/gpt-4o",
        defaultEmbedding: "openai/text-embedding-3-small",
        theme: "dark",
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId:
            state.activeProjectId === id ? null : state.activeProjectId,
        })),

      addCredential: (credential) =>
        set((state) => ({
          credentials: [...state.credentials, credential],
        })),

      updateCredential: (id, updates) =>
        set((state) => ({
          credentials: state.credentials.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCredential: (id) =>
        set((state) => ({
          credentials: state.credentials.filter((c) => c.id !== id),
        })),

      addMCPServer: (server) =>
        set((state) => ({
          mcpServers: [...state.mcpServers, server],
        })),

      updateMCPServer: (id, updates) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteMCPServer: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.filter((s) => s.id !== id),
        })),

      addTool: (tool) =>
        set((state) => ({
          tools: [...state.tools, tool],
        })),

      updateTool: (id, updates) =>
        set((state) => ({
          tools: state.tools.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTool: (id) =>
        set((state) => ({
          tools: state.tools.filter((t) => t.id !== id),
        })),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      addOptimization: (optimization) =>
        set((state) => ({
          optimizations: [...state.optimizations, optimization],
        })),

      deleteOptimization: (id) =>
        set((state) => ({
          optimizations: state.optimizations.filter((o) => o.runId !== id),
        })),
      addDemoOptimization: () =>
        set((state) => ({
          optimizations: [
            {
              name: "Demo Optimization",
              status: "pending",
              runId: "demo-optimization",
              createdAt: new Date(),
              progress: 30,
              trials: 10,
              bestScore: 0.8,
            },
            ...state.optimizations,
          ],
        })),
    }),
    {
      name: "rag-app-storage",
    }
  )
);
