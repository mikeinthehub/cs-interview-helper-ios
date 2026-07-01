import { create } from 'zustand';
import { cn } from '../../utils/cn';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: Toast['type']) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in cursor-pointer',
            t.type === 'error' && 'bg-red-600 text-white',
            t.type === 'success' && 'bg-emerald-600 text-white',
            t.type === 'info' && 'bg-surface-alt border border-border text-text'
          )}
          onClick={() => remove(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export const toast = useToastStore.getState().add;
