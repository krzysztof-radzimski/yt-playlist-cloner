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

Ikona: źródłem jest `resources/icon.svg`; po jego zmianie uruchom `npm run icon`
(renderuje Electronem `build/icon.png` 1024² dla electron-buildera oraz
`resources/icon.png` 512² używane w oknie/docku przez import `?asset`).

## Architektura

- `src/main/youtube.ts` — klient Innertube (cache per zestaw ciasteczek), pobieranie playlisty
  z kontynuacjami, defensywne parsowanie (`deepFind`, `textOf`), parsowanie ID z URL.
- `src/main/auth.ts` — okno logowania Google na partycji `persist:youtube` (wzorzec ytmdesktop:
  first-party `ServiceLogin?service=youtube`, NIE OAuth — OAuth w webview jest blokowany).
- `src/main/cloner.ts` — tworzenie playlisty + dodawanie paczkami (20 szt., 1,5 s przerwy,
  backoff 5 s podwajany) z postępem przez IPC i anulowaniem.
- `src/main/export.ts` — natywne okno „Zapisz jako" + zapis pliku; treść (CSV/XML/JSON)
  serializuje renderer w `lib/export.ts` (proces główny tylko waliduje i pisze na dysk).
- `src/main/ipc.ts` — handlery IPC z walidacją wejścia (kanały w `src/shared/ipc.ts`).
- `src/preload/index.ts` — `contextBridge` implementujący kontrakt `RendererApi`
  z `src/shared/api.ts`.
- `src/renderer/` — React 19; `App.tsx` trzyma stan globalny (auth/playlista/klonowanie),
  `PlaylistView` stan kolejności i wykluczeń, sortowanie w `lib/sort.ts`.
- `src/shared/i18n.ts` — wspólny słownik pl/en (frazy zależne od liczby/parametrów jako funkcje);
  `resolveLanguage` wybiera polski, gdy język systemu zaczyna się od „pl". Proces główny używa
  `src/main/locale.ts` (`mainStrings()`), renderer kontekstu `i18n.ts` (`useStrings()`); język
  ustalany raz w mainie i przekazywany do renderera przez `additionalArguments` (preload → `window.api.language`).

## Twarde ograniczenia projektowe

- **Cały tekst UI i komunikaty idą przez i18n** — nie wpisuj polskich ani angielskich napisów
  na sztywno w komponentach ani w procesie głównym; dodaj klucz w `src/shared/i18n.ts` (pl i en)
  i użyj `useStrings()` / `mainStrings()`. Odmiana liczb: pl ma 3 formy (helper `pluralPl`),
  en 2 — frazy zależne od liczby są funkcjami w słowniku, nie składane w komponencie.
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
- **Eksport tylko z dostępnych pól** — `PlaylistVideo` (lista playlisty) NIE zawiera opisu
  ani daty publikacji filmu; dostępne są tylko metadane playlisty (`description`,
  `last_updated`, `views`, `privacy`) i pola per film (tytuł, kanał, czas, ID, dostępność).
  Nie dorabiaj per-film opisów/dat przez `getInfo` bez świadomej zgody — to N żądań,
  sięga po endpoint odtwarzacza i podnosi ryzyko blokady.
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
