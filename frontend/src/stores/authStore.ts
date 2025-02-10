import { create } from "zustand";

interface UserData {
  phoneNumber: string;
  username: string;
  accountBalance: number;
  role: string;
  profileImage: string;
  userId: string;
}

interface AuthState {
  isAuthenticated: boolean;
  clientSeed: string;
  userData: UserData | null;
  authenticate: (data: UserData) => void;
  deauthenticate: () => void;
  updateUserData: (data: Partial<UserData>) => void;
  updateClientSeed: (data: string) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  clientSeed: "1234567890",
  userData: null,
  authenticate: (data: UserData) =>
    set({ isAuthenticated: true, userData: data }),
  deauthenticate: () => set({ isAuthenticated: false, userData: null }),
  updateUserData: (data: Partial<UserData>) =>
    set((state) => ({
      userData: state.userData ? { ...state.userData, ...data } : null,
    })),
  updateClientSeed: (newClientSeed: string) =>
    set({ clientSeed: newClientSeed }),
}));

export default useAuthStore;
