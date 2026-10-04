import type { DeskItem, WorkspacePlan } from '../../shared/models'
import { getDeviceDefinition } from '../../shared/models'

export interface PlacementChecklistItem {
  item: DeskItem
  label: string
  sequence: number
  placed: boolean
}

export interface PlacementSummary {
  total: number
  placed: number
  remaining: number
  progressPercent: number
  complete: boolean
}

export function summarizePlacement(plan: Pick<WorkspacePlan, 'items' | 'placedItemIds'>): PlacementSummary {
  const total = plan.items.length
  const placed = plan.items.filter((item) => plan.placedItemIds.includes(item.id)).length
  const remaining = total - placed

  return {
    total,
    placed,
    remaining,
    progressPercent: total === 0 ? 0 : Math.round((placed / total) * 100),
    complete: total > 0 && remaining === 0,
  }
}

export function createPlacementChecklist(plan: WorkspacePlan): PlacementChecklistItem[] {
  const typeSequences = new Map<DeskItem['type'], number>()

  return plan.items.map((item) => {
    const definition = getDeviceDefinition(item.type)
    const nextSequence = (typeSequences.get(item.type) ?? 0) + 1
    typeSequences.set(item.type, nextSequence)

    return {
      item,
      label: `${definition.label} ${nextSequence}`,
      sequence: nextSequence,
      placed: plan.placedItemIds.includes(item.id),
    }
  })
}

export function setItemPlaced(plan: WorkspacePlan, itemId: string, placed: boolean): WorkspacePlan {
  const exists = plan.items.some((item) => item.id === itemId)
  if (!exists) return plan

  const nextIds = plan.placedItemIds.filter((id) => id !== itemId && plan.items.some((item) => item.id === id))
  if (placed) nextIds.push(itemId)

  return { ...plan, placedItemIds: nextIds }
}

export function markAllPlaced(plan: WorkspacePlan): WorkspacePlan {
  return { ...plan, placedItemIds: plan.items.map((item) => item.id) }
}

export function reconcilePlacedItemIds(plan: WorkspacePlan): WorkspacePlan {
  const validIds = new Set(plan.items.map((item) => item.id))
  const nextIds = plan.placedItemIds.filter((id) => validIds.has(id))
  return nextIds.length === plan.placedItemIds.length ? plan : { ...plan, placedItemIds: nextIds }
}
