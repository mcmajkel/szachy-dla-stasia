#!/usr/bin/env node
/**
 * Generator FAZY 8 — „Pełne zasady" (Stappenmethode Krok 1, lekcje 9, 12, 14):
 *   - roszada (lekcja 9),
 *   - pat i remis (lekcja 12),
 *   - bicie w przelocie (lekcja 14).
 *
 * Osobny plik, a nie dopisek w generuj.js: tamten przy każdym uruchomieniu
 * tworzy paczki 01–07 od nowa. Tu generujemy tylko pakiet-08, więc istniejące
 * zadania (i postępy dziecka przypięte do ich id) zostają nietknięte.
 *
 * Rozwiązania liczy chess.js — tak jak w generuj.js. Walidator (waliduj.js)
 * przelicza je drugi raz.
 *
 * Użycie:  node tools/generuj-faza8.js
 */
const { Chess } = require("chess.js");
const fs = require("fs");
const path = require("path");
const W = require("./waliduj.js");

const FILES = "abcdefgh";
const POLA = [];
for (const f of FILES) for (let r = 1; r <= 8; r++) POLA.push(f + r);

/* ---------- deterministyczny random (powtarzalna paczka) ---------- */
let ziarno = 20261106;
function rnd() {
  ziarno = (ziarno * 1103515245 + 12345) & 0x7fffffff;
  return ziarno / 0x7fffffff;
}
const losowy = (t) => t[Math.floor(rnd() * t.length)];

const kolS = (s) => s.charCodeAt(0) - 97;
const rzdS = (s) => parseInt(s[1], 10) - 1;
const odleglosc = (a, b) => Math.max(Math.abs(kolS(a) - kolS(b)), Math.abs(rzdS(a) - rzdS(b)));
const BUDZET_MS = 20000;

function zbudujFen(bierki, tura, roszady = "-", ep = "-") {
  const plansza = {};
  for (const { pole, znak } of bierki) plansza[pole] = znak;
  const rzedy = [];
  for (let r = 8; r >= 1; r--) {
    let s = "", puste = 0;
    for (const f of FILES) {
      const p = plansza[f + r];
      if (!p) puste++;
      else { if (puste) { s += puste; puste = 0; } s += p; }
    }
    if (puste) s += puste;
    rzedy.push(s);
  }
  return rzedy.join("/") + ` ${tura} ${roszady} ${ep} 0 1`;
}

/** buduje pozycję; null, gdy nielegalna (strona bez ruchu w szachu, pion na 1./8. linii) */
function pozycja(bierki, tura, roszady, ep) {
  const pola = new Set();
  for (const b of bierki) {
    if (pola.has(b.pole)) return null;
    pola.add(b.pole);
    if (b.znak.toLowerCase() === "p" && (b.pole[1] === "1" || b.pole[1] === "8")) return null;
  }
  const fen = zbudujFen(bierki, tura, roszady, ep);
  let c;
  try { c = new Chess(fen); } catch (e) { return null; }
  const przeciwny = tura === "w" ? "b" : "w";
  const krol = bierki.find((b) => b.znak === (przeciwny === "w" ? "K" : "k"));
  if (krol && c.isAttacked(krol.pole, tura)) return null;
  return c;
}

const uci = (m) => m.from + m.to + (m.promotion || "");
const NAZWA_PL = { k: "król", q: "hetman", r: "wieża", b: "goniec", n: "skoczek", p: "pion" };
const LITERA_PL = { k: "K", q: "H", r: "W", b: "G", n: "S", p: "" };
const NARZEDNIK = { k: "królem", q: "hetmanem", r: "wieżą", b: "gońcem", n: "skoczkiem", p: "pionem" };

function zapisPL(c, m) {
  if (m.flags.includes("k")) return "O-O";
  if (m.flags.includes("q")) return "O-O-O";
  c.move(m);
  const suf = c.isCheckmate() ? "#" : c.isCheck() ? "+" : "";
  c.undo();
  const bicie = m.captured ? "x" : "";
  const skad = m.piece === "p" && bicie ? m.from[0] : "";
  return `${LITERA_PL[m.piece]}${skad}${bicie}${m.to}${suf}`;
}

