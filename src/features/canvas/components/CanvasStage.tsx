import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Check, Move, RotateCw } from 'lucide-react'
import type { DeskItem, LayoutAnalysis, WorkspacePlan } from '../../../shared/models'
import { getDeviceDefinition } from '../../../shared/models'
import { getItemBounds } from '../../../shared/layoutRules'

interface CanvasStageProps {
  plan: WorkspacePlan
  selectedItemId: string | null
  analysis: LayoutAnalysis
  checkMode?: boolean
  checkedItemIds?: string[]
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onToggleChecked?: (id: string) => void
}

interface DragState { id: string; offsetX: number; offsetY: number }

export function CanvasStage({ plan, selectedItemId, analysis, checkMode = false, checkedItemIds = [], onSelect, onMove, onToggleChecked }: CanvasStageProps) {
  const stageRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const scaleToMm = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: ((clientX - rect.left) / rect.width) * plan.deskWidthMm, y: ((clientY - rect.top) / rect.height) * plan.deskHeightMm }
  }, [plan.deskHeightMm, plan.deskWidthMm])

  useEffect(() => {
    if (!drag) return
    const handleMove = (event: PointerEvent) => {
      const point = scaleToMm(event.clientX, event.clientY)
      if (!point) return
      onMove(drag.id, point.x - drag.offsetX, point.y - drag.offsetY)
    }
    const handleUp = () => setDrag(null)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp) }
  }, [drag, onMove, scaleToMm])

  const startDrag = (event: ReactPointerEvent<SVGGElement>, item: DeskItem) => {
    event.stopPropagation()
    const point = scaleToMm(event.clientX, event.clientY)
    if (!point) return
    if (checkMode) {
      onToggleChecked?.(item.id)
      return
    }
    onSelect(item.id)
    setDrag({ id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y })
  }

  const handleStagePointerDown = () => {
    if (!checkMode) onSelect(null)
  }

  const handleKeyDown = (item: DeskItem) => (event: ReactKeyboardEvent<SVGGElement>) => {
    if (!checkMode) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleChecked?.(item.id)
    }
  }

  return (
    <div className="canvas-wrap">
      <div className="canvas-toolbar">
        {checkMode
          ? <span className="check-mode-hint">点击设备切换“已就位”</span>
          : <span><Move size={14} /> 拖动设备调整位置</span>}
        <span><RotateCw size={14} /> 旋转请在右侧操作</span>
      </div>
      <svg ref={stageRef} className={`desk-canvas ${checkMode ? 'is-check-mode' : ''}`} viewBox={`0 0 ${plan.deskWidthMm} ${plan.deskHeightMm}`} role="img" aria-label={`桌面布局画布，${plan.deskWidthMm}乘${plan.deskHeightMm}毫米${checkMode ? '，核对模式' : ''}`} onPointerDown={handleStagePointerDown}>
        <defs>
          <pattern id="desk-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d8e1ed" strokeWidth="1" /></pattern>
          <filter id="item-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#20304a" floodOpacity=".12" /></filter>
        </defs>
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="#f8fafc" />
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="url(#desk-grid)" />
        <text x="34" y="48" fill="#a0aec0" fontSize="20" letterSpacing="3">FOCUS ZONE / {plan.deskWidthMm} × {plan.deskHeightMm} MM</text>
        {plan.items.map((item, itemIndex) => {
          const definition = getDeviceDefinition(item.type)
          const isSelected = selectedItemId === item.id
          const hasIssue = !checkMode && (analysis.overlapIds.includes(item.id) || analysis.outOfBoundsIds.includes(item.id))
          const isChecked = checkedItemIds.includes(item.id)
          const cx = item.x + item.widthMm / 2
          const cy = item.y + item.heightMm / 2
          const itemClass = [
            'desk-item',
            isSelected ? 'is-selected' : '',
            hasIssue ? 'has-issue' : '',
            checkMode ? (isChecked ? 'is-checked' : 'is-pending') : '',
          ].join(' ').trim()
          const stateLabel = checkMode ? `，${isChecked ? '已就位' : '未就位'}，编号${itemIndex + 1}` : ''
          return <g className={itemClass} key={item.id} onPointerDown={(event) => startDrag(event, item)} onKeyDown={handleKeyDown(item)} role="button" tabIndex={0} aria-label={`${definition.label}，${item.widthMm}乘${item.heightMm}毫米${stateLabel}`} aria-pressed={checkMode ? isChecked : undefined}>
            <g transform={`translate(${cx} ${cy}) rotate(${item.rotation})`}>
              <rect x={-item.widthMm / 2} y={-item.heightMm / 2} width={item.widthMm} height={item.heightMm} rx={Math.min(24, item.heightMm / 5)} fill={definition.color} filter="url(#item-shadow)" />
              <rect className="item-inner-line" x={-item.widthMm / 2 + 12} y={-item.heightMm / 2 + 12} width={Math.max(0, item.widthMm - 24)} height={Math.max(0, item.heightMm - 24)} rx={12} fill="none" />
              <text x="0" y="5" textAnchor="middle" fill="#1f2e44" fontWeight="700" fontSize={Math.max(18, Math.min(32, item.widthMm / 16))}>{definition.shortLabel}</text>
              <text x="0" y="30" textAnchor="middle" fill="#44546b" fontSize="16">{item.widthMm} × {item.heightMm}</text>
            </g>
            {isSelected && <rect className="selection-box" x={getItemBounds(item).left - 8} y={getItemBounds(item).top - 8} width={getItemBounds(item).width + 16} height={getItemBounds(item).height + 16} rx="12" fill="none" />}
            {hasIssue && <g transform={`translate(${Math.max(18, getItemBounds(item).right - 4)} ${Math.max(18, getItemBounds(item).top - 4)}`}><circle r="18" fill="#ef6a6a" /><text textAnchor="middle" y="7" fill="white" fontSize="22" fontWeight="700">!</text></g>}
            {checkMode && (
              isChecked
                ? <g className="check-badge check-badge-on" transform={`translate(${Math.max(20, getItemBounds(item).right - 2)} ${Math.max(20, getItemBounds(item).top - 2)})`}><circle r="19" fill="#2f9e72" /><Check size={20} x={-10} y={-10} color="white" strokeWidth={3.2} /></g>
                : <g className="check-badge check-badge-off" transform={`translate(${Math.max(20, getItemBounds(item).right - 2)} ${Math.max(20, getItemBounds(item).top - 2)})`}><circle r="19" fill="#fff" stroke="#e8a23d" strokeWidth="3" /><text textAnchor="middle" y="7" fill="#c47f16" fontSize="20" fontWeight="800">{itemIndex + 1}</text></g>
            )}
            {checkMode && !isChecked && <rect className="pending-box" x={getItemBounds(item).left - 7} y={getItemBounds(item).top - 7} width={getItemBounds(item).width + 14} height={getItemBounds(item).height + 14} rx="12" fill="none" />}
          </g>
        })}
        {plan.items.length === 0 && <g><circle cx={plan.deskWidthMm / 2} cy={plan.deskHeightMm / 2 - 12} r="32" fill="#e8eef6" /><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 2} textAnchor="middle" fill="#8493a8" fontSize="22">+</text><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 48} textAnchor="middle" fill="#8493a8" fontSize="22">从左侧添加第一件设备</text></g>}
      </svg>
      <div className="canvas-legend">
        {checkMode ? (
          <>
            <span><i className="legend-dot pending-dot" /> 未就位（点击勾选）</span>
            <span><i className="legend-dot checked-dot" /> 已就位</span>
          </>
        ) : (
          <>
            <span><i className="legend-dot clear-dot" /> 可用空间</span>
            <span><i className="legend-dot issue-dot" /> 冲突 / 越界</span>
          </>
        )}
        <span className="canvas-scale">网格：50 mm</span>
      </div>
    </div>
  )
}
