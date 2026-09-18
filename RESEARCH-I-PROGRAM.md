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

**Aplikacja idzie dokładnie tą kolejnością.** Pierwotnie faza 1 zaczynała od mata w 1 (za Twoim planem), ale skoro decyzja nie była niczym podyktowana, przebudowałem fazy na zgodne z metodą. Lekcje 1–2 (plansza, ruchy figur) są pominięte, bo Staś je zna — aplikacja zaczyna od lekcji 3.

### 1.6 Rytuał trzech pytań

Zeszyt „Step 1 extra" wprowadza ćwiczenia bez podanego tematu (jak w prawdziwej partii), a dziecko ma przed każdym ruchem odhaczyć trzy pytania:

1. **Czy mogę wygrać materiał?**
2. **Czy mogę dać mata?**
3. **Czy któraś moja bierka jest zagrożona?**

To gotowy rytuał do powtarzania przy prawdziwej szachownicy — i naturalny kierunek rozbudowy aplikacji (paczka zadań „mix", bez podpowiedzi tematu).

---

## Część 2 — Program zadań, który z tego zbudowałem

### 2.1 Fazy = kolejność lekcji metody

**432 zadania**, wszystkie sprawdzone silnikiem. Numeracja faz odpowiada lekcjom Kroku 1:

| Faza | Nazwa | Lekcja | Zadań | Czego uczy |
|---|---|---|---|---|
| 1 | Bicie | 3 | 55 | zobaczyć, że można coś zabrać |
| 2 | Obrona bierki | 5 | 46 | uciec, zbić napastnika, zasłonić, obronić |
| 3 | Szach | 6 | 71 | dać szacha i obronić się przed nim |
| 4 | Mat w jednym ruchu | 7–8 | 107 | domknięcie partii |
| 5 | Co się opłaca | 10 | 51 | wiszące bierki, wartość materiału |
| 6 | Podwójny atak | 11 | 50 | widelec skoczkiem |
| 7 | Maty techniczne | 13 | 52 | schody dwiema wieżami, mat hetmanem |
| 8 | Pełne zasady | 9, 12, 14 | 0 | roszada, remisy, bicie w przelocie — do zrobienia |

Mata jest 107 — Twój plan wymagał „minimum 100 pozycji mata w 1". Widelców 50, przy wymaganiu „20–30 na motyw".

Przy 6 zadaniach dziennie to **ok. 11 tygodni** materiału bez powtórek.

Zadania rozwiązane przed przebudową nie przepadły: id są stałe, a migracja stanu (`wersja` 1 → 2) przelicza tylko numer odblokowanej fazy.

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

Przy 432 zadaniach takich dziur byłyby dziesiątki. Dlatego:

- `tools/generuj.js` układa rzadkie pozycje i **wylicza rozwiązania silnikiem** (chess.js) — lista jest kompletna z definicji,
- `tools/waliduj.js` przelicza wszystko od nowa i porównuje; obecny wynik: **432 zadania, 0 błędów**,
- silnik jest tylko narzędziem autorskim — do przeglądarki trafiają gotowe dane, więc aplikacja dalej jest jednym plikiem bez zależności.

Walidator przy okazji wyłapał, że oryginalne `f3-01` ma **10 bierek** — powyżej progu z §1.2. Zostawiłem je (jest z Twojego planu), ale nowe zadania takie nie są.

### 2.4 Czego świadomie nie ma i co dalej

**Faza 8 (pełne zasady) jest pusta.** Roszada, bicie w przelocie i pat wymagają albo nowych typów zadań („pat czy mat?" to pytanie wyboru, nie ruch), albo silnika w przeglądarce. To naturalna następna paczka.

**Pominięte lekcje 1–2 i 4.** Plansza, ruchy figur i pion — Staś to zna, więc aplikacja zaczyna od lekcji 3. Jeśli okaże się, że np. ruch gońca jeszcze kuleje, dorobienie paczki „jak chodzi ta figura" to jeden przebieg generatora.

Kolejni kandydaci, w kolejności wartości:

1. **Związania i ataki odkryte** (faza 6) — plan przewiduje po 20–30 zadań, generator ma już walidator związań.
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
