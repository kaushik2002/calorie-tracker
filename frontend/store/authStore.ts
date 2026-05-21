import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as api from '../services/api';

interface AuthStore {
  token: string | null;
  userId: string | null;
  username: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

function parseJwt(token: string): { sub?: string; username?: string } | null {
  try {
    const base64 = token.split('.')[1];
    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  userId: null,
  username: null,
  isLoading: false,

  loadToken: async () => {
    const token = await SecureStore.getItemAsync('jwt_token');
    if (token) {
      const payload = parseJwt(token);
      set({ token, userId: payload?.sub ?? null, username: payload?.username ?? null });
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await api.login(username, password);
      const payload = parseJwt(data.access_token);
      set({
        token: data.access_token,
        userId: payload?.sub ?? null,
        username: payload?.username ?? username,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      await api.register(username, password);
      const data = await api.login(username, password);
      const payload = parseJwt(data.access_token);
      set({
        token: data.access_token,
        userId: payload?.sub ?? null,
        username: payload?.username ?? username,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    set({ token: null, userId: null, username: null });
  },
}));
