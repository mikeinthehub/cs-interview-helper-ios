export type RuntimeStatus =
  | 'INIT' | 'RESUME_PARSED' | 'CONFIG_READY'
  | 'RUNNING' | 'PAUSED' | 'REPORT_GENERATION' | 'DONE';

export type StageName =
  | 'SELF_INTRO' | 'PROJECT_DEEP_DIVE'
  | 'CS_FUNDAMENTALS' | 'CODING_INTERVIEW'
  | 'CANDIDATE_QUESTIONS';

export type StageStatusValue = 'pending' | 'in_progress' | 'completed';

export interface SessionConfig {
  role: string;
  strength: string;
  tone: string;
  level: string;
  mode: string;
  focus: string[];
  jd_text: string;
  jd_context?: Record<string, unknown>;
  fundamentals_count?: number;
  algorithms_count?: number;
  view?: string;
}

export interface CurrentQuestion {
  stage: string;
  question_id: string;
  question_text: string;
  prompt_block?: string;
  hint_level?: number;
  metadata?: {
    kind?: string;
    topic?: string;
    subtopic?: string;
    difficulty?: string;
    expected_points?: string[];
    tags?: string[];
  };
}

export interface SessionProgress {
  question_counts: Record<string, number>;
  completed_question_ids: string[];
  hints_used_total: number;
  skipped_total: number;
}

export interface SessionState {
  schema_version: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  runtime_status: RuntimeStatus;
  active_stage: StageName | null;
  stage_sequence: StageName[];
  stage_status: Record<string, StageStatusValue>;
  config: SessionConfig;
  artifacts: Record<string, string>;
  selection_summary?: Record<string, unknown>;
  question_plan: Record<string, unknown[]>;
  current_question: CurrentQuestion | null;
  progress: SessionProgress;
  pending_reconfiguration: Record<string, unknown>;
  command_history: Array<{ timestamp: string; command: string; payload?: unknown }>;
  available_commands?: string[];
}
