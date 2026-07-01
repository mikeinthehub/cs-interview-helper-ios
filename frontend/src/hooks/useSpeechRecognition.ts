import { useState, useRef, useCallback } from 'react';
import { useVoiceStore } from '../store/voiceStore';

interface SpeechRecognitionHook {
  isListening: boolean;
  interimText: string;
  startListening: (onFinal: (text: string) => void) => void;
  stopListening: () => void;
  browserSupported: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);
  const finalTextRef = useRef('');
  const setRecording = useVoiceStore((s) => s.setRecording);

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const browserSupported = !!SR;

  const startListening = useCallback(
    (onFinal: (text: string) => void) => {
      if (!SR || isListening) return;

      const recognition = new SR();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      finalTextRef.current = '';
      onFinalRef.current = onFinal;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          finalTextRef.current += final;
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'no-speech' and 'aborted' are normal, don't treat as errors
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition error:', event.error);
        }
        // On any error, finalize with whatever we have
        const final = finalTextRef.current + (interimText || '');
        if (final.trim() && onFinalRef.current) {
          onFinalRef.current(final.trim());
        }
        stopListeningInternal();
      };

      recognition.onend = () => {
        // If we have final text but recognition ended naturally, deliver it
        const final = finalTextRef.current;
        if (final.trim() && onFinalRef.current) {
          onFinalRef.current(final.trim());
        }
        stopListeningInternal();
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setRecording(true);
      setInterimText('');
    },
    [SR, isListening, interimText]
  );

  const stopListeningInternal = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setRecording(false);
    setInterimText('');
  }, []);

  const stopListening = useCallback(() => {
    const final = finalTextRef.current;
    if (final.trim() && onFinalRef.current) {
      onFinalRef.current(final.trim());
    }
    stopListeningInternal();
  }, [stopListeningInternal]);

  return { isListening, interimText, startListening, stopListening, browserSupported };
}
