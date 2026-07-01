import type { WeaknessItem } from '../../types/report';
import { Card, CardHeader } from '../shared/Card';
import { Badge } from '../shared/Badge';

export function WeaknessTracking({ items }: { items: WeaknessItem[] }) {
  const sorted = [...items].sort((a, b) => {
    const order: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
    return (order[a.priority] || 3) - (order[b.priority] || 3);
  });

  return (
    <Card>
      <CardHeader title="🔍 薄弱项追踪" />
      <div className="space-y-2">
        {sorted.map((w, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm py-2 border-b border-border/50 last:border-0">
            <Badge
              variant={w.priority === 'P0' ? 'danger' : w.priority === 'P1' ? 'warning' : 'default'}
              size="sm"
            >
              {w.priority}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-text font-medium">{w.issue}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                出现 {w.count} 次 · {w.focus_hint}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
