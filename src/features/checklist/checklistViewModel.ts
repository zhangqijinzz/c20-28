import { getDeviceDefinition, type DeskItem, type DeviceType, type WorkspacePlan } from '../../shared/models'

export interface ChecklistEntry {
  id: string
  index: number
  label: string
  hint: string
  color: string
  checked: boolean
}

export interface ChecklistSummary {
  total: number
  checkedCount: number
  pendingCount: number
  percent: number
  complete: boolean
  pendingIds: string[]
  entries: ChecklistEntry[]
}

export function summarizeChecklist(plan: WorkspacePlan): ChecklistSummary {
  const checkedSet = new Set(plan.checkedItemIds)
  const typeOccurrences = new Map<DeviceType, number>()

  const entries = plan.items.map((item, index) => {
    const occurrence = (typeOccurrences.get(item.type) ?? 0) + 1
    typeOccurrences.set(item.type, occurrence)
    const definition = getDeviceDefinition(item.type)
    return {
      id: item.id,
      index: index + 1,
      label: `${definition.label} ${occurrence}`,
      hint: definition.hint,
      color: definition.color,
      checked: checkedSet.has(item.id),
    }
  })

  const total = entries.length
  const checkedCount = entries.filter((entry) => entry.checked).length
  const pendingCount = total - checkedCount
  const percent = total === 0 ? 0 : Math.round((checkedCount / total) * 100)

  return {
    total,
    checkedCount,
    pendingCount,
    percent,
    complete: total > 0 && pendingCount === 0,
    pendingIds: entries.filter((entry) => !entry.checked).map((entry) => entry.id),
    entries,
  }
}

/** 切换某件设备的就位状态；重复勾选/取消都是幂等的 */
export function toggleItemChecked(checkedItemIds: string[], id: string): string[] {
  return checkedItemIds.includes(id)
    ? checkedItemIds.filter((checkedId) => checkedId !== id)
    : [...checkedItemIds, id]
}

export function allItemIdsChecked(items: Pick<DeskItem, 'id'>[]): string[] {
  return items.map((item) => item.id)
}
