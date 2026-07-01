import { create } from 'zustand';
import type { RoleOption, ConfigOption } from '../types/api';

interface ConfigStore {
  availableRoles: RoleOption[];
  availableModes: ConfigOption[];
  availableStrengths: ConfigOption[];
  availableTones: ConfigOption[];
  availableLevels: ConfigOption[];
  stageLabels: Record<string, string>;

  selectedRole: string;
  selectedMode: string;
  selectedStrength: string;
  selectedTone: string;
  selectedLevel: string;
  selectedFocus: string[];
  jdText: string;

  resumePath: string | null;
  resumeProfile: Record<string, unknown> | null;
  resumeRisksMd: string;

  setAvailableOptions: (opts: Record<string, (RoleOption | ConfigOption)[]>) => void;
  setStageLabels: (labels: Record<string, string>) => void;
  setSelected: (key: string, value: unknown) => void;
  setJdText: (text: string) => void;
  setResumeData: (path: string | null, profile: Record<string, unknown> | null, risksMd: string) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  availableRoles: [],
  availableModes: [],
  availableStrengths: [],
  availableTones: [],
  availableLevels: [],
  stageLabels: {},

  selectedRole: '',
  selectedMode: '完整模拟',
  selectedStrength: '人上人',
  selectedTone: '默认',
  selectedLevel: '中等',
  selectedFocus: [],
  jdText: '',

  resumePath: null,
  resumeProfile: null,
  resumeRisksMd: '',

  setAvailableOptions: (opts) =>
    set({
      availableRoles: (opts.roles as RoleOption[]) || [],
      availableModes: (opts.modes as ConfigOption[]) || [],
      availableStrengths: (opts.strengths as ConfigOption[]) || [],
      availableTones: (opts.tones as ConfigOption[]) || [],
      availableLevels: (opts.levels as ConfigOption[]) || [],
    }),
  setStageLabels: (labels) => set({ stageLabels: labels }),
  setSelected: (key, value) => set({ [key]: value } as Record<string, unknown>),
  setJdText: (text) => set({ jdText: text }),
  setResumeData: (path, profile, risksMd) =>
    set({ resumePath: path, resumeProfile: profile, resumeRisksMd: risksMd }),
  resetConfig: () =>
    set({
      selectedRole: '',
      selectedMode: '完整模拟',
      selectedStrength: '人上人',
      selectedTone: '默认',
      selectedLevel: '中等',
      selectedFocus: [],
      jdText: '',
      resumePath: null,
      resumeProfile: null,
      resumeRisksMd: '',
    }),
}));
