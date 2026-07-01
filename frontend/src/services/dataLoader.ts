/** Load bundled JSON/MD data files from /assets/data/ */

const cache = new Map<string, unknown>();

export async function loadData<T = unknown>(filename: string): Promise<T> {
  if (cache.has(filename)) return cache.get(filename) as T;
  const res = await fetch(`/assets/data/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  let data: unknown;
  if (filename.endsWith('.json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  cache.set(filename, data);
  return data as T;
}

export function loadDataSync(filename: string): string {
  // Fallback: use synchronous XMLHttpRequest (only for bundled assets)
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/assets/data/${filename}`, false);
  xhr.send();
  if (xhr.status !== 200) throw new Error(`Failed to load ${filename}`);
  return xhr.responseText;
}

// Pre-load all critical data
export async function preloadData(): Promise<void> {
  await Promise.all([
    loadData('SKILL.md'),
    loadData('fundamental_questions.json'),
    loadData('algorithm_questions.json'),
    loadData('interview_mode_profiles.json'),
    loadData('role_profiles.json'),
  ]);
}
