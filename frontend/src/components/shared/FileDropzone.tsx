import { type DragEvent, useState, useRef } from 'react';
import { cn } from '../../utils/cn';

interface FileDropzoneProps {
  onFile: (file: File) => void;
  accept?: string;
  className?: string;
}

export function FileDropzone({ onFile, accept = '.pdf,.docx,.md,.markdown,.txt', className }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
        dragging ? 'border-primary-500 bg-primary-500/5' : 'border-border hover:border-primary-400',
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <svg className="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
      </svg>
      <p className="text-sm text-text-secondary">
        <span className="text-primary-500 font-medium">点击上传</span> 或拖拽文件到此处
      </p>
      <p className="text-xs text-text-muted mt-1">支持 PDF、DOCX、Markdown、TXT</p>
    </div>
  );
}
