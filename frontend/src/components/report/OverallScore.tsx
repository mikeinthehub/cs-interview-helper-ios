import type { OverallConclusion } from '../../types/report';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { GRADE_COLORS } from '../../utils/constants';

interface OverallScoreProps {
  conclusion: OverallConclusion;
}

export function OverallScore({ conclusion }: OverallScoreProps) {
  const { total_score, grade, verdict } = conclusion;
  const gradeColor = GRADE_COLORS[grade] || 'text-text';
  const pct = Math.min(100, Math.max(0, total_score));

  return (
    <Card className="text-center">
      <div className="flex flex-col items-center">
        {/* Circular gauge */}
        <div className="relative w-28 h-28 mb-3">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"
              strokeLinecap="round"
              className={gradeColor.replace('text-', 'text-')}
              strokeDasharray={`${pct * 2.64} 264`}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${gradeColor}`}>{total_score}</span>
            <span className={`text-lg font-bold ${gradeColor}`}>{grade}</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-text mb-1">总评</h3>
        <p className="text-sm text-text-secondary leading-relaxed max-w-lg">{verdict}</p>

        <div className="flex gap-2 mt-3">
          {conclusion.strength && <Badge size="sm">强度: {conclusion.strength}</Badge>}
          {conclusion.mode && <Badge size="sm" variant="info">模式: {conclusion.mode}</Badge>}
          {conclusion.target_role && <Badge size="sm" variant="purple">角色: {conclusion.target_role}</Badge>}
        </div>
      </div>
    </Card>
  );
}
