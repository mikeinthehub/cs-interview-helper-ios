/**
 * Self-contained chat service — direct DeepSeek API calls with local tool execution.
 * Replaces: anthropic_client.py + chat_service.py + all Python scripts.
 */

import { getSkillMd } from './dataLoader';
import {
  saveSession, configureSession, recordAnswer, skipQuestion,
  hintQuestion, pauseInterview, continueInterview, generateReport,
} from './sessionManager';
import type { SessionState } from '../types/session';

// ========== DeepSeek API ==========

const API_KEY = 'sk-6397c0f9ee564435928af0b8052aaae2';
// Use proxy in browser (CORS), direct in native Capacitor WebView
const isNative = typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined';
const API_BASE = isNative
  ? 'https://api.deepseek.com/anthropic'
  : '/api/deepseek/anthropic';
const MODEL = 'deepseek-v4-pro[1m]';

// ========== Tool Definitions (same logic as Python scripts, executed locally) ==========

const TOOLS = [
  {
    name: 'read_session_state',
    description: 'Read current interview session state. Call this first.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_start',
    description: 'Start the interview — generate question plan and begin.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'apply_answer_judgement',
    description: 'Score candidate answer and advance to next question. MUST call after every candidate response.',
    input_schema: {
      type: 'object',
      properties: {
        quality: { type: 'string', enum: ['strong', 'partial', 'weak', 'wrong'] },
        score: { type: 'integer', minimum: 1, maximum: 5 },
        strengths: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        answer_summary: { type: 'string' },
        feedback: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        next_followup: { type: 'string' },
      },
      required: ['quality', 'score', 'answer_summary', 'feedback'],
    },
  },
  {
    name: 'interview_hint',
    description: 'Increase hint level for current question.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_skip',
    description: 'Skip current question.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_pause',
    description: 'Pause the interview.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_continue',
    description: 'Continue paused interview.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_score',
    description: 'Generate mid-session score.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_report',
    description: 'Generate final report.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'interview_configure',
    description: 'Update interview configuration.',
    input_schema: {
      type: 'object',
      properties: {
        mode: { type: 'string' },
        strength: { type: 'string' },
        tone: { type: 'string' },
        level: { type: 'string' },
        role: { type: 'string' },
        focus: { type: 'array', items: { type: 'string' } },
        jd_text: { type: 'string' },
      },
      required: [],
    },
  },
];

// ========== Context Builder ==========

function buildStateContext(state: SessionState): string {
  const { runtime_status, active_stage, stage_status, config, current_question, progress } = state;
  return [
    `[Session: ${runtime_status}]`,
    `active_stage=${active_stage || 'none'}`,
    `stage_status=${JSON.stringify(stage_status || {})}`,
    `config: mode=${config.mode}, strength=${config.strength}, tone=${config.tone}, level=${config.level}, role=${config.role || 'auto'}, focus=[${(config.focus || []).join(', ')}]`,
    config.jd_text ? `JD: ${config.jd_text.slice(0, 500)}` : '',
    state.question_plan && Object.keys(state.question_plan).length > 0
      ? `Question Plan: ${JSON.stringify(Object.fromEntries(Object.entries(state.question_plan).map(([k, v]) => [k, (v as unknown[]).length + ' questions'])))}`
      : '',
    current_question ? `Current: "${current_question.question_text}" [stage=${current_question.stage}, hint_level=${current_question.hint_level || 0}]` : 'No current question',
    active_stage && state.question_plan?.[active_stage]
      ? `Questions for ${active_stage}:\n${(state.question_plan[active_stage] as unknown[]).map((q: unknown, i: number) => `${i+1}. ${(q as Record<string,unknown>).question_id}: ${(q as Record<string,unknown>).question_text}`).join('\n')}`
      : '',
    `Progress: completed=${(progress.completed_question_ids || []).length}, hints=${progress.hints_used_total || 0}, skipped=${progress.skipped_total || 0}`,
    '---',
    'You are a CS Technical Interviewer. Follow SKILL.md rules strictly. Use Chinese. Ask ONE question at a time. After each answer call apply_answer_judgement then proceed.',
  ].join('\n');
}

