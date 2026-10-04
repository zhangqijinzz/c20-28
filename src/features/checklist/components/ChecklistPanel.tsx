import { Check, CheckCheck, ClipboardCheck, ListChecks, RotateCcw, XCircle } from 'lucide-react'
import type { ChecklistSummary } from '../checklistViewModel'

interface ChecklistPanelProps {
  checklist: ChecklistSummary
  planName: string
  onToggle: (id: string) => void
  onCheckAll: () => void
  onReset: () => void
  onExit: () => void
}

export function ChecklistPanel({ checklist, planName, onToggle, onCheckAll, onReset, onExit }: ChecklistPanelProps) {
  const { total, checkedCount, pendingCount, percent, complete, entries } = checklist
  return (
    <aside className="inspector-panel checklist-panel">
      <div className="module-heading">
        <div><span className="eyebrow">03 / 现场核对</span><h2>就位核对</h2></div>
        <ClipboardCheck size={18} className="muted-icon" />
      </div>

      <div className="checklist-progress-card">
        <div className="checklist-progress-head">
          <strong>{complete ? '全部就位' : `已就位 ${checkedCount} / ${total} 件`}</strong>
          <span className={complete ? 'checklist-percent is-complete' : 'checklist-percent'}>{percent}%</span>
        </div>
        <div className="checklist-progress-bar">
          <span className={complete ? 'is-complete' : ''} style={{ width: `${Math.max(complete ? 0 : 2, percent)}%` }} />
        </div>
        <p className="helper-text">点击清单或画布上的设备，切换就位状态</p>
      </div>

      {total > 0 && (
        complete
          ? <div className="checklist-callout complete"><CheckCheck size={15} /><span>{planName} 的设备已全部就位，收工！</span></div>
          : <div className="checklist-callout pending"><ListChecks size={15} /><span>还差 {pendingCount} 件未就位，画布上以琥珀色框标出</span></div>
      )}

      <div className="checklist-actions">
        <button type="button" className="checklist-primary" onClick={onCheckAll} disabled={pendingCount === 0}><Check size={14} /> 全部就位</button>
        <button type="button" className="checklist-ghost" onClick={onReset} disabled={checkedCount === 0}><RotateCcw size={14} /> 重置</button>
      </div>

      {total === 0 ? (
        <div className="empty-inspector">
          <span className="empty-illustration">✓</span>
          <strong>方案里还没有设备</strong>
          <p>退出核对模式，先从左侧素材区添加设备。</p>
          <button type="button" className="checklist-exit-inline" onClick={onExit}>退出核对模式</button>
        </div>
      ) : (
        <ul className="checklist-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className={`checklist-row ${entry.checked ? 'is-checked' : ''}`}
                aria-pressed={entry.checked}
                aria-label={`${entry.checked ? '已就位' : '未就位'}：${entry.label}`}
                onClick={() => onToggle(entry.id)}
              >
                <span className="checklist-index">{String(entry.index).padStart(2, '0')}</span>
                <span className="selected-swatch" style={{ backgroundColor: entry.color }} />
                <span className="checklist-row-copy"><strong>{entry.label}</strong><small>{entry.hint}</small></span>
                <span className="checklist-box" aria-hidden="true">{entry.checked && <Check size={12} strokeWidth={3} />}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="checklist-exit" onClick={onExit}><XCircle size={14} /> 退出核对模式</button>
    </aside>
  )
}
