# Spec: logowanie kodem z maila + synchronizacja postępów

Status: **szkic do akceptacji** · Data: 2026-10-30 · Dotyczy: `index.html`

## TL;DR

> **Zmiana 2026-10-30:** domyślnie logowanie **e-mailem i hasłem** (`POST /auth/v1/token?grant_type=password`). Wbudowany mailer Supabase nie pozwala zmienić szablonu na kod, a własny SMTP to dodatkowa konfiguracja. Hasło wpisuje się w tej aplikacji, w której ma być sesja — więc działa też z ikony iOS, tak jak kod. Logowanie kodem zostaje jako opcja („Zaloguj kodem z maila”), działa po ustawieniu SMTP i szablonu z `{{ .Token }}`.

- Logowanie **6-cyfrowym kodem z maila** (Supabase Auth, email OTP). Nie link — link na iPhonie otwiera Safari, a ikona na ekranie początkowym ma **osobny** `localStorage`, więc sesja wylądowałaby w złym miejscu.
- Konta zakłada **tylko rodzic w panelu Supabase**. Rejestracja z aplikacji wyłączona.
- Postępy dalej zapisują się w `localStorage` (`szachy-hub-v1`) — chmura to kopia i synchronizacja, nie zamiennik. Bez sieci wszystko działa jak dziś.
- Przy każdej synchronizacji: **scal lokalne + chmurę → zapisz w obu miejscach**. Scalanie nigdy nie zabiera postępu (lepszy wynik wygrywa). Pusta chmura nigdy nie nadpisuje urządzenia.
- Bez bibliotek i CDN: wywołania REST przez `fetch`, zgodnie z zasadą „jeden plik, bez zależności" z README.

---

## 1. Problem

Postęp dziecka żyje tylko w `localStorage` jednego urządzenia. Telefon rodzica, iPad i ikona na ekranie początkowym to dla aplikacji trzy różne osoby — seria dni, odblokowane fazy i gwiazdki się rozjeżdżają. Jedyny sposób przeniesienia to ręczny eksport/import JSON w panelu rodzica, a import **zastępuje** stan (`STATE = parsed`), więc łatwo skasować nowszy postęp starszym.

Dodatkowe ryzyko: wyczyszczenie danych przeglądarki = utrata całego postępu, bez kopii.

## 2. Cele

| # | Cel | Jak sprawdzamy |
|---|---|---|
| G1 | Postęp zrobiony na jednym urządzeniu widać na drugim | Rozwiąż zadanie na telefonie → otwórz iPada → zadanie oznaczone, seria ta sama |
| G2 | Zero utraty istniejącego postępu przy wdrożeniu | Każde urządzenie z danymi po pierwszym logowaniu ma ≥ tyle rozwiązanych zadań co przed |
| G3 | Dziecko nie musi się logować | Rodzic loguje raz na urządzenie; sesja trzyma się bez ponownego kodu |
| G4 | Działa z ikony na iOS | Pełny przepływ logowania przechodzi w trybie standalone (z ikony), bez wychodzenia do Safari |
| G5 | Dostęp do danych w chmurze tylko dla zaproszonych kont | Konto spoza listy nie dostaje kodu; zapytanie bez sesji zwraca 0 wierszy |

## 3. Poza zakresem (non-goals)

- **Wiele dzieci na jednym koncie** — dziś jest jeden profil; struktura danych nie blokuje tego później (patrz P2).
- **Blokowanie całej aplikacji za logowaniem** — strona i zadania są publiczne w repo i na GitHub Pages; ukrycie ich za loginem nic nie zabezpiecza. Logowanie chroni tylko dane w chmurze.
- **Logowanie hasłem / Google / Apple** — kod z maila wystarczy dla kilku kont rodzinnych.
- **Synchronizacja na żywo (realtime)** — sync przy starcie, po zadaniu i przy powrocie do aplikacji wystarcza.
- **Historia wersji / cofanie** — eksport JSON w panelu rodzica zostaje jako ręczna kopia.

## 4. Historyjki użytkownika

