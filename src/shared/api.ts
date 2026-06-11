import type {
  AuthState,
  CloneProgress,
  CloneRequest,
  FetchProgress,
  PlaylistData
} from './types'

/**
 * Kontrakt API udostępnianego rendererowi przez preload (window.api).
 * Funkcje on* zwracają funkcję wypisującą subskrypcję.
 */
export interface RendererApi {
  platform: NodeJS.Platform
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
  openExternal(url: string): void
}
