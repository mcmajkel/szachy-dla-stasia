/* Zestaw startowy — 8 zadan napisanych recznie wg planu nauki.
 * Zweryfikowane silnikiem (poza f2-02, ktore jest zadaniem pozycyjnym
 * bez obiektywnego kryterium silnikowego — patrz FORMAT-ZADAN.md).
 */
ZADANIA_PAKIET({
  id: "pakiet-00",
  nazwa: "Zestaw startowy",
  faza: 0,
  wersja: 2,
  zadania: [
  { id:"f1-01", poziom:2, motyw:"obrona-przed-szachem", faza:3, typ:"znajdz-wszystkie", orientacja:"black",
    tytul:"Trzy sposoby obrony",
    polecenie:"Białe dały szacha hetmanem. Znajdź WSZYSTKIE obrony.",
    fen:"4k3/3r4/2n5/4Q3/8/8/8/6K1 b - - 0 1",
    rozwiazania:["c6e5","d7e7","c6e7","e8d8","e8f8","e8f7"],
    podpowiedz:"Zbij • Zasłoń • Ucieknij",
    wyjasnienie:"Skoczek z c6 bije hetmana. Wieża z d7 (albo skoczek na e7) zasłania króla. Król może też uciec na d8, f8 lub f7." },

  { id:"f1-02", poziom:1, motyw:"mat-w-1", faza:4, typ:"ruch", orientacja:"white",
    tytul:"Mat na ostatniej linii",
    polecenie:"Zamatuj w jednym ruchu.",
    fen:"6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    rozwiazania:["a1a8"],
    podpowiedz:"Król nie ma gdzie uciec — własne piony go blokują.",
    wyjasnienie:"Wa8# — czarny król jest zamknięty przez własne piony f7, g7, h7." },

  { id:"f1-03", poziom:1, motyw:"mat-w-1", faza:4, typ:"ruch", orientacja:"white",
    tytul:"Hetman z królem",
    polecenie:"Zamatuj w jednym ruchu.",
    fen:"6k1/8/6K1/8/8/8/8/3Q4 w - - 0 1",
    rozwiazania:["d1d8"],
    podpowiedz:"Twój król już pilnuje pól ucieczki.",
    wyjasnienie:"Hd8# — hetman kryje ósmą linię, a król z g6 odbiera f7, g7 i h7." },

  { id:"f2-01", poziom:1, motyw:"mat-w-1", faza:7, typ:"ruch", orientacja:"white",
    tytul:"Schody z dwóch wież",
    polecenie:"Zamatuj w jednym ruchu.",
    fen:"7K/8/8/8/8/1R6/R7/3k4 w - - 0 1",
    rozwiazania:["b3b1"],
    podpowiedz:"Jedna wieża już odcina drugą linię.",
    wyjasnienie:"Wb1# — wieża z a2 trzyma drugą linię, druga wieża daje mata na pierwszej." },

  { id:"f2-02", poziom:3, motyw:"zawezanie-pudelka", faza:7, typ:"ruch", orientacja:"white",
    tytul:"Zamknij pudełko",
    polecenie:"Nie dawaj szacha. Zamknij króla w mniejszym pudełku.",
    fen:"8/8/8/4k3/8/8/8/3Q2K1 w - - 0 1",
    rozwiazania:["d1d3"],
    podpowiedz:"Postaw hetmana tam, gdzie skoczyłby skoczek stojący na polu czarnego króla.",
    wyjasnienie:"Hd3 — z e5 skoczek skoczyłby na d3. Hetman odcina linię d i trzecią, król ma coraz mniej miejsca." },

  { id:"f3-01", poziom:1, motyw:"wiszaca-bierka", faza:5, typ:"ruch", orientacja:"white",
    tytul:"Wisząca bierka",
    polecenie:"Coś stoi bez obrony. Zbij to.",
    fen:"6k1/5ppp/8/3n4/8/8/5PPP/3R2K1 w - - 0 1",
    rozwiazania:["d1d5"],
    podpowiedz:"Sprawdź, czy skoczka ktoś broni.",
    wyjasnienie:"Wxd5 — skoczka nie broni żadna czarna bierka." },

  { id:"f4-01", poziom:1, motyw:"widelec", faza:6, typ:"ruch", orientacja:"white",
    tytul:"Widelec skoczkiem",
    polecenie:"Jeden ruch skoczka atakuje króla i wieżę naraz.",
    fen:"5r2/2k5/8/6N1/8/8/8/K7 w - - 0 1",
    rozwiazania:["g5e6"],
    podpowiedz:"Szukaj pola, z którego skoczek widzi c7 i f8.",
    wyjasnienie:"Se6+ — król musi uciec z szacha, więc po jego ruchu Sxf8 zabiera wieżę." },

  { id:"f4-02", poziom:2, motyw:"zwiazanie", faza:6, typ:"wskaz-pole", orientacja:"white",
    tytul:"Związanie",
    polecenie:"Dotknij skoczka, który jest związany.",
    fen:"3qk3/8/5n2/6B1/8/8/8/4K3 w - - 0 1",
    rozwiazania:["f6"],
    podpowiedz:"Popatrz na przekątną gońca.",
    wyjasnienie:"Skoczek z f6 stoi na przekątnej g5–d8. Jak się ruszy, goniec zbije hetmana." }
]
});
