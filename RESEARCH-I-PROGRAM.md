# Research: nauka szachów u 6-latka — i program zadań, który z niego wynika

Dokument ma dwie części: **co mówią źródła** i **co z tego wynikło dla aplikacji**.

---

## Część 1 — Ustalenia

### 1.1 Sesja ma trwać 5–10 minut, nie 30

Trzymanie uwagi u dziecka to mniej więcej **2–3 minuty na rok życia**, czyli u 6-latka realnie **12–18 minut** maksimum, a lekcja szachowa dla 4–6-latka powinna mieć **5–10 minut skupionej pracy**. Konsekwencja jest niebanalna: dziecko ćwiczące 15–20 minut dziennie przez rok wyprzedza dziecko grające dwie godziny raz w tygodniu.

To bezpośrednio uzasadnia format porcji dziennej w aplikacji: **5 zadań + 1 powtórka**, co pokrywa się z rekomendacją trenerów, żeby rozwiązywać **5–10 zadań dziennie**.

### 1.2 Mało bierek na planszy — to twarde wymaganie, nie estetyka

Metoda Stappenmethode (najpowszechniejszy europejski program nauczania szachów, od 1987) wydała osobne zeszyty **„Stepping stones"** dla dzieci **6–9 lat**, bo zwykły zeszyt Kroku 1 był dla nich za trudny. Zmiany względem zeszytu podstawowego są dla nas instrukcją obsługi:

| Zmiana w „Stepping stones" | Uzasadnienie autorów | Co z tego wzięliśmy |
|---|---|---|
| Większe diagramy | młodsze dziecko łatwiej rozpoznaje duże figury | plansza `min(100vw − 32px, 480px)`, pole ≥ 44 px |
| **Mniej bierek w pozycji** | „young children find it difficult to cope with positions where there is a lot of material on the board" | generator trzyma **3–6 bierek**, walidator ostrzega powyżej 7 |
| Tylko 6 diagramów na stronę | żeby ilość pracy nie wyglądała na przytłaczającą | 5 zadań + 1 powtórka, nie więcej |
| **Praktycznie brak tekstu** | „At the age of six, children can often read without yet being able to grasp the meaning of the text" | ikona typu zadania, przycisk 🔊 czytający polecenie |
| Podzielone tematy, zmieniona kolejność | lepsza przyswajalność | poziomy 1–3 wewnątrz każdej fazy |

Punkt o czytaniu jest kluczowy i łatwo go przeoczyć: **6-latek często potrafi przeczytać zdanie, ale nie rozumie go jeszcze w locie**. Dlatego polecenie nie może być jedynym nośnikiem informacji.

### 1.3 Rok, nie trzy miesiące

Autorzy metody piszą wprost, że przerabianie Kroku 1 w trzy miesiące to błąd i lepiej zaplanować **rok** na opanowanie podstaw. Twój plan 12-tygodniowy jest więc ambitny — co nie znaczy zły, bo zakłada codzienny kontakt i rodzica przy planszy. Ale warto to wiedzieć: jeśli Staś utknie w fazie 2 na miesiąc, **to jest norma, nie regres**.

### 1.4 Pamięć robocza dziecka mieści 4–7 elementów

Początkujący nie ma nic w pamięci długotrwałej, więc liczy wszystko „na roboczo" — a ta ma pojemność **4–7 elementów i około 30 sekund**. Pozycja z 15 bierkami po prostu nie mieści się dziecku w głowie. Stąd znowu: rzadkie pozycje, jeden motyw naraz.

### 1.5 Kolejność tematów: mat **nie** jest pierwszy

Tu jest największa niespodzianka researchu. Kolejność lekcji w Kroku 1 wygląda tak:

1. Plansza i bierki → 2. Jak chodzą figury → 3. **Atak i bicie** → 4. Pion → 5. **Obrona** → 6. Szach → 7. **Mat (1)** → 8. Mat (2) → 9. Roszada → 10. Korzystna wymiana → 11. Podwójny atak → 12. Remisy → 13. Mat hetmanem → 14. Bicie w przelocie → 15. Notacja

Mat pojawia się dopiero jako **siódma** lekcja, po biciu i obronie. Autorzy komentują to jednoznacznie: naukę matowania odkłada się tak długo, jak się da.

**Uwaga dla Ciebie:** Twój plan (i faza 1 aplikacji) zaczyna od mata w 1. To rozjazd z metodą źródłową. Nie przebudowałem z tego powodu faz — bo Staś zna już ruchy figur, a Twój plan świadomie wybiera „cel gry" jako pierwszy temat motywacyjny — ale **dołożyłem 30 zadań na obronę przed szachem do fazy 1**, żeby bicie i obrona nie zostały przeskoczone.

### 1.6 Rytuał trzech pytań

Zeszyt „Step 1 extra" wprowadza ćwiczenia bez podanego tematu (jak w prawdziwej partii), a dziecko ma przed każdym ruchem odhaczyć trzy pytania:

1. **Czy mogę wygrać materiał?**
2. **Czy mogę dać mata?**
3. **Czy któraś moja bierka jest zagrożona?**

