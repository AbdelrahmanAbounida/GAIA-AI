"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      openProjectSheet: "",
      setOpenProjectSheet: (id) => set({ openProjectSheet: id }),

      currentLocalProviderView: "main",
      setCurrentLocalProviderView: (view) =>
        set({ currentLocalProviderView: view }),

      activeProjectId: null,
      settings: {
        defaultLLM: "openai/gpt-4o",
        defaultEmbedding: "openai/text-embedding-3-small",
        theme: "dark",
      },

      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    {
      name: "rag-app-storage",
    }
  )
);
