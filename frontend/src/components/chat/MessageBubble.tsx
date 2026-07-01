import type { ChatMessage } from '../../types/chat';
import { QualityBadge } from '../shared/Badge';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-surface-alt border border-border rounded-lg px-3 py-1.5 max-w-[80%]">
          <p className="text-xs text-text-secondary text-center">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-surface-alt text-primary-500 border border-border'
        }`}
      >
        {isUser ? '你' : '官'}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-md'
              : 'bg-surface-alt border border-border text-text rounded-tl-md'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          {message.quality && (
            <div className="mt-1.5">
              <QualityBadge quality={message.quality} />
            </div>
          )}
          {message.score && (
            <span className="text-xs ml-1.5 text-text-muted">{message.score}/5</span>
          )}
        </div>
        <span className="text-[10px] text-text-muted mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
