#!/usr/bin/env node
/**
 * Walidator zadań — sprawdza, czy lista `rozwiazania` jest KOMPLETNA i POPRAWNA.
 *
 * Aplikacja nie zna zasad szachów (porównuje stringi UCI), więc każda pominięta
 * legalna odpowiedź = dziecko dostaje "spróbuj jeszcze raz" za dobry ruch.
 * Ten skrypt liczy prawdziwą odpowiedź silnikiem i porównuje z tym, co w paczce.
 *
 * Użycie:  node tools/waliduj.js [plik-paczki.js ...]
 *          node tools/waliduj.js            (waliduje wszystkie paczki w zadania/)
 */
const { Chess } = require("chess.js");
const fs = require("fs");
const path = require("path");

const KATALOG_ZADAN = path.join(__dirname, "..", "zadania");

/* ---------- silnikowe wyznaczanie rozwiązań ---------- */

function uci(m) {
  return m.from + m.to + (m.promotion ? m.promotion : "");
}

/** wszystkie ruchy dające mata */
function matyW1(fen) {
  const c = new Chess(fen);
  return c.moves({ verbose: true }).filter((m) => {
    c.move(m);
    const mat = c.isCheckmate();
    c.undo();
    return mat;
  }).map(uci);
}

/** wszystkie legalne ruchy (= wszystkie obrony, gdy jest szach) */
function wszystkieLegalne(fen) {
  return new Chess(fen).moves({ verbose: true }).map(uci);
}

/** bicia bierki, która nie jest broniona */
function biciaWiszacych(fen) {
  const c = new Chess(fen);
  const wynik = [];
  for (const m of c.moves({ verbose: true })) {
    if (!m.captured) continue;
    c.move(m);
    // czy przeciwnik może odbić na tym polu?
    const odbicie = c.moves({ verbose: true }).some((r) => r.to === m.to);
    c.undo();
    if (!odbicie) wynik.push(uci(m));
  }
  return wynik;
}

/** ruchy atakujące >= 2 bierki przeciwnika naraz (widelec) */
function widelce(fen, minWartosc = 3) {
  const WARTOSC = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  const c = new Chess(fen);
  const wynik = [];
  for (const m of c.moves({ verbose: true })) {
    c.move(m);
    const kolorOfiar = c.turn();
    // pola atakowane przez figurę, która właśnie się ruszyła
    const cele = [];
    for (const rzad of c.board()) {
      for (const pole of rzad) {
        if (!pole || pole.color !== kolorOfiar) continue;
        if (c.isAttacked(pole.square, kolorOfiar === "w" ? "b" : "w")) {
          // czy atakuje ją akurat ta figura z pola m.to?
          if (atakujeZPola(c, m.to, pole.square)) cele.push(pole.type);
        }
      }
    }
    c.undo();
    const cenne = cele.filter((t) => WARTOSC[t] >= minWartosc);
    if (cenne.length >= 2) wynik.push(uci(m));
  }
  return wynik;
}

/** czy figura stojąca na `from` atakuje pole `to` (geometrycznie, z blokadami) */
function atakujeZPola(chess, from, to) {
  const f = chess.get(from);
  if (!f) return false;
  const kol = (s) => s.charCodeAt(0) - 97;
  const rzd = (s) => parseInt(s[1], 10) - 1;
  const dk = kol(to) - kol(from);
  const dr = rzd(to) - rzd(from);
  const ak = Math.abs(dk), ar = Math.abs(dr);
  const wolneMiedzy = () => {
    const sk = Math.sign(dk), sr = Math.sign(dr);
    let k = kol(from) + sk, r = rzd(from) + sr;
    while (k !== kol(to) || r !== rzd(to)) {
      if (chess.get(String.fromCharCode(97 + k) + (r + 1))) return false;
      k += sk; r += sr;
    }
    return true;
  };
  switch (f.type) {
    case "n": return (ak === 1 && ar === 2) || (ak === 2 && ar === 1);
    case "k": return ak <= 1 && ar <= 1;
    case "p": return ak === 1 && dr === (f.color === "w" ? 1 : -1);
    case "r": return (dk === 0 || dr === 0) && wolneMiedzy();
    case "b": return ak === ar && wolneMiedzy();
    case "q": return (dk === 0 || dr === 0 || ak === ar) && wolneMiedzy();
  }
  return false;
}

/** pola z bierkami związanymi (nie mogą się ruszyć bez straty króla/hetmana za sobą) */
function polaZwiazane(fen) {
  const c = new Chess(fen);
  const wynik = [];
  for (const rzad of c.board()) {
    for (const pole of rzad) {
      if (!pole || pole.type === "k") continue;
      if (jestZwiazana(fen, pole.square)) wynik.push(pole.square);
    }
  }
  return wynik;
}

