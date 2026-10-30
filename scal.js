/* Scalanie postępów z dwóch źródeł (to urządzenie + chmura).
   Reguła ogólna: scalanie nigdy nie zabiera postępu — lepszy wynik wygrywa.
   Funkcja jest czysta i idempotentna: scal(a, scal(a, b)) daje to samo co scal(a, b),
   więc można ją wołać przy każdej synchronizacji, nie tylko przy pierwszym logowaniu.

   Wyjątki od „sumy":
   - `zastapiono` — znacznik czasu resetu albo importu. Jeśli źródła mają różny,
     nowszy wygrywa w całości (inaczej scalanie przywróciłoby skasowany postęp).
   - ustawienia rodzica (dźwięk, lichess, handicap) — wygrywa strona z nowszym
     `ustawieniaCzas`; przy remisie druga (chmura). Uruchamiane jako scal(lokalny, chmura).

   Plik działa w przeglądarce (globalna funkcja `scal`) i w Node (test w tools/). */
(function(root){
  var USTAWIENIA = ["dzwiek", "lichess", "handicap"];

  function kopia(o){ return JSON.parse(JSON.stringify(o)); }
  function liczba(x){ return typeof x === "number" ? x : 0; }
  function pozniejszaData(x, y){
    if(!x) return y || null;
    if(!y) return x;
    return x > y ? x : y; // format RRRR-MM-DD porównuje się jak tekst
  }

  function scalRekord(x, y){
    var r = {
      rozwiazane: !!(x.rozwiazane || y.rozwiazane),
      proby: Math.max(liczba(x.proby), liczba(y.proby)), // max, nie suma: suma rosłaby przy każdym scaleniu
      podpowiedz: !!(x.podpowiedz || y.podpowiedz),
      data: pozniejszaData(x.data, y.data),
      pierwszaProbaOK: !!(x.pierwszaProbaOK || y.pierwszaProbaOK)
    };
    if(x.czystaPowtorka || y.czystaPowtorka) r.czystaPowtorka = true;
    return r;
  }

  function scalSerie(x, y){
    x = x || {dni:0, ostatniDzien:null};
    y = y || {dni:0, ostatniDzien:null};
    // Wygrywa seria z późniejszym ostatnim dniem — sama „najdłuższa" mogłaby już wygasnąć.
    if(x.ostatniDzien !== y.ostatniDzien){
      var nowsza = pozniejszaData(x.ostatniDzien, y.ostatniDzien) === x.ostatniDzien ? x : y;
      return {dni: liczba(nowsza.dni), ostatniDzien: nowsza.ostatniDzien};
    }
    return {dni: Math.max(liczba(x.dni), liczba(y.dni)), ostatniDzien: x.ostatniDzien};
  }

  function scal(lokalny, chmura){
    if(!chmura) return kopia(lokalny);
    if(!lokalny) return kopia(chmura);

    var zl = liczba(lokalny.zastapiono), zc = liczba(chmura.zastapiono);
    if(zl !== zc) return kopia(zl > zc ? lokalny : chmura);

    var wynik = kopia(chmura);
    var a = lokalny.zadania || {}, b = chmura.zadania || {};
    wynik.zadania = {};
    Object.keys(a).concat(Object.keys(b)).forEach(function(id){
      if(wynik.zadania[id]) return;
      if(a[id] && b[id]) wynik.zadania[id] = scalRekord(a[id], b[id]);
      else wynik.zadania[id] = kopia(a[id] || b[id]);
    });

    wynik.seria = scalSerie(lokalny.seria, chmura.seria);
    wynik.odblokowanaFaza = Math.max(liczba(lokalny.odblokowanaFaza) || 1, liczba(chmura.odblokowanaFaza) || 1);
    wynik.wersja = Math.max(liczba(lokalny.wersja), liczba(chmura.wersja));
    wynik.zastapiono = zl;

    var ustawieniaZ = liczba(lokalny.ustawieniaCzas) > liczba(chmura.ustawieniaCzas) ? lokalny : chmura;
    USTAWIENIA.forEach(function(k){ if(ustawieniaZ[k] !== undefined) wynik[k] = ustawieniaZ[k]; });
    wynik.ustawieniaCzas = Math.max(liczba(lokalny.ustawieniaCzas), liczba(chmura.ustawieniaCzas));

    return wynik;
  }

  if(typeof module !== "undefined" && module.exports) module.exports = scal;
  else root.scal = scal;
})(this);
