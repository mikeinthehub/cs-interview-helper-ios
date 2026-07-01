import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  panelOpen: boolean;
  theme: 'light' | 'dark';
  activePage: string;
  toggleSidebar: () => void;
  togglePanel: () => void;
  toggleTheme: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  setActivePage: (p: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  panelOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  activePage: 'setup',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),
  setTheme: (t) => {
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    set({ theme: t });
  },
  setActivePage: (p) => set({ activePage: p }),
}));
