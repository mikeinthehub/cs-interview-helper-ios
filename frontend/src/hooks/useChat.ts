import { useCallback, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useChatStore } from '../store/chatStore';
import { streamChat } from '../services/chatService';
import { generateId } from '../utils/formatters';
import type { SessionState } from '../types/session';

export function useChat() {
  const sessionState = useSessionStore((s) => s.sessionState);
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const abortRef = useRef<AbortController | null>(null);

  const {
    messages, isStreaming, streamingContent,
    addMessage, setStreaming, appendStreamContent,
    finalizeStreamingMessage, clearMessages,
  } = useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionState || !content.trim() || isStreaming) return;

      const userMsgId = generateId();
      addMessage({
        id: userMsgId,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      });

      setStreaming(true);

      try {
        await streamChat(sessionState, content.trim(), {
          onTextDelta: (text) => {
            appendStreamContent(text);
          },
          onToolCall: (_name) => {
            // Tool execution in background
          },
          onToolResult: (_name, result) => {
            if (result.session_state) {
              setSessionState({ ...result.session_state } as SessionState);
            }
          },
          onError: (err) => {
            addMessage({
              id: generateId(),
              role: 'system',
              content: `❌ ${err}`,
              timestamp: new Date().toISOString(),
            });
          },
          onDone: (finalState) => {
            finalizeStreamingMessage(generateId());
            setStreaming(false);
            setSessionState({ ...finalState } as SessionState);
          },
        });
      } catch (err: unknown) {
        addMessage({
          id: generateId(),
          role: 'system',
          content: `❌ 连接错误: ${err instanceof Error ? err.message : 'Unknown'}`,
          timestamp: new Date().toISOString(),
        });
        setStreaming(false);
      }
    },
    [sessionState, isStreaming, addMessage, setStreaming, appendStreamContent, finalizeStreamingMessage, setSessionState]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}
