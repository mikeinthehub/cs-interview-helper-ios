import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  streamingToolCalls: string[];

  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (v: boolean) => void;
  appendStreamContent: (text: string) => void;
  addStreamingToolCall: (name: string) => void;
  finalizeStreamingMessage: (id: string) => void;
  clearMessages: () => void;
  setMessages: (msgs: ChatMessage[]) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingToolCalls: [],

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      }
      return { messages: msgs };
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  appendStreamContent: (text) =>
    set((s) => ({ streamingContent: s.streamingContent + text })),
  addStreamingToolCall: (name) =>
    set((s) => ({ streamingToolCalls: [...s.streamingToolCalls, name] })),
  finalizeStreamingMessage: (id) => {
    const { streamingContent, streamingToolCalls } = get();
    if (streamingContent || streamingToolCalls.length > 0) {
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id,
            role: 'interviewer',
            content: streamingContent,
            timestamp: new Date().toISOString(),
            toolCalls: streamingToolCalls.map((n) => ({ tool_name: n })),
          },
        ],
        streamingContent: '',
        streamingToolCalls: [],
      }));
    }
  },
  clearMessages: () => set({ messages: [], streamingContent: '', streamingToolCalls: [] }),
  setMessages: (msgs) => set({ messages: msgs }),
}));
