# CLAUDE.md

Aplikacja Electron klonująca playlisty YouTube **bez oficjalnego API Google** — odczyt i zapis
idą przez InnerTube (wewnętrzne API strony youtube.com) za pośrednictwem `youtubei.js`,
uwierzytelniane ciasteczkami sesji z logowania w oknie aplikacji. UI po polsku.

## Komendy

```bash
npm run dev          # electron-vite dev (HMR)
npm run typecheck    # tsc dla main+preload (tsconfig.node.json) i renderera (tsconfig.web.json)
npm run build        # build produkcyjny do out/
npm run dist:mac     # pakiet dystrybucyjny (electron-builder)
```

Brak testów automatycznych — weryfikacja przez `npm run typecheck && npm run build`.

## Architektura

- `src/main/youtube.ts` — klient Innertube (cache per zestaw ciasteczek), pobieranie playlisty
  z kontynuacjami, defensywne parsowanie (`deepFind`, `textOf`), parsowanie ID z URL.
- `src/main/auth.ts` — okno logowania Google na partycji `persist:youtube` (wzorzec ytmdesktop:
  first-party `ServiceLogin?service=youtube`, NIE OAuth — OAuth w webview jest blokowany).
- `src/main/cloner.ts` — tworzenie playlisty + dodawanie paczkami (20 szt., 1,5 s przerwy,
  backoff 5 s podwajany) z postępem przez IPC i anulowaniem.
- `src/main/ipc.ts` — handlery IPC z walidacją wejścia (kanały w `src/shared/ipc.ts`).
- `src/preload/index.ts` — `contextBridge` implementujący kontrakt `RendererApi`
  z `src/shared/api.ts`.
- `src/renderer/` — React 19; `App.tsx` trzyma stan globalny (auth/playlista/klonowanie),
  `PlaylistView` stan kolejności i wykluczeń, sortowanie w `lib/sort.ts`.

## Twarde ograniczenia projektowe

- **Nie wprowadzaj YouTube Data API v3** — cały sens projektu to działanie bez kluczy i quoty.
- **InnerTube jest niewersjonowane** — parsuj odpowiedzi defensywnie (deepFind/textOf, opcjonalne
  pola), nigdy sztywnymi ścieżkami JSON. Znane zmiany: token kontynuacji przeniesiony do
  `commandExecutorCommand.commands[]` (zepsuł yt-dlp 03/2025), część odpowiedzi używa
  `lockupViewModel` zamiast `playlistVideoRenderer` — youtubei.js to abstrahuje, ale przy
  aktualizacjach biblioteki sprawdź changelog.
- **Tempo zapisu jest celowe** — stałe `CLONE_*` w `src/shared/types.ts` (paczki 20 / 1,5 s,
  backoff od 5 s w `cloner.ts`) chronią przed `429 RESOURCE_EXHAUSTED` i zasilają też ETA
  w UI. Nie zrównoleglaj zapisów. Retry tylko dla błędów przejściowych (429/5xx);
  `playlist.create` nie jest ponawiane wcale (nie jest idempotentne — retry tworzyłby
  duplikaty playlist).
- **Czytaj `page.items`, nie `page.videos`** — `Feed.videos` w youtubei.js skanuje całą
  odpowiedź browse i łapie sekcję „Polecane”, którą YouTube dokleja do playlist;
  `Playlist.items` filtruje ją po `style`.
- **Klient Innertube**: zawsze `retrieve_player: false` (bez playera nie trzeba interpretera JS);
  cookie-auth, nie OAuth (OAuth działa już tylko dla klienta TV).
- **Playlisty mogą zawierać duplikaty filmów** — klucze w UI to `id:position` (`videoKey`),
  nie samo `id`.
- **Bezpieczeństwo Electrona**: sandbox + contextIsolation włączone, nawigacja i `window.open`
  zablokowane, `openExternal` tylko dla URL-i YouTube. CSP w `index.html` jest poluzowane dla
  dev (HMR) i zaostrzane w buildzie pluginem `strict-csp-on-build`.
- **youtubei.js jest ESM-only dla Node** — w buildzie main jest bundlowana
  (`externalizeDepsPlugin({ exclude: ['youtubei.js'] })`), nie zmieniaj tego na require.
- Limit playlisty: 5000 filmów (`PLAYLIST_MAX_VIDEOS`); miksy `RD…` odrzucane przy pobieraniu.
- Klon powstaje jako **prywatna** playlista — `youtubei.js` nie wystawia zmiany widoczności;
  nie obiecuj tego w UI.
