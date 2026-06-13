/**
 * Dwujęzyczność: polski dla użytkowników z polskim systemem, angielski dla
 * pozostałych. Słownik jest współdzielony — proces główny (komunikaty błędów,
 * tytuły okien, etykiety eksportu) i renderer (całe UI) korzystają z tego
 * samego źródła. Funkcje budują frazy zależne od liczby/parametrów.
 */

export type Language = 'pl' | 'en'

/** Polski, jeśli którykolwiek preferowany język systemu zaczyna się od „pl". */
export function resolveLanguage(locales: readonly string[]): Language {
  return locales.some((locale) => locale.toLowerCase().startsWith('pl')) ? 'pl' : 'en'
}

/** Polska odmiana: forms = [1, 2–4, 5+]. */
function pluralPl(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n)
  let form = forms[2]
  if (abs === 1) form = forms[0]
  else if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 12 || abs % 100 > 14)) form = forms[1]
  return `${n} ${form}`
}

export interface ExportStrings {
  metaPlaylist: string
  metaDescription: string
  metaAuthor: string
  metaUpdated: string
  metaViews: string
  metaPrivacy: string
  metaVideoCount: string
  metaUrl: string
  colNo: string
  colOriginalPos: string
  colInClone: string
  colId: string
  colTitle: string
  colChannel: string
  colChannelId: string
  colDuration: string
  colDurationSec: string
  colUrl: string
  colAvailable: string
  yes: string
  no: string
  privacyPublic: string
  privacyUnlisted: string
  privacyPrivate: string
  fileFallback: string
}

export interface MainStrings {
  playlistNotRecognized: string
  mixesNotSupported: string
  playlistMissingOrPrivate: string
  playlistNeedsLogin: string
  fetchFailed: (msg: string) => string
  playlistEmpty: string
  titleFallback: string
  untitledVideo: string
  cloneInProgress: string
  noNewPlaylistId: string
  enterPlaylistName: string
  titleTooLong: (max: number) => string
  cloneListEmpty: string
  tooManyVideos: (max: number) => string
  invalidVideoId: string
  invalidInput: string
  signInToCreate: string
  loginWindowTitle: string
  saveDialogTitle: string
  exportInvalidData: string
  exportUnsupportedFormat: string
  exportNoContent: string
  exportTooLarge: string
  exportInvalidName: string
}

export interface AppStrings {
  lang: Language
  appName: string

  // TopBar
  signIn: string
  signingIn: string
  signOut: string
  signedIn: string

  // HomeScreen
  heroTitle: string
  heroSubtitle: string
  fetchPlaceholder: string
  fetchButton: string
  fetching: string
  connecting: string
  fetchedCount: (loaded: number, total: number) => string
  features: ReadonlyArray<{ title: string; body: string }>

  // HomeScreen — moje playlisty
  myPlaylistsTitle: string
  myPlaylistsHint: string
  myPlaylistsLoading: string
  myPlaylistsEmpty: string
  myPlaylistsError: string
  myPlaylistsRefresh: string
  pickPlaylistAria: (title: string) => string

  // PlaylistView
  videosCount: (n: number) => string
  unavailableNote: (n: number) => string
  dragHint: string
  loadMore: string
  anotherPlaylist: string
  summaryToClone: string
  summaryTotalTime: string
  totalTime: (seconds: number) => string

  // VideoRow
  unavailableBadge: string
  includeAria: (title: string) => string
  includeTooltip: string
  skipTooltip: string

  // SortControls
  orderLabel: string
  sortModeAria: string
  sortOriginal: string
  sortTitle: string
  sortDuration: string
  sortChannel: string
  sortCustom: string
  reverseAria: string
  ascTooltip: string
  descTooltip: string
  shuffle: string

  // ClonePanel
  newPlaylist: string
  copySuffix: string
  playlistNameAria: string
  playlistNamePlaceholder: string
  cloneMeta: (count: number, seconds: number) => string
  overLimit: (max: number) => string
  createClone: string
  cloning: string
  signInToClone: string
  cloneNotePre: string
  cloneNoteStrong: string
  cloneNotePost: string

  // CloneModal
  creatingTitle: string
  addingTitle: string
  addedOf: (added: number, total: number, percent: number) => string
  pacingHint: string
  doneTitle: string
  doneMessage: (added: number) => string
  cancelledTitle: string
  cancelledMessage: (added: number, total: number) => string
  errorTitle: string
  unknownError: string
  partialHint: (added: number, total: number) => string
  cancel: string
  openInYouTube: string
  close: string

