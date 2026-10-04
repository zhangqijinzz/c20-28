import { Check, ClipboardCheck, Cloud, FileCheck2, PanelTop, TriangleAlert } from 'lucide-react'
import { DEVICE_DEFINITIONS } from '../shared/models'
import { CanvasStage } from '../features/canvas/components/CanvasStage'
import { DevicePalette } from '../features/materials/components/DevicePalette'
import { InspectorPanel } from '../features/inspection/components/InspectorPanel'
import { ChecklistPanel } from '../features/checklist/components/ChecklistPanel'
import { PreviewOverlay } from '../features/inspection/components/PreviewOverlay'
import { PlanSidebar } from '../features/workbench/components/PlanSidebar'
import { useWorkspaceViewModel } from '../features/workbench/workbenchViewModel'

export function App() {
  const viewModel = useWorkspaceViewModel()
  const { document, activePlan, selectedItem, analysis, issueIds, issueCount, checklist, isCheckMode } = viewModel

  if (!document || !activePlan) {
    return <main className="loading-screen"><span className="loading-orb" /><p>正在打开 FocusDesk…</p></main>
  }

  return (
    <main className="app-shell">
      <PlanSidebar plans={document.plans} activePlanId={document.activePlanId} onSelect={viewModel.selectPlan} onCreate={viewModel.createNewPlan} onDuplicate={viewModel.duplicateCurrentPlan} onDelete={viewModel.deleteCurrentPlan} />
      <section className="app-main">
        <header className="topbar">
          <div className="breadcrumb"><span>工作台</span><span>/</span><strong>{activePlan.name}</strong></div>
          <div className="topbar-actions">
            <span className={`save-state ${viewModel.status === 'error' ? 'save-error' : ''}`}><Cloud size={15} /> {viewModel.status === 'saving' ? '保存中…' : viewModel.status === 'error' ? '保存异常' : '已保存到本地'}</span>
            <button className={`preview-button check-toggle ${isCheckMode ? 'is-active' : ''}`} onClick={isCheckMode ? viewModel.exitCheckMode : viewModel.enterCheckMode} type="button"><ClipboardCheck size={16} /> {isCheckMode ? '退出核对' : '现场核对'}</button>
            <button className="preview-button" onClick={viewModel.openPreview} type="button"><PanelTop size={16} /> 预览方案</button>
            <span className="avatar">FD</span>
          </div>
        </header>
        <div className="workspace-content">
          <div className="page-heading"><div><span className="eyebrow">DESK PLANNER / {new Date().getFullYear()}</span><h1>把桌面，变成一张清晰的地图。</h1><p>{isCheckMode ? '核对模式：按设备逐件确认，未就位的在画布上一目了然。' : '先放置，再调整。每个尺寸与间距都在你的掌控之中。'}</p></div><div className="feedback-chip"><span className={viewModel.status === 'error' ? 'feedback-icon error' : 'feedback-icon'}>{viewModel.status === 'error' ? <TriangleAlert size={14} /> : <Check size={14} />}</span>{viewModel.feedback}</div></div>
          <div className="metrics-row"><div className="metric-card"><span>桌面尺寸</span><strong>{activePlan.deskWidthMm} <i>×</i> {activePlan.deskHeightMm}<small>mm</small></strong><em>可用面积</em></div><div className="metric-card"><span>已放置设备</span><strong>{activePlan.items.length}<small>件</small></strong><em>{isCheckMode ? `已就位 ${checklist.checkedCount} 件` : '点击设备可编辑'}</em></div><div className={`metric-card ${analysis.status === 'attention' ? 'metric-warning' : ''}`}><span>空间检查</span><strong>{issueCount === 0 ? '通过' : `${issueCount} 个问题`}</strong><em>{issueCount === 0 ? '布局目前很舒展' : '请查看红色标记'}</em></div><div className="coverage-card"><div><span>占用率</span><strong>{analysis.coveragePercent}%</strong></div><div className="coverage-bar"><span style={{ width: `${Math.max(4, analysis.coveragePercent)}%` }} /></div><small>设备投影面积 / 桌面面积</small></div></div>
          <div className={`editor-grid ${isCheckMode ? 'is-check-mode' : ''}`}>
            {!isCheckMode && <DevicePalette devices={DEVICE_DEFINITIONS} onAdd={viewModel.addItem} />}
            <section className="stage-panel"><div className="stage-header"><div><span className="eyebrow">{isCheckMode ? 'ON-SITE CHECK' : 'LIVE CANVAS'}</span><h2>{activePlan.name}</h2></div>{isCheckMode
              ? <div className={`status-pill ${checklist.complete ? '' : 'status-attention'}`}><ClipboardCheck size={14} />{checklist.complete ? '全部就位' : `已就位 ${checklist.checkedCount}/${checklist.total}`}</div>
              : <div className={`status-pill ${analysis.status === 'attention' ? 'status-attention' : ''}`}>{analysis.status === 'attention' ? <TriangleAlert size={14} /> : <FileCheck2 size={14} />}{analysis.status === 'attention' ? '需要调整' : '布局健康'}</div>}</div>
              <CanvasStage plan={activePlan} selectedItemId={selectedItem?.id ?? null} analysis={analysis} checkMode={isCheckMode} checkedItemIds={activePlan.checkedItemIds} onSelect={viewModel.selectItem} onMove={viewModel.moveItem} onToggleChecked={viewModel.toggleChecked} />
            </section>
            {isCheckMode
              ? <ChecklistPanel checklist={checklist} planName={activePlan.name} onToggle={viewModel.toggleChecked} onCheckAll={viewModel.checkAll} onReset={viewModel.resetChecks} onExit={viewModel.exitCheckMode} />
              : <InspectorPanel plan={activePlan} item={selectedItem} issueIds={issueIds} onUpdateDesk={viewModel.updateDesk} onUpdateItem={viewModel.updateItem} onRotate={viewModel.rotateItem} onDelete={viewModel.removeItem} />}
          </div>
        </div>
      </section>
      {viewModel.isPreviewOpen && <PreviewOverlay plan={activePlan} analysis={analysis} issueCount={issueCount} onClose={viewModel.closePreview} />}
    </main>
  )
}
