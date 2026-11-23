# Spec: moduł „Debiut" — nauka otwarć

Status: **plan zatwierdzony**, nic jeszcze nie zaimplementowane (11.2026). Decyzje — §9.

## TL;DR

- **Zasady najpierw, warianty potem.** Moduł uczy 4 reguł debiutu (środek, rozwój, roszada, hetman czeka) i obrony przed dziecięcymi pułapkami (mat szewski, mat głupca). Dopiero na końcu przychodzą **4 krótkie linie** (3–6 własnych ruchów), pokazane jako przykłady tych reguł.
- **5 bloków, ok. 190 zadań i 4 linie z rozgałęzieniami.** Bloki A–B i D korzystają z istniejących typów zadań. Blok C wymaga **jednego nowego typu `linia`**, w którym aplikacja sama odpowiada za przeciwnika ruchem z listy, bez silnika w przeglądarce.
- **Największe ryzyko:** pozycje debiutowe mają 28–32 bierki, a program (RESEARCH §1.2) trzyma 3–6. Łagodzimy to przyciemnianiem bierek nieistotnych i „mini-debiutami” z okrojonym materiałem (blok A, poziom 1).

---

## 1. Problem

Staś po fazie 8 zna wszystkie zasady i podstawową taktykę, ale partię zaczyna przypadkowymi ruchami. W partiach 6-latków przegrywa się najczęściej w pierwszych 5–10 ruchach: wiszącą bierką, matem szewskim albo królem, który został w środku. Aplikacja tego nie ćwiczy, bo każde zadanie to rzadka pozycja z jednym motywem.

## 2. Co mówią źródła i co z tego bierzemy

| Ustalenie | Źródło | Status | Wniosek dla modułu |
|---|---|---|---|
| Stappenmethode uczy debiutu dopiero w **Kroku 2**, w zeszycie *Plus*, lekcja „3+ The opening” | wynik wyszukiwania na stappenmethode.nl (podręcznik trenera Kroku 2) | ⚠️ **nieprzeczytane w całości**, bo strona nie otwiera się z tego środowiska | moduł idzie **po fazie 8**, a nie przed nią |
| Rdzeń zasad debiutu to kontrola środka, szybki rozwój i wczesna roszada | chess.com „Principles of the Opening”, Fine (streszczenie na lichess), blogi trenerów | zbieżne w kilku źródłach, ale to blogi, nie badania | blok A = 4 reguły, każda z własną ikoną |
| Rozumieć zasady, a nie wkuwać warianty; konkretne linie dopiero jako przykłady | blog trenera na lichess, chessgaja | opinia trenerów | linie dopiero w bloku C, krótkie, i każdy ruch ma swoje „dlaczego” |
| 6-latek: mało bierek, mało tekstu, 5–10 minut sesji | RESEARCH-I-PROGRAM.md §1.1–1.4 | już przyjęte w projekcie | porcja to 1 linia + 4 zadania; ikony zamiast zdań |

Do zrobienia przed implementacją: **przeczytać lekcję 3+ z podręcznika Kroku 2** (PDF z linku w Źródłach) i porównać kolejność reguł oraz typy ćwiczeń z tym planem.

## 3. Cele i poza zakresem

**Cele**
- Dziecko zna 4 reguły (🎯 środek, 🐴 rozwój, 🏰 roszada, 👸 hetman czeka) i rozpoznaje ruch, który je łamie.
- Dziecko broni się przed matem szewskim i matem głupca, a samo je wykorzystuje, gdy przeciwnik pozwoli.
- Dziecko gra z pamięci po jednej linii białymi i czarnymi (przeciw 1.e4 i 1.d4), łącznie z typowymi odpowiedziami przeciwnika.

**Poza zakresem**
- Teoria głębsza niż 6–7 ruchów, gambity i nazwy wariantów (dla 6-latka to szum).
- Silnik w przeglądarce. Aplikacja zostaje bez zależności, a odpowiedzi przeciwnika są zapisane w danych.
- Ocena „najlepszego ruchu” silnikiem typu Stockfish. Rozwiązania liczy chess.js offline, tak jak dziś.

