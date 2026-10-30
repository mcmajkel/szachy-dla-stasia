/* Scalanie postępów z dwóch źródeł (to urządzenie + chmura).
   Reguła ogólna: scalanie nigdy nie zabiera postępu — lepszy wynik wygrywa.
   Funkcja jest czysta i idempotentna: scal(a, scal(a, b)) daje to samo co scal(a, b),
   więc można ją wołać przy każdej synchronizacji, nie tylko przy pierwszym logowaniu.

   Wyjątki od „sumy":
   - `zastapiono` — znacznik czasu resetu albo importu. Jeśli źródła mają różny,
     nowszy postęp wygrywa w całości (inaczej scalanie przywróciłoby skasowany postęp).
     NIE dotyczy pierwszej synchronizacji urządzenia (opcje.pierwszy): wtedy zawsze suma,
     a `zastapiono` bierzemy z chmury. Urządzenie, które nigdy nie widziało chmury, nie
     może jej wyzerować swoim lokalnym resetem ani zostać wyzerowane cudzym.
   - ustawienia rodzica (dźwięk, lichess, handicap, zestaw figur) — wygrywa strona z nowszym
     `ustawieniaCzas`; przy remisie druga (chmura). Uruchamiane jako scal(lokalny, chmura).

   Plik działa w przeglądarce (globalna funkcja `scal`) i w Node (test w tools/). */
(function(root){
  var USTAWIENIA = ["dzwiek", "lichess", "handicap", "zestaw"];

  function kopia(o){ return JSON.parse(JSON.stringify(o)); }
  function liczba(x){ return typeof x === "number" ? x : 0; }
  function pozniejszaData(x, y){
    if(!x) return y || null;
    if(!y) return x;
    return x > y ? x : y; // format RRRR-MM-DD porównuje się jak tekst
  }
  // dni między datami RRRR-MM-DD (UTC, więc bez kłopotów ze zmianą czasu)
  function dzien(s){ var p = s.split("-"); return Date.UTC(+p[0], +p[1]-1, +p[2]) / 86400000; }

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

  /* Seria to przedział dni [koniec - dni + 1, koniec]. Jeśli przedziały z dwóch urządzeń
     nachodzą na siebie albo się stykają, seria jest ich sumą (wczoraj tablet, dziś telefon
     = seria trwa). Jeśli między nimi jest przerwa, liczy się tylko późniejszy. */
  function scalSerie(x, y){
    x = x || {dni:0, ostatniDzien:null};
    y = y || {dni:0, ostatniDzien:null};
    if(!x.ostatniDzien || !liczba(x.dni)) return {dni: liczba(y.dni), ostatniDzien: y.ostatniDzien || null};
    if(!y.ostatniDzien || !liczba(y.dni)) return {dni: liczba(x.dni), ostatniDzien: x.ostatniDzien};
    var kx = dzien(x.ostatniDzien), ky = dzien(y.ostatniDzien);
    var pozn = kx >= ky ? x : y, wczes = kx >= ky ? y : x;
    var kP = Math.max(kx, ky), kW = Math.min(kx, ky);
    var startP = kP - liczba(pozn.dni) + 1, startW = kW - liczba(wczes.dni) + 1;
    var dni = (kW >= startP - 1) ? kP - Math.min(startP, startW) + 1 : liczba(pozn.dni);
    return {dni: dni, ostatniDzien: pozn.ostatniDzien};
  }

  function scal(lokalny, chmura, opcje){
    if(!chmura) return kopia(lokalny);
    if(!lokalny) return kopia(chmura);
    var pierwszy = !!(opcje && opcje.pierwszy);

    var zl = liczba(lokalny.zastapiono), zc = liczba(chmura.zastapiono);
    var wynik;
    if(zl !== zc && !pierwszy){
      wynik = kopia(zl > zc ? lokalny : chmura);
    } else {
      wynik = kopia(chmura);
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
      wynik.zastapiono = zc;
    }

    // Ustawienia rodzica — zawsze nowsza zmiana, także gdy postęp został zastąpiony.
    var ustawieniaZ = liczba(lokalny.ustawieniaCzas) > liczba(chmura.ustawieniaCzas) ? lokalny : chmura;
    USTAWIENIA.forEach(function(k){ if(ustawieniaZ[k] !== undefined) wynik[k] = ustawieniaZ[k]; });
    wynik.ustawieniaCzas = Math.max(liczba(lokalny.ustawieniaCzas), liczba(chmura.ustawieniaCzas));

    return wynik;
  }

  if(typeof module !== "undefined" && module.exports) module.exports = scal;
  else root.scal = scal;
})(this);
