/**
 * File system abstraction for session persistence.
 * Uses localStorage in browser, Capacitor Filesystem when native.
 */

const PREFIX = 'cs_interview_';

async function tryGetCapFs(): Promise<Record<string, (...args: unknown[]) => Promise<unknown>> | null> {
  try {
    const mod = await import('@capacitor/filesystem');
    return mod.Filesystem as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
  } catch {
    return null;
  }
}

export async function saveJson(filename: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  // Always save to localStorage
  localStorage.setItem(`${PREFIX}${filename}`, json);

  // Try Capacitor Filesystem
  try {
    const fs = await tryGetCapFs();
    if (fs) {
      await fs.mkdir({ path: 'sessions', directory: 'Documents' } as Record<string, unknown>).catch(() => {});
      await fs.writeFile({ path: `sessions/${filename}`, data: json, directory: 'Documents' } as Record<string, unknown>);
    }
  } catch {
    // localStorage is fine
  }
}

export async function loadJson<T = unknown>(filename: string): Promise<T | null> {
  // Try Capacitor first
  try {
    const fs = await tryGetCapFs();
    if (fs) {
      const result = await fs.readFile({ path: `sessions/${filename}`, directory: 'Documents' } as Record<string, unknown>);
      const data = (result as Record<string, unknown>).data as string;
      if (data) return JSON.parse(data) as T;
    }
  } catch {
    // Fall through to localStorage
  }

  const cached = localStorage.getItem(`${PREFIX}${filename}`);
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function listSessions(): Promise<string[]> {
  try {
    const fs = await tryGetCapFs();
    if (fs) {
      const result = await fs.readdir({ path: 'sessions', directory: 'Documents' } as Record<string, unknown>);
      const files = (result as Record<string, unknown>).files as Array<{ name: string }> | undefined;
      if (files) return files.filter((f) => f.name.endsWith('.json')).map((f) => f.name);
    }
  } catch {
    // Fall through
  }

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key.slice(PREFIX.length));
  }
  return keys;
}
