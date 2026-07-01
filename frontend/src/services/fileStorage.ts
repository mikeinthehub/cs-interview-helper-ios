/**
 * File system abstraction for session persistence.
 * Uses localStorage (works in PWA and Capacitor WebView).
 */

const PREFIX = 'cs_interview_';

export async function saveJson(filename: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  // Chunk large files if needed (localStorage limit ~5-10MB)
  try {
    localStorage.setItem(`${PREFIX}${filename}`, json);
  } catch {
    // Remove old sessions if storage is full
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    // Remove oldest 5
    keys.slice(0, 5).forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(`${PREFIX}${filename}`, json);
  }
}

export async function loadJson<T = unknown>(filename: string): Promise<T | null> {
  const cached = localStorage.getItem(`${PREFIX}${filename}`);
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function listSessions(): Promise<string[]> {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX) && key.endsWith('_state.json')) {
      keys.push(key.slice(PREFIX.length).replace('_state.json', ''));
    }
  }
  return keys;
}
