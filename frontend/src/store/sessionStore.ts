import { create } from 'zustand';
import type { SessionState, SessionConfig } from '../types/session';

interface SessionStore {
  sessionId: string | null;
  sessionPath: string | null;
  sessionState: SessionState | null;
  isLoading: boolean;
  error: string | null;

  setSession: (id: string, path: string) => void;
  setSessionState: (state: SessionState | null) => void;
  updateState: (partial: Partial<SessionState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

const defaultConfig: SessionConfig = {
  role: '',
  strength: '人上人',
  tone: '默认',
  level: '中等',
  mode: '完整模拟',
  focus: [],
  jd_text: '',
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  sessionPath: null,
  sessionState: null,
  isLoading: false,
  error: null,

  setSession: (id, path) => set({ sessionId: id, sessionPath: path, error: null }),
  setSessionState: (state) => set({ sessionState: state, error: null }),
  updateState: (partial) => {
    const current = get().sessionState;
    if (current) {
      set({ sessionState: { ...current, ...partial } as SessionState });
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearSession: () => set({
    sessionId: null,
    sessionPath: null,
    sessionState: null,
    error: null,
  }),
}));

export { defaultConfig };
