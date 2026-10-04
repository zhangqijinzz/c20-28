import { describe, expect, it } from 'vitest'
import { createItem, createPlan } from '../../../shared/models'
import { allItemIdsChecked, summarizeChecklist, toggleItemChecked } from '../checklistViewModel'

describe('checklist view model', () => {
  it('starts every item pending and computes progress', () => {
    const plan = createPlan('核对', false)
    const summary = summarizeChecklist({ ...plan, items: [createItem('monitor'), createItem('keyboard')] })
    expect(summary.total).toBe(2)
    expect(summary.checkedCount).toBe(0)
    expect(summary.pendingCount).toBe(2)
    expect(summary.percent).toBe(0)
    expect(summary.complete).toBe(false)
    expect(summary.pendingIds).toHaveLength(2)
    expect(summary.entries.map((entry) => entry.checked)).toEqual([false, false])
  })

  it('counts only items present in the plan and distinguishes same-type devices', () => {
    const first = createItem('speaker')
    const second = createItem('speaker')
    const plan = { ...createPlan('核对', false), items: [first, second], checkedItemIds: [first.id] }
    const summary = summarizeChecklist(plan)
    expect(summary.checkedCount).toBe(1)
    expect(summary.percent).toBe(50)
    expect(summary.pendingIds).toEqual([second.id])
    expect(summary.entries.map((entry) => entry.label)).toEqual(['音箱 1', '音箱 2'])
    expect(summary.entries[0].index).toBe(1)
  })

  it('is complete only when there is at least one item and all are checked', () => {
    const empty = summarizeChecklist(createPlan('空', false))
    expect(empty.complete).toBe(false)
    expect(empty.percent).toBe(0)

    const item = createItem('lamp')
    const done = summarizeChecklist({ ...createPlan('核对', false), items: [item], checkedItemIds: [item.id] })
    expect(done.complete).toBe(true)
    expect(done.percent).toBe(100)
    expect(done.pendingIds).toEqual([])
  })

  it('toggles check state idempotently', () => {
    const item = createItem('monitor')
    expect(toggleItemChecked([], item.id)).toEqual([item.id])
    expect(toggleItemChecked([item.id], item.id)).toEqual([])
  })

  it('marks all current items checked', () => {
    const items = [createItem('monitor'), createItem('lamp')]
    expect(allItemIdsChecked(items)).toEqual(items.map((item) => item.id))
  })
})
