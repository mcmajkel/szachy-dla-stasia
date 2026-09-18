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

/**
 * LEKCJA 3 — „atak i bicie". Najprostsza umiejętność: zobaczyć, że można coś wziąć.
 * W pozycji jest DOKŁADNIE JEDNO bicie w ogóle i jest bezpieczne.
 */
function generujBicie({ ile, szablon, poziom, faza, prefiks }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const fen = losowaPozycja(szablon, "w", { promien: 5 });
    if (!fen || widziane.has(fen)) continue;
    const c = new Chess(fen);
    if (c.isCheck() || c.isGameOver()) continue;

    const wszystkieBicia = c.moves({ verbose: true }).filter((m) => m.captured);
    if (wszystkieBicia.length !== 1) continue;            // tylko jedno bicie w pozycji
    const bezpieczne = W.biciaWiszacych(fen);
    if (bezpieczne.length !== 1) continue;                // i jest darmowe

    const ruch = wszystkieBicia[0];
    if (ruch.piece === "k" || ruch.captured === "p") continue;

    widziane.add(fen);
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "bicie", typ: "ruch", orientacja: "white",
      tytul: "Zbij bierkę",
      polecenie: "Zbij czarną bierkę.",
      fen,
      rozwiazania: bezpieczne,
      podpowiedz: "Popatrz, którą czarną bierkę możesz zabrać swoją figurą.",
      wyjasnienie: `${zapisPL(fen, bezpieczne[0])} — zabierasz bierkę (${NAZWA_PL[ruch.captured]}) i nic za to nie tracisz.`,
    });
  }
  return wynik;
}

/**
 * LEKCJA 5 — „obrona". Twoja bierka jest atakowana: uciekaj, zbij atakującego,
 * obroń ją albo zasłoń. Silnik zwraca wszystkie ruchy, po których przeciwnik
 * nie wygrywa już materiału.
 */
function generujObronaBierki({ ile, szablon, poziom, faza, prefiks }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const fen = losowaPozycja(szablon, "w", { promien: 5 });
    if (!fen || widziane.has(fen)) continue;
    const c = new Chess(fen);
    if (c.isCheck() || c.isGameOver()) continue;

    // czy czarne naprawdę grożą zabraniem czegoś za darmo?
    let grozba;
    try { grozba = new Chess(fen.replace(" w ", " b ")); } catch (e) { continue; }
    if (!W.maBicieNaMaterial(grozba)) continue;

    const ratujace = W.ratunki(fen);
    if (ratujace.length < 1 || ratujace.length > 5) continue;   // 1–5 odpowiedzi
    if (ratujace.some((m) => m.length > 4)) continue;

    widziane.add(fen);
    const wielo = ratujace.length > 1;
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "obron-bierke",
      typ: wielo ? "znajdz-wszystkie" : "ruch", orientacja: "white",
      tytul: "Ratuj swoją bierkę",
      polecenie: wielo
        ? `Czarne chcą coś zabrać. Znajdź WSZYSTKIE sposoby obrony (jest ich ${ratujace.length}).`
        : "Czarne chcą zabrać twoją bierkę. Uratuj ją.",
      fen,
      rozwiazania: ratujace,
      podpowiedz: "Możesz uciec, zbić napastnika, zasłonić się albo obronić swoją bierkę.",
      wyjasnienie: wielo
        ? `Sposobów jest ${ratujace.length}. Zagrożoną bierkę ratuje się zawsze tak samo: ucieczka, zbicie napastnika, zasłona albo obrona.`
        : `${zapisPL(fen, ratujace[0])} — po tym ruchu czarne nie mają już nic za darmo.`,
    });
  }
  return wynik;
}

/**
 * LEKCJA 6 — „szach". Daj szacha, ale nie oddawaj przy tym figury.
 * Świadomie bez matów: mat jest dopiero lekcją 7.
 */
