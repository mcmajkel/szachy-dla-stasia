#!/usr/bin/env node
/**
 * Test scalania postępów (scal.js) — reguły z SPEC-LOGOWANIE.md, P0-4.
 *
 * Użycie:  node tools/test-scal.js
 */
const assert = require("assert");
const scal = require("../scal.js");

function stan(o) {
  return Object.assign(
    { wersja: 2, zadania: {}, seria: { dni: 0, ostatniDzien: null }, odblokowanaFaza: 1,
      dzwiek: true, handicap: 3, lichess: false, zastapiono: 0, ustawieniaCzas: 0 },
    o
  );
}
function rek(o) {
  return Object.assign({ rozwiazane: false, proby: 0, podpowiedz: false, data: null, pierwszaProbaOK: false }, o);
}
const POSTEP = ["zadania", "seria", "odblokowanaFaza", "wersja", "zastapiono"];
function postep(s) { const r = {}; POSTEP.forEach((k) => (r[k] = s[k])); return r; }

let ok = 0;
function test(nazwa, fn) {
  try { fn(); ok++; console.log("✓ " + nazwa); }
  catch (e) { console.log("✗ " + nazwa + "\n  " + e.message); process.exitCode = 1; }
}

const telefon = stan({
  zadania: {
    b1: rek({ rozwiazane: true, proby: 1, data: "2026-10-20", pierwszaProbaOK: true }),
    b2: rek({ rozwiazane: true, proby: 4, podpowiedz: true, data: "2026-10-21" }),
  },
  seria: { dni: 3, ostatniDzien: "2026-10-28" },
  odblokowanaFaza: 2,
});
const ipad = stan({
  zadania: {
    b2: rek({ rozwiazane: true, proby: 2, data: "2026-10-25", czystaPowtorka: true }),
    s1: rek({ rozwiazane: false, proby: 2 }),
  },
  seria: { dni: 1, ostatniDzien: "2026-10-29" },
  odblokowanaFaza: 3,
});

test("pusta chmura nie nadpisuje urządzenia", () => {
  assert.deepStrictEqual(scal(telefon, null), telefon);
});
test("puste urządzenie dostaje stan z chmury", () => {
  assert.deepStrictEqual(scal(null, ipad), ipad);
});
test("pusty domyślny stan w chmurze nie zabiera postępu", () => {
  assert.deepStrictEqual(postep(scal(telefon, stan())), postep(telefon));
});
test("suma zadań, wyższa faza", () => {
  const w = scal(telefon, ipad);
  assert.deepStrictEqual(Object.keys(w.zadania).sort(), ["b1", "b2", "s1"]);
  assert.strictEqual(w.odblokowanaFaza, 3);
});
test("rekord: lepszy wynik wygrywa, próby = max", () => {
  assert.deepStrictEqual(scal(telefon, ipad).zadania.b2, {
    rozwiazane: true, proby: 4, podpowiedz: true, data: "2026-10-25", pierwszaProbaOK: false, czystaPowtorka: true,
  });
});
test("seria: wygrywa późniejszy dzień, nie dłuższa liczba", () => {
  assert.deepStrictEqual(scal(telefon, ipad).seria, { dni: 1, ostatniDzien: "2026-10-29" });
});
test("seria: ten sam dzień → większa liczba", () => {
  const a = stan({ seria: { dni: 5, ostatniDzien: "2026-10-29" } });
  const b = stan({ seria: { dni: 2, ostatniDzien: "2026-10-29" } });
  assert.deepStrictEqual(scal(a, b).seria, { dni: 5, ostatniDzien: "2026-10-29" });
});
test("postęp jest przemienny", () => {
  assert.deepStrictEqual(postep(scal(telefon, ipad)), postep(scal(ipad, telefon)));
});
test("idempotentne: wielokrotne scalanie nic nie zmienia", () => {
  const raz = scal(telefon, ipad);
  assert.deepStrictEqual(scal(telefon, raz), raz);
  assert.deepStrictEqual(scal(raz, raz), raz);
});
test("reset (nowszy `zastapiono`) wygrywa w całości", () => {
  const poResecie = stan({ zastapiono: 1000 });
  assert.deepStrictEqual(scal(telefon, poResecie), poResecie);
  assert.deepStrictEqual(scal(poResecie, telefon), poResecie);
});
test("ustawienia: nowsza zmiana wygrywa", () => {
  const lok = stan({ lichess: true, ustawieniaCzas: 200 });
  const chm = stan({ lichess: false, ustawieniaCzas: 100 });
  assert.strictEqual(scal(lok, chm).lichess, true);
  assert.strictEqual(scal(chm, lok).lichess, true);
});
test("ustawienia: przy remisie wygrywa chmura", () => {
  const lok = stan({ dzwiek: false });
  const chm = stan({ dzwiek: true });
  assert.strictEqual(scal(lok, chm).dzwiek, true);
});
test("nie modyfikuje argumentów", () => {
  const przed = JSON.stringify([telefon, ipad]);
  scal(telefon, ipad);
  assert.strictEqual(JSON.stringify([telefon, ipad]), przed);
});

console.log("\n" + ok + " testów przeszło");
