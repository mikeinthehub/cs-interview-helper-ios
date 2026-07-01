import { useState } from 'react';
import { useConfigStore } from '../../store/configStore';
import { FileDropzone } from '../shared/FileDropzone';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { api } from '../../api/client';
import { toast } from '../shared/Toast';

export function ResumeUploadStep() {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const { resumeProfile, resumeRisksMd, setResumeData } = useConfigStore();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.upload('/resume/upload', formData);

      setParsing(true);
      setFilename(file.name);
      toast('正在解析简历...', 'info');

      const parseRes = await api.post('/resume/parse', {
        resume_path: uploadRes.path,
      });

      setResumeData(uploadRes.path, parseRes.profile, parseRes.resume_risks_md);
      toast('简历解析完成!', 'success');
    } catch (err: unknown) {
      toast(`简历处理失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleSkip = () => {
    setResumeData(null, null, '');
    toast('已跳过简历上传', 'info');
  };

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        上传简历（可选），系统会自动解析技术栈、项目经历和潜在风险点。支持 PDF、DOCX、Markdown、TXT 格式。
      </p>

      {!resumeProfile && !filename && (
        <>
          <FileDropzone onFile={handleFile} />
          <div className="text-center mt-3">
            <button onClick={handleSkip} className="text-xs text-text-muted hover:text-text-secondary underline">
              跳过，不提供简历
            </button>
          </div>
        </>
      )}

      {(uploading || parsing) && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {uploading ? '上传中...' : '解析中，请稍候...'}
          </p>
        </div>
      )}

      {resumeProfile && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">
              ✓ 简历已解析
              {filename && <span className="text-text-muted font-normal ml-2 text-xs">({filename})</span>}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setResumeData(null, null, '')}>
              重新上传
            </Button>
          </div>
          {/* Quick profile summary */}
          <div className="space-y-2 text-sm">
            {!!resumeProfile?.candidate_profile && (
              <>
                {(resumeProfile.candidate_profile as Record<string, unknown>).name && (
                  <div className="flex gap-2">
                    <span className="text-text-muted">姓名:</span>
                    <span className="text-text">{String((resumeProfile.candidate_profile as Record<string, unknown>).name)}</span>
                  </div>
                )}
                {(resumeProfile.candidate_profile as Record<string, unknown>).target_roles && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-text-muted">目标方向:</span>
                    <div className="flex gap-1">
                      {((resumeProfile.candidate_profile as Record<string, unknown>).target_roles as string[])?.map((r: string) => (
                        <Badge key={r} size="sm" variant="info">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(resumeProfile.candidate_profile as Record<string, unknown>).skills && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-text-muted">技能:</span>
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries((resumeProfile.candidate_profile as Record<string, unknown>).skills as Record<string, string[]> || {})
                        .flatMap(([, list]) => list)
                        .slice(0, 8)
                        .map((s: string) => (
                          <Badge key={s} size="sm">{s}</Badge>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {resumeRisksMd && (
              <details className="mt-2">
                <summary className="text-xs text-amber-500 cursor-pointer">查看风险点</summary>
                <pre className="text-xs text-text-secondary mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">{resumeRisksMd}</pre>
              </details>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
