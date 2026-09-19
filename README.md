# ♟️ Szachy dla Stasia

Hub do nauki szachów dla 6-latka. Jeden plik HTML, bez logowania, bez reklam, bez backendu.

## 🎮 Zagraj online

**[szachy-dla-stasia →](https://mcmajkel.github.io/szachy-dla-stasia/)**

Krótki adres do wpisania na telefonie: **[tinyurl.com/stasioszachy](https://tinyurl.com/stasioszachy)**

Na telefonie warto dodać stronę do ekranu początkowego („Udostępnij" → „Dodaj do ekranu początkowego") — wtedy odpala się jak aplikacja, bez paska przeglądarki.

## 🧩 Co to robi

Towarzysz nauki ułożony wg **Kroku 1 metody Stappenmethode**: bicie → obrona bierki → szach → mat → co się opłaca → podwójny atak → maty techniczne. Dziecko wchodzi i w 5–10 minut robi porcję zadań samo.

- **Dziś** — dzienna porcja zadań, seria dni pod rząd
- **Zadania** — 8 faz w kolejności metodycznej, kolejna odblokowuje się po 80% zadań rozwiązanych za pierwszym razem bez podpowiedzi
- **Graj** — końcówki, puzzle i plansza do zabawy na lichess.org (**domyślnie wyłączone**, włącza się w panelu rodzica)
- **Moje** — gwiazdki, postęp faz, panel rodzica (ukryty za bramką)

Podpowiedź pojawia się dopiero po trzeciej nieudanej próbie — i to jako przycisk, nie od razu jako tekst.

## 👨‍👩‍👧 Panel rodzica

Przytrzymaj logo na górze przez 3 sekundy **albo** kliknij „Panel rodzica" w zakładce Moje i odpowiedz na pytanie z mnożenia. W środku: tabela prób i podpowiedzi dla każdego zadania, przełącznik wyjść na lichess, eksport/import postępów w JSON, reset i notatka o szczeblu handicapu.

### Dlaczego lichess jest domyślnie wyłączony

Analiza i edytor na lichess **pozwalają ruszać obydwoma kolorami i nie pilnują zasad** — to narzędzia do analizy, nie do gry. Sześciolatek, który trafi tam z aplikacji, widzi „szachy, w których wszystko wolno", łącznie z biciem króla. Przełącznik w panelu rodzica włącza całość: zakładkę „Graj" i przycisk „Zagraj to na lichess" po rozwiązanym zadaniu. Wyłączony = zakładka znika z dolnego paska.

## 🔧 Jak to jest zrobione

- **Jeden plik `index.html`** — cały CSS i JS inline, bez builda, bez npm, bez CDN-ów
- **Bez bibliotek szachowych** — walidacja przez porównanie ruchu w notacji UCI z listą rozwiązań
- **Figury jako własne SVG** — Unicode ♔♕♖ renderuje się niespójnie na Androidzie i iOS
- **Interakcja tap-tap, nie drag** — drag na telefonie koliduje ze scrollem strony
- **Telefon, iPad i desktop** — na iPadzie poziomo plansza i treść zadania stoją obok siebie, żeby nic nie trzeba było przewijać
- **Postępy w `localStorage`** (klucz `szachy-hub-v1`), zapis po każdym zadaniu
- **Offline-first** — zadania działają bez internetu, sieci wymaga tylko zakładka „Graj"

## 📚 Zadania

**432 zadania**, wszystkie zweryfikowane silnikiem szachowym, w paczkach w katalogu `zadania/`.

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
| 8. Pełne zasady | 9, 12, 14 | — |

Każde ma `poziom` 1–3. Aplikacja podnosi poprzeczkę dopiero, gdy dziecko opanuje obecny poziom (≥ 6 rozwiązanych, ≥ 80% za pierwszym razem bez podpowiedzi).

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
<script src="zadania/pakiet-07-nowa.js"></script>
```

⚠️ **Nie pisz `rozwiazania` ręcznie.** Aplikacja nie zna zasad szachów — porównuje stringi. Pominięta legalna odpowiedź = dziecko dostaje „spróbuj jeszcze raz" za dobry ruch. Tak było z pierwszym zadaniem w tym repo: miało wpisane 4 obrony przed szachem, a legalnych było 6. Dlatego rozwiązania liczy silnik.

## 📱 Uruchomienie lokalne

Otwórz `index.html` w przeglądarce. Tyle — nie ma nic do zainstalowania.