**Rodzic (administrator)**
- Jako rodzic chcę dodać adres e-mail w panelu Supabase, żeby tylko wybrane osoby mogły synchronizować postępy.
- Jako rodzic chcę zalogować się raz na iPadzie z ikony, wpisując kod z maila, żeby nie przełączać się między aplikacjami.
- Jako rodzic chcę, żeby po pierwszym logowaniu na telefonie, na którym dziecko już grało, nic nie zniknęło.
- Jako rodzic chcę widzieć w panelu, czy i kiedy była ostatnia synchronizacja, żeby wiedzieć, że kopia istnieje.
- Jako rodzic chcę, żeby reset postępów w panelu kasował też chmurę — inaczej scalanie przywróciłoby stare dane.
- Jako rodzic chcę móc się wylogować na danym urządzeniu (np. pożyczony tablet).

**Dziecko**
- Jako dziecko chcę otworzyć ikonę i od razu grać, bez żadnego ekranu logowania.
- Jako dziecko chcę, żeby moja seria dni nie spadła do 1, kiedy wczoraj grałem na tablecie, a dziś na telefonie.

**Przypadki brzegowe**
- Brak sieci przy starcie → aplikacja startuje z `localStorage`, sync przy następnej okazji.
- Kod wygasł / pomylony → jasny komunikat i przycisk „wyślij nowy kod".
- E-mail spoza listy → komunikat „ten adres nie ma dostępu" (bez wysyłania maila).
- Dwa urządzenia grały offline tego samego dnia → po synchronizacji suma postępów, nic nie ginie.

## 5. Wymagania

### P0 — bez tego nie wypuszczamy

**P0-1. Logowanie kodem z maila**
- Formularz w panelu rodzica (za istniejącą bramką z mnożeniem): pole e-mail → „Wyślij kod" → pole kodu → „Zaloguj".
- Wywołania: `POST /auth/v1/otp` z `create_user: false`, potem `POST /auth/v1/verify` z `type: "email"`.
- Szablon maila „Magic Link" w Supabase zmieniony tak, by pokazywał `{{ .Token }}` zamiast linku.
- Kryteria:
  - [ ] Z ikony na iOS cały przepływ odbywa się w aplikacji; użytkownik tylko kopiuje kod z Poczty.
  - [ ] Pole kodu ma `inputmode="numeric"` i `autocomplete="one-time-code"` (iOS podpowiada kod z maila nad klawiaturą).
  - [ ] Zły/wygasły kod → komunikat po polsku, stan formularza zachowany.

**P0-2. Tylko zaproszone konta**
- W Supabase: wyłączone „Allow new users to sign up"; konta dodaje rodzic (Authentication → Users → Add/Invite).
- Kryteria:
  - [ ] E-mail spoza listy → brak maila, komunikat w aplikacji.
  - [ ] Tabela ma włączone RLS; polityki `select/insert/update` tylko gdy `auth.uid() = user_id`.
  - [ ] Zapytanie z samym kluczem publicznym (bez sesji) zwraca 0 wierszy.

**P0-3. Trwała sesja**
- Access + refresh token zapisane w `localStorage` pod osobnym kluczem (np. `szachy-auth-v1`), odświeżane przez `POST /auth/v1/token?grant_type=refresh_token`.
- Kryteria:
  - [ ] Po zamknięciu i otwarciu ikony nadal zalogowany.
  - [ ] Wygasły access token odświeża się bez udziału użytkownika.
  - [ ] Nieudane odświeżenie (np. konto usunięte) → stan „wylogowany", lokalne postępy nietknięte.

**P0-4. Scalanie postępów** (funkcja `scal(a, b)` — czysta, idempotentna, przemienna)

