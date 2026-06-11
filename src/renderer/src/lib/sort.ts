import type { VideoItem } from '@shared/types'

export type SortMode = 'original' | 'title' | 'duration' | 'channel' | 'custom'

export interface SortSpec {
  mode: SortMode
  descending: boolean
}

export const SORT_OPTIONS: Array<{ mode: Exclude<SortMode, 'custom'>; label: string }> = [
  { mode: 'original', label: 'Kolejność oryginalna' },
  { mode: 'title', label: 'Tytuł' },
  { mode: 'duration', label: 'Długość' },
  { mode: 'channel', label: 'Kanał' }
]

const collator = new Intl.Collator('pl', { sensitivity: 'base', numeric: true })

export function sortVideos(videos: readonly VideoItem[], spec: SortSpec): VideoItem[] {
  // Kolejność własna (ręczna/tasowanie) nie jest wyliczalna — zwracamy bez zmian.
  if (spec.mode === 'custom') return [...videos]

  const primary = (a: VideoItem, b: VideoItem): number => {
    switch (spec.mode) {
      case 'title':
        return collator.compare(a.title, b.title)
      case 'duration':
        return a.durationSeconds - b.durationSeconds
      case 'channel':
        return collator.compare(a.channelName, b.channelName)
      default:
        return a.position - b.position
    }
  }

  // Kierunek odwraca tylko klucz główny; remisy zostają w kolejności
  // oryginalnej (pełny reverse odwracałby też remisy).
  const direction = spec.descending ? -1 : 1
  return [...videos].sort((a, b) => direction * primary(a, b) || a.position - b.position)
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items]
  const [moved] = result.splice(from, 1)
  result.splice(to, 0, moved)
  return result
}

/** Playlisty mogą zawierać duplikaty filmów — klucz musi łączyć id z pozycją. */
export function videoKey(video: VideoItem): string {
  return `${video.id}:${video.position}`
}
