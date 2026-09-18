#!/usr/bin/env node
/**
 * Generator zadań — tworzy rzadkie, zweryfikowane silnikiem pozycje dla 6-latka.
 *
 * Dlaczego generator, a nie ręczne pisanie FEN-ów:
 *  - lista `rozwiazania` powstaje z silnika, więc jest KOMPLETNA z definicji
 *    (ręczne pisanie dało dziurę w f1-01 — brakowało dwóch legalnych obron),
 *  - badania (Stappenmethode, zeszyty "Stepping stones" dla 6–9 lat) mówią
 *    wprost: mało bierek na planszy, bo dziecko gubi się w zatłoczonej pozycji.
 *    Generator trzyma 3–6 bierek, czego pozycje z prawdziwych partii nie robią.
 *
 * Użycie:  node tools/generuj.js
 */
const { Chess } = require("chess.js");
const fs = require("fs");
const path = require("path");
const W = require("./waliduj.js");

const POLA = [];
for (const f of "abcdefgh") for (let r = 1; r <= 8; r++) POLA.push(f + r);

/* ---------- deterministyczny random (powtarzalne paczki) ---------- */
let ziarno = 20260918;
function rnd() {
  ziarno = (ziarno * 1103515245 + 12345) & 0x7fffffff;
  return ziarno / 0x7fffffff;
}
const losowy = (t) => t[Math.floor(rnd() * t.length)];
function tasuj(t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

/* ---------- budowanie losowej pozycji ---------- */

function zbudujFen(bierki, tura) {
  const plansza = {};
  for (const { pole, znak } of bierki) plansza[pole] = znak;
  const rzedy = [];
  for (let r = 8; r >= 1; r--) {
    let s = "", puste = 0;
    for (const f of "abcdefgh") {
      const p = plansza[f + r];
      if (!p) puste++;
      else { if (puste) { s += puste; puste = 0; } s += p; }
    }
    if (puste) s += puste;
    rzedy.push(s);
  }
  return rzedy.join("/") + ` ${tura} - - 0 1`;
}

const kolS = (s) => s.charCodeAt(0) - 97;
const rzdS = (s) => parseInt(s[1], 10) - 1;
const odleglosc = (a, b) => Math.max(Math.abs(kolS(a) - kolS(b)), Math.abs(rzdS(a) - rzdS(b)));

/**
 * Losowa pozycja wg szablonu materiału, np. {w:"KQ", b:"K"}.
 * `promien` > 0 stawia bierki w pasie wokół czarnego króla — maty i bicia
 * zdarzają się w jego okolicy, więc trafialność rośnie o rzędy wielkości.
 */
function losowaPozycja(szablon, tura, opcje = {}) {
  const promien = opcje.promien || 0;
  const zajete = new Set();
  const bierki = [];

  // czarny król najpierw — reszta układa się względem niego
  const polaKrola = opcje.brzeg
    ? POLA.filter((s) => s[0] === "a" || s[0] === "h" || s[1] === "1" || s[1] === "8")
    : POLA;
  const kc = losowy(polaKrola);
  zajete.add(kc);
  bierki.push({ pole: kc, znak: "k" });

  // kandydatów liczymy RAZ — filtrowanie 64 pól w pętli losującej było
  // wąskim gardłem generatora (miliardy operacji przy 400k prób)
  const kandydaci = promien ? POLA.filter((x) => odleglosc(x, kc) <= promien) : POLA;
  const wezPole = (warunek) => {
    for (let p = 0; p < 40; p++) {
      const s = losowy(kandydaci);
      if (!zajete.has(s) && (!warunek || warunek(s))) { zajete.add(s); return s; }
    }
    return null;
  };

  // biały król nie może stać obok czarnego
  for (const z of szablon.w) {
    const pole = z.toUpperCase() === "K"
      ? wezPole((s) => odleglosc(s, kc) >= 2)
      : wezPole();
    if (!pole) return null;
    bierki.push({ pole, znak: z.toUpperCase() });
  }
  for (const z of szablon.b) {
    if (z.toLowerCase() === "k") continue;              // król już stoi
    const pole = wezPole();
    if (!pole) return null;
    bierki.push({ pole, znak: z.toLowerCase() });
  }

  const fen = zbudujFen(bierki, tura);
  try {
    const c = new Chess(fen);
    // strona, która NIE jest na ruchu, nie może stać w szachu
    const przeciwny = tura === "w" ? "b" : "w";
    const krolPrzeciwnika = bierki.find(
      (b) => b.znak.toLowerCase() === "k" && (b.znak === "k") === (przeciwny === "b")
    );
    if (krolPrzeciwnika && c.isAttacked(krolPrzeciwnika.pole, tura)) return null;
    // pionki nie na 1. ani 8. linii
    for (const b of bierki) {
      if (b.znak.toLowerCase() === "p" && (b.pole[1] === "1" || b.pole[1] === "8")) return null;
    }
    return c.fen();
  } catch (e) {
    return null;
  }
}

/* ---------- polski opis ruchu ---------- */

const LITERA_PL = { k: "K", q: "H", r: "W", b: "G", n: "S", p: "" };
const NAZWA_PL = { k: "król", q: "hetman", r: "wieża", b: "goniec", n: "skoczek", p: "pion" };
const NARZEDNIK = { k: "królem", q: "hetmanem", r: "wieżą", b: "gońcem", n: "skoczkiem", p: "pionem" };

function zapisPL(fen, uci) {
  const c = new Chess(fen);
  const ruch = c.moves({ verbose: true }).find((m) => m.from + m.to === uci.slice(0, 4));
  if (!ruch) return uci;
  c.move(ruch);
  const bicie = ruch.captured ? "x" : "";
  const sufiks = c.isCheckmate() ? "#" : c.isCheck() ? "+" : "";
  const lit = LITERA_PL[ruch.piece];
  const skad = ruch.piece === "p" && bicie ? ruch.from[0] : "";
  return `${lit}${skad}${bicie}${ruch.to}${sufiks}`;
}

/* ---------- rozpoznawanie wzorca mata (do wyjaśnienia) ---------- */

function opiszMata(fen, uci) {
  const c = new Chess(fen);
  const ruch = c.moves({ verbose: true }).find((m) => m.from + m.to === uci.slice(0, 4));
  c.move(ruch);
  const kolorKrola = c.turn();
  let poleKrola = null;
  for (const rzad of c.board())
    for (const p of rzad)
      if (p && p.type === "k" && p.color === kolorKrola) poleKrola = p.square;

  const sasiednie = (s) => {
    const k = s.charCodeAt(0) - 97, r = +s[1] - 1, out = [];
    for (let dk = -1; dk <= 1; dk++) for (let dr = -1; dr <= 1; dr++) {
      if (!dk && !dr) continue;
      const nk = k + dk, nr = r + dr;
      if (nk >= 0 && nk < 8 && nr >= 0 && nr < 8) out.push(String.fromCharCode(97 + nk) + (nr + 1));
    }
    return out;
  };

  const wokol = sasiednie(poleKrola);
  const wlasne = wokol.filter((s) => { const p = c.get(s); return p && p.color === kolorKrola; });
  const naBrzegu = poleKrola[1] === "1" || poleKrola[1] === "8" || poleKrola[0] === "a" || poleKrola[0] === "h";
  const bronionyPrzezKrola = (() => {
    const kol = kolorKrola === "w" ? "b" : "w";
    let pk = null;
    for (const rzad of c.board())
      for (const p of rzad) if (p && p.type === "k" && p.color === kol) pk = p.square;
    return pk ? sasiednie(pk).includes(ruch.to) : false;
  })();

  if (wlasne.length >= 2 && naBrzegu)
    return "Król jest zamknięty własnymi bierkami — nie ma dokąd uciec.";
  if (bronionyPrzezKrola)
    return `Twój król broni ${NARZEDNIK[ruch.piece]}, więc czarny król nie może jej zbić.`;
  if (naBrzegu)
    return "Król stoi przy krawędzi i wszystkie pola ucieczki są odcięte.";
  return "Wszystkie pola wokół króla są pod kontrolą.";
}

/* ---------- generatory tematyczne ---------- */

/** jak W.matyW1, ale na gotowym obiekcie Chess — parsowanie FEN to główny koszt */
function matyW1Szybki(c) {
  const out = [];
  for (const m of c.moves({ verbose: true })) {
    c.move(m);
    if (c.isCheckmate()) out.push(m.from + m.to + (m.promotion || ""));
    c.undo();
  }
  return out;
}

/** budżet czasu — generator nigdy nie miele w nieskończoność */
const BUDZET_MS = 25000;

function generujMatW1({ ile, szablon, poziom, faza, prefiks, tytul, maxRozwiazan = 2 }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const fen = losowaPozycja(szablon, "w", { promien: 3, brzeg: rnd() < 0.75 });
    if (!fen || widziane.has(fen)) continue;

    const c = new Chess(fen);
    if (c.isGameOver() || c.isCheck()) continue;

    const maty = matyW1Szybki(c);
    if (!maty.length || maty.length > maxRozwiazan) continue;

    // bez matów przez promocję (za wcześnie na to)
    if (maty.some((m) => m.length > 4)) continue;

    widziane.add(fen);
    const uci = maty[0];
    const zapis = zapisPL(fen, uci);
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "mat-w-1", typ: "ruch", orientacja: "white",
      tytul,
      polecenie: "Zamatuj w jednym ruchu.",
      fen,
      rozwiazania: maty,
      podpowiedz: "Sprawdź, gdzie król może uciec — i odetnij mu ostatnie pole.",
      wyjasnienie: `${zapis} — ${opiszMata(fen, uci)}`,
    });
  }
  return wynik;
}