---

## 4. Komplet ćwiczeń

Numeracja faz idzie dalej po fazie 8. W UI to jeden moduł „Debiut ♞” z pięcioma blokami (fazy 9–13), więc lista faz w zakładce Zadania nie puchnie.

### Blok A — faza 9: Cztery reguły (≈ 60 zadań)

| # | Ćwiczenie | Typ | Motyw (walidator) | Przykład | Poz. |
|---|---|---|---|---|---|
| A1 | **Zajmij środek.** Który ruch pionem zajmuje środek? | `ruch` | `srodek` *(nowy)*: ruchy piona na d4/e4/d5/e5 albo ruchy, które je atakują | pozycja startowa → `e2e4`, `d2d4` | 1 |
| A2 | **Pokaż pola środka** | `wskaz-pole` | — | tap d4, e4, d5, e5 | 1 |
| A3 | **Wyprowadź figurę.** Znajdź wszystkie ruchy rozwijające | `znajdz-wszystkie` | `rozwoj` *(nowy)*: ruch S/G z pierwszej linii na pole, które nie wisi | start → `g1f3`, `b1c3` (a nie `Sa3`, `Sh3`) | 1–2 |
| A4 | **Skoczek na brzegu.** Sf3 czy Sh3? | `wybor` | `wybor-staly` *(nowy, odpowiedź z danych)* | „Skoczek na brzegu widzi mało pól” | 1 |
| A5 | **Schowaj króla.** Zrób roszadę w pozycji z debiutu | `ruch` | `roszada` (istnieje) | po partii włoskiej → `e1g1` | 2 |
| A6 | **Hetman czeka.** Ruch hetmanem dostaje własny komunikat | `ruch` + `pulapki` | `rozwoj` | `d1h5` → „Hetman wyszedł za wcześnie — przeciwnik go przegoni z tempem” | 2 |
| A7 | **Kto jest lepiej rozwinięty?** | `wybor` | `liczenie-rozwoju` *(nowy)*: liczy S/G poza pierwszą linią i roszadę | „Białe / Czarne / Tak samo” | 2–3 |
| A8 | **Mini-debiut.** Na planszy tylko piony, skoczki i gońce (≤ 7 bierek w strefie gry); wyprowadź figurę do środka | `ruch` | `rozwoj` | okrojona pozycja startowa | 1 |

Poziomy: 1 — mini-debiuty i pozycja startowa; 2 — pozycje po 2–3 ruchach; 3 — po 5–6 ruchach, z jedną pułapką w tle.

### Blok B — faza 10: Pułapki z pierwszych ruchów (≈ 45 zadań)

| # | Ćwiczenie | Typ | Motyw | Przykład (sprawdzony chess.js) | Poz. |
|---|---|---|---|---|---|
| B1 | **Co grozi?** Pokaż pole, na którym przeciwnik da mata | `wskaz-pole` | `grozba-mata` *(nowy)*: pole docelowe mata w 1 dla strony, która nie jest na ruchu | po 1.e4 e5 2.Gc4 Sc6 3.Hh5 → `f7` | 1 |
| B2 | **Obroń f7.** Mat szewski grozi, zagraj obronę | `ruch` | `obrona-przed-matem` *(nowy)* | jw.; silnik daje 8 obron: g6, He7, Hf6, Hg5, Hh4, Sh6, d5, Ke7 | 2 |
| B3 | **Obrona z tempem.** Obrona, która przy okazji atakuje hetmana albo rozwija figurę | `ruch` | `obrona-z-rozwojem` *(nowy)*: obrona przed matem, która atakuje hetmana lub jest ruchem S/G | po 3.Hh5 → `g7g6` (atakuje hetmana); po 4.Hf3 → `g8f6` (rozwija i zasłania f7) | 3 |
| B4 | **Mat szewski / mat głupca / mat Legala — teraz ty matujesz** | `ruch` | `mat-w-1` (istnieje) | 1.f3 e5 2.g4 → `d8h4#`; mat Legala → `c3d5#` | 1–3 |
| B5 | **Wisi w debiucie.** Przeciwnik zostawił bierkę bez obrony | `ruch` | `wiszaca-bierka` (istnieje) | pozycje po 3–6 ruchach | 2–3 |

