import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ClipboardCheck, Move, RotateCw } from 'lucide-react'
import type { DeskItem, LayoutAnalysis, WorkspacePlan } from '../../../shared/models'
import { getDeviceDefinition } from '../../../shared/models'
import { getItemBounds } from '../../../shared/layoutRules'

interface CanvasStageProps {
  plan: WorkspacePlan
  selectedItemId: string | null
  analysis: LayoutAnalysis
  checkMode?: boolean
  placedItemIds?: string[]
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onTogglePlacement?: (id: string, placed: boolean) => void
}

interface DragState { id: string; offsetX: number; offsetY: number }

export function CanvasStage({ plan, selectedItemId, analysis, checkMode = false, placedItemIds = [], onSelect, onMove, onTogglePlacement }: CanvasStageProps) {
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
    if (checkMode) {
      onTogglePlacement?.(item.id, !placedItemIds.includes(item.id))
      return
    }
    const point = scaleToMm(event.clientX, event.clientY)
    if (!point) return
    onSelect(item.id)
    setDrag({ id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y })
  }

  const deviceSequences = new Map<DeskItem['type'], number>()

  return (
    <div className="canvas-wrap">
      <div className="canvas-toolbar">
        {checkMode ? <span><ClipboardCheck size={14} /> 点击设备可切换就位状态</span> : <span><Move size={14} /> 拖动设备调整位置</span>}
        <span><RotateCw size={14} /> {checkMode ? '未就位设备以橙色描边标出' : '旋转请在右侧操作'}</span>
      </div>
      <svg ref={stageRef} className="desk-canvas" viewBox={`0 0 ${plan.deskWidthMm} ${plan.deskHeightMm}`} role="img" aria-label={`桌面布局画布，${plan.deskWidthMm}乘${plan.deskHeightMm}毫米`} onPointerDown={() => onSelect(null)}>
        <defs>
          <pattern id="desk-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d8e1ed" strokeWidth="1" /></pattern>
          <filter id="item-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#20304a" floodOpacity=".12" /></filter>
        </defs>
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="#f8fafc" />
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="url(#desk-grid)" />
        <text x="34" y="48" fill="#a0aec0" fontSize="20" letterSpacing="3">FOCUS ZONE / {plan.deskWidthMm} × {plan.deskHeightMm} MM</text>
        {plan.items.map((item) => {
          const definition = getDeviceDefinition(item.type)
          const isSelected = selectedItemId === item.id
          const hasIssue = analysis.overlapIds.includes(item.id) || analysis.outOfBoundsIds.includes(item.id)
          const isPlaced = placedItemIds.includes(item.id)
          const deviceSequence = (deviceSequences.get(item.type) ?? 0) + 1
          deviceSequences.set(item.type, deviceSequence)
          const bounds = getItemBounds(item)
          const cx = item.x + item.widthMm / 2
          const cy = item.y + item.heightMm / 2
          const placementClass = checkMode ? (isPlaced ? 'is-placement-placed' : 'is-placement-missing') : ''
          return <g className={`desk-item ${isSelected ? 'is-selected' : ''} ${hasIssue ? 'has-issue' : ''} ${placementClass}`} key={item.id} onPointerDown={(event) => startDrag(event, item)} role="button" tabIndex={0} aria-pressed={checkMode ? isPlaced : undefined} aria-label={`${definition.label} ${deviceSequence}，${item.widthMm}乘${item.heightMm}毫米${checkMode ? (isPlaced ? '，已就位' : '，未就位') : ''}`}>
            <g transform={`translate(${cx} ${cy}) rotate(${item.rotation})`}>
              <rect x={-item.widthMm / 2} y={-item.heightMm / 2} width={item.widthMm} height={item.heightMm} rx={Math.min(24, item.heightMm / 5)} fill={definition.color} filter="url(#item-shadow)" />
              <rect className="item-inner-line" x={-item.widthMm / 2 + 12} y={-item.heightMm / 2 + 12} width={Math.max(0, item.widthMm - 24)} height={Math.max(0, item.heightMm - 24)} rx={12} fill="none" />
              <text x="0" y="5" textAnchor="middle" fill="#1f2e44" fontWeight="700" fontSize={Math.max(18, Math.min(32, item.widthMm / 16))}>{definition.shortLabel}</text>
              <text x="0" y="30" textAnchor="middle" fill="#44546b" fontSize="16">{item.widthMm} × {item.heightMm}</text>
            </g>
            {checkMode && <rect className="placement-box" x={bounds.left - 10} y={bounds.top - 10} width={bounds.width + 20} height={bounds.height + 20} rx={14} fill="none" />}
            {isSelected && <rect className="selection-box" x={bounds.left - 8} y={bounds.top - 8} width={bounds.width + 16} height={bounds.height + 16} rx="12" fill="none" />}
            {checkMode && <g className="placement-badge" transform={`translate(${bounds.left + 18} ${Math.max(20, bounds.top - 6)})`}><circle r="20" /><text textAnchor="middle" y="7" fontSize="20" fontWeight="800">{isPlaced ? '✓' : deviceSequence}</text></g>}
            {hasIssue && <g transform={`translate(${Math.max(18, bounds.right - 4)} ${Math.max(18, bounds.top - 4)}`}><circle r="18" fill="#ef6a6a" /><text textAnchor="middle" y="7" fill="white" fontSize="22" fontWeight="700">!</text></g>}
          </g>
        })}
        {plan.items.length === 0 && <g><circle cx={plan.deskWidthMm / 2} cy={plan.deskHeightMm / 2 - 12} r="32" fill="#e8eef6" /><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 2} textAnchor="middle" fill="#8493a8" fontSize="22">+</text><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 48} textAnchor="middle" fill="#8493a8" fontSize="22">从左侧添加第一件设备</text></g>}
      </svg>
      <div className="canvas-legend">
        {checkMode ? <><span><i className="legend-dot placed-dot" /> 已就位</span><span><i className="legend-dot missing-dot" /> 未就位</span></> : <><span><i className="legend-dot clear-dot" /> 可用空间</span><span><i className="legend-dot issue-dot" /> 冲突 / 越界</span></>}
        <span className="canvas-scale">网格：50 mm</span>
      </div>
    </div>
  )
}
