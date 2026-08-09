import { create } from 'zustand';
import type { PublicUser } from '../api/auth';

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  status: 'idle' | 'authenticated' | 'unauthenticated';
  setAuth: (user: PublicUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken, status: 'authenticated' }),
  clearAuth: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));
