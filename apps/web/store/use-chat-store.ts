import { ChatMessage, Artifact } from "@gaia/ai";
import { create } from "zustand";

interface ChatStore {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isLoadingVotes: boolean;

  // Sheet state
  isSheetOpen: boolean;
  selectedArtifact: Artifact | null;
  artifactBoundingBox: DOMRect | null;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  setLoadingMessages: (loading: boolean) => void;
  setLoadingVotes: (loading: boolean) => void;

  // Sheet actions
  openSheet: (artifact: Artifact, boundingBox?: DOMRect | null) => void;
  closeSheet: () => void;
  setSheetOpen: (open: boolean) => void;

  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoadingMessages: false,
  isLoadingVotes: false,

  // Sheet state
  isSheetOpen: false,
  selectedArtifact: null,
  artifactBoundingBox: null,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setLoadingVotes: (loading) => set({ isLoadingVotes: loading }),

  // Sheet actions
  openSheet: (artifact, boundingBox = null) =>
    set({
      isSheetOpen: true,
      selectedArtifact: artifact,
      artifactBoundingBox: boundingBox,
    }),

  closeSheet: () =>
    set({
      isSheetOpen: false,
      selectedArtifact: null,
      artifactBoundingBox: null,
    }),

  setSheetOpen: (open) => set({ isSheetOpen: open }),

  reset: () =>
    set({
      messages: [],
      isLoadingMessages: false,
      isLoadingVotes: false,
      isSheetOpen: false,
      selectedArtifact: null,
      artifactBoundingBox: null,
    }),
}));
