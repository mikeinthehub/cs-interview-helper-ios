import { useSessionStore } from '../../store/sessionStore';
import { Button } from '../shared/Button';
import { api } from '../../api/client';
import { toast } from '../shared/Toast';

interface Cmd {
  label: string;
  command: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function CommandBar() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const runtimeStatus = useSessionStore((s) => s.sessionState?.runtime_status);
  const setSessionState = useSessionStore((s) => s.setSessionState);

  if (!sessionId || !runtimeStatus) return null;

  const cmdMap: Record<string, Cmd[]> = {
    CONFIG_READY: [
      { label: '开始', command: 'start', icon: '▶️', variant: 'primary' },
    ],
    RUNNING: [
      { label: '提示', command: 'hint', icon: '💡', variant: 'secondary' },
      { label: '重复', command: 'repeat', icon: '🔄', variant: 'secondary' },
      { label: '跳过', command: 'skip', icon: '⏭️', variant: 'danger' },
      { label: '暂停', command: 'pause', icon: '⏸️', variant: 'ghost' },
    ],
    PAUSED: [
      { label: '继续', command: 'continue', icon: '▶️', variant: 'primary' },
      { label: '评分', command: 'score', icon: '📊', variant: 'secondary' },
      { label: '生成报告', command: 'report', icon: '📋', variant: 'ghost' },
    ],
    REPORT_GENERATION: [
      { label: '生成报告', command: 'report', icon: '📋', variant: 'primary' },
    ],
    DONE: [],
  };

  const commands = cmdMap[runtimeStatus] || [];

  const handle = async (cmd: string) => {
    try {
      const res = await api.post(`/session/${sessionId}/${cmd}`) as { session_state?: Record<string, unknown> };
      if (res.session_state) setSessionState(res.session_state as unknown as Parameters<typeof setSessionState>[0]);
      toast(`/${cmd} 已执行`, 'success');
    } catch (err: unknown) {
      toast(`失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    }
  };

  return (
    <div className="border-t border-border bg-surface-alt/50 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
      <span className="text-xs text-text-muted mr-1 shrink-0">快捷:</span>
      {commands.map((c) => (
        <Button
          key={c.command}
          variant={c.variant}
          size="sm"
          onClick={() => handle(c.command)}
        >
          {c.icon} {c.label}
        </Button>
      ))}
    </div>
  );
}
