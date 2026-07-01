import { useSessionStore } from '../../store/sessionStore';
import { Card, CardHeader } from '../shared/Card';

export function ProgressPanel() {
  const state = useSessionStore((s) => s.sessionState);
  if (!state) return null;

  const { progress } = state;
  if (!progress) return null;

  const { question_counts, completed_question_ids, hints_used_total, skipped_total } = progress;
  const totalQuestions = Object.values(question_counts || {}).reduce<number>((a, b) => a + (b as number), 0);
  const completed = completed_question_ids?.length || 0;

  return (
    <Card>
      <CardHeader title="进度" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">题目进度</span>
          <span className="text-text font-mono">{completed}/{totalQuestions}</span>
        </div>
        <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${totalQuestions > 0 ? (completed / totalQuestions) * 100 : 0}%` }}
          />
        </div>
        {Object.entries(question_counts || {}).map(([stage, count]) => (
          <div key={stage} className="flex justify-between text-xs">
            <span className="text-text-muted capitalize">{stage.replace('_', ' ')}</span>
            <span className="text-text-secondary">{String(count)} 题</span>
          </div>
        ))}
        <div className="flex justify-between text-xs pt-1 border-t border-border">
          <span className="text-text-muted">提示次数</span>
          <span className="text-text">{hints_used_total || 0}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">跳过次数</span>
          <span className="text-text">{skipped_total || 0}</span>
        </div>
      </div>
    </Card>
  );
}
