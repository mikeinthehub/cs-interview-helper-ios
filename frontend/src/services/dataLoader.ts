/**
 * Load bundled JSON/MD data files via Vite static imports.
 * iOS WKWebView blocks fetch() for local files, so we bundle at build time.
 */

// Static imports — Vite bundles these into the JS at build time
import skillMd from '../../public/assets/data/SKILL.md?raw';
import fundamentalQuestionsRaw from '../../public/assets/data/fundamental_questions.json';
import algorithmQuestionsRaw from '../../public/assets/data/algorithm_questions.json';
import modeProfilesRaw from '../../public/assets/data/interview_mode_profiles.json';
import roleProfilesRaw from '../../public/assets/data/role_profiles.json';

// Cache
let _skillMd = '';
let _fundamentalQuestions: unknown = null;
let _algorithmQuestions: unknown = null;
let _modeProfiles: unknown = null;
let _roleProfiles: unknown = null;

export function getSkillMd(): string {
  if (!_skillMd) _skillMd = skillMd;
  return _skillMd;
}

export function getFundamentalQuestions(): unknown {
  if (!_fundamentalQuestions) _fundamentalQuestions = fundamentalQuestionsRaw;
  return _fundamentalQuestions;
}

export function getAlgorithmQuestions(): unknown {
  if (!_algorithmQuestions) _algorithmQuestions = algorithmQuestionsRaw;
  return _algorithmQuestions;
}

export function getModeProfiles(): unknown {
  if (!_modeProfiles) _modeProfiles = modeProfilesRaw;
  return _modeProfiles;
}

export function getRoleProfiles(): unknown {
  if (!_roleProfiles) _roleProfiles = roleProfilesRaw;
  return _roleProfiles;
}

// For backward compat
export async function loadData<T = unknown>(filename: string): Promise<T> {
  // Route to static imports
  const staticMap: Record<string, () => unknown> = {
    'SKILL.md': getSkillMd,
    'fundamental_questions.json': getFundamentalQuestions,
    'algorithm_questions.json': getAlgorithmQuestions,
    'interview_mode_profiles.json': getModeProfiles,
    'role_profiles.json': getRoleProfiles,
  };
  const fn = staticMap[filename];
  if (fn) return fn() as T;
  throw new Error(`Unknown data file: ${filename}. Add it to dataLoader.ts static imports.`);
}
