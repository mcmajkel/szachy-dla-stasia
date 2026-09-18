# Format zadań — jak dogrywać nowe paczki

Zadania nie mieszkają już w `index.html`. Siedzą w katalogu `zadania/` jako **paczki** — osobne pliki `.js`, które same się rejestrują w aplikacji.

Dzięki temu dorzucenie 50 nowych zadań to dodanie jednego pliku i jednej linijki, bez dotykania kodu aplikacji.

---

## 1. Dlaczego akurat plik `.js`, a nie `.json`

Bo aplikacja ma działać po otwarciu z dysku (`file://`), a w tym trybie przeglądarka **blokuje `fetch()`** na pliki lokalne (CORS dla `file://`). Zwykły `<script src="...">` działa bez przeszkód. To ten sam trik, którego używa `words-game` z plikiem `wordsDatabase.js`.

Efekt uboczny: paczka jest wykonywalnym kodem, więc nie wklejaj tam niczego z niepewnego źródła.

---

## 2. Szkielet paczki

Plik `zadania/pakiet-07-cokolwiek.js`:

```js
ZADANIA_PAKIET({
  id: "pakiet-07",              // unikalny, stały
  nazwa: "Widelce gońcem",      // widoczna tylko dla rodzica
  faza: 4,                      // do której fazy trafiają zadania
  wersja: 1,
  zadania: [ /* ... */ ]
});
```

Funkcja `ZADANIA_PAKIET` jest zdefiniowana w `index.html` **przed** wczytaniem paczek, więc plik po prostu się „melduje".

---

## 3. Pojedyncze zadanie

```js
{
  id: "g4d-01",                 // unikalny w całej aplikacji
  faza: 4,                      // 1–5
  poziom: 2,                    // 1 = najłatwiejsze, 3 = najtrudniejsze w tej fazie
  motyw: "widelec",             // decyduje, jak walidator sprawdza rozwiązania
  typ: "ruch",                  // "ruch" | "znajdz-wszystkie" | "wskaz-pole"
  orientacja: "white",          // z czyjej strony pokazać planszę
  tytul: "Widelec gońcem",
  polecenie: "Znajdź ruch gońca, który atakuje dwie bierki naraz.",
  fen: "5r2/2k5/8/6N1/8/8/8/K7 w - - 0 1",
  rozwiazania: ["g5e6"],        // UCI: pole startowe + docelowe, bez spacji
  podpowiedz: "Szukaj pola, z którego goniec widzi obie bierki.",
  wyjasnienie: "Ge6+ — król musi uciec, więc potem bierzesz wieżę."
}
```

### Typy zadań

| `typ` | Jak dziecko odpowiada | Co wpisać w `rozwiazania` |
|---|---|---|
| `ruch` | tap figura → tap pole docelowe | ruchy UCI, np. `["a1a8"]` |
| `znajdz-wszystkie` | jw., z licznikiem „znaleziono 2/6" | **wszystkie** poprawne ruchy |
| `wskaz-pole` | jeden tap w pole | nazwy pól, np. `["f6"]` |

### Poziomy trudności

`poziom` steruje doborem porcji dziennej. Aplikacja podnosi poprzeczkę dopiero, gdy dziecko radzi sobie z obecnym poziomem — dlatego wewnątrz jednej fazy warto mieć zadania na wszystkich trzech poziomach.

| `poziom` | Dla kogo |
|---|---|
| 1 | pierwszy kontakt z motywem, 3–4 bierki na planszy |
| 2 | ten sam motyw, więcej bierek albo mniej oczywiste pole |
| 3 | motyw w otoczeniu innych bierek, bliżej prawdziwej partii |

---

## 4. ⚠️ Najważniejsza zasada: `rozwiazania` musi być KOMPLETNE

Aplikacja **nie zna zasad szachów** — porównuje tylko stringi. Jeśli pominiesz choć jedną legalną odpowiedź, dziecko zagra dobry ruch i usłyszy „spróbuj jeszcze raz". To nie jest teoretyczne ryzyko: pierwsze zadanie w tej aplikacji (`f1-01`) miało wpisane 4 obrony przed szachem, a legalnych było 6.

Dlatego **nie pisz `rozwiazania` ręcznie**. Wylicz je silnikiem:

```bash
cd tools && npm install        # raz
node tools/generuj.js          # tworzy paczki od zera
node tools/waliduj.js          # sprawdza wszystkie paczki w zadania/
```

Walidator dla każdego zadania liczy prawdziwą odpowiedź (chess.js) i krzyczy, gdy lista się nie zgadza:

```
✗ g1a-07 (mat-w-1): BRAKUJACE rozwiazania: h5h8
✗ g3b-02 (wiszaca-bierka): BLEDNE rozwiazania (silnik ich nie potwierdza): d1d5
```

Walidator ostrzega też, gdy na planszy jest więcej niż 7 bierek — badania nad nauczaniem 6-latków (zeszyty „Stepping stones" metody Stappenmethode) mówią wprost, że przy zatłoczonej planszy dziecko przestaje widzieć motyw.

### Motywy rozpoznawane przez walidator

| `motyw` | Co sprawdza silnik |
|---|---|
| `mat-w-1` | wszystkie ruchy dające mata |
| `obrona-przed-szachem` | wszystkie legalne ruchy w pozycji z szachem |
| `wiszaca-bierka` | bicia bierki, której nikt nie broni |
| `widelec` | ruchy atakujące ≥ 2 cenne bierki naraz |
| `zwiazanie` | pola z bierkami związanymi |

Motyw spoza tej listy = walidator sprawdzi tylko, czy ruchy są legalne, i powie o tym wprost. Nowy motyw dopisujesz w `tools/waliduj.js` w tablicy `SILNIK`.

---

## 5. Podpięcie paczki do aplikacji

Jedna linijka w `index.html`, w bloku obok pozostałych paczek:

```html
<script src="zadania/pakiet-07-widelce-goncem.js"></script>
```

Kolejność nie ma znaczenia — aplikacja i tak sortuje zadania po fazie i poziomie. Paczka, której plik nie istnieje, jest po cichu pomijana (aplikacja nie wywala się).

---

## 6. Ścieżka dodania nowej porcji, od zera

1. Dopisz generator tematu w `tools/generuj.js` (albo użyj istniejącego z innym materiałem — patrz `szablon: { w: "KQ", b: "K" }`).
2. `node tools/generuj.js`
3. `node tools/waliduj.js` — musi wyjść `bledow: 0`.
4. Dodaj `<script src="...">` w `index.html`.
5. Otwórz aplikację, przeklikaj dwa–trzy zadania z nowej paczki.
6. `git add . && git commit && git push` — GitHub Pages przebuduje się samo.

---

## 7. Czego świadomie nie ma

- **Zadań wielotchodowych** (mat w 2+). Aplikacja sprawdza pojedynczy ruch; przeciwnik nie odpowiada. Mat w 2 wymagałby silnika w przeglądarce — patrz uwaga o `chess.js` w README.
- **Promocji pionka w zapisie.** Aplikacja skleja UCI z czterech znaków (`e7e8`) i sama promuje na hetmana. Zadania na niedopromowanie nie zadziałają.
- **Roszady i bicia w przelocie** w `rozwiazania` — generator ich nie produkuje, bo pozycje startowe nie mają praw do roszady.
