import { useSessionStore } from '../../store/sessionStore';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';
import { api } from '../../api/client';
import { toast } from '../shared/Toast';

interface CommandDef {
  label: string;
  command: string;
  icon: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const COMMANDS_BY_STATUS: Record<string, CommandDef[]> = {
  CONFIG_READY: [
    { label: '开始面试', command: 'start', icon: '▶', variant: 'primary' },
  ],
  RUNNING: [
    { label: '提示', command: 'hint', icon: '💡' },
    { label: '重复', command: 'repeat', icon: '🔄' },
    { label: '解释', command: 'explain', icon: '💬' },
    { label: '跳过', command: 'skip', icon: '⏭', variant: 'danger' },
    { label: '暂停', command: 'pause', icon: '⏸', variant: 'secondary' },
    { label: '评分', command: 'score', icon: '📊', variant: 'secondary' },
  ],
  PAUSED: [
    { label: '继续', command: 'continue', icon: '▶', variant: 'primary' },
    { label: '评分', command: 'score', icon: '📊', variant: 'secondary' },
  ],
  REPORT_GENERATION: [
    { label: '生成报告', command: 'report', icon: '📋', variant: 'primary' },
  ],
};

export function CommandPanel() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const runtimeStatus = useSessionStore((s) => s.sessionState?.runtime_status);
  const setSessionState = useSessionStore((s) => s.setSessionState);

  if (!runtimeStatus) return null;

  const commands = COMMANDS_BY_STATUS[runtimeStatus] || [];

  if (commands.length === 0) {
    // Always show report option when there are answers
    if (runtimeStatus === 'DONE' || runtimeStatus === 'REPORT_GENERATION') {
      // Handled above
    }
    return null;
  }

  const handleCommand = async (cmd: string) => {
    if (!sessionId) return;
    try {
      const res = await api.post(`/session/${sessionId}/${cmd}`) as { session_state?: Record<string, unknown> };
      if (res.session_state) {
        setSessionState(res.session_state as unknown as Parameters<typeof setSessionState>[0]);
      }
      toast(`命令 "${cmd}" 已执行`, 'success');
    } catch (err: unknown) {
      toast(`执行失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    }
  };

  return (
    <Card>
      <CardHeader title="快捷操作" />
      <div className="grid grid-cols-2 gap-1.5">
        {commands.map((cmd) => (
          <Button
            key={cmd.command}
            variant={cmd.variant || 'ghost'}
            size="sm"
            onClick={() => handleCommand(cmd.command)}
          >
            <span className="text-xs">{cmd.icon}</span>
            <span className="text-xs">{cmd.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
