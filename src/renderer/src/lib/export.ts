import { type ExportStrings, type Language, getStrings } from '@shared/i18n'
import type { ExportFormat, PlaylistData, VideoItem } from '@shared/types'
import { videoKey } from './sort'

/**
 * Eksport „szybki" — tylko pola, które InnerTube zwraca w liście playlisty.
 * Opisu i daty publikacji per film tu nie ma (nie ma ich w odpowiedzi
 * playlisty); na poziomie playlisty zapisujemy opis i datę aktualizacji.
 * Wiersze są w bieżącej kolejności widoku, a `position` zachowuje oryginalną.
 */

interface ExportPlaylistMeta {
  id: string
  title: string
  description: string
  author: string
  lastUpdated: string
  views: string
  privacy: string
  videoCount: number
  url: string
}

interface ExportRow {
  order: number
  position: number
  included: boolean
  videoId: string
  title: string
  channel: string
  channelId: string
  durationSeconds: number
  durationText: string
  url: string
  available: boolean
}

function localizePrivacy(raw: string, t: ExportStrings): string {
  switch (raw.toUpperCase()) {
    case 'PUBLIC':
      return t.privacyPublic
    case 'UNLISTED':
      return t.privacyUnlisted
    case 'PRIVATE':
      return t.privacyPrivate
    default:
      return raw
  }
}

function buildMeta(playlist: PlaylistData, rowCount: number, t: ExportStrings): ExportPlaylistMeta {
  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    author: playlist.author,
    lastUpdated: playlist.lastUpdated,
    views: playlist.views,
    privacy: localizePrivacy(playlist.privacy, t),
    videoCount: rowCount,
    url: `https://www.youtube.com/playlist?list=${playlist.id}`
  }
}

function buildRows(order: readonly VideoItem[], excluded: ReadonlySet<string>): ExportRow[] {
  return order.map((video, index) => ({
    order: index + 1,
    position: video.position + 1,
    included: !excluded.has(videoKey(video)),
    videoId: video.id,
    title: video.title,
    channel: video.channelName,
    channelId: video.channelId,
    durationSeconds: video.durationSeconds,
    durationText: video.durationText,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    available: video.isPlayable
  }))
}

/* ---------- JSON ---------- */

function toJson(meta: ExportPlaylistMeta, rows: ExportRow[]): string {
  return JSON.stringify(
    {
      playlist: meta,
      videos: rows.map((row) => ({
        order: row.order,
        position: row.position,
        included: row.included,
        videoId: row.videoId,
        title: row.title,
        channel: row.channel,
        channelId: row.channelId,
        durationSeconds: row.durationSeconds,
        durationText: row.durationText,
        url: row.url,
        available: row.available
      }))
    },
    null,
    2
  )
}

/* ---------- CSV (RFC 4180, BOM dla Excela) ---------- */

function csvCell(value: string | number | boolean): string {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function metaComment(label: string, value: string): string {
  // Komentarze nagłówka muszą być jednoliniowe — zwijamy znaki nowej linii.
  return `# ${label}: ${value.replace(/\s*[\r\n]+\s*/g, ' ').trim()}`
}

function toCsv(meta: ExportPlaylistMeta, rows: ExportRow[], t: ExportStrings): string {
  const header = [
    metaComment(t.metaPlaylist, meta.title),
    metaComment(t.metaDescription, meta.description),
    metaComment(t.metaAuthor, meta.author),
    metaComment(t.metaUpdated, meta.lastUpdated),
    metaComment(t.metaViews, meta.views),
    metaComment(t.metaPrivacy, meta.privacy),
    metaComment(t.metaVideoCount, String(meta.videoCount)),
    metaComment(t.metaUrl, meta.url),
    ''
  ]
  const columns = [
    t.colNo,
    t.colOriginalPos,
    t.colInClone,
    t.colId,
    t.colTitle,
    t.colChannel,
    t.colChannelId,
    t.colDuration,
    t.colDurationSec,
    t.colUrl,
    t.colAvailable
  ]
  const lines = [columns.map(csvCell).join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.order,
        row.position,
        row.included ? t.yes : t.no,
        row.videoId,
        row.title,
        row.channel,
        row.channelId,
        row.durationText,
        row.durationSeconds,
        row.url,
        row.available ? t.yes : t.no
      ]
        .map(csvCell)
        .join(',')
    )
  }
  // BOM (﻿), by Excel odczytał polskie znaki; CRLF zgodnie z RFC 4180.
  return '\uFEFF' + [...header, ...lines].join('\r\n')
}

/* ---------- XML ---------- */

// Znaki sterujące niedozwolone w XML 1.0 (poza \t, \n, \r).
const XML_INVALID_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

function xmlText(value: string | number | boolean): string {
  return String(value)
    .replace(XML_INVALID_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toXml(meta: ExportPlaylistMeta, rows: ExportRow[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<playlist id="${xmlText(meta.id)}">`,
    `  <title>${xmlText(meta.title)}</title>`,
    `  <description>${xmlText(meta.description)}</description>`,
    `  <author>${xmlText(meta.author)}</author>`,
    `  <lastUpdated>${xmlText(meta.lastUpdated)}</lastUpdated>`,
    `  <views>${xmlText(meta.views)}</views>`,
    `  <privacy>${xmlText(meta.privacy)}</privacy>`,
    `  <videoCount>${meta.videoCount}</videoCount>`,
    `  <url>${xmlText(meta.url)}</url>`,
    '  <videos>'
  ]
  for (const row of rows) {
    lines.push(
      `    <video order="${row.order}" position="${row.position}" included="${row.included}" available="${row.available}">`,
      `      <id>${xmlText(row.videoId)}</id>`,
      `      <title>${xmlText(row.title)}</title>`,
      `      <channel id="${xmlText(row.channelId)}">${xmlText(row.channel)}</channel>`,
      `      <duration seconds="${row.durationSeconds}">${xmlText(row.durationText)}</duration>`,
      `      <url>${xmlText(row.url)}</url>`,
      '    </video>'
    )
  }
  lines.push('  </videos>', '</playlist>')
  return lines.join('\n')
}

/* ---------- API ---------- */

export function serializePlaylist(
  format: ExportFormat,
  playlist: PlaylistData,
  order: readonly VideoItem[],
  excluded: ReadonlySet<string>,
  lang: Language
): string {
  const t = getStrings(lang).exporter
  const rows = buildRows(order, excluded)
  const meta = buildMeta(playlist, rows.length, t)
  switch (format) {
    case 'json':
      return toJson(meta, rows)
    case 'csv':
      return toCsv(meta, rows, t)
    case 'xml':
      return toXml(meta, rows)
  }
}

/** Bezpieczna nazwa pliku z tytułu playlisty + rozszerzenie formatu. */
export function exportFileName(title: string, format: ExportFormat, lang: Language): string {
  const safe = title
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return `${safe || getStrings(lang).exporter.fileFallback}.${format}`
}
