import { useLocation } from 'react-router-dom';
import { IOSTabBar } from './IOSTabBar';
import { IOSNavBar } from './IOSNavBar';

const PAGE_TITLES: Record<string, string> = {
  '/': '面试配置',
  '/setup': '面试配置',
  '/interview': '面试对话',
  '/report': '复盘报告',
};

interface IOSShellProps {
  children: React.ReactNode;
}

export function IOSShell({ children }: IOSShellProps) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'CS 技术面试';
  const useLargeTitle = location.pathname === '/' || location.pathname === '/setup';

  return (
    <div
      className="flex flex-col h-full bg-[var(--ios-bg)]"
      style={{ fontFamily: 'var(--font-ios)' }}
    >
      {/* Top Navigation Bar */}
      <IOSNavBar title={title} largeTitle={useLargeTitle} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <IOSTabBar />
    </div>
  );
}