function generujDajSzacha({ ile, szablon, poziom, faza, prefiks }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const fen = losowaPozycja(szablon, "w", { promien: 5 });
    if (!fen || widziane.has(fen)) continue;
    const c = new Chess(fen);
    if (c.isCheck() || c.isGameOver()) continue;

    const szachy = W.szachyBezpieczne(fen);
    if (szachy.length !== 1) continue;
    if (szachy[0].length > 4) continue;

    // bez matów — mat to osobna, późniejsza lekcja
    const c2 = new Chess(fen);
    c2.move({ from: szachy[0].slice(0, 2), to: szachy[0].slice(2, 4) });
    if (c2.isCheckmate()) continue;

    widziane.add(fen);
    wynik.push({
      id: `${prefiks}-${String(wynik.length + 1).padStart(2, "0")}`,
      faza, poziom, motyw: "daj-szacha", typ: "ruch", orientacja: "white",
      tytul: "Daj szacha",
      polecenie: "Zaatakuj czarnego króla — daj szacha.",
      fen,
      rozwiazania: szachy,
      podpowiedz: "Szach to atak na króla. Sprawdź, która figura może go zaatakować.",
      wyjasnienie: `${zapisPL(fen, szachy[0])} — teraz czarny król jest atakowany i czarne muszą się bronić.`,
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

  console.log("Generuje zadania w kolejnosci metodycznej (Stappenmethode Krok 1)...\n");

  // FAZA 1 — lekcja 3: atak i bicie
  console.log("FAZA 1 — bicie (lekcja 3)");
  const bic1 = generujBicie({ ile: 20, szablon: { w: "KR", b: "Kn" }, poziom: 1, faza: 1, prefiks: "b1a" });
  const bic2 = generujBicie({ ile: 20, szablon: { w: "KB", b: "Kr" }, poziom: 2, faza: 1, prefiks: "b1b" });
  const bic3 = generujBicie({ ile: 15, szablon: { w: "KNP", b: "Kqp" }, poziom: 3, faza: 1, prefiks: "b1c" });
  zapiszPaczke("pakiet-01-bicie.js",
    { id: "pakiet-01", nazwa: "Bicie", faza: 1, wersja: 1 }, [...bic1, ...bic2, ...bic3]);

  // FAZA 2 — lekcja 5: obrona zagrozonej bierki
  console.log("FAZA 2 — obrona bierki (lekcja 5)");
  const obr1 = generujObronaBierki({ ile: 20, szablon: { w: "KR", b: "Kb" }, poziom: 1, faza: 2, prefiks: "b2a" });
  const obr2 = generujObronaBierki({ ile: 20, szablon: { w: "KN", b: "Kr" }, poziom: 2, faza: 2, prefiks: "b2b" });
  const obr3 = generujObronaBierki({ ile: 15, szablon: { w: "KRP", b: "Kqp" }, poziom: 3, faza: 2, prefiks: "b2c" });
  zapiszPaczke("pakiet-02-obrona-bierki.js",
    { id: "pakiet-02", nazwa: "Obrona bierki", faza: 2, wersja: 1 }, [...obr1, ...obr2, ...obr3]);

  // FAZA 3 — lekcja 6: szach (dawanie i obrona przed nim)
  console.log("FAZA 3 — szach (lekcja 6)");
  const sza1 = generujDajSzacha({ ile: 20, szablon: { w: "KR", b: "Kp" }, poziom: 1, faza: 3, prefiks: "b3a" });
  const sza2 = generujDajSzacha({ ile: 18, szablon: { w: "KB", b: "Krp" }, poziom: 2, faza: 3, prefiks: "b3b" });
  const odS1 = generujObrone({ ile: 18, szablon: { w: "KQ", b: "Kr" }, poziom: 2, faza: 3, prefiks: "b3c" });
  const odS2 = generujObrone({ ile: 14, szablon: { w: "KR", b: "Kn" }, poziom: 3, faza: 3, prefiks: "b3d" });
  zapiszPaczke("pakiet-03-szach.js",
    { id: "pakiet-03", nazwa: "Szach", faza: 3, wersja: 1 }, [...sza1, ...sza2, ...odS1, ...odS2]);

  // FAZA 4 — lekcje 7-8: mat
  console.log("FAZA 4 — mat (lekcje 7-8)");
  const m1 = generujMatW1({ ile: 25, szablon: { w: "KQ", b: "K" }, poziom: 1, faza: 4, prefiks: "b4a", tytul: "Mat hetmanem" });
  const m2 = generujMatW1({ ile: 25, szablon: { w: "KR", b: "K" }, poziom: 1, faza: 4, prefiks: "b4b", tytul: "Mat wieza" });
  const m3 = generujMatW1({ ile: 25, szablon: { w: "KQR", b: "K" }, poziom: 2, faza: 4, prefiks: "b4c", tytul: "Mat w jednym ruchu" });
  const m4 = generujMatW1({ ile: 15, szablon: { w: "KRB", b: "Kp" }, poziom: 3, faza: 4, prefiks: "b4d", tytul: "Mat w jednym ruchu" });
  const m5 = generujMatW1({ ile: 15, szablon: { w: "KQN", b: "Kp" }, poziom: 3, faza: 4, prefiks: "b4e", tytul: "Mat w jednym ruchu" });
  zapiszPaczke("pakiet-04-mat-w-1.js",
    { id: "pakiet-04", nazwa: "Mat w jednym ruchu", faza: 4, wersja: 1 }, [...m1, ...m2, ...m3, ...m4, ...m5]);

  // FAZA 5 — lekcja 10: co sie oplaca (wiszace bierki)
  console.log("FAZA 5 — co sie oplaca (lekcja 10)");
  const w1 = generujWiszaca({ ile: 18, szablon: { w: "KR", b: "Kn" }, poziom: 1, faza: 5, prefiks: "b5a" });
  const w2 = generujWiszaca({ ile: 18, szablon: { w: "KB", b: "Kr" }, poziom: 2, faza: 5, prefiks: "b5b" });
  const w3 = generujWiszaca({ ile: 14, szablon: { w: "KNP", b: "Kqp" }, poziom: 3, faza: 5, prefiks: "b5c" });
  zapiszPaczke("pakiet-05-wiszace-bierki.js",
    { id: "pakiet-05", nazwa: "Wiszace bierki", faza: 5, wersja: 1 }, [...w1, ...w2, ...w3]);

  // FAZA 6 — lekcja 11: podwojny atak
  console.log("FAZA 6 — podwojny atak (lekcja 11)");
  const f1 = generujWidelec({ ile: 18, ofiara: "q", poziom: 1, faza: 6, prefiks: "b6a" });
  const f2 = generujWidelec({ ile: 18, ofiara: "r", poziom: 2, faza: 6, prefiks: "b6b" });
  const f3 = generujWidelec({ ile: 12, ofiara: "b", poziom: 3, faza: 6, prefiks: "b6c" });
  zapiszPaczke("pakiet-06-widelce.js",
    { id: "pakiet-06", nazwa: "Widelce skoczkiem", faza: 6, wersja: 1 }, [...f1, ...f2, ...f3]);

  // FAZA 7 — lekcja 13: maty techniczne
  console.log("FAZA 7 — maty techniczne (lekcja 13)");
  const t1 = generujMatW1({ ile: 25, szablon: { w: "KRR", b: "K" }, poziom: 1, faza: 7, prefiks: "b7a", tytul: "Schody z dwoch wiez" });
  const t2 = generujMatW1({ ile: 25, szablon: { w: "KQ", b: "K" }, poziom: 2, faza: 7, prefiks: "b7b", tytul: "Domknij mata hetmanem" });
  zapiszPaczke("pakiet-07-maty-techniczne.js",
    { id: "pakiet-07", nazwa: "Maty techniczne", faza: 7, wersja: 1 }, [...t1, ...t2]);

  console.log("\nGotowe. Teraz: node tools/waliduj.js");
}

if (require.main === module) main();
