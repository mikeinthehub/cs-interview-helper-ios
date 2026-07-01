import { useState, useRef, useCallback, useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { voice, rate, loadVoices } = useVoiceStore();

  // Load available voices on mount and when they change
  useEffect(() => {
    loadVoices();
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [loadVoices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text || !text.trim()) return;

      // Cancel any current speech
      window.speechSynthesis.cancel();

      // Strip markdown-like syntax for cleaner speech
      const cleanText = text
        .replace(/[*_~`#]/g, '')       // Remove markdown formatting chars
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links → text only
        .replace(/```[\s\S]*?```/g, '（代码部分省略）') // Code blocks
        .replace(/`([^`]+)`/g, '$1')   // Inline code
        .replace(/\n{2,}/g, '。')      // Double newline → period pause
        .replace(/\n/g, '，')           // Single newline → comma pause
        .replace(/\s{2,}/g, ' ')        // Collapse whitespace
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Use the selected voice if available
      if (voice) {
        utterance.voice = voice;
      } else {
        // Try to find a good Chinese voice
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(
          (v) => v.lang === 'zh-CN' && v.localService
        ) || voices.find((v) => v.lang.startsWith('zh'));
        if (zhVoice) utterance.voice = zhVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        // 'canceled' is expected when we call stop() or a new speak()
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis error:', e.error);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voice, rate]
  );

  return { speak, stop, isSpeaking };
}
