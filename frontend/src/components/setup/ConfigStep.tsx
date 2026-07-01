import { useConfigStore } from '../../store/configStore';
import { Select } from '../shared/Select';
import { Badge } from '../shared/Badge';

const MODE_DESCRIPTIONS: Record<string, string> = {
  '完整模拟': '自我介绍→项目深挖→CS基础→算法→反问→复盘',
  '项目深挖': '重点拷打项目 ownership、架构、难点、tradeoff',
  '八股快问快答': '密集抽查基础知识，强调关键点覆盖',
  '算法陪练': '多题算法练习，思路、复杂度、边界和hint',
  'JD 定向面': '围绕岗位JD做能力匹配和风险追问',
  '简历拷打': '盯住简历里最容易被质疑的表述',
  '复盘教练': '基于transcript生成结构化复盘',
};

export function ConfigStep() {
  const {
    selectedRole, selectedMode, selectedStrength, selectedTone, selectedLevel, selectedFocus,
    availableRoles, availableModes, availableStrengths, availableTones, availableLevels,
    setSelected,
  } = useConfigStore();

  const handleFocusInput = (value: string) => {
    if (value.endsWith(',') || value.endsWith('，')) {
      const term = value.slice(0, -1).trim();
      if (term && !selectedFocus.includes(term)) {
        setSelected('selectedFocus', [...selectedFocus, term]);
      }
      return;
    }
  };

  const removeFocus = (term: string) => {
    setSelected('selectedFocus', selectedFocus.filter((f) => f !== term));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">配置面试参数。所有字段都有推荐默认值，可以直接使用。</p>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="面试模式"
          value={selectedMode}
          onChange={(v) => setSelected('selectedMode', v)}
          options={availableModes.length > 0
            ? availableModes.map((m) => ({ ...m, description: MODE_DESCRIPTIONS[m.id] || '' }))
            : Object.entries(MODE_DESCRIPTIONS).map(([id, desc]) => ({ id, label: id, description: desc }))
          }
          placeholder="选择模式"
        />
        <Select
          label="岗位角色"
          value={selectedRole}
          onChange={(v) => setSelected('selectedRole', v)}
          options={availableRoles.length > 0 ? availableRoles : [
            { id: 'backend-java', label: 'Java 后端' },
            { id: 'backend-python', label: 'Python 后端' },
            { id: 'backend-go', label: 'Go 后端' },
            { id: 'ai-agent', label: 'AI Agent' },
            { id: 'ai-rag', label: 'AI RAG' },
            { id: 'ai-eval', label: 'AI 评测' },
            { id: 'sre-platform', label: 'SRE 平台' },
          ]}
          placeholder="自动推断"
        />
        <Select
          label="面试强度"
          value={selectedStrength}
          onChange={(v) => setSelected('selectedStrength', v)}
          options={availableStrengths.length > 0 ? availableStrengths : [
            { id: '人上人', label: '人上人 — 标准追问深度' },
            { id: '顶级', label: '顶级 — 深度追问，高标准' },
            { id: '夯', label: '夯 — 最高强度追问' },
            { id: 'NPC', label: 'NPC — 降低深度，更多引导' },
            { id: '拉完了', label: '拉完了 — 基础级别' },
          ]}
        />
        <Select
          label="面试官语气"
          value={selectedTone}
          onChange={(v) => setSelected('selectedTone', v)}
          options={availableTones.length > 0 ? availableTones : [
            { id: '默认', label: '默认 — 专业直接' },
            { id: '温和', label: '温和 — 支持性更强' },
            { id: '铁面', label: '铁面 — 尖锐追问，压力面' },
          ]}
        />
        <Select
          label="题目难度"
          value={selectedLevel}
          onChange={(v) => setSelected('selectedLevel', v)}
          options={availableLevels.length > 0 ? availableLevels : [
            { id: '简单', label: '简单' },
            { id: '中等', label: '中等' },
            { id: '困难', label: '困难' },
          ]}
        />
      </div>

      {/* Focus topics */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">重点方向</label>
        <input
          type="text"
          placeholder="输入后按回车添加，如: Redis, MySQL, RAG"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val && !selectedFocus.includes(val)) {
                setSelected('selectedFocus', [...selectedFocus, val]);
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
          onChange={(e) => handleFocusInput(e.target.value)}
        />
        {selectedFocus.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedFocus.map((f) => (
              <Badge key={f} size="sm" variant="info">
                {f}
                <button className="ml-1 text-text-muted hover:text-text" onClick={() => removeFocus(f)}>×</button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
