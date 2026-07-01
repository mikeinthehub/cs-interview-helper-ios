export const STAGE_LABELS: Record<string, string> = {
  SELF_INTRO: '自我介绍',
  PROJECT_DEEP_DIVE: '项目深挖',
  CS_FUNDAMENTALS: 'CS 基础',
  CODING_INTERVIEW: '算法面试',
  CANDIDATE_QUESTIONS: '候选人反问',
};

export const STATUS_LABELS: Record<string, string> = {
  INIT: '初始化',
  RESUME_PARSED: '简历已解析',
  CONFIG_READY: '配置就绪',
  RUNNING: '面试中',
  PAUSED: '已暂停',
  REPORT_GENERATION: '生成报告',
  DONE: '已完成',
};

export const STATUS_COLORS: Record<string, string> = {
  INIT: 'bg-slate-500',
  RESUME_PARSED: 'bg-blue-500',
  CONFIG_READY: 'bg-amber-500',
  RUNNING: 'bg-emerald-500',
  PAUSED: 'bg-orange-500',
  REPORT_GENERATION: 'bg-purple-500',
  DONE: 'bg-slate-400',
};

export const QUALITY_COLORS: Record<string, string> = {
  strong: 'text-emerald-400 bg-emerald-500/10',
  partial: 'text-amber-400 bg-amber-500/10',
  weak: 'text-orange-400 bg-orange-500/10',
  wrong: 'text-red-400 bg-red-500/10',
};

export const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-400',
  'B+': 'text-blue-400',
  B: 'text-sky-400',
  C: 'text-amber-400',
  D: 'text-red-400',
};

export const API_BASE = '/api';
