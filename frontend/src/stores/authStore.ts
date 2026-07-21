import { create } from 'zustand';
import { api, setAccessToken } from '../api/client';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const res = await api.auth.login(formData);
    setAccessToken(res.access_token);
    const user = await api.auth.me();
    set({
      user,
      isAuthenticated: true,
    });
  },

  register: async (payload) => {
    await api.auth.register(payload);
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore errors during logout
    }
    setAccessToken(null);
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    set({ isInitializing: true });
    try {
      const res = await api.auth.refresh();
      if (res && res.access_token) {
        setAccessToken(res.access_token);
        const user = await api.auth.me();
        set({
          user,
          isAuthenticated: true,
        });
      } else {
        setAccessToken(null);
        set({
          user: null,
          isAuthenticated: false,
        });
      }
    } catch (e) {
      setAccessToken(null);
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isInitializing: false });
    }
  },
}));

// Listen to auth expiration event to automatically log out on 401
if (typeof window !== 'undefined') {
  window.addEventListener('auth-expired', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });
}
