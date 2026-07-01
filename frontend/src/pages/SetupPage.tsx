import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useConfigStore } from '../store/configStore';
import { useUIStore } from '../store/uiStore';
import { SetupWizard } from '../components/setup/SetupWizard';
import { ResumeUploadStep } from '../components/setup/ResumeUploadStep';
import { JDInputStep } from '../components/setup/JDInputStep';
import { ConfigStep } from '../components/setup/ConfigStep';
import { ReviewStep } from '../components/setup/ReviewStep';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { api } from '../api/client';
import { toast } from '../components/shared/Toast';

const STEPS = ['简历上传', '岗位描述', '面试配置', '确认开始'];

export function SetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const setSession = useSessionStore((s) => s.setSession);
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const setActivePage = useUIStore((s) => s.setActivePage);

  const { selectedRole, selectedMode, selectedStrength, selectedTone, selectedLevel, selectedFocus, jdText, resumePath } = useConfigStore();

  useEffect(() => {
    setActivePage('setup');
    // Load constants on mount
    api.get('/config/constants').then((data) => {
      useConfigStore.getState().setAvailableOptions(data as Record<string, Array<{id: string; label: string}>>);
      useConfigStore.getState().setStageLabels((data.stage_labels || {}) as Record<string, string>);
    }).catch(() => {});
  }, [setActivePage]);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      // 1. Create session
      const initRes = await api.post('/session/init', {
        resume_path: resumePath,
        session_name: 'interview',
      });

      const sid = initRes.session_id;
      setSession(sid, initRes.path);

      // 2. Set JD if provided
      if (jdText.trim()) {
        await api.post(`/session/${sid}/jd`, { jd_text: jdText });
      }

      // 3. Configure session
      await api.post(`/session/${sid}/configure`, {
        role: selectedRole || undefined,
        mode: selectedMode,
        strength: selectedStrength,
        tone: selectedTone,
        level: selectedLevel,
        focus: selectedFocus.length > 0 ? selectedFocus : undefined,
      });

      // 4. Read final state
      const stateRes = await api.get(`/session/${sid}/state`);
      setSessionState(stateRes as Parameters<typeof setSessionState>[0]);

      toast('面试配置完成!', 'success');
      navigate('/interview');
    } catch (err: unknown) {
      toast(`创建失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text">设置面试</h2>
          <p className="text-sm text-text-secondary mt-1">配置面试参数，开始一场CS技术模拟面试</p>
        </div>

        <SetupWizard steps={STEPS} currentStep={step} onStepClick={setStep}>
          {step === 0 && <ResumeUploadStep />}
          {step === 1 && <JDInputStep />}
          {step === 2 && <ConfigStep />}
          {step === 3 && <ReviewStep />}
        </SetupWizard>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            ← 上一步
          </Button>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                下一步 →
              </Button>
            ) : (
              <Button onClick={handleCreateSession} loading={loading}>
                🚀 开始面试
              </Button>
            )}
          </div>
        </div>

        {/* Existing sessions */}
        <ExistingSessions />
      </div>
    </div>
  );
}

function ExistingSessions() {
  const [sessions, setSessions] = useState<Array<{ session_id: string; runtime_status: string; mode?: string; created_at: string }>>([]);
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const setSessionState = useSessionStore((s) => s.setSessionState);

  useEffect(() => {
    api.get('/session/').then((data) => setSessions(data as Array<{ session_id: string; runtime_status: string; mode?: string; created_at: string }>)).catch(() => {});
  }, []);

  if (sessions.length === 0) return null;

  const handleResume = async (sid: string) => {
    try {
      const state = await api.get(`/session/${sid}/state`);
      setSession(sid, sessions.find((s) => s.session_id === sid)?.session_id || '');
      setSessionState(state as Parameters<typeof setSessionState>[0]);
      navigate('/interview');
    } catch {
      toast('恢复会话失败', 'error');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-text mb-3">历史会话</h3>
      <div className="space-y-2">
        {sessions.slice(0, 5).map((s) => (
          <Card key={s.session_id} padding="sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate font-mono">{s.session_id}</p>
                <p className="text-xs text-text-muted">
                  {s.mode || 'N/A'} · {new Date(s.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleResume(s.session_id)}>
                继续
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
