import {
  CLONE_AVG_REQUEST_MS,
  CLONE_BATCH_DELAY_MS,
  CLONE_BATCH_SIZE
} from '@shared/types'

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export function formatLongDuration(totalSeconds: number): string {
  // Najpierw zaokrąglenie do pełnych minut, potem podział — inaczej
  // 3590 s wyświetlałoby się jako „60 min” zamiast „1 godz. 0 min”.
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  return `${hours} godz. ${minutes} min`
}

/** Polska odmiana: plural(5, ['film', 'filmy', 'filmów']) → "5 filmów". */
export function plural(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count)
  let form = forms[2]
  if (abs === 1) form = forms[0]
  else if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 12 || abs % 100 > 14)) form = forms[1]
  return `${count} ${form}`
}

/** Szacowany czas klonowania — liczony z tych samych stałych co faktyczne tempo. */
export function estimateCloneSeconds(videoCount: number): number {
  if (videoCount <= 1) return 3
  const perBatchSeconds = (CLONE_BATCH_DELAY_MS + CLONE_AVG_REQUEST_MS) / 1000
  return 3 + Math.ceil((videoCount - 1) / CLONE_BATCH_SIZE) * perBatchSeconds
}

export function formatEta(seconds: number): string {
  if (seconds < 50) return `ok. ${Math.max(5, Math.round(seconds / 5) * 5)} s`
  return `ok. ${Math.max(1, Math.round(seconds / 60))} min`
}

/** Zdejmuje prefiks "Error invoking remote method ..." z błędów IPC. */
export function cleanIpcError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
}
