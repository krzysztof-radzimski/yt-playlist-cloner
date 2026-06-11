import type { WebContents } from 'electron'
import { IPC } from '../shared/ipc'
import {
  CLONE_BATCH_DELAY_MS,
  CLONE_BATCH_SIZE,
  type CloneProgress,
  type CloneRequest
} from '../shared/types'
import { getClient } from './youtube'

/**
 * Tempo zapisu jest celowo zachowawcze: InnerTube zwraca 429 RESOURCE_EXHAUSTED
 * przy zbyt szybkim edytowaniu playlist. Paczki z przerwą i wykładniczym
 * backoffem to sprawdzony wzorzec (m.in. spotify_to_ytmusic).
 */
const MAX_RETRIES = 5
const INITIAL_BACKOFF_MS = 5000

let cancelRequested = false
let running = false

export function cancelClone(): void {
  cancelRequested = true
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Sen przerywalny anulowaniem — sprawdza flagę co ćwierć sekundy. */
async function cancellableSleep(ms: number): Promise<void> {
  const step = 250
  for (let waited = 0; waited < ms && !cancelRequested; waited += step) {
    await sleep(Math.min(step, ms - waited))
  }
}

/**
 * Tylko throttling i błędy serwera są warte ponowienia. Błędy trwałe
 * (4xx poza 429, wygasła sesja) mają wypaść natychmiast — youtubei.js
 * zgłasza status wyłącznie w treści komunikatu InnertubeError.
 */
function isTransientError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /status code (429|5\d\d)/i.test(message) || /RESOURCE_EXHAUSTED/i.test(message)
}

async function withBackoff<T>(operation: () => Promise<T>): Promise<T> {
  let delay = INITIAL_BACKOFF_MS
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation()
    } catch (err) {
      if (attempt >= MAX_RETRIES || cancelRequested || !isTransientError(err)) throw err
      await cancellableSleep(delay)
      if (cancelRequested) throw err
      delay *= 2
    }
  }
}

interface CreatePlaylistResult {
  playlist_id?: string
  data?: { playlistId?: string }
}

export async function runClone(request: CloneRequest, target: WebContents): Promise<void> {
  if (running) throw new Error('Poprzednie klonowanie jeszcze trwa.')
  running = true
  cancelRequested = false

  const total = request.videoIds.length
  let added = 0
  let playlistId: string | undefined

  const send = (progress: CloneProgress): void => {
    if (!target.isDestroyed()) target.send(IPC.CloneProgress, progress)
  }

  try {
    const yt = await getClient()
    send({ stage: 'creating', added, total })

    // Tworzenie playlisty NIE jest ponawiane: create nie jest idempotentne,
    // a retry po utraconej odpowiedzi tworzyłby duplikaty playlist.
    const created = (await yt.playlist.create(
      request.title,
      request.videoIds.slice(0, 1)
    )) as CreatePlaylistResult
    playlistId = created.playlist_id ?? created.data?.playlistId
    if (!playlistId) throw new Error('YouTube nie zwrócił identyfikatora nowej playlisty.')
    added = 1
    send({ stage: 'adding', added, total, playlistId })

    // Kolejność dodawania wyznacza kolejność na playliście.
    while (added < total) {
      if (cancelRequested) {
        send({ stage: 'cancelled', added, total, playlistId })
        return
      }
      const batch = request.videoIds.slice(added, added + CLONE_BATCH_SIZE)
      const id = playlistId
      await withBackoff(() => yt.playlist.addVideos(id, batch))
      added += batch.length
      send({ stage: 'adding', added, total, playlistId })
      if (added < total) await cancellableSleep(CLONE_BATCH_DELAY_MS)
    }

    send({ stage: 'done', added, total, playlistId })
  } catch (err) {
    if (cancelRequested) {
      send({ stage: 'cancelled', added, total, playlistId })
    } else {
      send({
        stage: 'error',
        added,
        total,
        playlistId,
        message: err instanceof Error ? err.message : String(err)
      })
    }
  } finally {
    running = false
  }
}
