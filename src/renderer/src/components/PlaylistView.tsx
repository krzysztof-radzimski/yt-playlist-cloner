import { useCallback, useMemo, useRef, useState } from 'react'
import type { PlaylistData, VideoItem } from '@shared/types'
import { useStrings } from '../i18n'
import { arrayMove, shuffleArray, sortVideos, videoKey, type SortSpec } from '../lib/sort'
import ClonePanel from './ClonePanel'
import ExportPanel from './ExportPanel'
import SortControls from './SortControls'
import VideoRow from './VideoRow'

/** Liczba wierszy renderowanych na raz — kolejne dochodzą przy przewijaniu. */
const RENDER_PAGE = 200

interface Props {
  playlist: PlaylistData
  loggedIn: boolean
  cloning: boolean
  onClone: (title: string, videoIds: string[]) => void
  onLoginRequest: () => void
  onBack: () => void
}

export default function PlaylistView({
  playlist,
  loggedIn,
  cloning,
  onClone,
  onLoginRequest,
  onBack
}: Props): React.JSX.Element {
  const t = useStrings()
  const [order, setOrder] = useState<VideoItem[]>(playlist.videos)
  const [spec, setSpec] = useState<SortSpec>({ mode: 'original', descending: false })
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(
    () => new Set(playlist.videos.filter((video) => !video.isPlayable).map(videoKey))
  )
  const [visibleCount, setVisibleCount] = useState(RENDER_PAGE)
  const dragFrom = useRef<number | null>(null)

  const applySpec = useCallback(
    (next: SortSpec) => {
      if (next.mode === 'custom') {
        // Jedyna zmiana możliwa w trybie własnym to odwrócenie kierunku.
        if (next.descending !== spec.descending) setOrder((current) => [...current].reverse())
      } else {
        setOrder(sortVideos(playlist.videos, next))
      }
      setSpec(next)
    },
    [playlist.videos, spec.descending]
  )

  const handleShuffle = useCallback(() => {
    setOrder((current) => shuffleArray(current))
    setSpec({ mode: 'custom', descending: false })
  }, [])

  const handleMove = useCallback((from: number, to: number) => {
    setOrder((current) => arrayMove(current, from, to))
    setSpec({ mode: 'custom', descending: false })
  }, [])

  // Stabilne handlery — bez nich memo(VideoRow) nigdy nie pomija renderu
  // i każda interakcja przerysowuje wszystkie zamontowane wiersze.
  const handleRowDragStart = useCallback((from: number) => {
    dragFrom.current = from
  }, [])

  const handleRowDragEnd = useCallback(() => {
    dragFrom.current = null
  }, [])

  const handleRowDrop = useCallback(
    (to: number) => {
      const from = dragFrom.current
      dragFrom.current = null
      if (from !== null && from !== to) handleMove(from, to)
    },
    [handleMove]
  )

  const toggleExcluded = useCallback((key: string) => {
    setExcluded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const included = useMemo(
    () => order.filter((video) => !excluded.has(videoKey(video))),
    [order, excluded]
  )
  const totalSeconds = useMemo(
    () => included.reduce((sum, video) => sum + video.durationSeconds, 0),
    [included]
  )
  const unavailableCount = useMemo(
    () => playlist.videos.filter((video) => !video.isPlayable).length,
    [playlist.videos]
  )

  const visible = order.slice(0, visibleCount)

  return (
    <div className="playlist-layout">
      <section className="list-pane">
        <header className="list-header">
          <span className="list-header-count">{t.videosCount(order.length)}</span>
          {unavailableCount > 0 && (
            <span className="list-header-note">{t.unavailableNote(unavailableCount)}</span>
          )}
          <span className="list-header-hint">{t.dragHint}</span>
        </header>
        <ol
          className="video-list"
          onScroll={(event) => {
            const el = event.currentTarget
            const nearBottom = el.scrollTop + el.clientHeight > el.scrollHeight - 600
            if (nearBottom && visibleCount < order.length) {
              setVisibleCount((count) => Math.min(count + RENDER_PAGE, order.length))
            }
          }}
        >
          {visible.map((video, index) => (
            <VideoRow
              key={videoKey(video)}
              video={video}
              index={index}
              excluded={excluded.has(videoKey(video))}
              onToggleExcluded={toggleExcluded}
              onDragStart={handleRowDragStart}
              onDragEnd={handleRowDragEnd}
              onDropAt={handleRowDrop}
            />
          ))}
          {visibleCount < order.length && <li className="list-more">{t.loadMore}</li>}
        </ol>
      </section>

      <aside className="side-pane">
        <button className="btn btn-ghost btn-back" onClick={onBack}>
          {t.anotherPlaylist}
        </button>
        <div className="card summary-card">
          <h2 className="summary-title" title={playlist.title}>
            {playlist.title}
          </h2>
          {playlist.author && <p className="summary-author">{playlist.author}</p>}
          <dl className="summary-stats">
            <div>
              <dt>{t.summaryToClone}</dt>
              <dd>{t.videosCount(included.length)}</dd>
            </div>
            <div>
              <dt>{t.summaryTotalTime}</dt>
              <dd>{t.totalTime(totalSeconds)}</dd>
            </div>
          </dl>
        </div>
        <SortControls spec={spec} onChange={applySpec} onShuffle={handleShuffle} />
        <ClonePanel
          playlistTitle={playlist.title}
          includedIds={included.map((video) => video.id)}
          loggedIn={loggedIn}
          cloning={cloning}
          onClone={onClone}
          onLoginRequest={onLoginRequest}
        />
        <ExportPanel playlist={playlist} order={order} excluded={excluded} />
      </aside>
    </div>
  )
}
