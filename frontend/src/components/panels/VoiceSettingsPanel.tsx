import { useEffect } from 'react';
import { useVoiceStore } from '../../store/voiceStore';
import { Card, CardHeader } from '../shared/Card';
import { cn } from '../../utils/cn';

const RATE_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function VoiceSettingsPanel() {
  const {
    voice, rate, autoRead, availableVoices,
    setVoiceByName, setRate, setAutoRead, loadVoices,
  } = useVoiceStore();

  useEffect(() => {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = () => loadVoices();
  }, [loadVoices]);

  const handleTest = () => {
    const testText = '你好，这是语音播报测试。请确认声音和语速是否合适。';
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const rateLabel = (r: number) => `${r.toFixed(2)}x`;

  return (
    <Card>
      <CardHeader title="🎤 语音设置" />

      {/* Auto-read toggle */}
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-text-secondary">🔊 自动播报题目</span>
        <button
          onClick={() => setAutoRead(!autoRead)}
          className={cn(
            'w-10 h-5 rounded-full transition-colors relative',
            autoRead ? 'bg-primary-500' : 'bg-border'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
              autoRead ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Voice selector */}
      <div className="py-1.5">
        <label className="text-sm text-text-secondary block mb-1">👤 播报声音</label>
        <select
          value={voice?.name || ''}
          onChange={(e) => setVoiceByName(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
        >
          {availableVoices.length === 0 && (
            <option value="">加载声音列表中...</option>
          )}
          {availableVoices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        {availableVoices.length === 0 && (
          <p className="text-[10px] text-text-muted mt-1">如果没有声音选项，请刷新页面后重试。</p>
        )}
      </div>

      {/* Rate slider */}
      <div className="py-1.5">
        <label className="text-sm text-text-secondary block mb-1">
          🏃 播报语速 <span className="text-xs text-primary-500 font-medium ml-1">{rateLabel(rate)}</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.05}
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-surface-alt cursor-pointer accent-primary-500"
          style={{
            background: `linear-gradient(to right, var(--color-primary-500, #6366f1) 0%, var(--color-primary-500, #6366f1) ${((rate - 0.5) / 1.5) * 100}%, var(--color-border, #e2e8f0) ${((rate - 0.5) / 1.5) * 100}%, var(--color-border, #e2e8f0) 100%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-0.5 px-0.5">
          {RATE_STEPS.map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={cn(
                'hover:text-text-secondary transition-colors',
                Math.abs(rate - r) < 0.03 && 'text-primary-500 font-medium'
              )}
            >
              {rateLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Test button */}
      <button
        onClick={handleTest}
        className="w-full mt-2 py-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors"
      >
        🔊 测试播报
      </button>
    </Card>
  );
}