| Pole | Reguła | Dlaczego |
|---|---|---|
| `zadania[id].rozwiazane` | OR | rozwiązane gdziekolwiek = rozwiązane |
| `zadania[id].pierwszaProbaOK` | OR | „lepszy wynik wygrywa" |
| `zadania[id].czystaPowtorka` | OR | j.w. |
| `zadania[id].podpowiedz` | OR | uczciwa informacja dla rodzica |
| `zadania[id].proby` | max | suma nie jest idempotentna — wielokrotne scalanie by ją pompowało |
| `zadania[id].data` | późniejsza | ostatnie rozwiązanie |
| `seria` | wygrywa ta z późniejszym `ostatniDzien`; przy remisie większe `dni` | sama „najdłuższa seria" bez daty dawałaby serię, która już wygasła |
| `odblokowanaFaza` | max, potem `przeliczOdblokowanie()` | nigdy nie zamykamy odblokowanej fazy |
| `dzwiek`, `lichess`, `handicap` | wygrywa strona z nowszym `ustawieniaCzas`; przy remisie chmura | „zawsze chmura” cofałoby zmianę zrobioną właśnie na tym urządzeniu |
| `wersja` | max; po scaleniu `migruj()` | |

- Kryteria:
  - [ ] `scal(a, b)` = `scal(b, a)` i `scal(a, scal(a, b))` = `scal(a, b)` — test w `tools/`.
  - [ ] Pusta chmura + pełne urządzenie → urządzenie bez zmian, chmura = urządzenie.
  - [ ] Pełna chmura + puste urządzenie → urządzenie = chmura.
  - [ ] Telefon (fazy 1–2) + iPad (faza 3) → oba pokazują fazę 3 i wszystkie rozwiązane zadania z obu.

**P0-5. Kiedy synchronizujemy**
- Start aplikacji, `visibilitychange` → widoczna, po `finalizeSolve` i `markDailyDone` (z opóźnieniem ~2 s, żeby nie wysyłać po każdym tapnięciu).
- Zawsze: pobierz wiersz → `scal` → zapisz lokalnie → `upsert` do chmury.
- Kryteria:
  - [ ] Bez sieci/sesji `saveState()` działa dokładnie jak dziś; błąd sieci nie pokazuje dziecku żadnego komunikatu.
  - [ ] Synchronizacja nie blokuje renderu (aplikacja startuje z `localStorage`, scalony stan dorysowuje się po powrocie odpowiedzi).

**P0-6. Reset i import muszą uwzględniać chmurę**
- Reset w panelu: zapis pustego stanu **bez scalania** (lokalnie i w chmurze), za tym samym `confirm()`.
- Import JSON: zostaje „zastąp", też bez scalania, i wysyła wynik do chmury.
- Kryteria:
  - [ ] Po resecie na urządzeniu A i synchronizacji na B — B też jest wyzerowane.

- Reset i import ustawiają `zastapiono = Date.now()`. Przy różnych `zastapiono` nowszy stan wygrywa w całości, bez scalania — dzięki temu urządzenie B, które było offline, też przyjmie reset.

**P0-7. Model danych**
```sql
create table postepy (
  user_id uuid primary key references auth.users on delete cascade,
  stan jsonb not null,
  zaktualizowano timestamptz not null default now()
);
alter table postepy enable row level security;
-- wdrożone jako migracja „postepy” w projekcie Chess-Stanis:
create policy "wlasny wiersz select" on postepy for select to authenticated using ((select auth.uid()) = user_id);
create policy "wlasny wiersz insert" on postepy for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wlasny wiersz update" on postepy for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on postepy from anon;
grant select, insert, update on postepy to authenticated;
```

### P1 — szybko po wdrożeniu

- **P1-1. Status w panelu rodzica** *(zrobione)*: „Zalogowano jako …", „Ostatnia synchronizacja: dziś 14:32", przycisk „Synchronizuj teraz", „Wyloguj".
- **P1-2. Przycisk „Wyślij ponownie"** z odliczaniem 60 s (limit Supabase na ponowne wysłanie kodu).
- **P1-3. Reset odporny na urządzenia offline** *(zrobione w P0-6 przez `zastapiono`)*.

### P2 — projektujemy tak, żeby dało się później

- **Kilkoro dzieci na koncie**: klucz `(user_id, profil)` zamiast samego `user_id`. Dziś jeden wiersz — migracja to dodanie kolumny z domyślną wartością.
- **Własny SMTP** (np. Resend) zamiast wbudowanego, jeśli kont będzie więcej niż kilka.

## 6. Miary sukcesu

