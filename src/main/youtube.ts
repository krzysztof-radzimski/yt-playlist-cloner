import { session } from 'electron'
import { Innertube } from 'youtubei.js'
import type { PlaylistData, VideoItem } from '../shared/types'
import { getLanguage, mainStrings } from './locale'

/**
 * Cała komunikacja z YouTube idzie przez InnerTube — wewnętrzne API strony
 * youtube.com — uwierzytelniana ciasteczkami sesji z partycji logowania.
 * InnerTube nie jest wersjonowane, więc parsowanie odpowiedzi jest celowo
 * defensywne (deepFind, textOf) zamiast zaszytych na sztywno ścieżek JSON.
 */

export const YT_PARTITION = 'persist:youtube'

function ytSession(): Electron.Session {
  return session.fromPartition(YT_PARTITION)
}

async function getYtCookies(): Promise<Electron.Cookie[]> {
  return ytSession().cookies.get({ url: 'https://www.youtube.com' })
}

async function buildCookieHeader(): Promise<string> {
  const cookies = await getYtCookies()
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

export async function isLoggedIn(): Promise<boolean> {
  const cookies = await getYtCookies()
  // SAPISID jest podstawą podpisu SAPISIDHASH wymaganego przy zapisie.
  return cookies.some((c) => c.name === 'SAPISID' || c.name === '__Secure-3PAPISID')
}

let cached: { client: Innertube; cookie: string } | null = null

/** Zwraca klienta InnerTube; odtwarza go, gdy zmienią się ciasteczka sesji. */
export async function getClient(): Promise<Innertube> {
  const cookie = await buildCookieHeader()
  if (cached?.cookie === cookie) return cached.client
  const language = getLanguage()
  const client = await Innertube.create({
    cookie: cookie || undefined,
    lang: language === 'pl' ? 'pl' : 'en',
    location: language === 'pl' ? 'PL' : 'US',
    // Nie odtwarzamy filmów, więc pomijamy pobieranie i deszyfrowanie playera.
    retrieve_player: false
  })
  cached = { client, cookie }
  return client
}

export function invalidateClient(): void {
  cached = null
}

/** Wyciąga tekst z węzłów youtubei.js (string | Text | runs). */
function textOf(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const candidate = (value as { text?: unknown }).text
    if (typeof candidate === 'string') return candidate
    const stringified = String(value)
    return stringified === '[object Object]' ? '' : stringified
  }
  return ''
}

/** Przeszukuje drzewo odpowiedzi wszerz w poszukiwaniu pierwszego klucza o danej nazwie. */
function deepFind(root: unknown, key: string, maxDepth = 14): unknown {
  const queue: Array<{ node: unknown; depth: number }> = [{ node: root, depth: 0 }]
  const seen = new Set<object>()
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!
    if (node === null || typeof node !== 'object' || depth > maxDepth || seen.has(node)) continue
    seen.add(node)
    if (!Array.isArray(node)) {
      const record = node as Record<string, unknown>
      if (key in record) return record[key]
    }
    const children = Array.isArray(node) ? node : Object.values(node)
    for (const child of children) queue.push({ node: child, depth: depth + 1 })
  }
  return undefined
}

export async function getAccountInfo(): Promise<{ name?: string; photoUrl?: string }> {
  try {
    const yt = await getClient()
    const info = await yt.account.getInfo()
    const name = textOf(deepFind(info, 'account_name'))
    const photo = deepFind(info, 'account_photo')
    return { name: name || undefined, photoUrl: firstThumbnailUrl(photo) }
  } catch {
    // Brak danych konta nie blokuje aplikacji — pokażemy samo "zalogowano".
    return {}
  }
}

function firstThumbnailUrl(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const url = (value[0] as { url?: unknown } | undefined)?.url
    return typeof url === 'string' ? url : undefined
  }
  if (value && typeof value === 'object') {
    const record = value as { url?: unknown; thumbnails?: unknown }
    if (typeof record.url === 'string') return record.url
    return firstThumbnailUrl(record.thumbnails)
  }
  return undefined
}