const nowyId = (prefiks, n) => `${prefiks}-${String(n).padStart(2, "0")}`;

/* =========================================================
   ROSZADA — lekcja 9
   ========================================================= */

const KROTKA = { wieza: "h1", rWieza: "f1", krol: "g1", przejscie: ["f1", "g1"], miedzy: ["f1", "g1"], prawo: "K", nazwa: "krótka" };
const DLUGA  = { wieza: "a1", rWieza: "d1", krol: "c1", przejscie: ["d1", "c1"], miedzy: ["b1", "c1", "d1"], prawo: "Q", nazwa: "długa" };

/** dlaczego roszady w daną stronę NIE da się zrobić — zdanie dla dziecka */
function powodBlokady(c, strona) {
  if (c.isCheck()) return "król jest szachowany, a spod szacha roszady robić nie wolno";
  for (const s of strona.miedzy) {
    const p = c.get(s);
    if (p) return `między królem a wieżą stoi ${NAZWA_PL[p.type]} na ${s}`;
  }
  for (const s of strona.przejscie) {
    if (c.isAttacked(s, "b")) return `pole ${s} jest atakowane przez czarne, a król nie może przejść ani stanąć na atakowanym polu`;
  }
  return null;
}

function opisRoszady(strona) {
  return strona === KROTKA
    ? "król stanął na g1, a wieża przeskoczyła na f1"
    : "król stanął na c1, a wieża przeskoczyła na d1";
}

/** czarne bierki, które mogą „psuć" roszadę albo tylko stać na planszy */
const CZARNE_LEKKIE = ["n", "b", "r"];

/** Poziom 1: jedna wieża, roszada dozwolona. Dziecko uczy się samego ruchu. */
function generujZrobRoszade({ ile, prefiks, poziom, faza }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const strona = wynik.length % 5 < 3 ? KROTKA : DLUGA;   // 3:2 dla krótkiej
    const bierki = [{ pole: "e1", znak: "K" }, { pole: strona.wieza, znak: "R" }];
    // osłona pionków przed królem — wygląda jak prawdziwa partia
    const piony = strona === KROTKA ? ["f2", "g2", "h2"] : ["a2", "b2", "c2"];
    for (const p of piony) if (rnd() < 0.7) bierki.push({ pole: p, znak: "P" });
    const kc = losowy(POLA.filter((s) => +s[1] >= 6));
    bierki.push({ pole: kc, znak: "k" });
    if (rnd() < 0.5) bierki.push({ pole: losowy(POLA.filter((s) => +s[1] >= 4)), znak: losowy(CZARNE_LEKKIE) });
    if (bierki.length > 7) continue;

    const c = pozycja(bierki, "w", strona.prawo, "-");
    if (!c || c.isCheck()) continue;
    const fen = c.fen();
    if (widziane.has(fen)) continue;
    const roszady = W.roszady(fen);
    if (roszady.length !== 1) continue;

    widziane.add(fen);
    const m = c.moves({ verbose: true }).find((x) => uci(x) === roszady[0]);
    wynik.push({
      id: nowyId(prefiks, wynik.length + 1),
      faza, poziom, motyw: "roszada", typ: "ruch", orientacja: "white",
      tytul: strona === KROTKA ? "Krótka roszada" : "Długa roszada",
      polecenie: "Schowaj króla — zrób roszadę. Dotknij króla, a potem wieżę.",
      fen,
      rozwiazania: roszady,
      podpowiedz: "W roszadzie król idzie o dwa pola w stronę wieży, a wieża przeskakuje obok niego.",
      wyjasnienie: `${zapisPL(c, m)} — ${strona.nazwa} roszada: ${opisRoszady(strona)}. Król jest schowany, a wieża weszła do gry.`,
    });
  }
  return wynik;
}

