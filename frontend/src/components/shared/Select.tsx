import { cn } from '../../utils/cn';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; description?: string }[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select({ label, value, onChange, options, placeholder, className, size = 'md' }: SelectProps) {
  const heights: Record<string, string> = { sm: 'py-1.5 text-xs', md: 'py-2 text-sm' };
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-lg border border-border bg-surface text-text px-3 outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors appearance-none',
          heights[size]
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
