import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    INIT: 'default',
    RESUME_PARSED: 'info',
    CONFIG_READY: 'warning',
    RUNNING: 'success',
    PAUSED: 'warning',
    REPORT_GENERATION: 'purple',
    DONE: 'default',
  };
  const labels: Record<string, string> = {
    INIT: '初始化',
    RESUME_PARSED: '简历已解析',
    CONFIG_READY: '配置就绪',
    RUNNING: '面试中',
    PAUSED: '已暂停',
    REPORT_GENERATION: '生成报告',
    DONE: '已完成',
  };
  return <Badge variant={map[status] || 'default'}>{labels[status] || status}</Badge>;
}

export function QualityBadge({ quality }: { quality: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    strong: 'success',
    partial: 'warning',
    weak: 'warning',
    wrong: 'danger',
  };
  const labels: Record<string, string> = {
    strong: '优秀',
    partial: '部分正确',
    weak: '较弱',
    wrong: '错误',
  };
  return (
    <Badge variant={map[quality] || 'default'} size="sm">
      {labels[quality] || quality}
    </Badge>
  );
}
