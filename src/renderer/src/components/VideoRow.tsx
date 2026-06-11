import { memo } from 'react'
import type { VideoItem } from '@shared/types'
import { useStrings } from '../i18n'
import { videoKey } from '../lib/sort'

/** Własny typ dataTransfer — wiersze przyjmują tylko przeciągnięcia wierszy,
 *  nie tekst/linki/pliki upuszczone z zewnątrz aplikacji. */
const ROW_DRAG_TYPE = 'application/x-yt-playlist-cloner-row'

interface Props {
  video: VideoItem
  index: number
  excluded: boolean
  onToggleExcluded: (key: string) => void
  onDragStart: (index: number) => void
  onDragEnd: () => void
  onDropAt: (index: number) => void
}

function VideoRow({
  video,
  index,
  excluded,
  onToggleExcluded,
  onDragStart,
  onDragEnd,
  onDropAt
}: Props): React.JSX.Element {
  const t = useStrings()
  const classNames = ['video-row']
  if (excluded) classNames.push('is-excluded')
  if (!video.isPlayable) classNames.push('is-unavailable')

  return (
    <li
      className={classNames.join(' ')}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(ROW_DRAG_TYPE, String(index))
        event.dataTransfer.effectAllowed = 'move'
        onDragStart(index)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(ROW_DRAG_TYPE)) event.preventDefault()
      }}
      onDrop={(event) => {
        if (event.dataTransfer.types.includes(ROW_DRAG_TYPE)) {
          event.preventDefault()
          onDropAt(index)
        }
      }}
    >
      <span className="row-index">{index + 1}</span>
      <span className="row-thumb">
        <img src={video.thumbnailUrl} alt="" loading="lazy" draggable={false} />
        {video.durationText && <span className="row-duration">{video.durationText}</span>}
      </span>
      <span className="row-meta">
        <span className="row-title" title={video.title}>
          {video.title}
        </span>
        <span className="row-channel">
          {video.channelName}
          {!video.isPlayable && <span className="badge badge-warn">{t.unavailableBadge}</span>}
        </span>
      </span>
      <label className="row-include" title={excluded ? t.skipTooltip : t.includeTooltip}>
        <input
          type="checkbox"
          checked={!excluded}
          aria-label={t.includeAria(video.title)}
          onChange={() => onToggleExcluded(videoKey(video))}
        />
      </label>
    </li>
  )
}

export default memo(VideoRow)
