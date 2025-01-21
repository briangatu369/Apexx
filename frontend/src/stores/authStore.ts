import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  authenticate: () => void;
  deauthenticate: () => void;
}

const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  authenticate: () => set({ isAuthenticated: true }),
  deauthenticate: () => set({ isAuthenticated: false }),
}));

export default useAuth;
