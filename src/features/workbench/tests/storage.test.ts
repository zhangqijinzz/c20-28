import { describe, expect, it } from 'vitest'
import { LocalWorkspaceRepository } from '../workspaceRepository'
import type { StorageService } from '../storageService'
import { createInitialDocument, createItem, createPlan } from '../../../shared/models'

function memoryStorage(initial: string | null = null): StorageService {
  let value = initial
  return { read: async () => value, write: async (next) => { value = next } }
}

describe('local workspace repository', () => {
  it('round trips a document', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage())
    const document = createInitialDocument()
    await repository.save(document)
    await expect(repository.load()).resolves.toEqual(document)
  })

  it('falls back when stored JSON is damaged', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage('{broken'))
    await expect(repository.load()).resolves.toBeNull()
  })

  it('migrates legacy plans without checklist data and drops stale check records', async () => {
    const item = createItem('monitor')
    const legacyPlan = { ...createPlan('旧方案', false), items: [item] }
    const legacyDocument = { version: 1 as const, plans: [legacyPlan], activePlanId: legacyPlan.id }
    const storage = memoryStorage(JSON.stringify(legacyDocument))
    const repository = new LocalWorkspaceRepository(storage)

    const loaded = await repository.load()
    expect(loaded?.plans[0].checkedItemIds).toEqual([])

    // 设备删除后，其核对记录在加载时一并清除，不留下永远勾不掉的条目
    const removed = createItem('lamp')
    const stalePlan = { ...createPlan('迁移', false), items: [item], checkedItemIds: [item.id, removed.id, 'ghost-id'] }
    const staleDocument = { version: 1 as const, plans: [stalePlan], activePlanId: stalePlan.id }
    const repository2 = new LocalWorkspaceRepository(memoryStorage(JSON.stringify(staleDocument)))
    const migrated = await repository2.load()
    expect(migrated?.plans[0].items).toHaveLength(1)
    expect(migrated?.plans[0].checkedItemIds).toEqual([item.id])
  })
})

