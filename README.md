# ♟️ Szachy dla Stasia

Aplikacja do nauki szachów dla 6-latka. Strona statyczna (HTML + JS, bez builda i bez bibliotek), bez reklam. Działa bez logowania i offline; opcjonalnie synchronizuje postępy między urządzeniami.

## 🎮 Zagraj online

**[szachy-dla-stasia →](https://mcmajkel.github.io/szachy-dla-stasia/)**

Krótki adres do wpisania na telefonie: **[tinyurl.com/stasioszachy](https://tinyurl.com/stasioszachy)**

Na telefonie warto dodać stronę do ekranu początkowego („Udostępnij" → „Dodaj do ekranu początkowego") — wtedy odpala się jak aplikacja, bez paska przeglądarki.

## 🧩 Co to robi

Program ułożony wg **Kroku 1 metody Stappenmethode**: bicie → obrona bierki → szach → mat → co się opłaca → podwójny atak → maty techniczne.

- **Dziś** — porcja na dziś: 5 zadań z bieżącej fazy + 1 powtórka najdawniej robionego zadania z wcześniejszych faz. Po przerwie ≥ 3 dni porcja to sama powtórka. Po skończonej porcji można grać dalej albo powtarzać. Licznik dni z rzędu.
- **Zadania** — 8 faz w kolejności metodycznej. Kolejna faza odblokowuje się, gdy ≥ 80% zadań fazy jest zaliczonych (rozwiązanych bez błędu i bez podpowiedzi — za pierwszym razem albo przy powtórce) albo gdy rozwiązane są wszystkie. Rodzic może odblokować fazę ręcznie.
- **Graj** — końcówki do ćwiczenia, zadania bez końca, partia z komputerem i plansza do zabawy na lichess.org (**domyślnie wyłączone**, włącza się w panelu rodzica)
- **Moje** — gwiazdki (2 za zadanie rozwiązane czysto za pierwszym razem, 1 za pozostałe rozwiązane), postęp faz, dźwięk, wejście do panelu rodzica

Podpowiedź pojawia się dopiero po trzeciej nieudanej próbie — i to jako przycisk, nie od razu jako tekst.

## 👨‍👩‍👧 Panel rodzica

Przytrzymaj logo na górze przez 3 sekundy **albo** kliknij „Panel rodzica" w zakładce Moje i odpowiedz na pytanie z mnożenia. W środku:

- tabela prób, podpowiedzi i dat dla każdego zadania,
- przełącznik wyjść na lichess,
- wybór zestawu figur (z podglądem),
- notatka o szczeblu handicapu (aplikacja jej nie używa),
- ☁️ synchronizacja: logowanie, stan, „Synchronizuj", „Wyloguj",
- eksport/import postępów w JSON,
- „Odblokuj następną fazę" i reset postępów.

### Dlaczego lichess jest domyślnie wyłączony

Analiza i edytor na lichess **pozwalają ruszać obydwoma kolorami i nie pilnują zasad** — to narzędzia do analizy, nie do gry. Sześciolatek, który trafi tam z aplikacji, widzi „szachy, w których wszystko wolno", łącznie z biciem króla. Przełącznik w panelu rodzica włącza całość: zakładkę „Graj" i przycisk „Zagraj to na lichess" po rozwiązanym zadaniu. Wyłączony = zakładka znika z dolnego paska.

## ☁️ Synchronizacja postępów (opcjonalna)

Bez logowania wszystko działa jak dawniej — postępy są tylko na tym urządzeniu.

- **Logowanie** w panelu rodzica, w sekcji „☁️ Synchronizacja":
  - **e-mail + hasło** (domyślne) — działa też w aplikacji z ikony na ekranie początkowym iOS;
  - **link z maila** — link otwiera się w przeglądarce, więc na iPhonie/iPadzie loguje Safari, a nie aplikację z ikony.
- **Konta zakłada rodzic** w panelu Supabase (Authentication → Users). Rejestracji z aplikacji nie ma.
- **Postępy zostają w `localStorage`**; chmura (Supabase, tabela `postepy`) to kopia. Synchronizacja przy starcie, przy powrocie do aplikacji, po odzyskaniu sieci i ok. 2 s po każdym zapisie.
- **Scalanie nie zabiera postępu** (`scal.js`): zadania z obu urządzeń się sumują, wygrywa lepszy wynik, wyższa faza; seria dni łączy się między urządzeniami; ustawienia rodzica — wygrywa nowsza zmiana. Reset i import docierają też do urządzeń, które były offline.
- W `index.html` jest tylko publiczny klucz Supabase; dane chroni RLS (każde konto widzi tylko swój wiersz).
- **Sprawdzone na żywo** (30.10.2026): logowanie hasłem i synchronizacja między iPhone'em a przeglądarką Chrome na drugim urządzeniu. Logowanie linkiem — tylko w teście na udawanym Supabase.

Szczegóły, decyzje i historia zmian: [SPEC-LOGOWANIE.md](SPEC-LOGOWANIE.md).

## 🔧 Jak to jest zrobione

- **Bez builda, bez npm, bez CDN-ów** w aplikacji. `index.html` ma cały CSS i główny JS; osobno: paczki zadań (`zadania/`), scalanie postępów (`scal.js`), service worker (`sw.js`), zestawy figur (`figury/`). `npm` jest potrzebny tylko narzędziom w `tools/`.
- **Bez bibliotek szachowych** — walidacja przez porównanie ruchu w notacji UCI z listą rozwiązań
- **Figury** — domyślnie „Klasyczne": własne SVG (Unicode ♔♕♖ renderuje się niespójnie na Androidzie i iOS). Do wyboru w panelu rodzica dodatkowe zestawy z plików: Płaskie (RhosGFX, CC0), Fantasy (MIT), Konie (CC BY-NC-SA 4.0), Halloween (MIT, PNG). Źródła i licencje: [figury/LICENCJE.md](figury/LICENCJE.md), spec: [SPEC-ZESTAWY-FIGUR.md](SPEC-ZESTAWY-FIGUR.md)
- **Interakcja tap-tap, nie drag** — drag na telefonie koliduje ze scrollem strony
- **Telefon, iPad i desktop** — na iPadzie poziomo i na telefonie poziomo plansza i treść zadania stoją obok siebie
- **Postępy w `localStorage`** (klucz `szachy-hub-v1`), zapis po każdej próbie i rozwiązaniu
- **Offline** — `sw.js` przy pierwszym otwarciu z internetem zapisuje aplikację, zadania i figury; potem działa bez sieci

## 📚 Zadania

**432 zadania** w paczkach w katalogu `zadania/`. Rozwiązania liczy silnik (`chess.js`) w `tools/generuj.js`, a `tools/waliduj.js` sprawdza je ponownie: obecnie 0 błędów i 2 ostrzeżenia (`f2-02` — dla tego motywu sprawdzana jest tylko legalność; `f3-01` — 10 bierek na planszy, zalecane ≤ 7).

Kolejność faz idzie za **Krokiem 1 metody Stappenmethode** — mat celowo nie jest pierwszy, bo metoda stawia go dopiero jako lekcję 7, po biciu i obronie:

| Faza | Lekcja | Zadań |
|---|---|---|
| 1. Bicie | 3 | 55 |
| 2. Obrona bierki | 5 | 46 |
| 3. Szach | 6 | 71 |
| 4. Mat w jednym ruchu | 7–8 | 107 |
| 5. Co się opłaca | 10 | 51 |
| 6. Podwójny atak | 11 | 50 |
| 7. Maty techniczne | 13 | 52 |
| 8. Pełne zasady | 9, 12, 14 | brak zadań (w aplikacji „wkrótce nowe zadania") |

Każde zadanie ma `poziom` 1–3 (167 / 164 / 101). Aplikacja podnosi poziom w fazie dopiero, gdy dziecko opanuje obecny (≥ 6 rozwiązanych i ≥ 80% z nich za pierwszym razem bez podpowiedzi) albo rozwiąże wszystkie zadania z tego poziomu.

Skąd taki, a nie inny dobór — [RESEARCH-I-PROGRAM.md](RESEARCH-I-PROGRAM.md).

## ➕ Dodawanie zadań

Pełna specyfikacja: **[FORMAT-ZADAN.md](FORMAT-ZADAN.md)**. W skrócie:

```bash
cd tools && npm install     # raz
node tools/generuj.js       # tworzy paczki
node tools/waliduj.js       # musi dać "bledow: 0"
```

Potem jedna linijka w `index.html`:

```html
<script src="zadania/pakiet-08-nowa.js"></script>
```

i dopisanie tej samej ścieżki do listy `PLIKI` w `sw.js` — inaczej nowa paczka nie zadziała offline. `waliduj.js` zgłosi błąd, jeśli o tym zapomnisz.

⚠️ **Nie pisz `rozwiazania` ręcznie.** Aplikacja nie zna zasad szachów — porównuje stringi. Pominięta legalna odpowiedź = dziecko dostaje „spróbuj jeszcze raz" za dobry ruch. Tak było z pierwszym zadaniem w tym repo: miało wpisane 4 obrony przed szachem, a legalnych było 6. Dlatego rozwiązania liczy silnik.

## 🧪 Testy

```bash
node tools/test-scal.js     # scalanie postępów (20 testów)
node tools/waliduj.js       # zadania + zgodność index.html / sw.js / zadania/ / figury/
```

## 📴 Offline i aktualizacje

- Pierwsze otwarcie musi być z internetem — wtedy service worker zapisuje pliki. Potem aplikacja startuje bez sieci.
- **Aktualizacje docierają same.** Aplikacja startuje z pamięci, a w tle pobiera świeże pliki — nowa wersja pojawia się przy drugim otwarciu po wdrożeniu. `WERSJA` w `sw.js` podbij tylko, gdy zmieniasz listę `PLIKI` (stara pamięć zostanie wyczyszczona).
- Każdy lokalny `<script src>` z `index.html` i każdy plik zestawu figur musi być na liście `PLIKI` w `sw.js`. Pilnuje tego `node tools/waliduj.js`.
- Lichess i synchronizacja wymagają internetu; offline postępy zapisują się lokalnie i trafiają do chmury po powrocie sieci.
- iPhone/iPad: dodaj stronę do ekranu początkowego. Safari w zwykłej karcie może skasować dane strony (także postępy) po 7 dniach bez otwierania (polityka ITP w WebKit). Synchronizacja daje kopię w chmurze.
- Service worker działa tylko na `https://` i `localhost`. Otwarte jako `file://` aplikacja działa, ale bez trybu offline.

## 📱 Uruchomienie lokalne

Otwórz `index.html` w przeglądarce — nie ma nic do instalowania. Do testu trybu offline uruchom prosty serwer, np. `python3 -m http.server`, i wejdź na `http://localhost:8000`.