function generujObrone({ ile, szablon, poziom, faza, prefiks }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const fen = losowaPozycja(szablon, "b", { promien: 4 });
    if (!fen || widziane.has(fen)) continue;
    const c = new Chess(fen);
    if (!c.isCheck() || c.isCheckmate()) continue;

    const obrony = W.wszystkieLegalne(fen);
    if (obrony.length < 2 || obrony.length > 4) continue;   // 2–4 odpowiedzi = w sam raz
    if (obrony.some((m) => m.length > 4)) continue;

    widziane.add(fen);
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "obrona-przed-szachem", typ: "znajdz-wszystkie", orientacja: "black",
      tytul: "Obroń się przed szachem",
      polecenie: `Czarny król dostał szacha. Znajdź WSZYSTKIE obrony (jest ich ${obrony.length}).`,
      fen,
      rozwiazania: obrony,
      podpowiedz: "Zbij • Zasłoń • Ucieknij",
      wyjasnienie: `Obron jest ${obrony.length}. Przed szachem broni się zawsze tak samo: zbij atakującą bierkę, zasłoń się swoją albo ucieknij królem.`,
    });
  }
  return wynik;
}

function generujWiszaca({ ile, szablon, poziom, faza, prefiks }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const fen = losowaPozycja(szablon, "w", { promien: 5 });
    if (!fen || widziane.has(fen)) continue;
    const c = new Chess(fen);
    if (c.isCheck() || c.isGameOver()) continue;

    const bicia = W.biciaWiszacych(fen);
    if (bicia.length !== 1) continue;                 // dokładnie jedna wisząca bierka

    // wartość łupu musi być odczuwalna (nie pionek)
    const c2 = new Chess(fen);
    const ruch = c2.moves({ verbose: true }).find((m) => m.from + m.to === bicia[0]);
    if (!ruch || ruch.captured === "p") continue;
    // i nie może to być po prostu bicie broniące się samo przez szach
    if (ruch.piece === "k") continue;

    widziane.add(fen);
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "wiszaca-bierka", typ: "ruch", orientacja: "white",
      tytul: "Wisząca bierka",
      polecenie: "Jedna czarna bierka stoi bez obrony. Zbij ją.",
      fen,
      rozwiazania: bicia,
      podpowiedz: "Zanim zbijesz — sprawdź, czy ktoś tej bierki nie broni.",
      wyjasnienie: `${zapisPL(fen, bicia[0])} — ${NAZWA_PL[ruch.captured]} stał bez obrony, więc bierzesz go za darmo.`,
    });
  }
  return wynik;
}

