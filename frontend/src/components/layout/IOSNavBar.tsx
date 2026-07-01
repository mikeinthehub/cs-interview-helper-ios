interface IOSNavBarProps {
  title: string;
  largeTitle?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export function IOSNavBar({ title, largeTitle = false, rightAction, leftAction }: IOSNavBarProps) {
  return (
    <header
      className="flex-shrink-0 bg-[var(--ios-bg)] border-b border-[var(--ios-separator)]"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
    >
      {/* Standard height nav bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 'var(--nav-bar-height)' }}
      >
        <div className="w-10 flex justify-start">{leftAction}</div>
        {!largeTitle && (
          <h1
            className="text-[17px] font-semibold text-[var(--ios-label)] text-center flex-1 truncate"
            style={{ fontFamily: 'var(--font-ios)' }}
          >
            {title}
          </h1>
        )}
        <div className="w-10 flex justify-end">{rightAction}</div>
      </div>
      {/* Large title */}
      {largeTitle && (
        <div className="px-4 pb-2">
          <h1
            className="text-[34px] font-bold text-[var(--ios-label)] leading-tight"
            style={{ fontFamily: 'var(--font-ios)' }}
          >
            {title}
          </h1>
        </div>
      )}
    </header>
  );
}
