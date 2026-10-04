import { describe, expect, it } from 'vitest'
import { createItem, createPlan, duplicatePlan } from '../../../shared/models'
import { createPlacementChecklist, markAllPlaced, reconcilePlacedItemIds, setItemPlaced, summarizePlacement } from '../placementViewModel'

describe('placement checklist', () => {
  it('summarizes checked-in devices', () => {
    const plan = createPlan('核对', false)
    const first = createItem('monitor', 0)
    const second = createItem('keyboard', 1)
    const checked = setItemPlaced({ ...plan, items: [first, second] }, first.id, true)

    expect(summarizePlacement(checked)).toEqual({ total: 2, placed: 1, remaining: 1, progressPercent: 50, complete: false })
  })

  it('creates stable per-device checklist labels', () => {
    const plan = createPlan('核对', false)
    const first = createItem('monitor', 0)
    const second = createItem('monitor', 1)
    const items = createPlacementChecklist({ ...plan, items: [first, second] })

    expect(items.map((item) => item.label)).toEqual(['显示器 1', '显示器 2'])
  })

  it('removes placement records when a device is deleted and can mark all current devices', () => {
    const plan = createPlan('核对', false)
    const first = createItem('monitor', 0)
    const second = createItem('keyboard', 1)
    const stale = { ...plan, items: [first, second], placedItemIds: [first.id, second.id, 'removed-item'] }
    const reconciled = reconcilePlacedItemIds({ ...stale, items: [first] })

    expect(reconciled.placedItemIds).toEqual([first.id])
    expect(markAllPlaced({ ...reconciled, placedItemIds: [] }).placedItemIds).toEqual([first.id])
  })

  it('resets placement state when a plan is duplicated', () => {
    const source = createPlan('原方案')
    const plan = { ...source, placedItemIds: source.items.map((item) => item.id) }
    const copy = duplicatePlan(plan)

    expect(copy.id).not.toBe(plan.id)
    expect(copy.placedItemIds).toEqual([])
    expect(copy.items).toHaveLength(plan.items.length)
    expect(copy.items.some((item) => plan.items.some((source) => source.id === item.id))).toBe(false)
  })
})