const SKOK = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const poleZ = (k, r) => (k >= 0 && k < 8 && r >= 0 && r < 8) ? String.fromCharCode(97 + k) + (r + 1) : null;
const skokiZ = (s) => SKOK.map(([dk, dr]) => poleZ(kolS(s) + dk, rzdS(s) + dr)).filter(Boolean);

/**
 * Widelce budowane konstrukcyjnie: najpierw liczymy pole, z którego skoczek
 * atakuje króla i drugą bierkę naraz, dopiero potem stawiamy skoczka tak,
 * by mógł tam wskoczyć. Losowanie-i-sprawdzanie trafiało w to zbyt rzadko.
 */
function generujWidelec({ ile, ofiara, poziom, faza, prefiks }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const kc = losowy(POLA);                                  // czarny król
    const cel = losowy(POLA);                                 // czarna bierka do zdobycia
    if (cel === kc || odleglosc(cel, kc) < 2) continue;

    // pola, z których skoczek atakuje jednocześnie króla i cel
    const polaWidelca = skokiZ(kc).filter((s) => skokiZ(cel).includes(s) && s !== cel && s !== kc);
    if (!polaWidelca.length) continue;
    const doceloweS = losowy(polaWidelca);

    // skąd skoczek może tam wskoczyć
    const skad = losowy(skokiZ(doceloweS).filter((s) => s !== kc && s !== cel));
    if (!skad) continue;

    const kb = losowy(POLA.filter((s) =>
      odleglosc(s, kc) >= 2 && ![cel, skad, doceloweS].includes(s)));
    if (!kb) continue;

    const fen = zbudujFen([
      { pole: kc, znak: "k" }, { pole: cel, znak: ofiara },
      { pole: skad, znak: "N" }, { pole: kb, znak: "K" },
    ], "w");
    if (widziane.has(fen)) continue;

    let c;
    try { c = new Chess(fen); } catch (e) { continue; }
    if (c.isCheck() || c.isGameOver()) continue;
    if (c.isAttacked(kc, "w")) continue;                      // czarny nie może już stać w szachu

    const w = W.widelce(fen, 3);
    if (w.length !== 1 || w[0] !== skad + doceloweS) continue;

    const c2 = new Chess(fen);
    const ruch = c2.moves({ verbose: true }).find((m) => m.from + m.to === w[0]);
    if (!ruch) continue;
    c2.move(ruch);
    if (c2.isAttacked(ruch.to, c2.turn())) continue;          // skoczek nie może stać pod biciem
    if (c2.isCheckmate()) continue;

    widziane.add(fen);
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "widelec", typ: "ruch", orientacja: "white",
      tytul: "Widelec skoczkiem",
      polecenie: "Znajdź ruch skoczka, który atakuje dwie bierki naraz.",
      fen,
      rozwiazania: w,
      podpowiedz: "Szukaj pola, z którego skoczek widzi dwie cenne bierki jednocześnie.",
      wyjasnienie: `${zapisPL(fen, w[0])} — skoczek atakuje dwie bierki naraz. Przeciwnik obroni tylko jedną, drugą zbijasz.`,
    });
  }
  return wynik;
}

