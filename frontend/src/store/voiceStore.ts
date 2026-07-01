import { create } from 'zustand';

interface VoiceState {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  autoRead: boolean;
  isRecording: boolean;
  availableVoices: SpeechSynthesisVoice[];

  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  setVoiceByName: (name: string) => void;
  setRate: (rate: number) => void;
  setAutoRead: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  loadVoices: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  voice: null,
  rate: parseFloat(localStorage.getItem('voiceRate') || '1.0'),
  autoRead: localStorage.getItem('voiceAutoRead') !== 'false',
  isRecording: false,
  availableVoices: [],

  setVoice: (voice) => {
    if (voice) localStorage.setItem('voiceName', voice.name);
    set({ voice });
  },

  setVoiceByName: (name) => {
    const voices = get().availableVoices;
    const found = voices.find((v) => v.name === name) || null;
    if (found) localStorage.setItem('voiceName', found.name);
    set({ voice: found });
  },

  setRate: (rate) => {
    localStorage.setItem('voiceRate', String(rate));
    set({ rate });
  },

  setAutoRead: (v) => {
    localStorage.setItem('voiceAutoRead', String(v));
    set({ autoRead: v });
  },

  setRecording: (v) => set({ isRecording: v }),

  loadVoices: () => {
    const voices = window.speechSynthesis.getVoices();
    // Filter to Chinese voices, prefer local (not network) voices
    const zh = voices.filter((v) => v.lang.startsWith('zh'));
    const localZh = zh.filter((v) => v.localService);
    const sorted = [...localZh, ...zh.filter((v) => !v.localService)];

    set({ availableVoices: sorted });

    // Restore saved voice or pick best default
    const savedName = localStorage.getItem('voiceName');
    const state = get();
    if (!state.voice && sorted.length > 0) {
      const saved = savedName ? sorted.find((v) => v.name === savedName) : null;
      // Default preference: female zh-CN native voices
      const preferred = sorted.find(
        (v) => v.lang === 'zh-CN' && v.localService && /(Hui|Yao|女|female)/i.test(v.name)
      );
      const best = saved || preferred || sorted[0];
      set({ voice: best });
    }
  },
}));
