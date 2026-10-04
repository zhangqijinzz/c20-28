import { createInitialDocument, type WorkspaceDocument } from '../../shared/models'
import { BrowserStorageService, type StorageService } from './storageService'
import { normalizeWorkspaceDocument } from './documentNormalizer'

export interface WorkspaceRepository {
  load(): Promise<WorkspaceDocument | null>
  save(document: WorkspaceDocument): Promise<void>
}

export class LocalWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly storage: StorageService = new BrowserStorageService()) {}

  async load(): Promise<WorkspaceDocument | null> {
    try {
      const raw = await this.storage.read()
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return normalizeWorkspaceDocument(parsed)
    } catch {
      return null
    }
  }

  async save(document: WorkspaceDocument): Promise<void> {
    await this.storage.write(JSON.stringify(document))
  }
}

export function getInitialDocument(document: WorkspaceDocument | null): WorkspaceDocument {
  return document ?? createInitialDocument()
}