/* ---------- złożenie paczek ---------- */

function zapiszPaczke(nazwaPliku, meta, zadania) {
  if (!zadania.length) { console.log(`  ! ${nazwaPliku}: 0 zadan — pomijam`); return; }
  const naglowek =
`/* ${meta.nazwa}
 * ${zadania.length} zadan — wygenerowane i zweryfikowane silnikiem (tools/generuj.js)
 * Kazde "rozwiazania" pochodzi z chess.js, wiec lista jest kompletna.
 * NIE edytowac recznie — patrz FORMAT-ZADAN.md
 */
ZADANIA_PAKIET(`;
  const tresc = JSON.stringify({ ...meta, zadania }, null, 1);
  const plik = path.join(__dirname, "..", "zadania", nazwaPliku);
  fs.writeFileSync(plik, naglowek + tresc + ");\n", "utf8");
  console.log(`  → ${nazwaPliku}: ${zadania.length} zadan`);
}

function main() {
  const katalog = path.join(__dirname, "..", "zadania");
  fs.mkdirSync(katalog, { recursive: true });

  console.log("Generuje zadania (to potrwa kilkanascie sekund)...\n");

  // FAZA 1 — mat w 1 (plan wymaga min. 100 pozycji) + obrona przed szachem
  console.log("FAZA 1 — cel gry");
  const mat1a = generujMatW1({ ile: 20, szablon: { w: "KQ", b: "K" }, poziom: 1, faza: 1, prefiks: "g1a", tytul: "Mat hetmanem" });
  const mat1b = generujMatW1({ ile: 20, szablon: { w: "KR", b: "K" }, poziom: 1, faza: 1, prefiks: "g1b", tytul: "Mat wieżą" });
  const mat1c = generujMatW1({ ile: 20, szablon: { w: "KQR", b: "K" }, poziom: 2, faza: 1, prefiks: "g1c", tytul: "Mat w jednym ruchu" });
  const mat1d = generujMatW1({ ile: 20, szablon: { w: "KRB", b: "Kp" }, poziom: 3, faza: 1, prefiks: "g1d", tytul: "Mat w jednym ruchu" });
  const mat1e = generujMatW1({ ile: 20, szablon: { w: "KQN", b: "Kp" }, poziom: 3, faza: 1, prefiks: "g1e", tytul: "Mat w jednym ruchu" });
  const obrona = generujObrone({ ile: 18, szablon: { w: "KQ", b: "Kr" }, poziom: 2, faza: 1, prefiks: "g1f" });
  const obrona2 = generujObrone({ ile: 12, szablon: { w: "KR", b: "Kn" }, poziom: 2, faza: 1, prefiks: "g1g" });

  zapiszPaczke("pakiet-01-mat-w-1.js",
    { id: "pakiet-01", nazwa: "Mat w jednym ruchu", faza: 1, wersja: 1 },
    [...mat1a, ...mat1b, ...mat1c, ...mat1d, ...mat1e]);
  zapiszPaczke("pakiet-02-obrona.js",
    { id: "pakiet-02", nazwa: "Obrona przed szachem", faza: 1, wersja: 1 },
    [...obrona, ...obrona2]);

  // FAZA 2 — maty techniczne: rozpoznanie pozycji końcowej techniki
  console.log("FAZA 2 — maty techniczne");
  const schody = generujMatW1({ ile: 25, szablon: { w: "KRR", b: "K" }, poziom: 1, faza: 2, prefiks: "g2a", tytul: "Schody z dwóch wież" });
  const hetman = generujMatW1({ ile: 25, szablon: { w: "KQ", b: "K" }, poziom: 2, faza: 2, prefiks: "g2b", tytul: "Domknij mata hetmanem" });
  zapiszPaczke("pakiet-03-maty-techniczne.js",
    { id: "pakiet-03", nazwa: "Maty techniczne", faza: 2, wersja: 1 },
    [...schody, ...hetman]);

  // FAZA 3 — wartość bierek / wiszące bierki
  console.log("FAZA 3 — co sie oplaca");
  const wisz1 = generujWiszaca({ ile: 18, szablon: { w: "KR", b: "Kn" }, poziom: 1, faza: 3, prefiks: "g3a" });
  const wisz2 = generujWiszaca({ ile: 18, szablon: { w: "KB", b: "Kr" }, poziom: 2, faza: 3, prefiks: "g3b" });
  const wisz3 = generujWiszaca({ ile: 14, szablon: { w: "KNP", b: "Kqp" }, poziom: 3, faza: 3, prefiks: "g3c" });
  zapiszPaczke("pakiet-04-wiszace-bierki.js",
    { id: "pakiet-04", nazwa: "Wiszące bierki", faza: 3, wersja: 1 },
    [...wisz1, ...wisz2, ...wisz3]);

  // FAZA 4 — taktyka
  console.log("FAZA 4 — taktyka");
  const wid1 = generujWidelec({ ile: 18, ofiara: "q", poziom: 1, faza: 4, prefiks: "g4a" });
  const wid2 = generujWidelec({ ile: 18, ofiara: "r", poziom: 2, faza: 4, prefiks: "g4b" });
  const wid3 = generujWidelec({ ile: 12, ofiara: "b", poziom: 3, faza: 4, prefiks: "g4c" });
  zapiszPaczke("pakiet-05-widelce.js",
    { id: "pakiet-05", nazwa: "Widelce skoczkiem", faza: 4, wersja: 1 },
    [...wid1, ...wid2, ...wid3]);

  console.log("\nGotowe. Teraz: node tools/waliduj.js");
}

if (require.main === module) main();