// ========== Tool Execution ==========

interface ToolCallResult {
  success: boolean;
  session_state: SessionState;
  data?: unknown;
}

function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  state: SessionState,
): ToolCallResult {
  let newState = { ...state };

  switch (toolName) {
    case 'read_session_state':
      return { success: true, session_state: newState, data: stateSnapshot(newState) };

    case 'interview_start': {
      // Question plan will be generated asynchronously — for now set up the plan
      newState.runtime_status = 'RUNNING';
      if (newState.stage_sequence.length > 0) {
        newState.active_stage = newState.stage_sequence[0];
        newState.stage_status[newState.active_stage] = 'in_progress';
      }
      newState.command_history.push({ timestamp: new Date().toISOString(), command: 'start' });
      return { success: true, session_state: newState, data: stateSnapshot(newState) };
    }

    case 'apply_answer_judgement': {
      const quality = (toolInput.quality as string) || 'partial';
      const score = (toolInput.score as number) || 3;
      const summary = (toolInput.answer_summary as string) || '';
      const feedback = (toolInput.feedback as string) || '';
      newState = recordAnswer(newState, quality, score, summary, feedback);
      return { success: true, session_state: newState, data: { judged: true, quality, score } };
    }

    case 'interview_hint':
      newState = hintQuestion(newState);
      return { success: true, session_state: newState };

    case 'interview_skip':
      newState = skipQuestion(newState);
      return { success: true, session_state: newState };

    case 'interview_pause':
      newState = pauseInterview(newState);
      return { success: true, session_state: newState };

    case 'interview_continue':
      newState = continueInterview(newState);
      return { success: true, session_state: newState };

    case 'interview_score':
      newState.command_history.push({ timestamp: new Date().toISOString(), command: 'score' });
      return { success: true, session_state: newState, data: { score_pending: true } };

    case 'interview_report':
      newState = generateReport(newState);
      return { success: true, session_state: newState };

    case 'interview_configure': {
      newState = configureSession(newState, toolInput as Record<string, unknown>);
      return { success: true, session_state: newState };
    }

    default:
      return { success: false, session_state: newState, data: { error: `Unknown tool: ${toolName}` } };
  }
}

function stateSnapshot(state: SessionState): Record<string, unknown> {
  return {
    runtime_status: state.runtime_status,
    active_stage: state.active_stage,
    stage_status: state.stage_status,
    current_question: state.current_question,
    config: state.config,
    progress: state.progress,
  };
}

// ========== Streaming Chat ==========

export interface StreamEvents {
  onTextDelta: (text: string) => void;
  onToolCall: (name: string, input: Record<string, unknown>) => void;
  onToolResult: (name: string, result: ToolCallResult) => void;
  onError: (error: string) => void;
  onDone: (finalState: SessionState) => void;
}