/** Poziom 2: obie wieże, ale wolno tylko w jedną stronę. */
function generujKtoraRoszada({ ile, prefiks, poziom, faza }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const bierki = [{ pole: "e1", znak: "K" }, { pole: "a1", znak: "R" }, { pole: "h1", znak: "R" }];
    const kc = losowy(POLA.filter((s) => +s[1] >= 6));
    bierki.push({ pole: kc, znak: "k" });
    // przeszkoda: czarna figura atakująca pole przejścia albo własna bierka po drodze
    if (rnd() < 0.35) {
      bierki.push({ pole: losowy(["b1", "c1", "d1", "f1", "g1"]), znak: losowy(["N", "B"]) });
    } else {
      bierki.push({ pole: losowy(POLA.filter((s) => +s[1] >= 3)), znak: losowy(["b", "r", "n", "q"]) });
    }

    const c = pozycja(bierki, "w", "KQ", "-");
    if (!c || c.isCheck()) continue;
    const fen = c.fen();
    if (widziane.has(fen)) continue;
    const roszady = W.roszady(fen);
    if (roszady.length !== 1) continue;

    // czarna figura nie może po prostu wisieć do zbicia wieżą — to byłoby inne zadanie
    if (W.biciaWiszacych(fen).length) continue;

    const dozwolona = roszady[0] === "e1g1" ? KROTKA : DLUGA;
    const zakazana = dozwolona === KROTKA ? DLUGA : KROTKA;
    const powod = powodBlokady(c, zakazana);
    if (!powod) continue;

    widziane.add(fen);
    const m = c.moves({ verbose: true }).find((x) => uci(x) === roszady[0]);
    wynik.push({
      id: nowyId(prefiks, wynik.length + 1),
      faza, poziom, motyw: "roszada", typ: "ruch", orientacja: "white",
      tytul: "W którą stronę roszada?",
      polecenie: "Zrób roszadę. Uwaga: tylko w jedną stronę wolno!",
      fen,
      rozwiazania: roszady,
      podpowiedz: "Roszady nie wolno, gdy coś stoi między królem a wieżą albo gdy król przechodzi przez atakowane pole.",
      wyjasnienie: `${zapisPL(c, m)} — ${dozwolona.nazwa} roszada jest w porządku. ${zakazana === KROTKA ? "Krótkiej" : "Długiej"} nie wolno, bo ${powod}.`,
    });
  }
  return wynik;
}

/** Poziom 3: „Czy białe mogą zrobić roszadę?" — tak / nie, z powodem w wyjaśnieniu. */
function generujCzyRoszada({ ile, prefiks, poziom, faza }) {
  const wynik = [], widziane = new Set();
  // kolejno: tak, szach, pole atakowane, bierka między, ... — żeby odpowiedzi były wymieszane
  const plan = ["tak", "atak", "szach", "miedzy", "tak", "atak", "tak", "szach", "atak", "tak"];
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const cel = plan[wynik.length % plan.length];
    const strona = rnd() < 0.6 ? KROTKA : DLUGA;
    const bierki = [{ pole: "e1", znak: "K" }, { pole: strona.wieza, znak: "R" }];
    const kc = losowy(POLA.filter((s) => +s[1] >= 6));
    bierki.push({ pole: kc, znak: "k" });
    if (cel === "miedzy") bierki.push({ pole: losowy(strona.miedzy), znak: losowy(["N", "B", "Q"]) });
    bierki.push({ pole: losowy(POLA.filter((s) => +s[1] >= 3)), znak: losowy(["b", "r", "n", "q"]) });

    const c = pozycja(bierki, "w", strona.prawo, "-");
    if (!c) continue;
    const fen = c.fen();
    if (widziane.has(fen)) continue;
    if (W.biciaWiszacych(fen).length) continue;          // bez darmowych łupów — skupiamy się na roszadzie
    const odp = W.czyRoszada(fen)[0];
    const powod = odp === "nie" ? powodBlokady(c, strona) : null;
    const rodzaj = odp === "tak" ? "tak"
      : c.isCheck() ? "szach"
      : powod && powod.startsWith("między") ? "miedzy" : "atak";
    if (rodzaj !== cel) continue;

    widziane.add(fen);
    wynik.push({
      id: nowyId(prefiks, wynik.length + 1),
      faza, poziom, motyw: "czy-roszada", typ: "wybor", orientacja: "white",
      tytul: "Czy wolno zrobić roszadę?",
      polecenie: `Białe mają ruch. Czy mogą teraz zrobić ${strona.nazwa} roszadę?`,
      fen,
      odpowiedzi: [{ id: "tak", tekst: "Tak ✅" }, { id: "nie", tekst: "Nie ❌" }],
      rozwiazania: [odp],
      podpowiedz: "Sprawdź trzy rzeczy: czy król jest szachowany, czy coś stoi po drodze i czy czarne atakują pola, przez które przejdzie król.",
      wyjasnienie: odp === "tak"
        ? `Tak! Król nie jest szachowany, droga jest wolna i czarne nie atakują pól ${strona.przejscie.join(" i ")}. Roszada dozwolona.`
        : `Nie — ${powod}.`,
    });
  }
  return wynik;
}

