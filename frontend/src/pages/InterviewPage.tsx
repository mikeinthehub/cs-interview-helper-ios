import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useUIStore } from '../store/uiStore';
import { ChatContainer } from '../components/chat/ChatContainer';
import { CommandBar } from '../components/chat/CommandBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';

export function InterviewPage() {
  const navigate = useNavigate();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionState = useSessionStore((s) => s.sessionState);
  const setActivePage = useUIStore((s) => s.setActivePage);

  useEffect(() => {
    setActivePage('interview');
  }, [setActivePage]);

  if (!sessionId || !sessionState) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <h2 className="text-base font-semibold text-text mb-1">暂无面试会话</h2>
          <p className="text-sm text-text-secondary mb-4">
            请先在「面试配置」页面创建新面试，或恢复一个已有会话
          </p>
          <Button onClick={() => navigate('/setup')}>
            去配置 →
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatContainer />
      <CommandBar />
    </div>
  );
}
