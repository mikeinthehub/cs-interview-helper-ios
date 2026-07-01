import type { ModuleScore } from '../../types/report';
import { Card, CardHeader } from '../shared/Card';
import { ProgressBar } from '../shared/ProgressBar';

const MODULE_LABELS: Record<string, string> = {
  self_introduction: '自我介绍',
  project_depth: '项目深度',
  cs_fundamentals: 'CS 基础',
  algorithm_ability: '算法能力',
  communication: '沟通能力',
  candidate_questions: '候选人提问',
};

export function ModuleScores({ scores }: { scores: Record<string, ModuleScore> }) {
  return (
    <Card>
      <CardHeader title="模块评分" />
      <div className="space-y-3">
        {Object.entries(scores).map(([key, module]) => {
          const pct = Math.round((module.score / (module.weight || 1)) * 100) || module.score;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text">{MODULE_LABELS[key] || key}</span>
                <span className="text-text-muted font-mono text-xs">
                  {module.score}/{module.weight}
                </span>
              </div>
              <ProgressBar value={pct} color="primary" size="sm" />
              {module.summary && (
                <p className="text-xs text-text-secondary mt-1">{module.summary}</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
