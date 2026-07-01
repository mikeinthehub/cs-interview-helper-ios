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
import { toast } from '../components/shared/Toast';
import { createSession, configureSession, saveSession } from '../services/sessionManager';
import { selectQuestions } from '../services/questionSelector';

const STEPS = ['简历上传', '岗位描述', '面试配置', '确认开始'];

export function SetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const setSession = useSessionStore((s) => s.setSession);
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const setActivePage = useUIStore((s) => s.setActivePage);

  const { selectedRole, selectedMode, selectedStrength, selectedTone, selectedLevel, selectedFocus, jdText } = useConfigStore();

  useEffect(() => {
    setActivePage('setup');
    // Load constants — bundled locally, no API needed
    useConfigStore.getState().setAvailableOptions({
      roles: [
        { id: 'backend-java', label: 'Java 后端' },
        { id: 'backend-python', label: 'Python 后端' },
        { id: 'backend-go', label: 'Go 后端' },
        { id: 'ai-agent', label: 'AI Agent' },
        { id: 'ai-rag', label: 'AI RAG' },
        { id: 'ai-eval', label: 'AI 评测' },
        { id: 'sre-platform', label: 'SRE 平台' },
      ],
      modes: [
        { id: '完整模拟', label: '完整模拟', description: '自我介绍→项目深挖→CS基础→算法→反问→复盘' },
        { id: '项目深挖', label: '项目深挖', description: '重点拷打项目 ownership、架构、难点、tradeoff' },
        { id: '八股快问快答', label: '八股快问快答', description: '密集抽查基础知识' },
        { id: '算法陪练', label: '算法陪练', description: '多题算法练习' },
        { id: 'JD 定向面', label: 'JD 定向面', description: '围绕岗位JD做能力匹配' },
        { id: '简历拷打', label: '简历拷打', description: '盯住简历里最易被质疑的表述' },
        { id: '复盘教练', label: '复盘教练', description: '基于transcript生成复盘' },
      ],
      strengths: [
        { id: '人上人', label: '人上人', description: '标准追问深度' },
        { id: '顶级', label: '顶级', description: '深度追问，高标准' },
        { id: '夯', label: '夯', description: '最高强度追问' },
        { id: 'NPC', label: 'NPC', description: '降低深度，更多引导' },
        { id: '拉完了', label: '拉完了', description: '基础级别' },
      ],
      tones: [
        { id: '默认', label: '默认', description: '专业直接' },
        { id: '温和', label: '温和', description: '支持性更强' },
        { id: '铁面', label: '铁面', description: '尖锐追问，压力面' },
      ],
      levels: [
        { id: '简单', label: '简单' }, { id: '中等', label: '中等' }, { id: '困难', label: '困难' },
      ],
    } as Record<string, Array<{ id: string; label: string; description?: string }>>);
    useConfigStore.getState().setStageLabels({
      SELF_INTRO: '自我介绍', PROJECT_DEEP_DIVE: '项目深挖', CS_FUNDAMENTALS: 'CS 基础',
      CODING_INTERVIEW: '算法面试', CANDIDATE_QUESTIONS: '候选人反问',
    });
  }, [setActivePage]);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      // 1. Create local session
      const state = createSession('interview');

      // 2. Configure
      const configured = configureSession(state, {
        role: selectedRole || undefined,
        mode: selectedMode,
        strength: selectedStrength,
        tone: selectedTone,
        level: selectedLevel,
        focus: selectedFocus.length > 0 ? selectedFocus : undefined,
        jd_text: jdText || undefined,
      });

      // 3. Generate question plan (stored by LLM at interview_start)
      await selectQuestions(configured.config);

      // 4. Save
      await saveSession(configured);

      setSession(configured.session_id, '');
      setSessionState(configured as Parameters<typeof setSessionState>[0]);

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
    import('../services/sessionManager').then(({ loadSession }) => {
      loadSession('').then(() => {
        // Use localStorage to find sessions
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('cs_interview_') && key.endsWith('_state.json')) {
            const id = key.replace('cs_interview_', '').replace('_state.json', '');
            keys.push(id);
          }
        }
        setSessions(keys.map((k) => ({ session_id: k, runtime_status: 'UNKNOWN', created_at: '' })));
      });
    }).catch(() => {});
  }, []);

  if (sessions.length === 0) return null;

  const handleResume = async (sid: string) => {
    try {
      const { loadSession } = await import('../services/sessionManager');
      const state = await loadSession(sid);
      if (state) {
        setSession(sid, '');
        setSessionState(state as Parameters<typeof setSessionState>[0]);
        navigate('/interview');
      }
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