Aplikacja rodzinna, kilka kont — mierzymy ręcznie, nie analityką.

| Typ | Miara | Cel |
|---|---|---|
| Wiodąca | Czas od „Wyślij kod" do zalogowania z ikony iOS | < 2 min, bez wychodzenia z aplikacji |
| Wiodąca | Postęp z urządzenia A widoczny na B po otwarciu | 100% w testach z listy w §8 |
| Wiodąca | Liczba rozwiązanych zadań na każdym urządzeniu po pierwszym logowaniu | ≥ liczba sprzed logowania (0 strat) |
| Opóźniona | Ponowne logowania wymagane przez 30 dni | 0 |
| Opóźniona | Utracony postęp zgłoszony przez rodzinę w ciągu 30 dni | 0 |

## 7. Otwarte pytania

| Pytanie | Kto | Blokuje? |
|---|---|---|
| URL projektu Supabase i klucz publiczny (anon/publishable) | rodzic | **tak** — bez tego nie da się podłączyć |
| Lista e-maili do zaproszenia | rodzic | tak, przed testami |
| Wbudowany mailer Supabase wysyła tylko do członków zespołu projektu i ma niski limit godzinowy — wystarczy czy od razu własny SMTP? | rodzic / inżynieria | tak, jeśli zapraszani są spoza zespołu projektu |
| Darmowy projekt Supabase jest wstrzymywany po tygodniu bez aktywności — akceptujemy (aplikacja działa dalej lokalnie, sync wraca po wznowieniu w panelu), czy dodajemy coś, co go budzi? | rodzic | nie |
| Czy logowanie ma być też widoczne poza panelem rodzica (np. mała ikonka chmurki w „Moje")? | rodzic / design | nie |

## 8. Plan i testy

**Faza 1 — konfiguracja (rodzic, ~15 min)**: projekt Supabase, wyłączenie rejestracji, szablon maila z `{{ .Token }}`, tabela + RLS z §P0-7, dodanie kont, przekazanie URL i klucza publicznego.

**Faza 2 — kod (`index.html`)**: moduł auth (fetch), `scal()` + test w `tools/`, hooki sync w `saveState`/start/`visibilitychange`, formularz w panelu rodzica, zmiany resetu i importu. README: aktualizacja „bez logowania, bez backendu".

**Faza 3 — testy na urządzeniach**

- [ ] iPhone, Safari: logowanie, sync
- [ ] iPhone, ikona z ekranu początkowego: logowanie bez wychodzenia do Safari, sesja po zamknięciu ikony
- [ ] iPad poziomo: j.w.
- [ ] Telefon z istniejącym postępem + pusta chmura → nic nie ginie
- [ ] Dwa urządzenia grają offline → po powrocie sieci suma postępów, poprawna seria
- [ ] Tryb samolotowy: aplikacja startuje i zapisuje lokalnie
- [ ] Reset na A → B wyzerowane po synchronizacji
- [ ] E-mail spoza listy → brak kodu

## Źródła

> **Potwierdzone w dokumentacji Supabase (2026-10-30, przez connector):** kod zamiast linku przez `{{ .Token }}` w szablonie „Magic Link”, `shouldCreateUser: false`, `verifyOtp` z `type: "email"`, wbudowany mailer wysyła tylko do członków zespołu organizacji (inne adresy: `email_address_not_authorized`). **Niepotwierdzone:** dokładny limit ponownego wysłania kodu (dokumentacja podaje go jako zmienną), wstrzymywanie darmowego projektu po tygodniu, zachowanie magazynu ikony iOS (webkit.org niedostępne z tej sesji).

- Supabase, logowanie kodem (OTP), `shouldCreateUser`/`create_user`, szablon z `{{ .Token }}`: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase, limity wbudowanego maila i własny SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase, RLS i bezpieczeństwo klucza publicznego w kodzie klienta: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase, wstrzymywanie nieaktywnych darmowych projektów: https://supabase.com/docs/guides/platform/billing-on-supabase
- WebKit, osobny magazyn i wyłączenie 7-dniowego limitu dla aplikacji z ekranu początkowego: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
