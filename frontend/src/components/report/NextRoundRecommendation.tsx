import type { NextRoundRecommendation as NRType } from '../../types/report';
import { Card, CardHeader } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { useConfigStore } from '../../store/configStore';
import { toast } from '../shared/Toast';

export function NextRoundRecommendation({ recommendation }: { recommendation: NRType }) {
  const setSelected = useConfigStore((s) => s.setSelected);

  const handleApply = () => {
    if (recommendation.strength) setSelected('selectedStrength', recommendation.strength);
    if (recommendation.tone) setSelected('selectedTone', recommendation.tone);
    if (recommendation.mode) setSelected('selectedMode', recommendation.mode);
    if (recommendation.focus) setSelected('selectedFocus', recommendation.focus);
    toast('已应用推荐配置到设置页面', 'success');
  };

  return (
    <Card>
      <CardHeader title="🔄 下一轮建议" action={
        <Button size="sm" variant="ghost" onClick={handleApply}>应用到配置</Button>
      } />
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-text-muted text-xs">强度</span>
            <p className="text-text font-medium">{recommendation.strength || '-'}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">语气</span>
            <p className="text-text font-medium">{recommendation.tone || '-'}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">模式</span>
            <p className="text-text font-medium">{recommendation.mode || '-'}</p>
          </div>
        </div>
        {recommendation.focus && recommendation.focus.length > 0 && (
          <div>
            <span className="text-text-muted text-xs">重点方向</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {recommendation.focus.map((f, i) => (
                <Badge key={i} size="sm" variant="info">{f}</Badge>
              ))}
            </div>
          </div>
        )}
        {recommendation.rationale && (
          <div>
            <span className="text-text-muted text-xs">理由</span>
            <p className="text-sm text-text-secondary mt-1">{recommendation.rationale}</p>
          </div>
        )}
        {recommendation.commands && recommendation.commands.length > 0 && (
          <div>
            <span className="text-text-muted text-xs">推荐命令</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {recommendation.commands.map((c, i) => (
                <code key={i} className="text-xs bg-surface-alt px-1.5 py-0.5 rounded text-primary-500">{c}</code>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
