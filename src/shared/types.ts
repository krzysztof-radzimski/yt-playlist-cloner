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
  author: string
  videoCount: number
  videos: VideoItem[]
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
