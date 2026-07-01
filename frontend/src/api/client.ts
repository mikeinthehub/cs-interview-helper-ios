const BASE = '/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (url: string): Promise<any> => request(url),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: (url: string, body?: unknown): Promise<any> =>
    request(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload: async (url: string, formData: FormData): Promise<any> => {
    const res = await fetch(`${BASE}${url}`, { method: 'POST', body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(body.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },
  streamChat: (sessionId: string, content: string, onEvent: (evt: Record<string, unknown>) => void, onDone: () => void, onError: (err: string) => void) => {
    const controller = new AbortController();
    fetch(`${BASE}/chat/${sessionId}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        onError(body.detail || `HTTP ${res.status}`);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) { onDone(); return; }
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') { onDone(); return; }
            try { onEvent(JSON.parse(data)); } catch { /* skip */ }
          }
        }
      }
      onDone();
    }).catch((err) => {
      if (err.name !== 'AbortError') onError(err.message);
    });
    return controller;
  },
};
