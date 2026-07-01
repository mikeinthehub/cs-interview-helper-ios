/**
 * Session state machine — ported from interview_session.py.
 * Manages interview lifecycle: INIT → CONFIG_READY → RUNNING → REPORT_GENERATION → DONE
 */

import { saveJson, loadJson, listSessions } from './fileStorage';
import type { SessionState, SessionConfig, StageName, CurrentQuestion } from '../types/session';

const STAGE_SEQUENCES: Record<string, StageName[]> = {
  '完整模拟': ['SELF_INTRO', 'PROJECT_DEEP_DIVE', 'CS_FUNDAMENTALS', 'CODING_INTERVIEW', 'CANDIDATE_QUESTIONS'],
  '项目深挖': ['PROJECT_DEEP_DIVE'],
  '八股快问快答': ['CS_FUNDAMENTALS'],
  '算法陪练': ['CODING_INTERVIEW'],
  'JD 定向面': ['SELF_INTRO', 'PROJECT_DEEP_DIVE', 'CS_FUNDAMENTALS', 'CANDIDATE_QUESTIONS'],
  '简历拷打': ['PROJECT_DEEP_DIVE', 'CS_FUNDAMENTALS'],
  '复盘教练': [],
};

export function createSession(name = 'interview'): SessionState {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const sessionId = `${name}_session_${timestamp}`.slice(0, 40);

  const state: SessionState = {
    schema_version: '1.0',
    session_id: sessionId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    runtime_status: 'INIT',
    active_stage: null,
    stage_sequence: STAGE_SEQUENCES['完整模拟'],
    stage_status: {},
    config: {
      role: '',
      strength: '人上人',
      tone: '默认',
      level: '中等',
      mode: '完整模拟',
      focus: [],
      jd_text: '',
    },
    artifacts: {},
    question_plan: {},
    current_question: null,
    progress: {
      question_counts: {},
      completed_question_ids: [],
      hints_used_total: 0,
      skipped_total: 0,
    },
    pending_reconfiguration: {},
    command_history: [],
  };
  return state;
}

export async function saveSession(state: SessionState): Promise<void> {
  state.updated_at = new Date().toISOString();
  await saveJson(`${state.session_id}_state.json`, state);
}

export async function loadSession(sessionId: string): Promise<SessionState | null> {
  return loadJson<SessionState>(`${sessionId}_state.json`);
}

export async function getAllSessions(): Promise<string[]> {
  return listSessions();
}

// ========== Configuration ==========

export function configureSession(state: SessionState, config: Partial<SessionConfig>): SessionState {
  if (config.role !== undefined) state.config.role = config.role;
  if (config.strength !== undefined) state.config.strength = config.strength;
  if (config.tone !== undefined) state.config.tone = config.tone;
  if (config.level !== undefined) state.config.level = config.level;
  if (config.mode !== undefined) {
    state.config.mode = config.mode;
    state.stage_sequence = STAGE_SEQUENCES[config.mode] || STAGE_SEQUENCES['完整模拟'];
    // Initialize stage_status for all stages in sequence
    state.stage_status = {};
    for (const stage of state.stage_sequence) {
      state.stage_status[stage] = 'pending';
    }
  }
  if (config.focus !== undefined) state.config.focus = config.focus;
  if (config.jd_text !== undefined) state.config.jd_text = config.jd_text;

  state.runtime_status = 'CONFIG_READY';
  return state;
}

// ========== Start Interview ==========

export function startInterview(state: SessionState, questionPlan: Record<string, unknown[]>): SessionState {
  state.runtime_status = 'RUNNING';
  state.question_plan = questionPlan;

  // Set first stage as active
  if (state.stage_sequence.length > 0) {
    const firstStage = state.stage_sequence[0];
    state.active_stage = firstStage;
    state.stage_status[firstStage] = 'in_progress';

    // Set first question
    const stageQuestions = questionPlan[firstStage] as CurrentQuestion[] | undefined;
    if (stageQuestions && stageQuestions.length > 0) {
      state.current_question = stageQuestions[0];
      state.progress.question_counts[firstStage] = stageQuestions.length;
    }
  }

  state.command_history.push({ timestamp: new Date().toISOString(), command: 'start' });
  return state;
}

// ========== Answer Recording ==========

export function recordAnswer(
  state: SessionState,
  _quality: string,
  _score: number,
  _answerSummary: string,
  _feedback: string,
): SessionState {
  if (state.current_question) {
    state.progress.completed_question_ids.push(state.current_question.question_id);
  }
  // Advance to next question in current stage
  advanceQuestion(state);
  state.command_history.push({ timestamp: new Date().toISOString(), command: 'record-answer' });
  return state;
}

// ========== Commands ==========

export function skipQuestion(state: SessionState): SessionState {
  state.progress.skipped_total++;
  advanceQuestion(state);
  state.command_history.push({ timestamp: new Date().toISOString(), command: 'skip' });
  return state;
}

export function hintQuestion(state: SessionState): SessionState {
  state.progress.hints_used_total++;
  if (state.current_question) {
    state.current_question.hint_level = (state.current_question.hint_level || 0) + 1;
  }
  state.command_history.push({ timestamp: new Date().toISOString(), command: 'hint' });
  return state;
}

export function pauseInterview(state: SessionState): SessionState {
  state.runtime_status = 'PAUSED';
  state.command_history.push({ timestamp: new Date().toISOString(), command: 'pause' });
  return state;
}

export function continueInterview(state: SessionState): SessionState {
  state.runtime_status = 'RUNNING';
  state.command_history.push({ timestamp: new Date().toISOString(), command: 'continue' });
  return state;
}

export function generateReport(state: SessionState): SessionState {
  state.runtime_status = 'REPORT_GENERATION';
  state.command_history.push({ timestamp: new Date().toISOString(), command: 'report' });
  return state;
}

export function finalizeReport(state: SessionState): SessionState {
  state.runtime_status = 'DONE';
  return state;
}

// ========== Internal ==========

function advanceQuestion(state: SessionState): void {
  if (!state.active_stage) return;
  const stageQuestions = (state.question_plan[state.active_stage] as CurrentQuestion[]) || [];
  const currentIdx = stageQuestions.findIndex(
    (q) => q.question_id === state.current_question?.question_id
  );

  if (currentIdx >= 0 && currentIdx < stageQuestions.length - 1) {
    // Next question in same stage
    state.current_question = stageQuestions[currentIdx + 1];
  } else {
    // Stage complete, move to next
    state.stage_status[state.active_stage] = 'completed';
    const stageIdx = state.stage_sequence.indexOf(state.active_stage);
    if (stageIdx >= 0 && stageIdx < state.stage_sequence.length - 1) {
      const nextStage = state.stage_sequence[stageIdx + 1];
      state.active_stage = nextStage;
      state.stage_status[nextStage] = 'in_progress';
      const nextQuestions = (state.question_plan[nextStage] as CurrentQuestion[]) || [];
      state.current_question = nextQuestions.length > 0 ? nextQuestions[0] : null;
    } else {
      // All stages complete
      state.active_stage = null;
      state.current_question = null;
      state.runtime_status = 'REPORT_GENERATION';
    }
  }
}