/* =========================================================
   BICIE W PRZELOCIE — lekcja 14
   ========================================================= */

/**
 * Biały pion na 5. linii, czarny właśnie skoczył o dwa pola obok niego.
 * `dodatki` = ile innych bierek dorzucić (poziom 2).
 */
function generujWPrzelocie({ ile, prefiks, poziom, faza, dodatki = 0, drugiPion = false }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const kolCzarny = Math.floor(rnd() * 8);
    const fC = FILES[kolCzarny];
    const sasiednie = [kolCzarny - 1, kolCzarny + 1].filter((k) => k >= 0 && k < 8);
    const fB = FILES[losowy(sasiednie)];
    const bierki = [{ pole: fC + "5", znak: "p" }, { pole: fB + "5", znak: "P" }];
    if (drugiPion) {
      // drugi biały pion na 5. linii, ale nie obok czarnego — „który pion może?"
      const daleko = FILES.split("").filter((f) => Math.abs(kolS(f + "1") - kolCzarny) >= 2 && f !== fB);
      bierki.push({ pole: losowy(daleko) + "5", znak: "P" });
    }
    const wolne = (s) => !bierki.some((b) => b.pole === s) && s !== fC + "6" && s !== fC + "7";
    const kb = losowy(POLA.filter((s) => wolne(s) && +s[1] <= 4));
    bierki.push({ pole: kb, znak: "K" });
    const kc = losowy(POLA.filter((s) => wolne(s) && +s[1] >= 6 && odleglosc(s, kb) >= 2));
    bierki.push({ pole: kc, znak: "k" });
    for (let i = 0; i < dodatki; i++) {
      const s = losowy(POLA.filter(wolne));
      bierki.push({ pole: s, znak: losowy(i % 2 ? ["N", "B"] : ["n", "b", "r"]) });
    }

    const c = pozycja(bierki, "w", "-", fC + "6");
    if (!c || c.isCheck()) continue;
    const fen = c.fen();
    if (!fen.includes(` ${fC}6 `)) continue;          // chess.js zostawia pole przelotu tylko, gdy bicie jest możliwe
    if (widziane.has(fen)) continue;
    const ep = W.wPrzelocie(fen);
    if (!ep.length) continue;
    if (drugiPion && ep.length !== 1) continue;
    // poziom 1–2: żadnych innych bić w pozycji, żeby nie mylić z fazą 1
    if (c.moves({ verbose: true }).some((m) => m.captured && !m.flags.includes("e"))) continue;

    widziane.add(fen);
    const m = c.moves({ verbose: true }).find((x) => uci(x) === ep[0]);
    wynik.push({
      id: nowyId(prefiks, wynik.length + 1),
      faza, poziom, motyw: "w-przelocie", typ: ep.length > 1 ? "znajdz-wszystkie" : "ruch", orientacja: "white",
      tytul: "Bicie w przelocie",
      polecenie: `Czarny pion właśnie skoczył o dwa pola (${fC}7→${fC}5). Zbij go w przelocie!`,
      fen,
      ostatniRuch: fC + "7" + fC + "5",
      rozwiazania: ep,
      podpowiedz: `Twój pion bije na ukos, na pole ${fC}6 — to, które czarny pion przeskoczył.`,
      wyjasnienie: `${zapisPL(c, m)} — bicie w przelocie: twój pion stanął na ${fC}6, a czarny pion z ${fC}5 zniknął. Wolno tak tylko od razu, w następnym ruchu!`,
    });
  }
  return wynik;
}

/* =========================================================
   PAT — lekcja 12
   ========================================================= */