⚠️ **Decyzja do podjęcia przy B2.** Silnik uznaje Ke7 i d5 za „obronę”, bo po nich nie ma mata w 1, ale to złe ruchy. Zgodnie z FORMAT-ZADAN §4 `rozwiazania` musi zawierać wszystkie 8 ruchów, więc dobrej odpowiedzi nigdy nie odrzucamy. Proponowane rozwiązanie: nowe pole **`oceny`**, czyli `{"e8e7": "Bronisz, ale król w środku to kłopot. Lepiej g6 albo He7."}`. Ruch się liczy, ale zamiast „Brawo!” dziecko dostaje komentarz. Tak samo dla `d7d5` (oddaje piona).

### Blok C — fazy 11–12: Moje pierwsze otwarcia (4 linie, ≈ 40 kroków treningowych)

Repertuar dobrany tak, żeby każdy ruch dał się wytłumaczyć jedną z 4 reguł. Wszystkie linie sprawdzone pod kątem legalności (chess.js, 23.11.2026):

| Linia | Kolor | Ruchy | Rozgałęzienia przeciwnika (P1) |
|---|---|---|---|
| **Partia czterech skoczków** (pierwsza) | białe | 1.e4 e5 2.Sf3 Sc6 3.Sc3 Sf6 4.Gb5 Gb4 5.O-O O-O | 3…Gc5 |
| **Partia włoska** (druga) | białe | 1.e4 e5 2.Sf3 Sc6 3.Gc4 Gc5 4.c3 Sf6 5.d3 d6 6.O-O O-O | 3…Sf6 (dwa skoczki), 2…d6 |
| **Na 1.e4: e5 + skoczki** | czarne | 1.e4 e5 2.Sf3 Sc6 3.Gc4 Gc5 / 3.d4 exd4 4.Sxd4 Sf6 | 3.Gc4 / 3.d4 / 3.Gb5 |
| **Na 1.d4: d5, Sf6, e6, Ge7, O-O** | czarne | 1.d4 d5 2.c4 e6 3.Sc3 Sf6 4.Gg5 Ge7 5.e3 O-O | 2.Gf4 (system londyński): 2…Sf6 3.e3 e6 4.Sf3 Ge7 |

Na 1.d4 czarne nie uczą się konkretnego wariantu. Uczą się **ustawienia** (d5, Sf6, e6, Ge7, O-O), które działa prawie na wszystko, co gra 6-latek białymi.

Tryby każdej linii (stopniowanie trudności = `poziom`):

| Tryb | Co robi dziecko | Poziom |
|---|---|---|
| C1 **Obejrzyj** | aplikacja gra ruch po ruchu; przy każdym ruchu ikona reguły (🎯🐴🏰👸) i przycisk „Dlaczego?” | 1 |
| C2 **Zagraj ze strzałką** | dziecko gra swoje ruchy, strzałka pokazuje figurę (nie pole) | 1 |
| C3 **Z pamięci** | bez strzałki; po 3 błędach podpowiedź jak dziś | 2 |
| C4 **Przeciwnik się zmienia** | aplikacja losuje odpowiedź przeciwnika z rozgałęzień | 3 |
| C5 **Dokończ linię** | start z pozycji w środku linii (np. po 3 ruchach) | 2–3 |

Ruchy dobre, ale inne niż w linii (np. Sc3 zamiast Gc4), dostają komentarz „Dobry ruch 🐴, ale w naszym otwarciu gramy teraz gońcem” i **nie liczą się jako błąd**. Wymaga to pola `alternatywy` na danym kroku.

### Blok D — faza 13: Ukarz błąd przeciwnika (≈ 45 zadań)

Pozycje po 4–8 ruchach z prawdziwych, typowych błędów debiutowych. Dziecko znajduje jeden ruch:

