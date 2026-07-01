interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-2.5 animate-fade-in">
      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold bg-surface-alt text-primary-500 border border-border">
        官
      </div>
      <div className="flex flex-col items-start max-w-[75%]">
        <div className="rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed bg-surface-alt border border-border text-text">
          <span className="whitespace-pre-wrap break-words">{content}</span>
          <span className="inline-block w-2 h-4 bg-primary-500 ml-0.5 align-text-bottom animate-blink" />
        </div>
        <span className="text-[10px] text-text-muted mt-1 px-1">输入中...</span>
      </div>
    </div>
  );
}
