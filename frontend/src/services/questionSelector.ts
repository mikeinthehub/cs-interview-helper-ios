/**
 * Question selection — ported from select_questions.py.
 * Loads bundled JSON banks, scores questions by profile/JD/focus/role,
 * and produces a question plan for the session.
 */

import { loadData } from './dataLoader';
import type { SessionConfig, CurrentQuestion } from '../types/session';

interface FundamentalQuestion {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  layer: string;
  question: string;
  expected_points: string[];
  followups: string[];
  related_keywords: string[];
  role_tags: string[];
}

interface AlgorithmQuestion {
  id: string;
  title: string;
  title_en: string;
  difficulty: string;
  tags: string[];
  prompt: string;
  expected_approaches: string[];
  hints: string[];
  edge_cases: string[];
  related_keywords: string[];
  role_tags: string[];
}

interface ModeProfile {
  mode: string;
  aliases: string[];
  stage_sequence: string[];
  default_question_counts: Record<string, number>;
  selection_policy: Record<string, string>;
}

// ========== Keyword extraction ==========

function extractKeywords(text: string, knownWords: Set<string>): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const word of knownWords) {
    if (lower.includes(word.toLowerCase())) {
      found.push(word);
    }
  }
  return found;
}

function buildKnownKeywords(fundamentals: FundamentalQuestion[], algorithms: AlgorithmQuestion[]): Set<string> {
  const words = new Set<string>();
  for (const q of fundamentals) {
    for (const kw of q.related_keywords) words.add(kw);
    words.add(q.topic);
    words.add(q.subtopic);
  }
  for (const q of algorithms) {
    for (const kw of q.related_keywords) words.add(kw);
    for (const tag of q.tags) words.add(tag);
  }
  return words;
}

// ========== Scoring ==========

function scoreFundamental(
  q: FundamentalQuestion,
  profileKeywords: string[],
  jdKeywords: string[],
  focusTerms: string[],
  role: string,
  difficulty: string,
  layer: string,
): { score: number; reasons: string[] } {
  let score = 0.1;
  const reasons: string[] = [];

  // Profile keyword match
  for (const kw of profileKeywords) {
    if (q.related_keywords.some((rk) => rk.toLowerCase() === kw.toLowerCase())) {
      score += 4;
      reasons.push(`profile:${kw}`);
    }
    if (q.topic.toLowerCase().includes(kw.toLowerCase())) {
      score += 3;
      reasons.push(`profile_topic:${kw}`);
    }
  }

  // JD keyword match
  for (const kw of jdKeywords) {
    if (q.related_keywords.some((rk) => rk.toLowerCase() === kw.toLowerCase())) {
      score += 3;
      reasons.push(`jd:${kw}`);
    }
  }

  // Focus terms
  for (const term of focusTerms) {
    if (q.related_keywords.some((rk) => rk.toLowerCase().includes(term.toLowerCase()))) {
      score += 6;
      reasons.push(`focus:${term}`);
    }
    if (q.topic.toLowerCase().includes(term.toLowerCase())) {
      score += 4;
      reasons.push(`focus_topic:${term}`);
    }
  }

  // Role tag match
  if (role && q.role_tags.some((rt) => rt.toLowerCase() === role.toLowerCase())) {
    score += 2.5;
    reasons.push(`role:${role}`);
  }

  // Difficulty alignment
  const diffMap: Record<string, number> = { '简单': 0, '中等': 1, '困难': 2 };
  const qDiff = diffMap[q.difficulty] ?? 1;
  const targetDiff = diffMap[difficulty] ?? 1;
  const diffDelta = Math.abs(qDiff - targetDiff);
  if (diffDelta === 0) { score += 5; reasons.push('diff_exact'); }
  else if (diffDelta === 1) { score -= 2; reasons.push('diff_1off'); }
  else { score -= 5; reasons.push('diff_2off'); }

  // Layer alignment
  const layerMap: Record<string, number> = { 'basic': 0, 'standard': 1, 'deep': 2 };
  const qLayer = layerMap[q.layer] ?? 1;
  const targetLayer = layerMap[layer] ?? 1;
  const layerDelta = Math.abs(qLayer - targetLayer);
  if (layerDelta === 0) { score += 5; reasons.push('layer_exact'); }
  else if (layerDelta === 1) { score -= 1.5; }
  else { score -= 4; }

  return { score: Math.max(0.1, score), reasons };
}

