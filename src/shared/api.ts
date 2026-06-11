import type { Language } from './i18n'
import type {
  AuthState,
  CloneProgress,
  CloneRequest,
  ExportSaveRequest,
  ExportSaveResult,
  FetchProgress,
  PlaylistData
} from './types'

/**
 * Kontrakt API udostępnianego rendererowi przez preload (window.api).
 * Funkcje on* zwracają funkcję wypisującą subskrypcję.
 */
export interface RendererApi {
  platform: NodeJS.Platform
  language: Language
  auth: {
    getState(): Promise<AuthState>
    login(): Promise<AuthState>
    logout(): Promise<AuthState>
  }
  playlist: {
    fetch(input: string): Promise<PlaylistData>
    onFetchProgress(callback: (progress: FetchProgress) => void): () => void
  }
  clone: {
    start(request: CloneRequest): Promise<void>
    cancel(): void
    onProgress(callback: (progress: CloneProgress) => void): () => void
  }
  export: {
    save(request: ExportSaveRequest): Promise<ExportSaveResult>
  }
  openExternal(url: string): void
}