  // ExportPanel
  exportTitle: string
  exportFormatAria: string
  exportDownload: string
  exportSaving: string
  exportNote: string
  exportSaved: (path: string) => string
  exportCancelled: string

  // App
  loginFailed: (msg: string) => string
  logoutFailed: (msg: string) => string
  dismissMessage: string

  exporter: ExportStrings
  main: MainStrings
}

function buildPl(): AppStrings {
  const videos = (n: number): string => pluralPl(n, ['film', 'filmy', 'filmów'])
  const eta = (s: number): string =>
    s < 50 ? `ok. ${Math.max(5, Math.round(s / 5) * 5)} s` : `ok. ${Math.max(1, Math.round(s / 60))} min`
  const total = (s: number): string => {
    const m = Math.round(s / 60)
    const h = Math.floor(m / 60)
    const mm = m % 60
    return h === 0 ? `${mm} min` : `${h} godz. ${mm} min`
  }
  return {
    lang: 'pl',
    appName: 'YT Playlist Cloner',

    signIn: 'Zaloguj się przez YouTube',
    signingIn: 'Logowanie…',
    signOut: 'Wyloguj',
    signedIn: 'Zalogowano',

    heroTitle: 'Sklonuj playlistę YouTube',
    heroSubtitle:
      'Wklej link do playlisty — publicznej, niepublicznej albo własnej prywatnej — ułóż filmy po swojemu i zapisz kopię na swoim koncie.',
    fetchPlaceholder: 'https://www.youtube.com/playlist?list=…',
    fetchButton: 'Pobierz playlistę',
    fetching: 'Pobieranie…',
    connecting: 'Łączenie z YouTube…',
    fetchedCount: (loaded, totalCount) =>
      `Pobrano ${videos(loaded)}${totalCount > loaded ? ` z ~${totalCount}` : ''}`,
    features: [
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
    ],

    myPlaylistsTitle: 'Twoje playlisty',
    myPlaylistsHint: 'Kliknij jedną z Twoich playlist albo wklej link powyżej.',
    myPlaylistsLoading: 'Wczytywanie Twoich playlist…',
    myPlaylistsEmpty: 'Nie masz jeszcze żadnych playlist na tym koncie.',
    myPlaylistsError: 'Nie udało się wczytać Twoich playlist.',
    myPlaylistsRefresh: 'Odśwież',
    pickPlaylistAria: (title) => `Sklonuj playlistę: ${title}`,

    videosCount: videos,
    unavailableNote: (n) =>
      `${pluralPl(n, ['niedostępny film', 'niedostępne filmy', 'niedostępnych filmów'])} — domyślnie poza klonem`,
    dragHint: 'Przeciągaj wiersze, aby ułożyć ręcznie',
    loadMore: 'Przewiń niżej, aby wczytać kolejne wiersze…',
    anotherPlaylist: '← Inna playlista',
    summaryToClone: 'Do klonowania',
    summaryTotalTime: 'Łączny czas',
    totalTime: total,

    unavailableBadge: 'niedostępny',
    includeAria: (title) => `Uwzględnij w klonie: ${title}`,
    includeTooltip: 'Odznacz, aby pominąć',
    skipTooltip: 'Pominięty — zaznacz, aby dodać do klona',

    orderLabel: 'Kolejność',
    sortModeAria: 'Tryb sortowania',
    sortOriginal: 'Kolejność oryginalna',
    sortTitle: 'Tytuł',
    sortDuration: 'Długość',
    sortChannel: 'Kanał',
    sortCustom: 'Własna kolejność',
    reverseAria: 'Odwróć kierunek sortowania',
    ascTooltip: 'Rosnąco — kliknij, aby odwrócić',
    descTooltip: 'Malejąco — kliknij, aby odwrócić',
    shuffle: 'Przetasuj losowo',

    newPlaylist: 'Nowa playlista',
    copySuffix: ' (kopia)',
    playlistNameAria: 'Nazwa nowej playlisty',
    playlistNamePlaceholder: 'Nazwa nowej playlisty',
    cloneMeta: (count, seconds) => `${videos(count)} · ${eta(seconds)}`,
    overLimit: (max) => `YouTube ogranicza playlisty do ${max} filmów — odznacz część z nich.`,
    createClone: 'Utwórz klona',
    cloning: 'Klonowanie…',
    signInToClone: 'Zaloguj się, aby sklonować',
    cloneNotePre: 'Klon powstanie jako playlista ',
    cloneNoteStrong: 'prywatna',
    cloneNotePost: ' na Twoim koncie — widoczność zmienisz później w YouTube.',

    creatingTitle: 'Tworzenie playlisty…',
    addingTitle: 'Dodawanie filmów…',
    addedOf: (added, totalCount, percent) => `Dodano ${added} z ${totalCount} (${percent}%)`,
    pacingHint: 'Tempo jest celowo ograniczone, żeby YouTube nie odrzucał żądań.',
    doneTitle: 'Gotowe!',
    doneMessage: (added) =>
      `Sklonowano ${videos(added)}. Playlista jest prywatna — widoczność zmienisz w YouTube.`,
    cancelledTitle: 'Przerwano',
    cancelledMessage: (added, totalCount) =>
      `Na koncie została częściowa playlista (${added} z ${totalCount} filmów) — możesz ją dokończyć ręcznie albo usunąć w YouTube.`,
    errorTitle: 'Nie udało się',
    unknownError: 'Wystąpił nieznany błąd.',
    partialHint: (added, totalCount) =>
      `Zanim wystąpił błąd, dodano ${added} z ${totalCount} filmów — częściowa playlista została na Twoim koncie.`,
    cancel: 'Anuluj',
    openInYouTube: 'Otwórz w YouTube',
    close: 'Zamknij',

    exportTitle: 'Eksport do pliku',
    exportFormatAria: 'Format eksportu',
    exportDownload: 'Pobierz',
    exportSaving: 'Zapisywanie…',
    exportNote:
      'Zapisuje dane playlisty (z opisem i datą aktualizacji) oraz listę filmów w bieżącej kolejności. Opis i data pojedynczych filmów nie są dostępne w danych playlisty.',
    exportSaved: (path) => `Zapisano: ${path}`,
    exportCancelled: 'Anulowano.',

    loginFailed: (msg) => `Logowanie nie powiodło się: ${msg}`,
    logoutFailed: (msg) => `Wylogowanie nie powiodło się: ${msg}`,
    dismissMessage: 'Zamknij komunikat',

    exporter: {
      metaPlaylist: 'Playlista',
      metaDescription: 'Opis',
      metaAuthor: 'Autor',
      metaUpdated: 'Aktualizacja',
      metaViews: 'Wyświetlenia',
      metaPrivacy: 'Prywatność',
      metaVideoCount: 'Liczba filmów',
      metaUrl: 'URL',
      colNo: 'Lp.',
      colOriginalPos: 'Pozycja oryginalna',
      colInClone: 'W klonie',
      colId: 'ID',
      colTitle: 'Tytuł',
      colChannel: 'Kanał',
      colChannelId: 'ID kanału',
      colDuration: 'Czas',
      colDurationSec: 'Czas (s)',
      colUrl: 'URL',
      colAvailable: 'Dostępny',
      yes: 'tak',
      no: 'nie',
      privacyPublic: 'Publiczna',
      privacyUnlisted: 'Niepubliczna',
      privacyPrivate: 'Prywatna',
      fileFallback: 'playlista'
    },

    main: {
      playlistNotRecognized:
        'Nie rozpoznano playlisty. Wklej link w formacie youtube.com/playlist?list=…',
      mixesNotSupported: 'Miksy YouTube są generowane na bieżąco i nie da się ich sklonować.',
      playlistMissingOrPrivate:
        'Playlista nie istnieje albo jest prywatna. Jeśli to Twoja prywatna playlista, zaloguj się w aplikacji.',
      playlistNeedsLogin: 'Ta playlista wymaga zalogowania. Użyj przycisku „Zaloguj się” u góry.',
      fetchFailed: (msg) => `Nie udało się pobrać playlisty: ${msg}`,
      playlistEmpty: 'Playlista jest pusta albo żaden z jej filmów nie jest dostępny.',
      titleFallback: 'Playlista',
      untitledVideo: '(bez tytułu)',
      cloneInProgress: 'Poprzednie klonowanie jeszcze trwa.',
      noNewPlaylistId: 'YouTube nie zwrócił identyfikatora nowej playlisty.',
      enterPlaylistName: 'Podaj nazwę nowej playlisty.',
      titleTooLong: (max) => `Nazwa playlisty może mieć najwyżej ${max} znaków.`,
      cloneListEmpty: 'Lista filmów do sklonowania jest pusta.',
      tooManyVideos: (max) => `YouTube ogranicza playlisty do ${max} filmów.`,
      invalidVideoId: 'Lista zawiera nieprawidłowy identyfikator filmu.',
      invalidInput: 'Nieprawidłowe dane wejściowe.',
      signInToCreate: 'Zaloguj się, aby utworzyć playlistę na swoim koncie.',
      loginWindowTitle: 'Zaloguj się do YouTube',
      saveDialogTitle: 'Zapisz playlistę',
      exportInvalidData: 'Nieprawidłowe dane eksportu.',
      exportUnsupportedFormat: 'Nieobsługiwany format eksportu.',
      exportNoContent: 'Brak treści do zapisania.',
      exportTooLarge: 'Plik eksportu jest zbyt duży.',
      exportInvalidName: 'Nieprawidłowa nazwa pliku.'
    }
  }
}