To gotowy rytuał do powtarzania przy prawdziwej szachownicy — i naturalny kierunek rozbudowy aplikacji (paczka zadań „mix", bez podpowiedzi tematu).

---

## Część 2 — Program zadań, który z tego zbudowałem

### 2.1 Co jest w aplikacji teraz

**286 zadań**, wszystkie sprawdzone silnikiem szachowym:

| Paczka | Zadań | Faza | Motyw |
|---|---|---|---|
| `pakiet-00-start` | 8 | 1–4 | zestaw startowy, pisany ręcznie wg Twojego planu |
| `pakiet-01-mat-w-1` | 100 | 1 | mat w jednym ruchu (hetman, wieża, kombinacje) |
| `pakiet-02-obrona` | 30 | 1 | wszystkie obrony przed szachem |
| `pakiet-03-maty-techniczne` | 50 | 2 | schody dwiema wieżami, domknięcie hetmanem |
| `pakiet-04-wiszace-bierki` | 50 | 3 | zbij bierkę, której nikt nie broni |
| `pakiet-05-widelce` | 48 | 4 | widelec skoczkiem |

Twój plan wymagał „minimum 100 pozycji mata w 1" — **jest dokładnie 100**. Na motywy taktyczne plan mówił „20–30 zadań na motyw" — widelców jest 48.

Przy 6 zadaniach dziennie to **ok. 7 tygodni** materiału bez powtórek, a z powtórkami dłużej.

### 2.2 Trzy poziomy wewnątrz każdej fazy

Każde zadanie ma `poziom` 1–3. Aplikacja **sama podnosi poprzeczkę**: przechodzi na wyższy poziom dopiero, gdy w obecnym jest ≥ 6 rozwiązanych i ≥ 80% z nich za pierwszym razem bez podpowiedzi.

To realizacja tej samej zasady, co Twoja drabinka handicapu — celuj w wysoki odsetek sukcesów, bo za trudno = zniechęcenie.

| Poziom | Jak wygląda |
|---|---|
| 1 | 3–4 bierki, motyw „goły", król przy krawędzi |
| 2 | 4–5 bierek, mniej oczywiste pole |
| 3 | 5–6 bierek, motyw w otoczeniu innych figur |

### 2.3 Dlaczego zadania są generowane, a nie pisane ręcznie

Bo ręczne pisanie **już raz zawiodło**. Pierwsze zadanie ze SPEC-a (`f1-01`, „trzy sposoby obrony") miało wypisane 4 obrony, a legalnych jest **6** — brakowało `c6e7` (skoczek zasłania) i `e8f7` (król ucieka). Dziecko zagrałoby dobry ruch i dostało „spróbuj jeszcze raz".

Przy 286 zadaniach takich dziur byłyby dziesiątki. Dlatego:

- `tools/generuj.js` układa rzadkie pozycje i **wylicza rozwiązania silnikiem** (chess.js) — lista jest kompletna z definicji,
- `tools/waliduj.js` przelicza wszystko od nowa i porównuje; obecny wynik: **286 zadań, 0 błędów**,
- silnik jest tylko narzędziem autorskim — do przeglądarki trafiają gotowe dane, więc aplikacja dalej jest jednym plikiem bez zależności.

Walidator przy okazji wyłapał, że oryginalne `f3-01` ma **10 bierek** — powyżej progu z §1.2. Zostawiłem je (jest z Twojego planu), ale nowe zadania takie nie są.

### 2.4 Czego świadomie nie ma i co dalej

**Faza 5 (pełne zasady) jest pusta.** Roszada, bicie w przelocie i pat wymagają albo nowych typów zadań („pat czy mat?" to pytanie wyboru, nie ruch), albo silnika w przeglądarce. To naturalna następna paczka.

Kolejni kandydaci, w kolejności wartości:

1. **Związania i ataki odkryte** (faza 4) — plan przewiduje po 20–30 zadań, generator ma już walidator związań.
2. **Zadania „mix"** — bez podanego tematu, z rytuałem trzech pytań z §1.6. To dokładnie to, czego metoda używa jako pomostu do prawdziwej partii.
3. **Board vision / „bezpieczna droga"** — ćwiczenie z „Stepping stones": przeprowadź figurę przez planszę, nie wchodząc pod bicie. Uczy patrzenia na to, co robi przeciwnik.

Jak dołożyć paczkę — patrz [FORMAT-ZADAN.md](FORMAT-ZADAN.md).

---

## Źródła

- [Stappenmethode — Krok 1, podręcznik dla trenerów (PDF)](https://www.stappenmethode.nl/en/lp/en_lp_h1.pdf) — kolejność 15 lekcji, zeszyty „Stepping stones" dla 6–9 lat, rytuał trzech pytań, pamięć robocza, „zaplanuj rok"
- [Stappenmethode — opis Kroku 1](https://www.stappenmethode.nl/en/step1.php)
- [Kaabil Kids — codzienna rutyna treningowa dla dzieci](https://kaabilkids.com/blog/daily-chess-practice-routine-for-kids/) — 20 minut dziennie, krótkie sesje
- [CircleChess — realistyczny harmonogram dla początkującego](https://circlechess.com/blog/chess-practice-schedule-beginner) — 5–10 zadań dziennie
- [Kingdom of Chess — w jakim wieku zaczynać](https://kingdomofchess.com/at-what-age-should-a-child-start-learning-chess/) — długość sesji 4–6 lat
- [Chess Tournament Guide — ile powinien ćwiczyć młody zawodnik](https://chesstournamentguide.com/parents/how-much-should-a-young-chess-player-practice/) — uwaga 2–3 min na rok życia