| # | Motyw (istnieje) | Przykład sytuacji | Zadań |
|---|---|---|---|
| D1 | `wiszaca-bierka` | przeciwnik ruszył skoczka i odsłonił piona/gońca | 15 |
| D2 | `widelec` | Sxf7 — widelec hetmana i wieży / Sd5 — widelec na c7 | 15 |
| D3 | `mat-w-1` | król w środku, otwarta linia e | 10 |
| D4 | `zwiazanie` | Gg5 wiąże Sf6 z hetmanem, Gb5 wiąże Sc6 | 5 |

Generator: rozgrywa w chess.js pierwsze ruchy z listy typowych ruchów debiutowych (ze zmiennym ziarnem, jak `generuj-faza8.js`) i zatrzymuje się, gdy pojawia się motyw z jedną albo dwiema odpowiedziami. Tutaj poza walidatorem potrzebny jest **ręczny przegląd** każdej pozycji, bo losowy debiut potrafi dać pozycję, która w prawdziwej partii się nie zdarza.

### Blok E — pomost do partii (P2)

- **Wyścig rozwoju:** obie strony grają tylko ruchami rozwijającymi; wygrywa ten, kto pierwszy zrobi roszadę z wyprowadzonymi czterema figurami. Bez silnika, z regułami sprawdzanymi lokalnie.
- **Partia od pozycji po linii C** przez istniejący przycisk lichess (tylko przy włączonym przełączniku rodzica).
- **Rytuał przed ruchem w debiucie:** 3 pytania z RESEARCH §1.6 + 4. pytanie „Czy rozwijam figurę?”.

---

## 5. Zmiany techniczne

| Plik | Zmiana | Wielkość |
|---|---|---|
| `index.html` | nowy typ `linia`: stan kroku, automatyczna odpowiedź przeciwnika (z opóźnieniem ok. 600 ms i podświetleniem `ostatniRuch`), strzałka C2, losowanie gałęzi C4 | **duża**: główna praca |
| `index.html` | pola `oceny` i `alternatywy` (ruch zaliczony, inny komunikat); oba obok istniejących `pulapki` | mała |
| `index.html` | `FAZY` 9–13 z grupą „Debiut ♞”; blok B (faza 10) odblokowany po fazie 4, pozostałe bloki po fazie 8 albo ręcznie przez rodzica | mała |
| `index.html` | **przyciemnianie bierek** spoza strefy zadania (`strefa: ["c4","f7","h5",...]`) | średnia |
| `index.html` | porcja dnia w module: 1 linia (powtórka najdawniej ćwiczonej) + 4 zadania z bieżącej fazy | mała |
| `tools/generuj-debiut.js` | nowy generator paczek 09–13 (osobny plik, tak jak faza 8, żeby nie ruszać id 01–07) | średnia |
| `tools/waliduj.js` | motywy `srodek`, `rozwoj`, `liczenie-rozwoju`, `grozba-mata`, `obrona-przed-matem`, `obrona-z-rozwojem`; dla `linia`: legalność każdego kroku, ruchów z `alternatywy` i każdej gałęzi | średnia |
| `sw.js` | 5 nowych paczek w `PLIKI`, podbicie `WERSJA` | mała |
| `scal.js` | bez zmian: postęp linii liczony per id kroku (`l-wloska-03`) | — |

Format `linia` (propozycja):

```js
{
  id: "l-wloska", faza: 11, poziom: 1, typ: "linia", tryb: "strzalka",
  orientacja: "white", tytul: "Partia włoska",
  start: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  kroki: [
    { ruch: "e2e4", regula: "srodek", dlaczego: "Pion zajmuje środek i otwiera drogę gońcowi." },
    { przeciwnik: ["e7e5"] },
    { ruch: "g1f3", regula: "rozwoj", alternatywy: { "b1c3": "Dobry ruch 🐴, ale tu gramy Sf3 — atakuje piona e5." } },
    { przeciwnik: ["b8c6"] },
    { ruch: "f1c4", regula: "rozwoj", dlaczego: "Goniec celuje w f7 — najsłabsze pole czarnych." }
  ]
}
```

---

## 6. Kryteria akceptacji

