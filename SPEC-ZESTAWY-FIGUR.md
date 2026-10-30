# Spec: wybór zestawu figur w panelu rodzica

## Problem
Figury są jedną, wbudowaną grafiką (`PIECE_SHAPES` w `index.html`). Rodzic nie może dopasować wyglądu planszy do tego, co Stasiowi się podoba, a zmiana wyglądu bywa motywatorem dla 6-latka.

## Cele
- Rodzic zmienia zestaw figur w panelu rodzica jednym tapnięciem; plansza i zadania zmieniają wygląd od razu.
- Wybór jest zapamiętany i synchronizowany z postępami.
- Aplikacja nadal działa offline.

## Poza zakresem
- Wybór przez dziecko poza panelem rodzica (P1).
- Zestawy własne / wgrywane (P2).
- Zmiana kolorów planszy.

## Wymagania
**P0**
- Zestawy: `Domyślny` (obecne własne SVG), `RhosGFX` (CC0), `Fantasy` (MIT), `Konie` (horsey, CC BY-NC-SA 4.0), `Halloween` (MIT, PNG 500×500). Pliki: `figury/<zestaw>/{w,b}{K,Q,R,B,N,P}.<ext>`; rozszerzenie (`svg` lub `png`) jest polem zestawu w definicji, nie stałą w kodzie (Halloween to PNG 160×160).
- `pieceSvg(ch)` zwraca figurę z wybranego zestawu; dla zestawu „Domyślny" bez zmian.
- Figury z plików ładowane przez `<img>` (nie inline), bo pliki mają własne `id` i `<style>`, które kolidowałyby na jednej stronie.
- Panel rodzica: sekcja „Wygląd figur" z podglądem (król, skoczek, pionek) przy każdym zestawie.
- Wybór w `localStorage` (`szachy-hub-v1`) i w scalaniu `scal.js`; nowe pole nie psuje starych zapisów (brak pola = „Domyślny").
- `sw.js`: figury w cache offline (wymaga podbicia wersji cache). Lista `PLIKI` generowana z tej samej definicji zestawów (z rozszerzeniem), bo brakujący plik przerywa instalację service workera.
- Stopka `attrib` (index.html:1545): lista autorów i licencji używanych zestawów.

Kryteria akceptacji:
- Zmiana zestawu przebudowuje planszę bez przeładowania; animacje ruchu i bicia działają jak wcześniej.
- Po odświeżeniu i na drugim urządzeniu (po zalogowaniu) wybór jest ten sam.
- Tryb samolotowy: wszystkie zestawy się wyświetlają.
- Figury białe i czarne rozróżnialne na obu kolorach pól na telefonie (do sprawdzenia dla każdego zestawu).

**P1** – wybór zestawu przez dziecko jako nagroda za gwiazdki; zestaw sezonowy (Halloween).
**P2** – import własnego zestawu.

## Metryki
- Zestaw można zmienić w ≤ 2 tapnięciach od panelu rodzica.
- Rozmiar cache offline rośnie o ≤ 1 MB (zmierzone: ~415 KB figur w 4 zestawach, w tym ~230 KB Halloween).

## Pytania otwarte
- Czy „Konie" (CC BY-NC-SA, niekomercyjna) są akceptowalne? Aplikacja jest rodzinna i bez reklam, więc tak, ale zmiany tych plików musiałyby mieć tę samą licencję.
- Czy nazwy zestawów po polsku wystarczą, czy dodać obrazek-ikonę.
