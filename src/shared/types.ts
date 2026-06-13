export interface VideoItem {
  id: string
  title: string
  durationSeconds: number
  durationText: string
  channelName: string
  channelId: string
  thumbnailUrl: string
  isPlayable: boolean
  /** Pozycja w oryginalnej playliście, liczona od zera. */
  position: number
}

export interface PlaylistData {
  id: string
  title: string
  /** Opis playlisty — InnerTube zwraca go tylko dla części playlist. */
  description: string
  author: string
  /** Lokalizowany tekst „ostatnia aktualizacja" z YouTube (lub pusty). */
  lastUpdated: string
  views: string
  /** Surowa wartość z InnerTube: PUBLIC | UNLISTED | PRIVATE (lub pusta). */
  privacy: string
  videoCount: number
  videos: VideoItem[]
}

/**
 * Pozycja z listy playlist zalogowanego konta (browse FEplaylist_aggregation).
 * Służy tylko do wyboru w UI — klon i tak przechodzi pełną ścieżką fetchPlaylist.
 */
export interface MyPlaylist {
  id: string
  title: string
  /** Liczba filmów, jeśli InnerTube ją podał; 0 = nieznana. */
  videoCount: number
  /** Miniatura playlisty (URL z InnerTube) lub brak. */
  thumbnailUrl?: string
}

export type ExportFormat = 'csv' | 'xml' | 'json'

export interface ExportSaveRequest {
  defaultName: string
  content: string
  format: ExportFormat
}

export interface ExportSaveResult {
  saved: boolean
  path?: string
}

export interface AuthState {
  loggedIn: boolean
  accountName?: string
  accountPhotoUrl?: string
}

export interface FetchProgress {
  loaded: number
  total: number
}

export interface CloneRequest {
  title: string
  videoIds: string[]
}

export type CloneStage = 'creating' | 'adding' | 'done' | 'cancelled' | 'error'

export interface CloneProgress {
  stage: CloneStage
  added: number
  total: number
  playlistId?: string
  message?: string
}

/** Twardy limit YouTube na liczbę filmów w playliście tworzonej przez użytkownika. */
export const PLAYLIST_MAX_VIDEOS = 5000

/** Limit YouTube na długość tytułu playlisty. */
export const PLAYLIST_TITLE_MAX_LENGTH = 150

/**
 * Tempo zapisu klona — wspólne dla clonera (faktyczne tempo) i renderera
 * (szacowany czas), żeby ETA nie rozjechało się z rzeczywistością przy tuningu.
 */
export const CLONE_BATCH_SIZE = 20
export const CLONE_BATCH_DELAY_MS = 1500
export const CLONE_AVG_REQUEST_MS = 700