- `node tools/waliduj.js` → `bledow: 0` dla paczek 09–13; każda linia i gałąź legalna od pozycji startowej.
- Linia z bloku C przechodzi do końca na telefonie bez scrolla, a odpowiedź przeciwnika nie pozwala na tap w trakcie animacji (jak `locked` przy pułapkach).
- Ruch z `alternatywy` i z `oceny` nie zwiększa `wrongCount`.
- Tryb samolotowy: moduł działa w całości.
- Przy 32 bierkach strefa zadania jest czytelna: bierki spoza `strefa` przyciemnione, a na iPhonie SE pole ≥ 40 px.

## 7. Metryki (z istniejącego panelu rodzica)

- ≥ 80% zadań bloku B rozwiązanych czysto, zanim odblokuje się blok C.
- Linia „opanowana” = 3 przejścia z pamięci (C3) bez błędu w odstępie ≥ 2 dni.
- Test w prawdziwej partii (rodzic notuje): w 5 partiach z rzędu ani razu mat szewski przeciw Stasiowi, a roszada przed 10. ruchem w ≥ 3 z 5.

## 8. Kolejność wdrożenia

1. **Blok B** (pułapki): największa wartość w partiach, prawie wyłącznie istniejące typy. Nowe są motywy walidatora i pole `oceny`.
2. **Blok A** (reguły): istniejące typy, nowe motywy, przyciemnianie bierek.
3. **Typ `linia` + blok C**: główna praca w `index.html`; najpierw tryby C1–C3, potem C4–C5.
4. **Blok D**: generator z ręcznym przeglądem.
5. Blok E (P2).

## 9. Decyzje (23.11.2026)

| Pytanie | Decyzja | Konsekwencja w planie |
|---|---|---|
| Kiedy odblokować? | **Blok B po fazie 4** (mat w 1); bloki A, C, D po fazie 8 | B nie zależy od roszady; tylko B3 (obrona z tempem) używa pozycji z prawem do roszady, bez wymagania jej ruchu |
| Repertuar białymi | **Najpierw czterech skoczków, potem włoska** | czterech skoczków jest symetryczna i opiera się tylko na regule rozwoju; włoska dochodzi jako druga linia (celowanie w f7) |
| 32 bierki | **Oba sposoby:** poziom 1 = mini-debiuty z okrojonym materiałem, od poziomu 2 pełna plansza z przyciemnianiem bierek spoza `strefa` | do sprawdzenia na Stasiu po bloku A; jeśli przyciemnianie nie wystarczy, mini-debiuty także na poziomie 2 |

Otwarte: treść lekcji „3+ The opening” (Krok 2, Plus) — przeczytać przed implementacją bloku A.

## Źródła

- [Stappenmethode — podręcznik trenera Krok 2 (opis)](https://www.stappenmethode.nl/en/material/step2/handleiding-stap-2/) i [próbka PDF](https://www.stappenmethode.nl/lesmateriaal/samples/en_lp_h2.pdf): lekcja „3+ The opening” w zeszycie Plus (z wyników wyszukiwania; treść lekcji **niezweryfikowana**)
- [Stappenmethode — Krok 2](https://www.stappenmethode.nl/en/step2.php)
- [chess.com — The Principles of the Opening](https://www.chess.com/article/the-principles-of-the-opening)
- [lichess — Reuben Fine, Ideas Behind the Chess Openings: general principles](https://lichess.org/@/DIAChessClubStudies/blog/ideas-behind-the-chess-openings-by-reuben-fine-general-principles/t7trPiGw)
- [lichess — What are the best openings for beginners (perspektywa trenera)](https://lichess.org/@/John-Carre/blog/what-are-the-best-openings-for-beginners-a-chess-coach-perspective/XL4ILcHY)
- [lichess — 5–7 chess opening principles](https://lichess.org/@/Pawel_Chess_Coach/blog/5-7-chess-opening-principles-to-build-a-strong-foundation/k5ZIANmd)
- Linie i obrony z §4: sprawdzone lokalnie przez `chess.js` (`tools/node_modules`), 23.11.2026
