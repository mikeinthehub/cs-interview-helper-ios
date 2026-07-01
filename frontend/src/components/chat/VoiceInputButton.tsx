import { useCallback } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { cn } from '../../utils/cn';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const { isListening, interimText, startListening, stopListening, browserSupported } =
    useSpeechRecognition();

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening(onTranscript);
    }
  }, [isListening, startListening, stopListening, onTranscript]);

  if (!browserSupported) return null;

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled && !isListening}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0',
          isListening
            ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
            : 'bg-surface-alt text-text-muted hover:text-text hover:bg-surface-hover border border-border',
          (disabled && !isListening) && 'opacity-40 cursor-not-allowed'
        )}
        title={isListening ? '点击停止录音' : '点击开始语音输入'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {/* Interim text tooltip */}
      {isListening && interimText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface border border-border rounded-lg px-3 py-1.5 shadow-lg max-w-[280px]">
          <p className="text-xs text-text-secondary animate-fade-in">{interimText}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-surface border-b border-r border-border rotate-45 -mt-[5px]" />
        </div>
      )}
    </div>
  );
}
