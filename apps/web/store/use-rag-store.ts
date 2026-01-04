import { RAGSettings } from "@gaia/db";
import { create } from "zustand";

export type FileType =
  | "txt"
  | "json"
  | "csv"
  | "other"
  | "link"
  | "pdf"
  | "docx";

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  content: string;
}

interface RAGState {
  textContent: string;
  setTextContent: (content: string) => void;
  jsonContent: string;
  setJsonContent: (content: string) => void;
  uploadedFiles: UploadedFile[];
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (
    id: string,
    status: UploadedFile["status"],
    progress?: number
  ) => void;

  settings: RAGSettings | null;
  updateSettings: <K extends keyof RAGSettings>(
    key: K,
    value: RAGSettings[K] | Partial<RAGSettings[K]>
  ) => void;
  setSettings: (settings: RAGSettings) => void;

  clearAll: () => void;
}

export const useRAGStore = create<RAGState>((set) => ({
  textContent: "",
  setTextContent: (content) => set({ textContent: content }),

  jsonContent: "",
  setJsonContent: (content) => set({ jsonContent: content }),

  uploadedFiles: [],
  addFiles: (files) =>
    set((state) => ({
      uploadedFiles: [
        ...state.uploadedFiles,
        ...files.map((file) => ({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          status: "pending" as const,
          content: file.content,
        })),
      ],
    })),

  removeFile: (id) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
    })),

  updateFileStatus: (id, status, progress) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.map((f) =>
        f.id === id ? { ...f, status, progress } : f
      ),
    })),

  settings: null,

  updateSettings: (key, value) =>
    set((state) => {
      const currentValue = state.settings![key];
      const isNestedUpdate =
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof currentValue === "object" &&
        currentValue !== null &&
        !Array.isArray(currentValue);

      return {
        settings: {
          ...state.settings,
          [key]: isNestedUpdate ? { ...currentValue, ...value } : value!,
        },
      };
    }),

  setSettings: (settings) => set({ settings }),

  clearAll: () =>
    set({
      textContent: "",
      jsonContent: "",
      uploadedFiles: [],
    }),
}));
