import { useConfigStore } from '../../store/configStore';
import { Card, CardHeader } from '../shared/Card';
import { Badge } from '../shared/Badge';

export function ReviewStep() {
  const {
    selectedRole, selectedMode, selectedStrength, selectedTone, selectedLevel, selectedFocus,
    jdText, resumeProfile, resumePath,
  } = useConfigStore();

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        确认以下配置，点击"开始面试"创建面试会话并进入对话。
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader title="面试配置" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">模式</span>
              <span className="text-text font-medium">{selectedMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">角色</span>
              <span className="text-text">{selectedRole || '自动推断'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">强度</span>
              <span className="text-text">{selectedStrength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">语气</span>
              <span className="text-text">{selectedTone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">难度</span>
              <span className="text-text">{selectedLevel}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="附加信息" />
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-text-muted text-xs">简历</span>
              <p className="text-text text-xs">
                {resumeProfile ? '✓ 已解析' : resumePath ? '已上传，未解析' : '— 未提供'}
              </p>
            </div>
            <div>
              <span className="text-text-muted text-xs">JD</span>
              <p className="text-text text-xs">
                {jdText ? `已设置 (${jdText.length}字)` : '— 未提供'}
              </p>
            </div>
            {selectedFocus.length > 0 && (
              <div>
                <span className="text-text-muted text-xs block mb-1">重点方向</span>
                <div className="flex flex-wrap gap-1">
                  {selectedFocus.map((f) => (
                    <Badge key={f} size="sm">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* JD preview */}
      {jdText && (
        <Card className="mt-3">
          <CardHeader title="JD 预览" />
          <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">{jdText.slice(0, 500)}{jdText.length > 500 ? '...' : ''}</pre>
        </Card>
      )}
    </div>
  );
}
