import { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';

interface MessageListProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
}

export function MessageList({ messages, streamingContent, isStreaming }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text mb-2">开始你的技术面试</h3>
          <p className="text-sm text-text-secondary">
            面试官会基于你的简历、JD和配置，逐步展开技术问答。
            准备好后输入 <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded text-primary-500">/start</code> 或说"开始吧"。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && streamingContent && (
        <StreamingMessage content={streamingContent} />
      )}
    </div>
  );
}
