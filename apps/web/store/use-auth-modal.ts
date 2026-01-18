import { create } from "zustand";

export type ViewType = "auth" | "otp" | "forgot-password" | "reset-password";

export type AuthModalStore = {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;

  // Form type
  isLogin: boolean;
  setIsLogin: (val: boolean) => void;
  toggleAuthMode: () => void;

  // View management
  view: ViewType;
  setView: (view: ViewType) => void;

  // Form data
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  otp: string;
  setOtp: (otp: string) => void;

  // UI state
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  loading: boolean;
  setLoading: (val: boolean) => void;

  // Callback URL
  callbackUrl: string;
  setCallbackUrl: (url: string) => void;

  // Reset function
  resetModal: () => void;
};

const initialState = {
  isOpen: false,
  isLogin: true,
  view: "auth" as ViewType,
  email: "",
  password: "",
  otp: "",
  showPassword: false,
  loading: false,
  callbackUrl: "/",
};

export const useAuthModal = create<AuthModalStore>((set) => ({
  ...initialState,

  setIsOpen: (val) => set({ isOpen: val }),

  setIsLogin: (val) => set({ isLogin: val }),

  toggleAuthMode: () =>
    set((state) => ({
      isLogin: !state.isLogin,
      view: "auth",
      password: "",
    })),

  setView: (view) => set({ view }),

  setEmail: (email) => set({ email }),

  setPassword: (password) => set({ password }),

  setOtp: (otp) => set({ otp }),

  setShowPassword: (val) => set({ showPassword: val }),

  setLoading: (val) => set({ loading: val }),

  setCallbackUrl: (url) => set({ callbackUrl: url }),

  resetModal: () =>
    set({
      view: "auth",
      email: "",
      password: "",
      otp: "",
      showPassword: false,
      loading: false,
    }),
}));