function sasiednie(s) {
  const out = [];
  for (let dk = -1; dk <= 1; dk++) for (let dr = -1; dr <= 1; dr++) {
    if (!dk && !dr) continue;
    const k = kolS(s) + dk, r = rzdS(s) + dr;
    if (k >= 0 && k < 8 && r >= 0 && r < 8) out.push(FILES[k] + (r + 1));
  }
  return out;
}

/** losowa pozycja z czarnym królem przy brzegu i białymi figurami blisko niego */
function pozycjaPrzyKrolu(szablon, tura, promien = 3) {
  const brzeg = POLA.filter((s) => "ah".includes(s[0]) || "18".includes(s[1]));
  const kc = losowy(brzeg);
  const bierki = [{ pole: kc, znak: "k" }];
  const zajete = new Set([kc]);
  const blisko = POLA.filter((s) => odleglosc(s, kc) <= promien);
  for (const z of szablon.w) {
    const kand = blisko.filter((s) => !zajete.has(s) && (z !== "K" || odleglosc(s, kc) >= 2));
    if (!kand.length) return null;
    const s = losowy(kand); zajete.add(s); bierki.push({ pole: s, znak: z });
  }
  for (const z of szablon.b) {
    const kand = blisko.filter((s) => !zajete.has(s));
    if (!kand.length) return null;
    const s = losowy(kand); zajete.add(s); bierki.push({ pole: s, znak: z });
  }
  return pozycja(bierki, tura, "-", "-");
}

const ODP_MPS = [
  { id: "mat", tekst: "Mat 🏆" },
  { id: "pat", tekst: "Pat 🤝" },
  { id: "szach", tekst: "Szach ⚡" },
];

/** „Czarne mają ruch. Mat, pat czy szach?" */
function generujMatPatSzach({ ile, prefiks, poziom, faza, szablon }) {
  const wynik = [], widziane = new Set();
  const plan = ["pat", "mat", "szach", "pat", "szach", "mat", "pat", "pat", "mat", "szach"];
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const cel = plan[wynik.length % plan.length];
    const c = pozycjaPrzyKrolu(szablon, "b");
    if (!c) continue;
    const fen = c.fen();
    if (widziane.has(fen)) continue;
    const stan = W.matPatSzach(fen)[0];
    if (stan !== cel) continue;
    // w „szachu" niech będzie mało ucieczek — dziecko ma je zobaczyć
    let wyj;
    if (stan === "szach") {
      const ruchy = c.moves({ verbose: true });
      if (ruchy.length > 3) continue;
      wyj = `Szach — czarny król jest atakowany, ale ma ruch: ${ruchy.map((m) => zapisPL(c, m)).join(", ")}. To jeszcze nie koniec.`;
    } else if (stan === "mat") {
      wyj = "Mat! Czarny król jest szachowany i nie ma żadnej ucieczki. Białe wygrywają.";
    } else {
      const ruchyNieKrola = szablon.b.length > 0;
      wyj = "Pat! Czarny król NIE jest szachowany, ale czarne nie mają żadnego dozwolonego ruchu" +
        (ruchyNieKrola ? " (pion też stoi zablokowany)" : "") + ". To remis 🤝.";
    }
    widziane.add(fen);
    wynik.push({
      id: nowyId(prefiks, wynik.length + 1),
      faza, poziom, motyw: "mat-pat-szach", typ: "wybor", orientacja: "white",
      tytul: "Mat, pat czy szach?",
      polecenie: "Czarne mają ruch. Co widzisz na planszy?",
      fen,
      odpowiedzi: ODP_MPS,
      rozwiazania: [stan],
      podpowiedz: "Najpierw sprawdź, czy czarny król jest atakowany. Potem — czy czarne mają jakikolwiek ruch.",
      wyjasnienie: wyj,
    });
  }
  return wynik;
}