function jestZwiazana(fen, pole) {
  const c = new Chess(fen);
  const f = c.get(pole);
  if (!f) return false;
  // za bierką, na tej samej linii od atakującego, stoi król lub hetman
  const WARTOSC = { k: 100, q: 9 };
  const przeciwny = f.color === "w" ? "b" : "w";
  const kol = (s) => s.charCodeAt(0) - 97;
  const rzd = (s) => parseInt(s[1], 10) - 1;
  const kierunki = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for (const [dk, dr] of kierunki) {
    // szukamy atakującego po jednej stronie
    let k = kol(pole) + dk, r = rzd(pole) + dr, atakujacy = null;
    while (k >= 0 && k < 8 && r >= 0 && r < 8) {
      const s = String.fromCharCode(97 + k) + (r + 1);
      const p = c.get(s);
      if (p) {
        const liniowa = (dk === 0 || dr === 0) ? ["r","q"] : ["b","q"];
        if (p.color === przeciwny && liniowa.includes(p.type)) atakujacy = s;
        break;
      }
      k += dk; r += dr;
    }
    if (!atakujacy) continue;
    // a po przeciwnej stronie — coś cennego tego samego koloru co związana bierka
    k = kol(pole) - dk;
    r = rzd(pole) - dr;
    while (k >= 0 && k < 8 && r >= 0 && r < 8) {
      const s = String.fromCharCode(97 + k) + (r + 1);
      const p = c.get(s);
      if (p) {
        if (p.color === f.color && WARTOSC[p.type]) return true;
        break;
      }
      k -= dk;
      r -= dr;
    }
  }
  return false;
}

/* ---------- właściwa walidacja ---------- */

const SILNIK = {
  "mat-w-1": matyW1,
  "obrona-przed-szachem": wszystkieLegalne,
  "wiszaca-bierka": biciaWiszacych,
  "widelec": widelce,
  "zwiazanie": polaZwiazane,
};

function walidujZadanie(z) {
  const bledy = [];
  const ostrzezenia = [];

  // 1. FEN parsowalny?
  let c;
  try { c = new Chess(z.fen); }
  catch (e) { return { bledy: [`FEN nie do sparsowania: ${e.message}`], ostrzezenia }; }

  // 2. pola wymagane
  for (const p of ["id","faza","typ","fen","rozwiazania","polecenie","wyjasnienie"]) {
    if (z[p] === undefined) bledy.push(`brak pola "${p}"`);
  }
  if (!Array.isArray(z.rozwiazania) || z.rozwiazania.length === 0) {
    bledy.push("rozwiazania musi byc niepusta tablica");
  }

  // 3. liczba bierek — badania: 6-latek gubi sie przy zatloczonej planszy
  const bierki = z.fen.split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
  if (bierki > 7) ostrzezenia.push(`${bierki} bierek na planszy (dla 6-latka zalecane <= 7)`);

  if (bledy.length) return { bledy, ostrzezenia };

  // 4. porownanie z silnikiem
  const silnik = SILNIK[z.motyw];
  if (!silnik) {
    ostrzezenia.push(`brak walidatora dla motywu "${z.motyw}" — sprawdzam tylko legalnosc`);
    if (z.typ !== "wskaz-pole") {
      for (const r of z.rozwiazania) {
        const legalne = wszystkieLegalne(z.fen);
        if (!legalne.includes(r)) bledy.push(`ruch "${r}" jest NIELEGALNY w tej pozycji`);
      }
    }
    return { bledy, ostrzezenia };
  }

  const prawdziwe = silnik(z.fen).sort();
  const podane = [...z.rozwiazania].sort();

  const brakujace = prawdziwe.filter((r) => !podane.includes(r));
  const nadmiarowe = podane.filter((r) => !prawdziwe.includes(r));

  if (brakujace.length) bledy.push(`BRAKUJACE rozwiazania: ${brakujace.join(", ")}`);
  if (nadmiarowe.length) bledy.push(`BLEDNE rozwiazania (silnik ich nie potwierdza): ${nadmiarowe.join(", ")}`);

  return { bledy, ostrzezenia };
}

/* ---------- uruchomienie ---------- */

function wczytajPaczke(plik) {
  const zadania = [];
  global.ZADANIA_PAKIET = (pak) => zadania.push(...pak.zadania);
  delete require.cache[require.resolve(plik)];
  const kod = fs.readFileSync(plik, "utf8");
  new Function("ZADANIA_PAKIET", kod)(global.ZADANIA_PAKIET);
  return zadania;
}

function main() {
  let pliki = process.argv.slice(2);
  if (!pliki.length) {
    if (!fs.existsSync(KATALOG_ZADAN)) { console.error("brak katalogu zadania/"); process.exit(1); }
    pliki = fs.readdirSync(KATALOG_ZADAN).filter((f) => f.endsWith(".js"))
      .map((f) => path.join(KATALOG_ZADAN, f));
  }

  let wszystkie = 0, zBledami = 0, zOstrzezeniami = 0;
  const widzianeId = new Set();

  for (const plik of pliki) {
    const zadania = wczytajPaczke(path.resolve(plik));
    console.log(`\n=== ${path.basename(plik)} — ${zadania.length} zadan ===`);
    for (const z of zadania) {
      wszystkie++;
      if (widzianeId.has(z.id)) { console.log(`  ✗ ${z.id}: ZDUPLIKOWANE id`); zBledami++; continue; }
      widzianeId.add(z.id);
      const { bledy, ostrzezenia } = walidujZadanie(z);
      if (bledy.length) {
        zBledami++;
        console.log(`  ✗ ${z.id} (${z.motyw || z.typ}): ${bledy.join(" | ")}`);
      } else if (ostrzezenia.length) {
        zOstrzezeniami++;
        console.log(`  ⚠ ${z.id}: ${ostrzezenia.join(" | ")}`);
      }
    }
  }

  console.log(`\n--- PODSUMOWANIE ---`);
  console.log(`zadan: ${wszystkie}   bledow: ${zBledami}   ostrzezen: ${zOstrzezeniami}`);
  process.exit(zBledami ? 1 : 0);
}

if (require.main === module) main();
module.exports = { matyW1, wszystkieLegalne, biciaWiszacych, widelce, polaZwiazane, walidujZadanie, atakujeZPola };
