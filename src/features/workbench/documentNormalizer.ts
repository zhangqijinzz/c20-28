import { DEFAULT_DESK, DEVICE_DEFINITIONS, type DeskItem, type DeviceType, type WorkspaceDocument, type WorkspacePlan } from '../../shared/models'

const deviceTypes = new Set<DeviceType>(DEVICE_DEFINITIONS.map((device) => device.type))

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function normalizeDeskItem(value: unknown, index: number): DeskItem | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<DeskItem>
  if (typeof candidate.id !== 'string' || !candidate.id || !deviceTypes.has(candidate.type as DeviceType)) return null

  return {
    id: candidate.id,
    type: candidate.type as DeviceType,
    widthMm: asFiniteNumber(candidate.widthMm, DEVICE_DEFINITIONS.find((device) => device.type === candidate.type)?.widthMm ?? 0),
    heightMm: asFiniteNumber(candidate.heightMm, DEVICE_DEFINITIONS.find((device) => device.type === candidate.type)?.heightMm ?? 0),
    x: asFiniteNumber(candidate.x, 40 + index * 40),
    y: asFiniteNumber(candidate.y, 40),
    rotation: asFiniteNumber(candidate.rotation, 0),
  }
}

function normalizePlan(value: unknown, index: number): WorkspacePlan | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<WorkspacePlan>
  if (typeof candidate.id !== 'string' || !candidate.id) return null

  const rawItems = Array.isArray(candidate.items) ? candidate.items : []
  const parsedItems = rawItems.map(normalizeDeskItem).filter((item): item is DeskItem => item !== null)
  if (rawItems.length > 0 && parsedItems.length === 0) return null

  const seenItemIds = new Set<string>()
  const items = parsedItems.filter((item) => {
    if (seenItemIds.has(item.id)) return false
    seenItemIds.add(item.id)
    return true
  })
  const itemIds = new Set(items.map((item) => item.id))
  const placedItemIds = Array.isArray(candidate.placedItemIds)
    ? Array.from(new Set(candidate.placedItemIds.filter((id): id is string => typeof id === 'string' && itemIds.has(id))))
    : []

  return {
    id: candidate.id,
    name: asString(candidate.name, `工作台 ${index + 1}`),
    deskWidthMm: asFiniteNumber(candidate.deskWidthMm, DEFAULT_DESK.widthMm),
    deskHeightMm: asFiniteNumber(candidate.deskHeightMm, DEFAULT_DESK.heightMm),
    items,
    placedItemIds,
    updatedAt: asString(candidate.updatedAt, new Date().toISOString()),
  }
}

export function normalizeWorkspaceDocument(value: unknown): WorkspaceDocument | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<WorkspaceDocument>
  if (candidate.version !== 1 || !Array.isArray(candidate.plans)) return null

  const parsedPlans = candidate.plans.map(normalizePlan).filter((plan): plan is WorkspacePlan => plan !== null)
  const seenPlanIds = new Set<string>()
  const plans = parsedPlans.filter((plan) => {
    if (seenPlanIds.has(plan.id)) return false
    seenPlanIds.add(plan.id)
    return true
  })
  if (plans.length === 0) return null

  const activePlanId = typeof candidate.activePlanId === 'string' && plans.some((plan) => plan.id === candidate.activePlanId)
    ? candidate.activePlanId
    : plans[0].id

  return { version: 1, plans, activePlanId }
}
