# YT Playlist Cloner

Aplikacja desktopowa (Electron), która klonuje playlisty YouTube **bez oficjalnego API Google** —
bez kluczy API i bez dziennych limitów quota. Wklejasz link do playlisty, układasz filmy po
swojemu (sortowanie, tasowanie, ręczne przeciąganie) i zapisujesz kopię jako nową playlistę na
swoim koncie.

## Funkcje

- **Pobieranie playlist bez logowania** — publiczne i niepubliczne (unlisted) playlisty czytane
  są przez InnerTube (wewnętrzne API strony youtube.com) ze stronicowaniem po 100 filmów.
- **Własne prywatne playlisty** — po zalogowaniu w oknie aplikacji.
- **Sortowanie** — kolejność oryginalna, tytuł, długość, kanał (z polskim collatorem),
  kierunek rosnąco/malejąco, tasowanie losowe i ręczne układanie przeciąganiem.
- **Wybór filmów** — pojedyncze filmy można wykluczyć z klona; filmy niedostępne
  (usunięte/zablokowane) są pomijane domyślnie.
- **Bezpieczne tempo zapisu** — filmy dodawane są paczkami po 20 z przerwami i wykładniczym
  backoffem, żeby nie wpaść w limity InnerTube (429).
- **Logowanie w aplikacji** — sesja YouTube żyje w trwałej partycji Electrona
  (`persist:youtube`); nic nie jest eksportowane ani wysyłane poza Twój komputer.

## Jak to działa

Aplikacja nie używa YouTube Data API v3. Zamiast tego:

1. **Odczyt** — `youtubei.js` odpytuje endpoint `youtubei/v1/browse` (ten sam, którego używa
   strona youtube.com) i przechodzi po tokenach kontynuacji, aż pobierze całą playlistę.
2. **Logowanie** — okno aplikacji otwiera first-party stronę logowania Google
   (`ServiceLogin?service=youtube`), dokładnie tak jak robią to ytmdesktop czy pear-desktop.
   Ciasteczka sesji zostają w partycji Electrona.
3. **Zapis** — `youtubei.js` woła `playlist/create` i `browse/edit_playlist` z podpisem
   SAPISIDHASH wyliczanym z ciasteczka SAPISID. Kolejność dodawania filmów wyznacza kolejność
   na nowej playliście.

## Wymagania

- Node.js 20+
- npm

## Uruchomienie

```bash
npm install
npm run dev        # tryb deweloperski z HMR
```

Build i typecheck:

```bash
npm run typecheck  # kontrola typów (main + renderer)
npm run build      # build produkcyjny do out/
npm run dist:mac   # pakiet .dmg (macOS)
npm run dist:win   # instalator NSIS (Windows)
```

## Ograniczenia

- Playlisty użytkownika mają twardy limit **5000 filmów** (limit YouTube).
- **Miksów** (identyfikatory `RD…`) nie da się sklonować — są generowane na bieżąco.
- Filmy usunięte lub zablokowane regionalnie nie mogą trafić do klona.
- Klon powstaje jako playlista **prywatna** — widoczność zmienisz w YouTube/YouTube Studio.
- Cudze playlisty **prywatne** są niedostępne (klonujesz to, co widzi Twoje konto).

## Zastrzeżenie

Aplikacja korzysta z nieoficjalnego, niewersjonowanego API YouTube (InnerTube) i automatyzuje
działania na Twoim koncie, co formalnie narusza Warunki korzystania z usługi YouTube. Jest
przeznaczona do użytku osobistego, w rozsądnej skali (tempo zapisu jest celowo ograniczone).
Udokumentowane ryzyko przy takim użyciu sprowadza się głównie do przejściowego ograniczenia
żądań; używasz jej jednak na własną odpowiedzialność.

## Licencja

MIT — patrz [LICENSE](LICENSE).
