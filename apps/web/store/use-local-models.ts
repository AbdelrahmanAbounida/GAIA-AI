import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ConfirmDialogProps = {
  open: boolean;
  modelName: string;
  isInstalled: boolean;
};

export type ActiveLocalModelsViewTab = "all" | "ollama" | "openai-compatible";

export interface PullProgress {
  modelName: string;
  progress: number;
  status: string;
  total?: number;
  completed?: number;
  error?: string;
  startedAt: number;
}

interface LocalModelStore {
  // dialog
  confirmDownloadDialog: ConfirmDialogProps;
  setConfirmDownLoadModel: (props: ConfirmDialogProps) => void;

  // tabs
  currentActiveTab: ActiveLocalModelsViewTab;
  setCurrentActiveTab: (tab: ActiveLocalModelsViewTab) => void;

  // global search
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchResults: any[];
  setSearchResults: (list: any[]) => void;

  // ollama
  ollamaSearch: string;
  setOllamaSearch: (v: string) => void;
  customOllamaSearch: string;
  setCustomOllamaSearch: (v: string) => void;
  showCustomSearch: boolean;
  setShowCustomSearch: (v: boolean) => void;

  // openai compatible
  openaiName: string;
  setOpenaiName: (v: string) => void;
  openaiUrl: string;
  setOpenaiUrl: (v: string) => void;
  openaiKey: string;
  setOpenaiKey: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  addingOpenAICompatible: boolean;
  setAddingOpenAICompatible: (v: boolean) => void;

  // pull state management
  // activePulls: Map<string, PullProgress>;
  // setActivePulls: (
  //   fn: (prev: Map<string, PullProgress>) => Map<string, PullProgress>
  // ) => void;
  // updatePullProgress: (modelName: string, progress: PullProgress) => void;
  // removePull: (modelName: string) => void;
  // clearAllPulls: () => void;
  // getPullProgress: (modelName: string) => PullProgress | undefined;
  // isPulling: (modelName: string) => boolean;
}

export const useLocalModelStore = create<LocalModelStore>()(
  persist(
    (set, get) => ({
      // dialog
      confirmDownloadDialog: { open: false, modelName: "", isInstalled: false },
      setConfirmDownLoadModel: (props) => set({ confirmDownloadDialog: props }),

      // tabs
      currentActiveTab: "all",
      setCurrentActiveTab: (tab) => set({ currentActiveTab: tab }),

      // global search
      searchQuery: "",
      setSearchQuery: (v) => set({ searchQuery: v }),
      searchResults: [],
      setSearchResults: (list) => set({ searchResults: list }),

      // ollama
      ollamaSearch: "",
      setOllamaSearch: (v) => set({ ollamaSearch: v }),
      customOllamaSearch: "",
      setCustomOllamaSearch: (v) => set({ customOllamaSearch: v }),
      showCustomSearch: false,
      setShowCustomSearch: (v) => set({ showCustomSearch: v }),

      // openai compatible
      openaiName: "",
      setOpenaiName: (v) => set({ openaiName: v }),
      openaiUrl: "",
      setOpenaiUrl: (v) => set({ openaiUrl: v }),
      openaiKey: "",
      setOpenaiKey: (v) => set({ openaiKey: v }),
      showPassword: false,
      setShowPassword: (v) => set({ showPassword: v }),
      addingOpenAICompatible: false,
      setAddingOpenAICompatible: (v) => set({ addingOpenAICompatible: v }),

      // pull state management
      // activePulls: new Map(),
      // setActivePulls: (fn) =>
      //   set((state) => ({ activePulls: fn(state.activePulls) })),
      // updatePullProgress: (modelName, progress) =>
      //   set((state) => {
      //     const newPulls = new Map(state.activePulls);
      //     newPulls.set(modelName, progress);
      //     return { activePulls: newPulls };
      //   }),

      // removePull: (modelName) =>
      //   set((state) => {
      //     const newPulls = new Map(state.activePulls);
      //     newPulls.delete(modelName);
      //     return { activePulls: newPulls };
      //   }),

      // clearAllPulls: () => set({ activePulls: new Map() }),

      // getPullProgress: (modelName) => get().activePulls.get(modelName),

      // isPulling: (modelName) => get().activePulls.has(modelName),
    }),
    {
      name: "local-model-store",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const parsed = JSON.parse(str);

            if (parsed.state?.activePulls) {
              if (Array.isArray(parsed.state.activePulls)) {
                parsed.state.activePulls = new Map(parsed.state.activePulls);
              } else if (typeof parsed.state.activePulls === "object") {
                parsed.state.activePulls = new Map(
                  Object.entries(parsed.state.activePulls)
                );
              }
            } else {
              parsed.state.activePulls = new Map();
            }

            return JSON.stringify(parsed);
          } catch (e) {
            console.error("Failed to parse persisted state:", e);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const parsed = JSON.parse(value);

            if (parsed.state?.activePulls instanceof Map) {
              parsed.state.activePulls = Array.from(
                parsed.state.activePulls.entries()
              );
            }

            localStorage.setItem(name, JSON.stringify(parsed));
          } catch (e) {
            console.error("Failed to persist state:", e);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as any),
        };

        if (merged.activePulls && !(merged.activePulls instanceof Map)) {
          if (Array.isArray(merged.activePulls)) {
            merged.activePulls = new Map(merged.activePulls);
          } else if (typeof merged.activePulls === "object") {
            merged.activePulls = new Map(Object.entries(merged.activePulls));
          } else {
            merged.activePulls = new Map();
          }
        }

        return merged;
      },
      // partialize: (state) => ({
      //   activePulls: Array.from(state.activePulls.entries()).reduce(
      //     (acc, [key, value]) => {
      //       if (value.progress < 100) {
      //         acc.set(key, value);
      //       }
      //       return acc;
      //     },
      //     new Map<string, PullProgress>()
      //   ),
      // }),
    }
  )
);