function scoreAlgorithm(
  q: AlgorithmQuestion,
  profileKeywords: string[],
  jdKeywords: string[],
  focusTerms: string[],
  role: string,
  difficulty: string,
): { score: number; reasons: string[] } {
  let score = 0.1;
  const reasons: string[] = [];

  for (const kw of profileKeywords) {
    if (q.tags.some((t) => t.toLowerCase() === kw.toLowerCase()) || q.related_keywords.some((rk) => rk.toLowerCase() === kw.toLowerCase())) {
      score += 3;
      reasons.push(`profile:${kw}`);
    }
  }
  for (const kw of jdKeywords) {
    if (q.related_keywords.some((rk) => rk.toLowerCase() === kw.toLowerCase())) {
      score += 2;
      reasons.push(`jd:${kw}`);
    }
  }
  for (const term of focusTerms) {
    if (q.tags.some((t) => t.toLowerCase().includes(term.toLowerCase())) || q.related_keywords.some((rk) => rk.toLowerCase().includes(term.toLowerCase()))) {
      score += 4;
      reasons.push(`focus:${term}`);
    }
  }
  if (role && q.role_tags.some((rt) => rt.toLowerCase() === role.toLowerCase())) {
    score += 2;
    reasons.push(`role:${role}`);
  }

  const diffMatch = q.difficulty === difficulty ? 5 : q.difficulty === 'medium' && difficulty === '中等' ? 5 : q.difficulty === 'easy' && difficulty === '简单' ? 5 : q.difficulty === 'hard' && difficulty === '困难' ? 5 : -2;
  score += diffMatch;
  if (diffMatch > 0) reasons.push('diff_match');

  return { score: Math.max(0.1, score), reasons };
}

// ========== Pick diverse ==========

function pickDiverse<T>(items: Array<{ item: T; score: number; reasons: string[] }>, count: number, keyFn: (item: T) => string, maxPerKey = 2): T[] {
  const picked: T[] = [];
  const keyCounts = new Map<string, number>();
  const sorted = [...items].sort((a, b) => b.score - a.score);

  for (const { item } of sorted) {
    if (picked.length >= count) break;
    const key = keyFn(item);
    const cnt = keyCounts.get(key) || 0;
    if (cnt < maxPerKey) {
      picked.push(item);
      keyCounts.set(key, cnt + 1);
    }
  }
  return picked;
}

// ========== Main selection ==========

