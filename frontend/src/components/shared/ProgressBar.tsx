import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  showLabel?: boolean;
  label?: string;
}

const colors: Record<string, string> = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const sizes: Record<string, string> = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

export function ProgressBar({
  value, max = 100, size = 'md', color = 'primary', className, showLabel, label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-muted font-medium">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-surface-alt rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color], sizes[size])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