/** „Zamatuj — uwaga na pata!": mat w 1, ale kusi ruch dający pata */
function generujPulapkePata({ ile, prefiks, poziom, faza, szablon }) {
  const wynik = [], widziane = new Set();
  const koniec = Date.now() + BUDZET_MS;
  while (wynik.length < ile && Date.now() < koniec) {
    const c = pozycjaPrzyKrolu(szablon, "w");
    if (!c || c.isCheck()) continue;
    const fen = c.fen();
    if (widziane.has(fen)) continue;
    const maty = W.matyW1(fen);
    if (!maty.length || maty.length > 2 || maty.some((m) => m.length > 4)) continue;
    const paty = W.ruchyDajacePata(fen);
    // pułapka ma kusić hetmanem — „ruch królem daje pata" to słaby przykład
    const patHetmanem = paty.find((p) => c.get(p.slice(0, 2)).type === "q");
    if (!patHetmanem) continue;

    widziane.add(fen);
    const m = c.moves({ verbose: true }).find((x) => uci(x) === maty[0]);
    const pulapki = {};
    for (const p of paty) pulapki[p] = "To pat — remis! 🤝 Czarny król nie ma ruchu, ale nie jest szachowany.";
    wynik.push({
      id: nowyId(prefiks, wynik.length + 1),
      faza, poziom, motyw: "mat-w-1", typ: "ruch", orientacja: "white",
      tytul: "Mat, nie pat!",
      polecenie: "Zamatuj w jednym ruchu. Uważaj na pata!",
      fen,
      rozwiazania: maty,
      pulapki,
      podpowiedz: "Mat to szach bez ucieczki. Jeśli twój ruch nie daje szacha, a król nie ma dokąd iść — to pat.",
      wyjasnienie: `${zapisPL(c, m)} — mat! Uważaj: ${zapisPL(c, c.moves({ verbose: true }).find((x) => uci(x) === patHetmanem))} wyglądało podobnie, ale dawało pata i tylko remis.`,
    });
  }
  return wynik;
}

/* =========================================================
   złożenie paczki
   ========================================================= */

function main() {
  const faza = 8;
  console.log("FAZA 8 — pelne zasady (lekcje 9, 12, 14)");
  const czesci = [
    // poziom 1 — pierwszy kontakt z każdą zasadą
    generujZrobRoszade({ ile: 10, prefiks: "r8a", poziom: 1, faza }),
    generujWPrzelocie({ ile: 10, prefiks: "p8a", poziom: 1, faza }),
    generujMatPatSzach({ ile: 10, prefiks: "s8a", poziom: 1, faza, szablon: { w: "KQ", b: "" } }),
    // poziom 2 — ta sama zasada z haczykiem
    generujKtoraRoszada({ ile: 8, prefiks: "r8b", poziom: 2, faza }),
    generujWPrzelocie({ ile: 8, prefiks: "p8b", poziom: 2, faza, dodatki: 1, drugiPion: true }),
    generujPulapkePata({ ile: 12, prefiks: "u8a", poziom: 2, faza, szablon: { w: "KQ", b: "" } }),
    // poziom 3 — trzeba sprawdzić kilka warunków naraz
    generujCzyRoszada({ ile: 10, prefiks: "r8c", poziom: 3, faza }),
    generujMatPatSzach({ ile: 8, prefiks: "s8b", poziom: 3, faza, szablon: { w: "KR", b: "p" } }),
  ];
  czesci.forEach((cz) => console.log(`  ${cz.length ? cz[0].id.split("-")[0] : "?"}: ${cz.length}`));
  const zadania = czesci.flat();

  const meta = { id: "pakiet-08", nazwa: "Pelne zasady", faza, wersja: 1 };
  const naglowek =
`/* Pelne zasady: roszada, pat, bicie w przelocie
 * ${zadania.length} zadan — wygenerowane i zweryfikowane silnikiem (tools/generuj-faza8.js)
 * Kazde "rozwiazania" pochodzi z chess.js, wiec lista jest kompletna.
 * NIE edytowac recznie — patrz FORMAT-ZADAN.md
 */
ZADANIA_PAKIET(`;
  const plik = path.join(__dirname, "..", "zadania", "pakiet-08-pelne-zasady.js");
  fs.writeFileSync(plik, naglowek + JSON.stringify({ ...meta, zadania }, null, 1) + ");\n", "utf8");
  console.log(`  → pakiet-08-pelne-zasady.js: ${zadania.length} zadan\nTeraz: node tools/waliduj.js`);
}

if (require.main === module) main();
