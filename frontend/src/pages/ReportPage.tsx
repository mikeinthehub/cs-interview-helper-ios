import { useEffect, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useUIStore } from '../store/uiStore';
import { ReportView } from '../components/report/ReportView';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { api } from '../api/client';
import { toast } from '../components/shared/Toast';
import type { InterviewEvaluation } from '../types/report';

export function ReportPage() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActivePage('report');
  }, [setActivePage]);

  useEffect(() => {
    if (sessionId) {
      api.get(`/session/${sessionId}/evaluation`)
        .then((data) => setEvaluation(data as InterviewEvaluation))
        .catch(() => {});
    }
  }, [sessionId]);

  const handleGenerateReport = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await api.post(`/session/${sessionId}/report`);
      toast('报告已生成', 'success');
      const data = await api.get(`/session/${sessionId}/evaluation`);
      setEvaluation(data as InterviewEvaluation);
    } catch (err: unknown) {
      toast(`生成失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-base font-semibold text-text mb-2">暂无面试会话</h2>
          <p className="text-sm text-text-secondary mb-4">需要先创建并完成一场面试</p>
          <Button onClick={() => window.location.hash = '/setup'}>去配置</Button>
        </Card>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h2 className="text-base font-semibold text-text mb-2">尚未生成复盘报告</h2>
          <p className="text-sm text-text-secondary mb-4">面试完成后可以生成结构化复盘报告</p>
          <Button onClick={handleGenerateReport} loading={loading}>
            📋 生成报告
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <ReportView evaluation={evaluation} />
    </div>
  );
}
