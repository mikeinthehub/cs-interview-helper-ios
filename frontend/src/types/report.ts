export interface OverallConclusion {
  strength: string;
  tone: string;
  mode: string;
  target_role: string;
  total_score: number;
  grade: 'A' | 'B+' | 'B' | 'C' | 'D';
  verdict: string;
}

export interface ModuleScore {
  score: number;
  weight: number;
  stage: string;
  strengths: string[];
  issues: string[];
  summary: string;
}

export interface StageScore {
  module: string;
  question_count: number;
  score_5_total: number;
  avg_score_5: number;
  score_percent: number;
  hints_used: number;
  skipped_count: number;
  strengths: string[];
  issues: string[];
}

export interface WeaknessItem {
  issue: string;
  count: number;
  focus_hint: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface ReviewPriority {
  priority: string;
  topic: string;
  recommended_action: string;
  mode_bias: string;
}

export interface ProjectRiskMapItem {
  project: string;
  severity: string;
  area: string;
  evidence: string;
  interview_hit: boolean;
}

export interface ResumeRewriteSuggestion {
  id: string;
  scope: string;
  target_label: string;
  target_area: string;
  original_text: string;
  problem_types: string[];
  why_it_is_weak: string;
  evidence: string[];
  rewrite_strategy: string;
  suggested_rewrite: string;
  rewrite_diff?: { before: string; after: string };
  priority: 'P0' | 'P1' | 'P2';
  confidence: 'high' | 'medium' | 'low';
}

export interface NextRoundRecommendation {
  strength: string;
  tone: string;
  mode: string;
  focus: string[];
  recommended_questions: string[];
  rationale: string;
  evidence: string[];
  commands: string[];
}

export interface InterviewEvaluation {
  schema_version: string;
  kind: string;
  generated_at: string;
  overall_conclusion: OverallConclusion;
  module_scores: Record<string, ModuleScore>;
  stage_scores: Record<string, StageScore>;
  highlights: string[];
  issues: string[];
  weakness_tracking: WeaknessItem[];
  review_priorities: ReviewPriority[];
  project_risk_map?: ProjectRiskMapItem[];
  fundamentals_gap_list?: unknown[];
  algorithm_breakdown?: unknown[];
  jd_fit_gaps?: unknown[];
  resume_risk_map?: unknown[];
  resume_rewrite_suggestions?: ResumeRewriteSuggestion[];
  next_round_recommendation?: NextRoundRecommendation;
  report_sections: string[];
}
