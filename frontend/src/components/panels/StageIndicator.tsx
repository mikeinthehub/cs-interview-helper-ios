import { useSessionStore } from '../../store/sessionStore';
import { Card, CardHeader } from '../shared/Card';
import { STAGE_LABELS } from '../../utils/constants';
import { cn } from '../../utils/cn';
import type { StageStatusValue } from '../../types/session';

const STATUS_STYLES: Record<StageStatusValue, string> = {
  pending: 'bg-border text-text-muted',
  in_progress: 'bg-primary-500 text-white animate-pulse-soft',
  completed: 'bg-emerald-500 text-white',
};

export function StageIndicator() {
  const state = useSessionStore((s) => s.sessionState);
  if (!state) return null;

  const { stage_sequence, stage_status, active_stage } = state;

  if (!stage_sequence || stage_sequence.length === 0) {
    return (
      <Card>
        <CardHeader title="面试流程" />
        <p className="text-xs text-text-muted">暂无阶段信息</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="面试流程" />
      <div className="space-y-0">
        {stage_sequence.map((stage, i) => {
          const status: StageStatusValue = stage_status?.[stage] || 'pending';
          const isActive = stage === active_stage;
          return (
            <div key={stage} className="flex items-start gap-2">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 border-surface shrink-0',
                    STATUS_STYLES[status]
                  )}
                />
                {i < stage_sequence.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-5',
                      status === 'completed' ? 'bg-emerald-400' : 'bg-border'
                    )}
                  />
                )}
              </div>
              <div className="pb-3">
                <p
                  className={cn(
                    'text-xs font-medium leading-tight',
                    isActive ? 'text-primary-500' : 'text-text-secondary'
                  )}
                >
                  {STAGE_LABELS[stage] || stage}
                </p>
                <p className="text-[10px] text-text-muted">
                  {status === 'completed' ? '✓ 完成' : status === 'in_progress' ? '进行中…' : '等待'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
