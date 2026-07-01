import { useSessionStore } from '../../store/sessionStore';
import { Card, CardHeader } from '../shared/Card';
import { StatusBadge } from '../shared/Badge';
import { STAGE_LABELS } from '../../utils/constants';

export function StatusPanel() {
  const state = useSessionStore((s) => s.sessionState);
  if (!state) return null;

  const { runtime_status, active_stage, config } = state;

  return (
    <Card>
      <CardHeader title="会话状态" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">运行状态</span>
          <StatusBadge status={runtime_status} />
        </div>
        {active_stage && (
          <div className="flex justify-between">
            <span className="text-text-muted">当前阶段</span>
            <span className="text-text font-medium">{STAGE_LABELS[active_stage] || active_stage}</span>
          </div>
        )}
        {config?.mode && (
          <div className="flex justify-between">
            <span className="text-text-muted">面试模式</span>
            <span className="text-text">{config.mode}</span>
          </div>
        )}
        {config?.role && (
          <div className="flex justify-between">
            <span className="text-text-muted">岗位</span>
            <span className="text-text">{config.role}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
