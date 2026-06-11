import { basename } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { BrowserWindow, dialog } from 'electron'
import type { ExportFormat, ExportSaveRequest, ExportSaveResult } from '../shared/types'
import { mainStrings } from './locale'

// Treść pliku jest serializowana w rendererze (ma cały model + sortowanie),
// a proces główny tylko pokazuje okno „Zapisz jako" i zapisuje plik.
const MAX_CONTENT_BYTES = 64 * 1024 * 1024

const FILTERS: Record<ExportFormat, Electron.FileFilter[]> = {
  csv: [{ name: 'CSV', extensions: ['csv'] }],
  xml: [{ name: 'XML', extensions: ['xml'] }],
  json: [{ name: 'JSON', extensions: ['json'] }]
}

function validate(request: unknown): asserts request is ExportSaveRequest {
  const s = mainStrings().main
  const r = request as ExportSaveRequest | null
  if (!r || typeof r !== 'object') throw new Error(s.exportInvalidData)
  if (r.format !== 'csv' && r.format !== 'xml' && r.format !== 'json') {
    throw new Error(s.exportUnsupportedFormat)
  }
  if (typeof r.content !== 'string' || r.content.length === 0) {
    throw new Error(s.exportNoContent)
  }
  if (Buffer.byteLength(r.content, 'utf8') > MAX_CONTENT_BYTES) {
    throw new Error(s.exportTooLarge)
  }
  if (typeof r.defaultName !== 'string') {
    throw new Error(s.exportInvalidName)
  }
}

export async function saveExport(
  request: unknown,
  parent: BrowserWindow | null
): Promise<ExportSaveResult> {
  validate(request)
  // basename ucina ewentualne separatory ścieżki z podpowiadanej nazwy.
  const suggested = basename(request.defaultName) || `playlista.${request.format}`

  const options: Electron.SaveDialogOptions = {
    title: mainStrings().main.saveDialogTitle,
    defaultPath: suggested,
    filters: FILTERS[request.format]
  }
  const result = parent
    ? await dialog.showSaveDialog(parent, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return { saved: false }

  await writeFile(result.filePath, request.content, 'utf8')
  return { saved: true, path: result.filePath }
}