export async function selectQuestions(
  config: SessionConfig,
  profileText = '',
  jdText = '',
): Promise<Record<string, CurrentQuestion[]>> {
  const [fundamentalsRaw, algorithmsRaw, modeProfilesRaw] = await Promise.all([
    loadData<{ questions: FundamentalQuestion[] }>('fundamental_questions.json'),
    loadData<{ questions: AlgorithmQuestion[] }>('algorithm_questions.json'),
    loadData<{ profiles: Record<string, ModeProfile> }>('interview_mode_profiles.json'),
  ]);
  const fundamentals = fundamentalsRaw.questions || (fundamentalsRaw as unknown as FundamentalQuestion[]);
  const algorithms = algorithmsRaw.questions || (algorithmsRaw as unknown as AlgorithmQuestion[]);
  const modeProfiles = modeProfilesRaw.profiles || (modeProfilesRaw as unknown as Record<string, ModeProfile>);

  const knownWords = buildKnownKeywords(fundamentals, algorithms);
  const profileKeywords = extractKeywords(profileText, knownWords);
  const jdKeywords = extractKeywords(jdText, knownWords);
  const focusTerms = config.focus || [];
  const role = config.role || '';
  const mode = config.mode || '完整模拟';
  const difficulty = config.level || '中等';

  // Map strength to layer
  const strengthLayer: Record<string, string> = {
    '拉完了': 'basic', 'NPC': 'basic', '人上人': 'standard', '顶级': 'deep', '夯': 'deep',
  };
  const layer = strengthLayer[config.strength] || 'standard';

  // Score all questions
  const scoredFundamentals = fundamentals.map((q) => ({
    item: q,
    ...scoreFundamental(q, profileKeywords, jdKeywords, focusTerms, role, difficulty, layer),
  }));

  const scoredAlgorithms = algorithms.map((q) => ({
    item: q,
    ...scoreAlgorithm(q, profileKeywords, jdKeywords, focusTerms, role, difficulty),
  }));

  // Determine counts based on mode
  let fundamentalsCount = 5;
  let algorithmsCount = 2;
  if (mode === '项目深挖') { fundamentalsCount = 0; algorithmsCount = 0; }
  if (mode === '八股快问快答') { fundamentalsCount = 8; algorithmsCount = 0; }
  if (mode === '算法陪练') { fundamentalsCount = 0; algorithmsCount = 3; }

  const selectedFundamentals = pickDiverse(scoredFundamentals, fundamentalsCount, (q) => q.topic);
  const selectedAlgorithms = pickDiverse(scoredAlgorithms, algorithmsCount, (q) => q.tags[0] || q.id);

  // Build question plan by stage
  const plan: Record<string, CurrentQuestion[]> = {};

  if (mode !== '项目深挖' && mode !== '八股快问快答' && mode !== '算法陪练' && mode !== '简历拷打') {
    plan['SELF_INTRO'] = [{
      stage: 'SELF_INTRO',
      question_id: 'self_intro_001',
      question_text: '请先做一个 2-3 分钟的自我介绍，重点突出与你目标岗位最匹配的经历、项目和技术亮点。',
      metadata: { kind: 'self_intro' },
    }];
  }

  // Look up mode config by name or alias
  const modeCfg = modeProfiles[mode] || Object.values(modeProfiles).find(
    (m: ModeProfile) => m.aliases?.includes(mode)
  );
  const stageSeq = modeCfg?.stage_sequence || ['SELF_INTRO', 'PROJECT_DEEP_DIVE', 'CS_FUNDAMENTALS', 'CODING_INTERVIEW', 'CANDIDATE_QUESTIONS'];

  for (const stage of stageSeq) {
    if (stage === 'SELF_INTRO' && plan['SELF_INTRO']) continue;
    if (stage === 'CS_FUNDAMENTALS') {
      plan['CS_FUNDAMENTALS'] = selectedFundamentals.map((q) => ({
        stage: 'CS_FUNDAMENTALS',
        question_id: q.id,
        question_text: q.question,
        metadata: { kind: 'fundamental', topic: q.topic, subtopic: q.subtopic, difficulty: q.difficulty, expected_points: q.expected_points },
      }));
    }
    if (stage === 'CODING_INTERVIEW') {
      plan['CODING_INTERVIEW'] = selectedAlgorithms.map((q) => ({
        stage: 'CODING_INTERVIEW',
        question_id: q.id,
        question_text: q.prompt,
        metadata: { kind: 'algorithm', difficulty: q.difficulty, tags: q.tags, hints: q.hints, expected_approaches: q.expected_approaches },
      }));
    }
  }

  // PROJECT_DEEP_DIVE is dynamic (LLM-driven), so we leave it empty with a placeholder
  if (!plan['PROJECT_DEEP_DIVE'] && stageSeq.includes('PROJECT_DEEP_DIVE')) {
    plan['PROJECT_DEEP_DIVE'] = [];
  }

  return plan;
}
