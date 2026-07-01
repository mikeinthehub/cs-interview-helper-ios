import type { StageScore } from '../../types/report';
import { Card, CardHeader } from '../shared/Card';
import { STAGE_LABELS } from '../../utils/constants';

export function StageScores({ scores }: { scores: Record<string, StageScore> }) {
  return (
    <Card>
      <CardHeader title="阶段详情" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted border-b border-border">
              <th className="text-left py-2 font-medium">阶段</th>
              <th className="text-right py-2 font-medium">题目数</th>
              <th className="text-right py-2 font-medium">均分/5</th>
              <th className="text-right py-2 font-medium">得分%</th>
              <th className="text-right py-2 font-medium">提示</th>
              <th className="text-right py-2 font-medium">跳过</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(scores).map(([stage, s]) => (
              <tr key={stage} className="border-b border-border/50">
                <td className="py-2 text-text font-medium">{STAGE_LABELS[stage] || stage}</td>
                <td className="py-2 text-right text-text-secondary">{s.question_count}</td>
                <td className="py-2 text-right text-text font-mono">{s.avg_score_5?.toFixed(1) || '-'}</td>
                <td className="py-2 text-right text-text font-mono">{s.score_percent}%</td>
                <td className="py-2 text-right text-text-secondary">{s.hints_used}</td>
                <td className="py-2 text-right text-text-secondary">{s.skipped_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
