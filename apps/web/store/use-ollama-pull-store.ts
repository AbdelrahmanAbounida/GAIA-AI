import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PullProgress {
  modelName: string;
  progress: number;
  status: string;
  total?: number;
  completed?: number;
  error?: string;
  startedAt: number;
}
export interface OllamaPullState {
  activePulls: PullProgress[];
  addPull: (modelName: string) => void;
  updatePull: (modelName: string, updates: Partial<PullProgress>) => void;
  removePull: (modelName: string) => void;
  getPull: (modelName: string) => PullProgress | undefined;
}

export const useOllamaPullStore = create<OllamaPullState>()(
  persist(
    (set, get) => ({
      activePulls: [],

      addPull: (modelName: string) => {
        const existing = get().activePulls.find(
          (p) => p.modelName === modelName
        );
        if (existing) return;

        set((state) => ({
          activePulls: [
            ...state.activePulls,
            {
              modelName,
              progress: 0,
              status: "starting",
              startedAt: Date.now(),
            },
          ],
        }));
      },

      updatePull: (modelName: string, updates: Partial<PullProgress>) => {
        set((state) => ({
          activePulls: state.activePulls.map((p) =>
            p.modelName === modelName ? { ...p, ...updates } : p
          ),
        }));
      },

      removePull: (modelName: string) => {
        set((state) => ({
          activePulls: state.activePulls.filter(
            (p) => p.modelName !== modelName
          ),
        }));
      },

      getPull: (modelName: string) => {
        return get().activePulls.find((p) => p.modelName === modelName);
      },
    }),
    {
      name: "ollama-pull-storage",
    }
  )
);
