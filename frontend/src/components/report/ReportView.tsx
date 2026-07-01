import type { InterviewEvaluation } from '../../types/report';
import { Card, CardHeader } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { OverallScore } from './OverallScore';
import { ModuleScores } from './ModuleScores';
import { StageScores } from './StageScores';
import { WeaknessTracking } from './WeaknessTracking';
import { NextRoundRecommendation } from './NextRoundRecommendation';

interface ReportViewProps {
  evaluation: InterviewEvaluation;
}

export function ReportView({ evaluation }: ReportViewProps) {
  const { overall_conclusion, module_scores, stage_scores, highlights, issues, weakness_tracking, review_priorities, next_round_recommendation, resume_rewrite_suggestions, report_sections } = evaluation;

  const showSection = (name: string) => !report_sections || report_sections.includes(name);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-text">面试复盘报告</h2>
        <p className="text-sm text-text-secondary mt-1">
          模式: {overall_conclusion?.mode} · 角色: {overall_conclusion?.target_role || 'N/A'} · 强度: {overall_conclusion?.strength}
        </p>
      </div>

      {/* Overall Score */}
      {overall_conclusion && (
        <OverallScore conclusion={overall_conclusion} />
      )}

      {/* Module Scores */}
      {showSection('module_scores') && module_scores && Object.keys(module_scores).length > 0 && (
        <ModuleScores scores={module_scores} />
      )}

      {/* Stage Scores */}
      {showSection('stage_scores') && stage_scores && Object.keys(stage_scores).length > 0 && (
        <StageScores scores={stage_scores} />
      )}

      {/* Highlights & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showSection('highlights') && highlights && highlights.length > 0 && (
          <Card>
            <CardHeader title="✨ 亮点" />
            <ul className="space-y-1.5">
              {highlights.map((h, i) => (
                <li key={i} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-emerald-400 shrink-0">+</span> {h}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {showSection('issues') && issues && issues.length > 0 && (
          <Card>
            <CardHeader title="⚠️ 待改进" />
            <ul className="space-y-1.5">
              {issues.map((iss, i) => (
                <li key={i} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-amber-400 shrink-0">!</span> {iss}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Weakness Tracking */}
      {showSection('weakness_tracking') && weakness_tracking && weakness_tracking.length > 0 && (
        <WeaknessTracking items={weakness_tracking} />
      )}

      {/* Review Priorities */}
      {review_priorities && review_priorities.length > 0 && (
        <Card>
          <CardHeader title="📚 复习优先级" />
          <div className="space-y-2">
            {review_priorities.map((r, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Badge variant={r.priority === 'P0' ? 'danger' : 'warning'} size="sm">
                  {r.priority}
                </Badge>
                <div>
                  <span className="text-text font-medium">{r.topic}</span>
                  <p className="text-xs text-text-secondary">{r.recommended_action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Round Recommendation */}
      {next_round_recommendation && (
        <NextRoundRecommendation recommendation={next_round_recommendation} />
      )}

      {/* Resume Rewrite Suggestions */}
      {resume_rewrite_suggestions && resume_rewrite_suggestions.length > 0 && (
        <Card>
          <CardHeader title={`📝 简历修改建议 (${resume_rewrite_suggestions.length})`} />
          <div className="space-y-4">
            {resume_rewrite_suggestions.map((s, i) => (
              <div key={s.id || i} className="border-t border-border pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={s.priority === 'P0' ? 'danger' : s.priority === 'P1' ? 'warning' : 'default'} size="sm">
                    {s.priority}
                  </Badge>
                  <span className="text-sm font-medium text-text">{s.target_label}</span>
                  <Badge size="sm" variant="info">{s.scope}</Badge>
                </div>
                <p className="text-xs text-text-secondary mb-2">{s.why_it_is_weak}</p>
                <div className="bg-surface-alt rounded-lg p-3 text-xs">
                  <div className="text-red-400 line-through mb-1">{s.original_text}</div>
                  <div className="text-emerald-400">{s.suggested_rewrite}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
