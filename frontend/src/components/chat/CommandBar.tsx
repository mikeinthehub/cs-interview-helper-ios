import { useCallback } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useChatStore } from '../../store/chatStore';
import { streamChat } from '../../services/chatService';
import { generateId } from '../../utils/formatters';
import { Button } from '../shared/Button';

interface Cmd {
  label: string;
  command: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function CommandBar() {
  const sessionState = useSessionStore((s) => s.sessionState);
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const { addMessage, setStreaming, appendStreamContent, finalizeStreamingMessage } = useChatStore();

  const runtimeStatus = sessionState?.runtime_status;
  if (!sessionState || !runtimeStatus) return null;

  const sendCommand = useCallback(async (cmd: string) => {
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
  }, [sessionState, addMessage, setStreaming, appendStreamContent, finalizeStreamingMessage, setSessionState]);

  const cmdMap: Record<string, Cmd[]> = {
    CONFIG_READY: [
      { label: '开始', command: 'start', icon: '▶️', variant: 'primary' as const },
    ],
    RUNNING: [
      { label: '提示', command: 'hint', icon: '💡', variant: 'secondary' as const },
      { label: '重复', command: 'repeat', icon: '🔄', variant: 'secondary' as const },
      { label: '跳过', command: 'skip', icon: '⏭️', variant: 'danger' as const },
      { label: '暂停', command: 'pause', icon: '⏸️', variant: 'ghost' as const },
    ],
    PAUSED: [
      { label: '继续', command: 'continue', icon: '▶️', variant: 'primary' as const },
      { label: '评分', command: 'score', icon: '📊', variant: 'secondary' as const },
      { label: '生成报告', command: 'report', icon: '📋', variant: 'ghost' as const },
    ],
    REPORT_GENERATION: [
      { label: '生成报告', command: 'report', icon: '📋', variant: 'primary' as const },
    ],
    DONE: [],
  };

  const commands = cmdMap[runtimeStatus] || [];

  return (
    <div className="border-t border-border bg-surface-alt/50 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
      <span className="text-xs text-text-muted mr-1 shrink-0">快捷:</span>
      {commands.map((c) => (
        <Button key={c.command} variant={c.variant} size="sm" onClick={() => sendCommand(c.command)}>
          {c.icon} {c.label}
        </Button>
      ))}
    </div>
  );
}
