import { useConfigStore } from '../../store/configStore';

export function JDInputStep() {
  const jdText = useConfigStore((s) => s.jdText);
  const setJdText = useConfigStore((s) => s.setJdText);

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        粘贴目标岗位描述（JD），系统会把它作为整场面试的岗位语境，决定追问重点和评价标准。
      </p>

      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={12}
        placeholder="在这里粘贴岗位描述...

示例：
岗位职责：
- 负责后端服务架构设计与开发
- 参与分布式系统性能优化
- 设计高可用、可扩展的系统方案

任职要求：
- 3年以上Java/Python开发经验
- 熟悉MySQL、Redis、消息队列
- 有RAG、Agent、LLM相关经验优先"
        className="w-full bg-surface border border-border rounded-xl p-4 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
      />

      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-text-muted">
          {jdText.length > 0
            ? `已输入 ${jdText.length} 字符`
            : '留空则进行通用技术面试（不绑定特定JD）'}
        </p>
        {jdText.length > 0 && (
          <button
            onClick={() => setJdText('')}
            className="text-xs text-text-muted hover:text-text-secondary underline"
          >
            清除
          </button>
        )}
      </div>
    </div>
  );
}
