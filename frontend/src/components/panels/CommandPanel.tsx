import { useSessionStore } from '../../store/sessionStore';
import { useChatStore } from '../../store/chatStore';
import { streamChat } from '../../services/chatService';
import { generateId } from '../../utils/formatters';
import { Card, CardHeader } from '../shared/Card';
import { Button } from '../shared/Button';

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
  const sessionState = useSessionStore((s) => s.sessionState);
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const { addMessage, setStreaming, appendStreamContent, finalizeStreamingMessage, isStreaming } = useChatStore();

  const runtimeStatus = sessionState?.runtime_status;
  if (!runtimeStatus || !sessionState) return null;

  const commands = COMMANDS_BY_STATUS[runtimeStatus] || [];
  if (commands.length === 0) return null;

  const handleCommand = async (cmd: string) => {
    if (isStreaming) return;
    addMessage({
      id: generateId(),
      role: 'user',
      content: `/${cmd}`,
      timestamp: new Date().toISOString(),
    });
    setStreaming(true);
    try {
      await streamChat(sessionState, `/${cmd}`, {
        onTextDelta: (text) => appendStreamContent(text),
        onToolCall: () => {},
        onToolResult: (_, result) => {
          if (result.session_state) setSessionState({ ...result.session_state });
        },
        onError: () => {},
        onDone: (finalState) => {
          finalizeStreamingMessage(generateId());
          setStreaming(false);
          setSessionState({ ...finalState });
        },
      });
    } catch {
      setStreaming(false);
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
