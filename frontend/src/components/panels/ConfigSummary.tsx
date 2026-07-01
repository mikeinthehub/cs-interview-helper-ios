import { useSessionStore } from '../../store/sessionStore';
import { Card, CardHeader } from '../shared/Card';
import { Badge } from '../shared/Badge';

export function ConfigSummary() {
  const state = useSessionStore((s) => s.sessionState);
  if (!state) return null;

  const { config } = state;
  if (!config) return null;

  const entries: Array<[string, string | undefined]> = [
    ['模式', config.mode],
    ['角色', config.role],
    ['强度', config.strength],
    ['语气', config.tone],
    ['难度', config.level],
  ];
  const items = entries.filter(([, v]) => v);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader title="当前配置" />
      <div className="space-y-1.5">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-text-muted text-xs">{label}</span>
            <span className="text-text text-xs font-medium">{value}</span>
          </div>
        ))}
        {config.focus && config.focus.length > 0 && (
          <div className="pt-1.5 border-t border-border">
            <span className="text-text-muted text-xs block mb-1">重点方向</span>
            <div className="flex flex-wrap gap-1">
              {config.focus.map((f) => (
                <Badge key={f} size="sm">{f}</Badge>
              ))}
            </div>
          </div>
        )}
        {config.jd_text && (
          <div className="pt-1.5 border-t border-border">
            <span className="text-text-muted text-xs block mb-1">JD 已设置</span>
            <p className="text-xs text-text-secondary line-clamp-3">{config.jd_text}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
