import { useState, useRef, type KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';
import { VoiceInputButton } from './VoiceInputButton';

interface ChatInputProps {
  onSend: (content: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onCancel, isStreaming, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleTranscript = (text: string) => {
    setValue((prev) => (prev ? prev + ' ' + text : text));
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="border-t border-border p-3 bg-surface-alt/30">
      <div className="flex gap-2 max-w-4xl mx-auto items-end">
        {/* Voice input button */}
        <VoiceInputButton
          onTranscript={handleTranscript}
          disabled={disabled || isStreaming}
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '输入消息...'}
          disabled={disabled || isStreaming}
          rows={1}
          className={cn(
            'flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[42px] max-h-[120px]'
          )}
        />

        {isStreaming ? (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            ⏹ 停止
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
              value.trim()
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-surface-alt text-text-muted cursor-not-allowed'
            )}
          >
            发送
          </button>
        )}
      </div>
    </div>
  );
}
