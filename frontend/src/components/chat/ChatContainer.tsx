import { useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useSessionStore } from '../../store/sessionStore';
import { useVoiceStore } from '../../store/voiceStore';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

export function ChatContainer() {
  const { messages, isStreaming, streamingContent, sendMessage, cancelStream } = useChat();
  const runtimeStatus = useSessionStore((s) => s.sessionState?.runtime_status);
  const autoRead = useVoiceStore((s) => s.autoRead);
  const { speak } = useSpeechSynthesis();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastReadIdRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-read new interviewer (role='interviewer') messages
  useEffect(() => {
    if (!autoRead || isStreaming) return;
    const interviewerMsgs = messages.filter((m) => m.role === 'interviewer');
    if (interviewerMsgs.length === 0) return;
    const latest = interviewerMsgs[interviewerMsgs.length - 1];
    if (latest.id !== lastReadIdRef.current && latest.content) {
      lastReadIdRef.current = latest.id;
      speak(latest.content);
    }
  }, [messages, autoRead, isStreaming, speak]);

  const isActive = runtimeStatus === 'RUNNING' || runtimeStatus === 'PAUSED';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
      />

      {/* Scroll anchor */}
      <div ref={bottomRef} />

      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        isStreaming={isStreaming}
        disabled={!isActive && runtimeStatus !== 'CONFIG_READY'}
        placeholder={
          !isActive
            ? runtimeStatus === 'CONFIG_READY'
              ? '输入 /start 或"开始吧"开始面试...'
              : '面试尚未开始，请先配置并开始...'
            : '输入你的回答... (Enter 发送，Shift+Enter 换行)'
        }
      />
    </div>
  );
}