export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim()
  const fromParam = /[?&]list=([A-Za-z0-9_-]+)/.exec(trimmed)?.[1]
  if (fromParam) return fromParam
  if (!trimmed.includes('://') && /^[A-Za-z0-9_-]{2,}$/.test(trimmed)) return trimmed
  return null
}

interface RawPlaylistVideo {
  id?: unknown
  title?: unknown
  duration?: { seconds?: unknown; text?: unknown }
  author?: { name?: unknown; id?: unknown }
  is_playable?: unknown
}

function toVideoItem(node: unknown, position: number): VideoItem | null {
  const raw = node as RawPlaylistVideo
  if (!raw || typeof raw.id !== 'string' || raw.id.length === 0) return null
  // Transmisje na żywo i premiery mają seconds = NaN, a tekst 'N/A' (fallback
  // youtubei.js) — normalizujemy, żeby NaN nie zatruł sum i sortowania w UI.
  const seconds = raw.duration?.seconds
  const durationText = textOf(raw.duration?.text)
  return {
    id: raw.id,
    title: textOf(raw.title) || mainStrings().main.untitledVideo,
    durationSeconds: typeof seconds === 'number' && Number.isFinite(seconds) ? seconds : 0,
    durationText: durationText === 'N/A' ? '' : durationText,
    channelName: textOf(raw.author?.name),
    channelId: typeof raw.author?.id === 'string' ? raw.author.id : '',
    // Deterministyczny adres miniatury — niezależny od kształtu odpowiedzi InnerTube.
    thumbnailUrl: `https://i.ytimg.com/vi/${raw.id}/mqdefault.jpg`,
    isPlayable: raw.is_playable !== false,
    position
  }
}

function friendlyFetchError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err)
  const s = mainStrings().main
  if (/does not exist|nie istnieje/i.test(message)) {
    return new Error(s.playlistMissingOrPrivate)
  }
  if (/sign in|signed in|zaloguj/i.test(message)) {
    return new Error(s.playlistNeedsLogin)
  }
  return new Error(s.fetchFailed(message))
}

export async function fetchPlaylist(
  input: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<PlaylistData> {
  const s = mainStrings().main
  const id = parsePlaylistId(input)
  if (!id) {
    throw new Error(s.playlistNotRecognized)
  }
  if (id.startsWith('RD')) {
    throw new Error(s.mixesNotSupported)
  }

  const yt = await getClient()
  let page: Awaited<ReturnType<Innertube['getPlaylist']>>
  try {
    page = await yt.getPlaylist(id)
  } catch (err) {
    throw friendlyFetchError(err)
  }

  const info = page.info as Record<string, unknown>
  const declaredTotal = Number(textOf(deepFind(info, 'total_items')).replace(/[^\d]/g, '')) || 0

  const videos: VideoItem[] = []
  const append = (nodes: unknown): number => {
    let appended = 0
    for (const node of Array.isArray(nodes) ? nodes : []) {
      const item = toVideoItem(node, videos.length)
      if (item) {
        videos.push(item)
        appended++
      }
    }
    return appended
  }

  // Playlist.items (nie Feed.videos!) — Feed.videos skanuje całą odpowiedź
  // browse i łapie też sekcję „Polecane”, którą YouTube dokleja do playlist.
  append(page.items)
  onProgress?.(videos.length, Math.max(declaredTotal, videos.length))

  // Strony kontynuacji po ~100 filmów; bezpieczniki na wypadek pętli w API.
  let emptyPages = 0
  let pages = 0
  while (page.has_continuation && pages < 300) {
    pages++
    try {
      page = await page.getContinuation()
    } catch {
      break
    }
    const appended = append(page.items)
    if (appended === 0) {
      if (++emptyPages >= 2) break
    } else {
      emptyPages = 0
    }
    onProgress?.(videos.length, Math.max(declaredTotal, videos.length))
  }

  if (videos.length === 0) {
    throw new Error(s.playlistEmpty)
  }

  return {
    id,
    title: textOf(info['title']) || s.titleFallback,
    description: textOf(info['description']),
    author: textOf(deepFind(info['author'], 'name') ?? info['author']),
    lastUpdated: textOf(info['last_updated']),
    views: textOf(info['views']),
    privacy: textOf(info['privacy']),
    videoCount: videos.length,
    videos
  }
}