export async function streamChat(
  state: SessionState,
  userMessage: string,
  events: StreamEvents,
): Promise<void> {
  const skillMd = await getSkillMd();
  const stateContext = buildStateContext(state);

  // Build messages
  const messages: Array<{ role: string; content: string }> = [
    { role: 'user', content: stateContext },
  ];

  // Add last few Q&A exchanges from state if available
  // (transcript would be stored separately)

  messages.push({ role: 'user', content: userMessage });

  // Call DeepSeek API
  try {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: 'text', text: skillMd }],
        messages,
        tools: TOOLS,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      events.onError(`API Error ${response.status}: ${err}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { events.onError('No response stream'); return; }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentState = { ...state };
    const pendingToolCalls: Array<{ id: string; name: string; input: string }> = [];
    let toolInputJson = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;

        try {
          const event = JSON.parse(jsonStr);

          if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if (delta?.text) {
              events.onTextDelta(delta.text);
            }
            if (delta?.partial_json) {
              toolInputJson += delta.partial_json;
            }
          }

          if (event.type === 'content_block_start') {
            const block = event.content_block;
            if (block?.type === 'tool_use') {
              pendingToolCalls.push({ id: block.id, name: block.name, input: '' });
              toolInputJson = '';
            }
          }

          if (event.type === 'content_block_stop') {
            // Finalize tool call input
            if (pendingToolCalls.length > 0) {
              const last = pendingToolCalls[pendingToolCalls.length - 1];
              if (toolInputJson && !last.input) {
                last.input = toolInputJson;
              }
            }
          }

          if (event.type === 'message_delta' && event.delta?.stop_reason === 'tool_use') {
            // All tool calls finalized — execute them
            for (const tc of pendingToolCalls) {
              let parsedInput: Record<string, unknown> = {};
              try { parsedInput = JSON.parse(tc.input || '{}'); } catch { /* empty */ }

              events.onToolCall(tc.name, parsedInput);
              const result = executeTool(tc.name, parsedInput, currentState);
              currentState = result.session_state;
              events.onToolResult(tc.name, result);

              // Persist state after each tool execution
              await saveSession(currentState);
            }
            pendingToolCalls.length = 0;
            toolInputJson = '';
          }
        } catch {
          // Skip malformed events
        }
      }
    }

    // Auto-judge: if the LLM didn't call apply_answer_judgement, force it
    const isCommand = userMessage.startsWith('/') || /^(开始|暂停|继续|跳过|提示|重复|解释|评分|报告)/.test(userMessage);
    const hasQuestion = !!currentState.current_question;
    if (!isCommand && hasQuestion && !pendingToolCalls.length) {
      // Advance state with default judgement
      currentState = recordAnswer(currentState, 'partial', 3, userMessage.slice(0, 100), '');
      await saveSession(currentState);

      // Tell LLM to ask the next question
      if (currentState.current_question) {
        const ctx = buildStateContext(currentState);
        messages.push({ role: 'user', content: `[State updated. Ask the next question.]\n${ctx}` });
        // Re-call API for the next question
        const resp2 = await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: MODEL, max_tokens: 2048, system: [{ type: 'text', text: getSkillMd() }], messages, tools: TOOLS, stream: true }),
        });
        if (resp2.ok) {
          const reader2 = resp2.body?.getReader();
          if (reader2) {
            let buf2 = '';
            while (true) {
              const { done, value } = await reader2.read();
              if (done) break;
              buf2 += new TextDecoder().decode(value, { stream: true });
              for (const l of buf2.split('\n')) {
                if (l.startsWith('data: ') && l.slice(6) !== '[DONE]') {
                  try {
                    const evt = JSON.parse(l.slice(6));
                    if (evt.type === 'content_block_delta' && evt.delta?.text) {
                      events.onTextDelta(evt.delta.text);
                    }
                  } catch { /* skip */ }
                }
              }
              buf2 = buf2.split('\n').pop() || '';
            }
          }
        }
      }
    }

    // Final save
    await saveSession(currentState);
    events.onDone(currentState);
  } catch (err: unknown) {
    events.onError(err instanceof Error ? err.message : 'Unknown error');
  }
}

// ========== Non-streaming (for commands) ==========

export async function sendChat(
  state: SessionState,
  userMessage: string,
): Promise<{ text: string; state: SessionState }> {
  return new Promise((resolve, reject) => {
    let text = '';

    streamChat(state, userMessage, {
      onTextDelta: (t) => { text += t; },
      onToolCall: () => {},
      onToolResult: () => { /* state updated via onDone */ },
      onError: (err) => reject(new Error(err)),
      onDone: (s) => resolve({ text, state: s }),
    });
  });
}