function buildEn(): AppStrings {
  const videos = (n: number): string => `${n} ${n === 1 ? 'video' : 'videos'}`
  const eta = (s: number): string =>
    s < 50 ? `~${Math.max(5, Math.round(s / 5) * 5)} s` : `~${Math.max(1, Math.round(s / 60))} min`
  const total = (s: number): string => {
    const m = Math.round(s / 60)
    const h = Math.floor(m / 60)
    const mm = m % 60
    return h === 0 ? `${mm} min` : `${h} h ${mm} min`
  }
  return {
    lang: 'en',
    appName: 'YT Playlist Cloner',

    signIn: 'Sign in with YouTube',
    signingIn: 'Signing in…',
    signOut: 'Sign out',
    signedIn: 'Signed in',

    heroTitle: 'Clone a YouTube playlist',
    heroSubtitle:
      'Paste a playlist link — public, unlisted, or your own private — reorder the videos your way, and save a copy to your account.',
    fetchPlaceholder: 'https://www.youtube.com/playlist?list=…',
    fetchButton: 'Fetch playlist',
    fetching: 'Fetching…',
    connecting: 'Connecting to YouTube…',
    fetchedCount: (loaded, totalCount) =>
      `Fetched ${videos(loaded)}${totalCount > loaded ? ` of ~${totalCount}` : ''}`,
    features: [
      {
        title: 'No Google API',
        body: 'The app talks to YouTube like a browser does — no API keys and no daily quota limits.'
      },
      {
        title: 'Your account, your session',
        body: 'You sign in inside the app window and the session stays on your computer. No external servers.'
      },
      {
        title: 'Any order',
        body: 'Sort videos by title, length, or channel, shuffle them randomly, or arrange them by hand with drag and drop.'
      }
    ],

    myPlaylistsTitle: 'Your playlists',
    myPlaylistsHint: 'Click one of your playlists, or paste a link above.',
    myPlaylistsLoading: 'Loading your playlists…',
    myPlaylistsEmpty: 'You don’t have any playlists on this account yet.',
    myPlaylistsError: 'Couldn’t load your playlists.',
    myPlaylistsRefresh: 'Refresh',
    pickPlaylistAria: (title) => `Clone playlist: ${title}`,

    videosCount: videos,
    unavailableNote: (n) =>
      `${n} unavailable ${n === 1 ? 'video' : 'videos'} — excluded by default`,
    dragHint: 'Drag rows to reorder manually',
    loadMore: 'Scroll down to load more rows…',
    anotherPlaylist: '← Another playlist',
    summaryToClone: 'To clone',
    summaryTotalTime: 'Total time',
    totalTime: total,

    unavailableBadge: 'unavailable',
    includeAria: (title) => `Include in clone: ${title}`,
    includeTooltip: 'Uncheck to skip',
    skipTooltip: 'Skipped — check to include in the clone',

    orderLabel: 'Order',
    sortModeAria: 'Sort mode',
    sortOriginal: 'Original order',
    sortTitle: 'Title',
    sortDuration: 'Length',
    sortChannel: 'Channel',
    sortCustom: 'Custom order',
    reverseAria: 'Reverse sort direction',
    ascTooltip: 'Ascending — click to reverse',
    descTooltip: 'Descending — click to reverse',
    shuffle: 'Shuffle',

    newPlaylist: 'New playlist',
    copySuffix: ' (copy)',
    playlistNameAria: 'New playlist name',
    playlistNamePlaceholder: 'New playlist name',
    cloneMeta: (count, seconds) => `${videos(count)} · ${eta(seconds)}`,
    overLimit: (max) => `YouTube limits playlists to ${max} videos — deselect some of them.`,
    createClone: 'Create clone',
    cloning: 'Cloning…',
    signInToClone: 'Sign in to clone',
    cloneNotePre: 'The clone is created as a ',
    cloneNoteStrong: 'private',
    cloneNotePost: ' playlist on your account — you can change its visibility later in YouTube.',

    creatingTitle: 'Creating playlist…',
    addingTitle: 'Adding videos…',
    addedOf: (added, totalCount, percent) => `Added ${added} of ${totalCount} (${percent}%)`,
    pacingHint: 'The pace is intentionally limited so YouTube doesn’t reject requests.',
    doneTitle: 'Done!',
    doneMessage: (added) =>
      `Cloned ${videos(added)}. The playlist is private — change its visibility in YouTube.`,
    cancelledTitle: 'Cancelled',
    cancelledMessage: (added, totalCount) =>
      `A partial playlist was left on your account (${added} of ${totalCount} videos) — you can finish it manually or delete it in YouTube.`,
    errorTitle: 'Something went wrong',
    unknownError: 'An unknown error occurred.',
    partialHint: (added, totalCount) =>
      `Before the error, ${added} of ${totalCount} videos were added — a partial playlist was left on your account.`,
    cancel: 'Cancel',
    openInYouTube: 'Open in YouTube',
    close: 'Close',

    exportTitle: 'Export to file',
    exportFormatAria: 'Export format',
    exportDownload: 'Download',
    exportSaving: 'Saving…',
    exportNote:
      'Saves the playlist data (with description and last-updated date) and the list of videos in the current order. Per-video descriptions and dates are not available in the playlist data.',
    exportSaved: (path) => `Saved: ${path}`,
    exportCancelled: 'Cancelled.',

    loginFailed: (msg) => `Sign-in failed: ${msg}`,
    logoutFailed: (msg) => `Sign-out failed: ${msg}`,
    dismissMessage: 'Dismiss message',

    exporter: {
      metaPlaylist: 'Playlist',
      metaDescription: 'Description',
      metaAuthor: 'Author',
      metaUpdated: 'Updated',
      metaViews: 'Views',
      metaPrivacy: 'Privacy',
      metaVideoCount: 'Video count',
      metaUrl: 'URL',
      colNo: 'No.',
      colOriginalPos: 'Original position',
      colInClone: 'In clone',
      colId: 'ID',
      colTitle: 'Title',
      colChannel: 'Channel',
      colChannelId: 'Channel ID',
      colDuration: 'Duration',
      colDurationSec: 'Duration (s)',
      colUrl: 'URL',
      colAvailable: 'Available',
      yes: 'yes',
      no: 'no',
      privacyPublic: 'Public',
      privacyUnlisted: 'Unlisted',
      privacyPrivate: 'Private',
      fileFallback: 'playlist'
    },

    main: {
      playlistNotRecognized:
        'Couldn’t recognize the playlist. Paste a link like youtube.com/playlist?list=…',
      mixesNotSupported: 'YouTube mixes are generated on the fly and can’t be cloned.',
      playlistMissingOrPrivate:
        'The playlist doesn’t exist or is private. If it’s your own private playlist, sign in within the app.',
      playlistNeedsLogin: 'This playlist requires signing in. Use the “Sign in” button at the top.',
      fetchFailed: (msg) => `Couldn’t fetch the playlist: ${msg}`,
      playlistEmpty: 'The playlist is empty or none of its videos are available.',
      titleFallback: 'Playlist',
      untitledVideo: '(untitled)',
      cloneInProgress: 'A previous clone is still running.',
      noNewPlaylistId: 'YouTube didn’t return an ID for the new playlist.',
      enterPlaylistName: 'Enter a name for the new playlist.',
      titleTooLong: (max) => `The playlist name can be at most ${max} characters.`,
      cloneListEmpty: 'The list of videos to clone is empty.',
      tooManyVideos: (max) => `YouTube limits playlists to ${max} videos.`,
      invalidVideoId: 'The list contains an invalid video ID.',
      invalidInput: 'Invalid input.',
      signInToCreate: 'Sign in to create a playlist on your account.',
      loginWindowTitle: 'Sign in to YouTube',
      saveDialogTitle: 'Save playlist',
      exportInvalidData: 'Invalid export data.',
      exportUnsupportedFormat: 'Unsupported export format.',
      exportNoContent: 'Nothing to save.',
      exportTooLarge: 'The export file is too large.',
      exportInvalidName: 'Invalid file name.'
    }
  }
}

const STRINGS: Record<Language, AppStrings> = { pl: buildPl(), en: buildEn() }

export function getStrings(lang: Language): AppStrings {
  return STRINGS[lang]
}
