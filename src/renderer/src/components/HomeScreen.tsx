import { useState } from 'react'
import type { FetchProgress } from '@shared/types'
import { plural } from '../lib/format'

interface Props {
  fetching: boolean
  progress: FetchProgress | null
  error: string | null
  onFetch: (input: string) => void
}

const FEATURES = [
  {
    title: 'Bez API Google',
    body: 'Aplikacja rozmawia z YouTube tak jak przeglądarka — bez kluczy API i dziennych limitów quota.'
  },
  {
    title: 'Twoje konto, Twoja sesja',
    body: 'Logujesz się w oknie aplikacji, a sesja zostaje na Twoim komputerze. Żadnych zewnętrznych serwerów.'
  },
  {
    title: 'Dowolna kolejność',
    body: 'Posortuj filmy po tytule, długości lub kanale, przetasuj losowo albo ułóż ręcznie przeciąganiem.'
  }
] as const

export default function HomeScreen({
  fetching,
  progress,
  error,
  onFetch
}: Props): React.JSX.Element {
  const [input, setInput] = useState('')
  const canSubmit = input.trim().length > 0 && !fetching

  return (
    <div className="home">
      <section className="hero">
        <h1>Sklonuj playlistę YouTube</h1>
        <p className="hero-sub">
          Wklej link do playlisty — publicznej, niepublicznej albo własnej prywatnej — ułóż filmy
          po swojemu i zapisz kopię na swoim koncie.
        </p>
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
            placeholder="https://www.youtube.com/playlist?list=…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={fetching}
            spellCheck={false}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {fetching ? 'Pobieranie…' : 'Pobierz playlistę'}
          </button>
        </form>
        {fetching && (
          <div className="fetch-status" role="status">
            <span className="spinner" aria-hidden="true" />
            {progress
              ? `Pobrano ${plural(progress.loaded, ['film', 'filmy', 'filmów'])}${
                  progress.total > progress.loaded ? ` z ~${progress.total}` : ''
                }`
              : 'Łączenie z YouTube…'}
          </div>
        )}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
      </section>
      <section className="feature-cards">
        {FEATURES.map((feature) => (
          <article className="card feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
