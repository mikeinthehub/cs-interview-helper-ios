import { useLocation, useNavigate } from 'react-router-dom';

interface Tab {
  path: string;
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: Tab[] = [
  { path: '/setup', label: '面试', icon: '⚙️', activeIcon: '⚙️' },
  { path: '/interview', label: '对话', icon: '💬', activeIcon: '💬' },
  { path: '/report', label: '报告', icon: '📋', activeIcon: '📋' },
];

export function IOSTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="flex-shrink-0 flex items-stretch bg-[var(--ios-bg-elevated)] border-t border-[var(--ios-separator)]"
      style={{ paddingBottom: 'var(--safe-area-bottom)', height: 'var(--tab-bar-height)' }}
    >
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path || (tab.path === '/setup' && location.pathname === '/');
        return (
          <button
            key={tab.path}
            onClick={() => {
              navigate(tab.path);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
              isActive
                ? 'text-[var(--ios-blue)] tab-active'
                : 'text-[var(--ios-label-tertiary)]'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span
              className="text-[10px] font-medium leading-none"
              style={{ fontFamily: 'var(--font-ios)' }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
