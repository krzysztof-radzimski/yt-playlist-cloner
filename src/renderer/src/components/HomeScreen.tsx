import { useState } from 'react'
import type { FetchProgress } from '@shared/types'
import { useStrings } from '../i18n'

interface Props {
  fetching: boolean
  progress: FetchProgress | null
  error: string | null
  onFetch: (input: string) => void
}

export default function HomeScreen({
  fetching,
  progress,
  error,
  onFetch
}: Props): React.JSX.Element {
  const t = useStrings()
  const [input, setInput] = useState('')
  const canSubmit = input.trim().length > 0 && !fetching

  return (
    <div className="home">
      <section className="hero">
        <h1>{t.heroTitle}</h1>
        <p className="hero-sub">{t.heroSubtitle}</p>
        <form
          className="fetch-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit) onFetch(input)
          }}
        >
          <input
            className="input fetch-input"
            type="text"
            placeholder={t.fetchPlaceholder}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={fetching}
            spellCheck={false}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {fetching ? t.fetching : t.fetchButton}
          </button>
        </form>
        {fetching && (
          <div className="fetch-status" role="status">
            <span className="spinner" aria-hidden="true" />
            {progress ? t.fetchedCount(progress.loaded, progress.total) : t.connecting}
          </div>
        )}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
      </section>
      <section className="feature-cards">
        {t.features.map((feature) => (
          <article className="card feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
