import { useCallback, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../api/client';
import { generateId } from '../utils/formatters';

export function useChat() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const aborterRef = useRef<AbortController | null>(null);

  const {
    messages, isStreaming, streamingContent,
    addMessage, setStreaming, appendStreamContent,
    finalizeStreamingMessage, clearMessages,
  } = useChatStore();

  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId || !content.trim() || isStreaming) return;

      const userMsgId = generateId();
      addMessage({
        id: userMsgId,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      });

      setStreaming(true);

      aborterRef.current = api.streamChat(
        sessionId,
        content.trim(),
        (evt) => {
          if (evt.type === 'text_delta') {
            appendStreamContent(evt.content as string);
          } else if (evt.type === 'tool_use_start') {
            // Tool calls in background — we don't interrupt streaming
          } else if (evt.type === 'tool_result') {
            // Tool executed
          } else if (evt.type === 'message_done') {
            if (evt.session_state) {
              setSessionState(evt.session_state as Parameters<typeof setSessionState>[0]);
            }
          } else if (evt.type === 'error') {
            addMessage({
              id: generateId(),
              role: 'system',
              content: `❌ ${evt.error || '未知错误'}`,
              timestamp: new Date().toISOString(),
            });
          }
        },
        () => {
          finalizeStreamingMessage(generateId());
          setStreaming(false);
        },
        (err) => {
          addMessage({
            id: generateId(),
            role: 'system',
            content: `❌ 连接错误: ${err}`,
            timestamp: new Date().toISOString(),
          });
          setStreaming(false);
        }
      );
    },
    [sessionId, isStreaming, addMessage, setStreaming, appendStreamContent, finalizeStreamingMessage, setSessionState]
  );

  const cancelStream = useCallback(() => {
    aborterRef.current?.abort();
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
