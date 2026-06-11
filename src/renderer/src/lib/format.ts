import { CLONE_AVG_REQUEST_MS, CLONE_BATCH_DELAY_MS, CLONE_BATCH_SIZE } from '@shared/types'

/**
 * Liczbowe/niezależne od języka pomocniki. Frazy zależne od języka
 * (czas łączny, ETA, odmiana) są w słowniku i18n (src/shared/i18n.ts).
 */

/** Szacowany czas klonowania — liczony z tych samych stałych co faktyczne tempo. */
export function estimateCloneSeconds(videoCount: number): number {
  if (videoCount <= 1) return 3
  const perBatchSeconds = (CLONE_BATCH_DELAY_MS + CLONE_AVG_REQUEST_MS) / 1000
  return 3 + Math.ceil((videoCount - 1) / CLONE_BATCH_SIZE) * perBatchSeconds
}

/** Zdejmuje prefiks "Error invoking remote method ..." z błędów IPC. */
export function cleanIpcError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
}
