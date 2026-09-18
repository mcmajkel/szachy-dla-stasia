# ♟️ Szachy dla Stasia

Hub do nauki szachów dla 6-latka. Jeden plik HTML, bez logowania, bez reklam, bez backendu.

## 🎮 Zagraj online

**[szachy-dla-stasia →](https://mcmajkel.github.io/szachy-dla-stasia/)**

Krótki adres do wpisania na telefonie: **[tinyurl.com/stasioszachy](https://tinyurl.com/stasioszachy)**

Na telefonie warto dodać stronę do ekranu początkowego („Udostępnij" → „Dodaj do ekranu początkowego") — wtedy odpala się jak aplikacja, bez paska przeglądarki.

## 🧩 Co to robi

Towarzysz 12-tygodniowego planu nauki, podzielony na 5 faz: mat w 1 → maty techniczne → wartość bierek → taktyka → pełne zasady. Dziecko wchodzi i w 5–10 minut robi porcję zadań samo.

- **Dziś** — dzienna porcja zadań, seria dni pod rząd
- **Zadania** — 5 faz, kolejna odblokowuje się po 80% zadań rozwiązanych za pierwszym razem bez podpowiedzi
- **Graj** — końcówki do ćwiczenia, puzzle i plansza do zabawy na lichess.org
- **Moje** — gwiazdki, postęp faz, panel rodzica (ukryty za bramką)

Podpowiedź pojawia się dopiero po trzeciej nieudanej próbie — i to jako przycisk, nie od razu jako tekst.

## 👨‍👩‍👧 Panel rodzica

Przytrzymaj logo na górze przez 3 sekundy **albo** kliknij „Panel rodzica" w zakładce Moje i odpowiedz na pytanie z mnożenia. W środku: tabela prób i podpowiedzi dla każdego zadania, eksport/import postępów w JSON, reset i notatka o szczeblu handicapu.

## 🔧 Jak to jest zrobione

- **Jeden plik `index.html`** — cały CSS i JS inline, bez builda, bez npm, bez CDN-ów
- **Bez bibliotek szachowych** — walidacja przez porównanie ruchu w notacji UCI z listą rozwiązań
- **Figury jako własne SVG** — Unicode ♔♕♖ renderuje się niespójnie na Androidzie i iOS
- **Interakcja tap-tap, nie drag** — drag na telefonie koliduje ze scrollem strony
- **Postępy w `localStorage`** (klucz `szachy-hub-v1`), zapis po każdym zadaniu
- **Offline-first** — zadania działają bez internetu, sieci wymaga tylko zakładka „Graj"

## 📚 Zadania

**286 zadań**, wszystkie zweryfikowane silnikiem szachowym, w paczkach w katalogu `zadania/`:

| Paczka | Zadań | Faza |
|---|---|---|
| Zestaw startowy | 8 | 1–4 |
| Mat w jednym ruchu | 100 | 1 |
| Obrona przed szachem | 30 | 1 |
| Maty techniczne | 50 | 2 |
| Wiszące bierki | 50 | 3 |
| Widelce skoczkiem | 48 | 4 |

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
