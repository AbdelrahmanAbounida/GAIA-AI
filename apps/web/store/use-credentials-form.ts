import { create } from "zustand";

type CredentialType = "ai_model" | "vectorstore";

interface CredentialFormState {
  credentialType: CredentialType;
  selectedProvider: string;
  selectedModel: string;
  fieldValues: Record<string, string>;
  showPasswordFields: Record<string, boolean>;
  isValidating: boolean;

  setCredentialType: (type: CredentialType) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  setFieldValue: (fieldId: string, value: string) => void;
  togglePasswordVisibility: (fieldId: string) => void;
  setIsValidating: (isValidating: boolean) => void;
  resetForm: () => void;
}

const initialState = {
  credentialType: "ai_model" as CredentialType,
  selectedProvider: "",
  selectedModel: "",
  fieldValues: {},
  showPasswordFields: {},
  isValidating: false,
};

export const useCredentialForm = create<CredentialFormState>((set) => ({
  ...initialState,

  setCredentialType: (type) =>
    set({
      credentialType: type,
      selectedProvider: "",
      selectedModel: "",
      fieldValues: {},
      showPasswordFields: {},
    }),

  setSelectedProvider: (provider) =>
    set({
      selectedProvider: provider,
      selectedModel: "",
      fieldValues: {},
      showPasswordFields: {},
    }),

  setSelectedModel: (model) =>
    set({
      selectedModel: model,
      fieldValues: {},
      showPasswordFields: {},
    }),

  setFieldValue: (fieldId, value) =>
    set((state) => ({
      fieldValues: {
        ...state.fieldValues,
        [fieldId]: value,
      },
    })),

  togglePasswordVisibility: (fieldId) =>
    set((state) => ({
      showPasswordFields: {
        ...state.showPasswordFields,
        [fieldId]: !state.showPasswordFields[fieldId],
      },
    })),

  setIsValidating: (isValidating) => set({ isValidating }),

  resetForm: () => set(initialState),
}));
