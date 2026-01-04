import { create } from "zustand";

type DialogsState = {
  credentialDialogOpen: boolean;
  setCredentialDialogOpen: (open: boolean) => void;

  openRAGSettingsDialog: boolean;
  setOpenRAGSettingsDialog: (open: boolean) => void;
};

export const useDialogs = create<DialogsState>()((set) => ({
  credentialDialogOpen: false,
  setCredentialDialogOpen: (open: boolean) =>
    set({ credentialDialogOpen: open }),

  openRAGSettingsDialog: false,
  setOpenRAGSettingsDialog: (open: boolean) =>
    set({ openRAGSettingsDialog: open }),
}));
