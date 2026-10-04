import { describe, expect, it } from 'vitest'
import { createInitialDocument, createItem, createPlan } from '../../../shared/models'
import { normalizeWorkspaceDocument } from '../documentNormalizer'

describe('workspace document normalizer', () => {
  it('adds an empty placement list to documents saved before placement mode', () => {
    const plan = createPlan('旧方案')
    const legacyDocument = { version: 1, plans: [{ ...plan }], activePlanId: plan.id }
    delete (legacyDocument.plans[0] as { placedItemIds?: string[] }).placedItemIds

    const normalized = normalizeWorkspaceDocument(legacyDocument)

    expect(normalized?.plans[0].placedItemIds).toEqual([])
  })

  it('drops placement records whose devices no longer exist', () => {
    const plan = createPlan('核对方案')
    const item = plan.items[0]
    const normalized = normalizeWorkspaceDocument({
      version: 1,
      plans: [{ ...plan, placedItemIds: [item.id, 'deleted-item'] }],
      activePlanId: plan.id,
    })

    expect(normalized?.plans[0].placedItemIds).toEqual([item.id])
  })

  it('keeps a valid document shape', () => {
    const document = createInitialDocument()
    expect(normalizeWorkspaceDocument(document)).toEqual(document)
  })

  it('rejects an empty plan list and unknown item type', () => {
    expect(normalizeWorkspaceDocument({ version: 1, plans: [], activePlanId: 'plan' })).toBeNull()
    const plan = createPlan('坏设备', false)
    const badItem = createItem('monitor')
    badItem.type = 'unknown' as never
    expect(normalizeWorkspaceDocument({ version: 1, plans: [{ ...plan, items: [badItem] }], activePlanId: plan.id })).toBeNull()
  })
})
