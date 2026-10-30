# Spec: logowanie + synchronizacja postępów (Supabase)

Status: **wdrożone (PR #3, po code review), przed testem na żywo** · Ostatnia zmiana: 2026-10-30 · Dotyczy: `index.html`, `scal.js`

## TL;DR

- Logowanie w panelu rodzica: **e-mail + hasło** (domyślnie) albo **link z maila** (alternatywa). Brak kodu z maila — patrz [Historia zmian](#historia-zmian).
- Hasło wpisuje się w tej aplikacji, w której ma być sesja, więc działa też z **ikony na ekranie początkowym iOS**. Link otwiera się w przeglądarce — na iOS loguje Safari, nie ikonę.
- Konta zakłada **tylko rodzic w panelu Supabase**. Rejestracja wyłączona, a `create_user: false` przy wysyłce linku.
- Postępy dalej zapisują się w `localStorage` (`szachy-hub-v1`) — chmura to kopia i synchronizacja, nie zamiennik. Bez sieci albo bez logowania wszystko działa jak dawniej.
- Przy każdej synchronizacji: **scal lokalne + chmurę → zapisz w obu miejscach**. Scalanie nigdy nie zabiera postępu. Pusta chmura nigdy nie nadpisuje urządzenia.
- Bez bibliotek i CDN: REST przez `fetch`, zgodnie z zasadą „jeden plik, bez zależności" z README.

---

## 1. Problem

Postęp dziecka żyje tylko w `localStorage` jednego urządzenia. Telefon rodzica, iPad i ikona na ekranie początkowym to dla aplikacji trzy różne osoby — seria dni, odblokowane fazy i gwiazdki się rozjeżdżają. Jedyny sposób przeniesienia to ręczny eksport/import JSON w panelu rodzica, a import **zastępuje** stan, więc łatwo skasować nowszy postęp starszym.

Dodatkowe ryzyko: wyczyszczenie danych przeglądarki = utrata całego postępu, bez kopii.

## 2. Cele

| # | Cel | Jak sprawdzamy |
|---|---|---|
| G1 | Postęp zrobiony na jednym urządzeniu widać na drugim | Rozwiąż zadanie na telefonie → otwórz iPada → zadanie oznaczone, seria ta sama |
| G2 | Zero utraty istniejącego postępu przy wdrożeniu | Każde urządzenie z danymi po pierwszym logowaniu ma ≥ tyle rozwiązanych zadań co przed |
| G3 | Dziecko nie musi się logować | Rodzic loguje raz na urządzenie; sesja trzyma się bez ponownego logowania |
| G4 | Działa z ikony na iOS | Logowanie hasłem przechodzi w trybie standalone (z ikony), bez wychodzenia do Safari |
| G5 | Dostęp do danych w chmurze tylko dla zaproszonych kont | Konto spoza listy się nie zaloguje; zapytanie bez sesji → `permission denied` |

## 3. Poza zakresem (non-goals)

- **Wiele dzieci na jednym koncie** — dziś jest jeden profil; struktura danych nie blokuje tego później (patrz P2).
- **Blokowanie całej aplikacji za logowaniem** — strona i zadania są publiczne w repo i na GitHub Pages; ukrycie ich za loginem nic nie zabezpiecza. Logowanie chroni tylko dane w chmurze.
- **Logowanie Google / Apple** — hasło wystarczy dla kilku kont rodzinnych.
- **Kod z maila** — wymaga własnego SMTP (patrz Historia zmian). Do rozważenia, jeśli SMTP kiedyś powstanie.
- **Synchronizacja na żywo (realtime)** — sync przy starcie, po zapisie i przy powrocie do aplikacji wystarcza.
- **Historia wersji / cofanie** — eksport JSON w panelu rodzica zostaje jako ręczna kopia.

## 4. Historyjki użytkownika

**Rodzic (administrator)**
- Jako rodzic chcę dodać adres e-mail w panelu Supabase, żeby tylko wybrane osoby mogły synchronizować postępy.
- Jako rodzic chcę zalogować się raz na iPadzie z ikony, wpisując e-mail i hasło, żeby nie przełączać się między aplikacjami.
- Jako rodzic na komputerze chcę zalogować się linkiem z maila, bez pamiętania hasła.
- Jako rodzic chcę, żeby po pierwszym logowaniu na telefonie, na którym dziecko już grało, nic nie zniknęło.
- Jako rodzic chcę widzieć w panelu, czy i kiedy była ostatnia synchronizacja.
- Jako rodzic chcę, żeby reset postępów w panelu kasował też chmurę — inaczej scalanie przywróciłoby stare dane.
- Jako rodzic chcę móc się wylogować na danym urządzeniu (np. pożyczony tablet).

**Dziecko**
- Jako dziecko chcę otworzyć ikonę i od razu grać, bez żadnego ekranu logowania.
- Jako dziecko chcę, żeby moja seria dni nie spadła do 1, kiedy wczoraj grałem na tablecie, a dziś na telefonie.

**Przypadki brzegowe**
- Brak sieci przy starcie → aplikacja startuje z `localStorage`, sync przy następnej okazji.
- Złe hasło → „Nieprawidłowy e-mail lub hasło.", formularz zostaje.
- Wygasły / zużyty link → komunikat w panelu z propozycją nowego linku albo hasła.
- E-mail spoza listy przy linku → komunikat, brak maila.
- Dwa urządzenia grały offline tego samego dnia → po synchronizacji suma postępów, nic nie ginie.

## 5. Wymagania

### P0 — bez tego nie wypuszczamy

**P0-1a. Logowanie e-mailem i hasłem (domyślne)**
- Formularz w panelu rodzica (za istniejącą bramką z mnożeniem): e-mail, hasło, „Zaloguj".
- Wywołanie: `POST /auth/v1/token?grant_type=password` z `{email, password}`.
- Pola z `autocomplete="username"` / `"current-password"`, żeby iOS proponował zapisane hasło.
- Kryteria:
  - [x] Złe hasło → komunikat po polsku, formularz zachowany (test w przeglądarce, udawany Supabase).
  - [ ] Z ikony na iOS logowanie bez wychodzenia do Safari (test na żywo).

**P0-1b. Logowanie linkiem z maila (alternatywa)**
- Przycisk „Zaloguj linkiem z maila" → e-mail → „Wyślij link".
- Wywołanie: `POST /auth/v1/otp?redirect_to=<adres strony>` z `{email, create_user: false}`.
- Po kliknięciu linku Supabase wraca na stronę z sesją we fragmencie adresu (`#access_token=…&refresh_token=…`). Aplikacja pobiera `/auth/v1/user`, zapisuje sesję i od razu czyści adres (`history.replaceState`).
- Błąd we fragmencie (`#error=…&error_description=…`) → komunikat w panelu rodzica.
- W panelu jasna informacja: na iPhonie/iPadzie link loguje Safari, nie ikonę.
- Wymaga w Supabase: **Authentication → URL Configuration → Redirect URLs: `https://mcmajkel.github.io/szachy-dla-stasia/**`**. Bez tego Supabase odsyła na Site URL.
- Działa na domyślnym szablonie i wbudowanym mailerze, ale **tylko na adresy członków organizacji** w Supabase.
- Kryteria:
  - [x] Powrót z linku → zalogowany, tokeny usunięte z adresu (test w przeglądarce).
  - [x] Wygasły link → komunikat, brak sesji (test w przeglądarce).
  - [ ] Na żywo: mail przychodzi, link wraca na GitHub Pages.

**P0-2. Tylko zaproszone konta**
- W Supabase: wyłączone „Allow new users to sign up"; konta dodaje rodzic (Authentication → Users → Add user, z hasłem).
- Kryteria:
  - [x] Tabela ma włączone RLS; polityki `select/insert/update` tylko gdy `auth.uid() = user_id`.
  - [x] Zapytanie jako `anon` → `permission denied for table postepy` (sprawdzone w bazie).
  - [x] Security advisor Supabase: brak uwag.
  - [ ] Rejestracja wyłączona (do sprawdzenia w panelu — connector nie ma dostępu do ustawień Auth).

**P0-3. Trwała sesja**
- Access + refresh token w `localStorage` pod kluczem `szachy-auth-v1`, odświeżane przez `POST /auth/v1/token?grant_type=refresh_token` minutę przed wygaśnięciem i raz po 401.
- Wylogowanie tylko przy odrzuconym tokenie (400/401/403). 429, 5xx i brak sieci nie wylogowują. Jeśli inna karta już odświeżyła sesję, karta przejmuje jej token zamiast się wylogować.
- Kryteria:
  - [x] Po przeładowaniu nadal zalogowany (test w przeglądarce).
  - [x] Odrzucony refresh token → wylogowanie, lokalne postępy nietknięte. Błąd sieci → bez wylogowania.
  - [ ] Na żywo: po zamknięciu i otwarciu ikony nadal zalogowany.

**P0-4. Scalanie postępów** (`scal.js`, funkcja `scal(lokalny, chmura)` — czysta, idempotentna)

| Pole | Reguła | Dlaczego |
|---|---|---|
| `zadania[id].rozwiazane` | OR | rozwiązane gdziekolwiek = rozwiązane |
| `zadania[id].pierwszaProbaOK` | OR | „lepszy wynik wygrywa" |
| `zadania[id].czystaPowtorka` | OR | j.w. |
| `zadania[id].podpowiedz` | OR | uczciwa informacja dla rodzica |
| `zadania[id].proby` | max | suma nie jest idempotentna — wielokrotne scalanie by ją pompowało |
| `zadania[id].data` | późniejsza | ostatnie rozwiązanie |
| `seria` | przedziały dni `[koniec − dni + 1, koniec]`: stykające się lub nachodzące → suma; z przerwą → późniejszy | wczoraj tablet, dziś telefon = seria trwa; „najdłuższa" bez daty dawałaby serię, która już wygasła |
| `odblokowanaFaza` | max, potem przeliczenie odblokowania | nigdy nie zamykamy odblokowanej fazy |
| `dzwiek`, `lichess`, `handicap` | wygrywa strona z nowszym `ustawieniaCzas`; przy remisie chmura | „zawsze chmura" cofałoby zmianę zrobioną właśnie na tym urządzeniu |
| `zastapiono` | różne → nowszy postęp wygrywa w całości; **wyjątek: pierwsza synchronizacja sesji zawsze sumuje**, znacznik z chmury | reset/import ma dojść do urządzeń offline, ale nie może skasować postępu urządzenia, które dopiero się loguje |
| `wersja` | max; po scaleniu `migruj()` | |

- Zmiana konta na urządzeniu (inne konto niż przy ostatniej synchronizacji, `szachy-konto-v1`): stan z chmury nowego konta zastępuje lokalny, bez mieszania.
- Porównanie stanów przez JSON z posortowanymi kluczami (`jsonb` zmienia kolejność kluczy).
- Kryteria (wszystkie w `node tools/test-scal.js`, 18 testów):
  - [x] Postęp przemienny: `scal(a, b)` = `scal(b, a)`; idempotentny: `scal(a, scal(a, b))` = `scal(a, b)`.
  - [x] Pusta chmura + pełne urządzenie → urządzenie bez zmian.
  - [x] Pełna chmura + puste urządzenie → urządzenie = chmura.
  - [x] Telefon (faza 2) + iPad (faza 3) → faza 3 i suma zadań.
  - [x] Reset przed pierwszym logowaniem nie kasuje chmury; reset w chmurze nie kasuje logującego się urządzenia.
  - [x] Brak zmian → brak zapisu do chmury (test w przeglądarce z odwróconą kolejnością kluczy).

**P0-5. Kiedy synchronizujemy**
- Start aplikacji, `visibilitychange` → widoczna, zdarzenie `online`, ~2 s po każdym `saveState()` (debounce).
- Zawsze: pobierz wiersz → `scal` → zapisz lokalnie → `upsert` do chmury (pomijany, gdy chmura już jest równa).
- Po scaleniu przerysowuje bieżącą zakładkę, ale **nie** ekran rozwiązywanego zadania.
- Kryteria:
  - [x] Bez sieci zapis lokalny działa, brak komunikatów dla dziecka, sync po powrocie sieci (test w przeglądarce).
  - [x] Synchronizacja nie blokuje startu.

**P0-6. Reset i import muszą uwzględniać chmurę**
- Import uzupełnia brakujące pola (jak przy starcie), żeby niepełny JSON nie rozszedł się na inne urządzenia.
- Reset i import ustawiają `zastapiono = Date.now()`. Przy różnych `zastapiono` nowszy stan wygrywa w całości, bez scalania — dzięki temu urządzenie, które było offline, też przyjmie reset.
- Kryteria:
  - [x] Reset → chmura wyzerowana (test w przeglądarce).
  - [ ] Na żywo: reset na A → B wyzerowane po synchronizacji.

**P0-7. Model danych** — wdrożony jako migracja `postepy` w projekcie Chess-Stanis (`xakddwasuguaowgxbagw`, eu-west-1)
```sql
create table public.postepy (
  user_id uuid primary key references auth.users on delete cascade,
  stan jsonb not null,
  zaktualizowano timestamptz not null default now()
);
alter table public.postepy enable row level security;
create policy "wlasny wiersz select" on public.postepy for select to authenticated using ((select auth.uid()) = user_id);
create policy "wlasny wiersz insert" on public.postepy for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "wlasny wiersz update" on public.postepy for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.postepy from anon;
grant select, insert, update on public.postepy to authenticated;
```
W `index.html` jest tylko klucz publiczny (`sb_publishable_…`); dane chroni RLS.

### P1 — szybko po wdrożeniu

- **P1-1. Status w panelu rodzica** *(zrobione)*: „Zalogowano jako …", „Ostatnia synchronizacja: dziś 14:32", „Synchronizuj", „Wyloguj".
- **P1-2. Reset odporny na urządzenia offline** *(zrobione w P0-6 przez `zastapiono`)*.
- **P1-3. Silniejsze hasło** — obecne jest łatwe do zgadnięcia. Ryzyko ograniczone (w bazie tylko postęp w zadaniach), ale zmiana to minuta w panelu Supabase.

### P2 — projektujemy tak, żeby dało się później

- **Kilkoro dzieci na koncie**: klucz `(user_id, profil)` zamiast samego `user_id`. Migracja to dodanie kolumny z domyślną wartością.
- **Własny SMTP** (np. Gmail z hasłem aplikacji): link na dowolne adresy, nie tylko członków organizacji; opcjonalnie powrót do kodu z maila.

## 6. Miary sukcesu

Aplikacja rodzinna, kilka kont — mierzymy ręcznie, nie analityką.

| Typ | Miara | Cel |
|---|---|---|
| Wiodąca | Czas logowania z ikony iOS | < 1 min, bez wychodzenia z aplikacji |
| Wiodąca | Postęp z urządzenia A widoczny na B po otwarciu | 100% w testach z §8 |
| Wiodąca | Liczba rozwiązanych zadań na każdym urządzeniu po pierwszym logowaniu | ≥ liczba sprzed logowania (0 strat) |
| Opóźniona | Ponowne logowania wymagane przez 30 dni | 0 |
| Opóźniona | Utracony postęp zgłoszony przez rodzinę w ciągu 30 dni | 0 |

## 7. Otwarte pytania

| Pytanie | Kto | Blokuje? |
|---|---|---|
| Czy rejestracja nowych kont jest wyłączona? | rodzic (panel Supabase) | nie dla działania, tak dla G5 |
| Czy Redirect URLs zawiera adres GitHub Pages? | rodzic (panel Supabase) | tak, dla logowania linkiem |
| Darmowy projekt Supabase może być wstrzymany po okresie bez aktywności — akceptujemy (aplikacja działa dalej lokalnie, sync wraca po wznowieniu)? | rodzic | nie |
| Czy logowanie ma być widoczne poza panelem rodzica (np. ikonka chmurki w „Moje")? | rodzic / design | nie |

## 8. Testy na urządzeniach (po scaleniu)

- [ ] Komputer: logowanie hasłem, sync
- [ ] Komputer: logowanie linkiem — mail przychodzi, link wraca na stronę zalogowaną
- [ ] iPhone, ikona z ekranu początkowego: logowanie hasłem, sesja po zamknięciu ikony
- [ ] iPad poziomo: j.w.
- [ ] Telefon z istniejącym postępem + pusta chmura → nic nie ginie
- [ ] Dwa urządzenia grają offline → po powrocie sieci suma postępów, poprawna seria
- [ ] Tryb samolotowy: aplikacja startuje i zapisuje lokalnie
- [ ] Reset na A → B wyzerowane po synchronizacji

Po pierwszym logowaniu: sprawdzenie w bazie (`select … from postepy`), czy wiersz powstał.

## Historia zmian

| Data | Zmiana | Powód |
|---|---|---|
| 2026-10-30 | Pierwsza wersja: logowanie 6-cyfrowym kodem z maila (szablon „Magic Link" z `{{ .Token }}`). | Link na iOS otwiera Safari, a ikona z ekranu początkowego ma osobny magazyn — sesja z linku nie trafia do ikony. |
| 2026-10-30 | Ustawienia rodzica: „nowsza zmiana wygrywa" zamiast „zawsze chmura"; reset/import przez `zastapiono` (wcześniej P1). | „Zawsze chmura" cofało zmianę zrobioną na urządzeniu; reset nie docierał do urządzeń offline. |
| 2026-10-30 | Kod z maila → **e-mail + hasło** jako domyślne logowanie. | Panel Supabase nie pozwolił zmienić szablonu maila bez własnego SMTP (ustalenie rodzica w panelu); konfiguracja SMTP to dodatkowy krok, a hasło działa z ikony iOS tak samo jak kod. |
| 2026-10-30 | Alternatywa: **link z maila** (zamiast kodu). | Działa na domyślnym szablonie i wbudowanym mailerze. Ograniczenie: na iOS loguje Safari, nie ikonę; wymaga Redirect URLs. |
| 2026-10-30 | Poprawki po code review (PR #3): pierwsza synchronizacja zawsze sumuje; zmiana konta nie miesza postępów; seria łączona przez urządzenia; ustawienia „nowsza zmiana" także po resecie/imporcie; stabilne porównanie JSON (koniec zbędnych zapisów i przerysowań); wylogowanie tylko przy odrzuconym tokenie; obsługa dwóch kart; import uzupełnia pola. | Review znalazł ryzyko utraty postępu przy pierwszym logowaniu i resecie przed logowaniem (sprzeczne z G2) oraz zbędny zapis do chmury przy każdej synchronizacji. |

## Źródła

Potwierdzone w dokumentacji Supabase (2026-10-30, przez connector Supabase):
- Logowanie bez hasła: `shouldCreateUser: false` blokuje tworzenie kont; kod zamiast linku wymaga `{{ .Token }}` w szablonie „Magic Link"; `verifyOtp` z `type: "email"` — https://supabase.com/docs/guides/auth/auth-email-passwordless
- Wbudowany mailer wysyła tylko na adresy członków organizacji (inne: `email_address_not_authorized`), ma niski limit godzinowy; po własnym SMTP domyślnie 30 maili/h — https://supabase.com/docs/guides/auth/auth-smtp i https://supabase.com/docs/guides/auth/testing-auth-flows
- Implicit flow: sesja wraca we fragmencie adresu `#access_token=…&refresh_token=…` — https://supabase.com/docs/guides/auth/sessions/implicit-flow

Sprawdzone bezpośrednio w projekcie (connector): tabela i polityki, `permission denied` dla `anon`, brak uwag security advisora, konto `mzlamaniec@gmail.com` potwierdzone z ustawionym hasłem.

Niepotwierdzone (strony niedostępne z tej sesji): dokładne zasady wstrzymywania darmowego projektu; zachowanie magazynu ikony iOS (osobny od Safari) — do potwierdzenia w teście z §8 (zalogowanie linkiem w Safari, potem otwarcie ikony).
