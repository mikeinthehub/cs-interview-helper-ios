/// <reference types="vite/client" />

// Vite asset imports
declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '/assets/data/*.json' {
  const value: Record<string, unknown>;
  export default value;
}
