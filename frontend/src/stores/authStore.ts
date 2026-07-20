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
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      await api.auth.login(formData);
      const user = await api.auth.me();
      set({
        user,
        isAuthenticated: true,
      });
    } catch (e) {
      // Phase 1 UI/UX: Fallback to mock session if in bypass development mode
      if (import.meta.env.VITE_DEV_BYPASS_AUTO_LOGIN === 'true') {
        const lowerUser = username.toLowerCase();
        const roleName = lowerUser.includes('manager') ? 'manager' : lowerUser.includes('admin') ? 'admin' : 'employee';
        const fullName = lowerUser.includes('manager') ? 'Neha Gupta' : lowerUser.includes('admin') ? 'Arnim Goyal' : 'Riwitika Sharma';
        
        set({
          user: {
            id: 1,
            email: username,
            full_name: fullName,
            role: {
              name: roleName,
              description: `${roleName} permission level`
            }
          },
          isAuthenticated: true
        });
      } else {
        throw e;
      }
    }
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
    // Phase 1 UI/UX Development: Bypass silent auto-login check if env variable is set to true
    if (import.meta.env.VITE_DEV_BYPASS_AUTO_LOGIN === 'true') {
      set({
        user: null,
        isAuthenticated: false,
        isInitializing: false,
      });
      return;
    }

    set({ isInitializing: true });
    try {
      // Silent refresh
      const res = await api.auth.refresh();
      if (res && res.access_token) {
        const user = await api.auth.me();
        set({
          user,
          isAuthenticated: true,
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
