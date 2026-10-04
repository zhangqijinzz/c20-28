import { describe, expect, it } from 'vitest'
import { createItem, createPlan, duplicatePlan, normalizeDocument, normalizePlan, pruneCheckedItemIds, type WorkspacePlan } from '../models'

describe('plan checklist persistence rules', () => {
  it('prunes checked ids for items that no longer exist', () => {
    const alive = createItem('monitor')
    const removed = createItem('keyboard')
    const plan = { ...createPlan('核对', false), items: [alive], checkedItemIds: [alive.id, removed.id, removed.id] }
    expect(pruneCheckedItemIds(plan.items, plan.checkedItemIds)).toEqual([alive.id])
  })

  it('tolerates legacy plans that have no checkedItemIds field', () => {
    const item = createItem('lamp')
    const legacy = { ...createPlan('旧方案', false), items: [item] } as unknown as WorkspacePlan
    expect(normalizePlan(legacy).checkedItemIds).toEqual([])
  })

  it('normalizes every plan inside a document', () => {
    const plan = createPlan('方案', false)
    const legacy = { ...createPlan('旧方案', false), checkedItemIds: undefined } as unknown as WorkspacePlan
    const document = normalizeDocument({ version: 1, plans: [plan, legacy], activePlanId: plan.id })
    expect(document.plans[0].checkedItemIds).toEqual([])
    expect(document.plans[1].checkedItemIds).toEqual([])
  })

  it('duplicates a plan with fresh ids and resets all check state', () => {
    const first = createItem('monitor')
    const second = createItem('keyboard')
    const source = { ...createPlan('原方案', false), items: [first, second], checkedItemIds: [first.id, second.id] }
    const copy = duplicatePlan(source)

    expect(copy.id).not.toBe(source.id)
    expect(copy.name).toBe('原方案 · 副本')
    expect(copy.items.map((item) => item.id)).not.toEqual(source.items.map((item) => item.id))
    expect(copy.checkedItemIds).toEqual([])
    expect(copy.items).toHaveLength(2)
    // 原方案的核对结果不受复制影响
    expect(source.checkedItemIds).toHaveLength(2)
  })
})
