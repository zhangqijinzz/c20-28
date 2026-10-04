import { Check, ClipboardCheck, ListChecks, X } from 'lucide-react'
import type { PlacementChecklistItem, PlacementSummary } from '../placementViewModel'
import { getDeviceDefinition } from '../../../shared/models'

interface PlacementChecklistPanelProps {
  summary: PlacementSummary
  items: PlacementChecklistItem[]
  onToggle: (id: string, placed: boolean) => void
  onMarkAll: () => void
  onExit: () => void
}

export function PlacementChecklistPanel({ summary, items, onToggle, onMarkAll, onExit }: PlacementChecklistPanelProps) {
  const remainingItems = items.filter((item) => !item.placed)
  const placedItems = items.filter((item) => item.placed)

  const renderPlacementItem = ({ item, label, sequence, placed }: PlacementChecklistItem) => {
    const definition = getDeviceDefinition(item.type)
    return (
      <button key={item.id} type="button" className={`placement-item ${placed ? 'is-placed' : ''}`} onClick={() => onToggle(item.id, !placed)} aria-pressed={placed}>
        <span className="placement-number">{sequence}</span>
        <span className="placement-swatch" style={{ backgroundColor: definition.color }} />
        <span className="placement-copy">
          <strong>{label}</strong>
          <small>{definition.shortLabel} · {item.widthMm} × {item.heightMm} mm</small>
        </span>
        <span className="placement-check" aria-hidden="true">{placed ? <Check size={14} /> : <X size={13} />}</span>
      </button>
    )
  }

  return (
    <aside className="inspector-panel placement-panel">
      <div className="module-heading">
        <div>
          <span className="eyebrow">03 / 现场核对</span>
          <h2>就位清单</h2>
        </div>
        <ClipboardCheck size={18} className="muted-icon" />
      </div>

      <div className={`placement-progress-card ${summary.complete ? 'is-complete' : ''}`}>
        <div className="placement-progress-heading">
          <span>{summary.complete ? '全部就位' : '现场核对中'}</span>
          <strong>{summary.placed}/{summary.total}</strong>
        </div>
        <div className="placement-progress-bar"><span style={{ width: `${summary.progressPercent}%` }} /></div>
        <p>{summary.total === 0 ? '方案里还没有设备' : summary.complete ? '所有设备均已确认到位' : `还差 ${summary.remaining} 件设备未就位`}</p>
      </div>

      <div className="placement-list-heading">
        <span><ListChecks size={14} /> 逐件核对</span>
        {summary.remaining > 0 && <button type="button" onClick={onMarkAll}>全部就位</button>}
      </div>

      <div className="placement-list">
        {items.length === 0 ? (
          <div className="placement-empty">先在方案中添加设备，再进入现场核对。</div>
        ) : (
          <>
            {remainingItems.length > 0 && (
              <section className="placement-group">
                <h3>待就位 <span>{remainingItems.length}</span></h3>
                {remainingItems.map(renderPlacementItem)}
              </section>
            )}
            {placedItems.length > 0 && (
              <section className="placement-group">
                <h3>已就位 <span>{placedItems.length}</span></h3>
                {placedItems.map(renderPlacementItem)}
              </section>
            )}
          </>
        )}
      </div>

      <button className="exit-placement-button" type="button" onClick={onExit}>退出核对模式</button>
    </aside>
  )
}
