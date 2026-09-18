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

## ➕ Dodawanie zadań

Zadania to tablica `ZADANIA` na górze skryptu w `index.html`. Nowe dopisuje się bez dotykania reszty kodu:

```js
{ id:"f2-03", faza:2, typ:"ruch", orientacja:"white",
  tytul:"Tytuł zadania",
  polecenie:"Zamatuj w jednym ruchu.",
  fen:"6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
  rozwiazania:["a1a8"],
  podpowiedz:"Krótka podpowiedź.",
  wyjasnienie:"Co się właściwie stało i dlaczego." }
```

Typy zadań: `ruch` (tap figura → tap pole), `znajdz-wszystkie` (licznik „znaleziono 2/6"), `wskaz-pole` (jeden tap w pole).

⚠️ **`rozwiazania` musi być kompletne.** Aplikacja nie zna zasad szachów — porównuje tylko stringi. Jeśli pominiesz legalną odpowiedź, dziecko dostanie „spróbuj jeszcze raz" za dobry ruch. Warto wkleić FEN do `lichess.org/analysis` i sprawdzić, czy nie ma innych rozwiązań.

## 📱 Uruchomienie lokalne

Otwórz `index.html` w przeglądarce. Tyle — nie ma nic do zainstalowania.
