/* Service worker — aplikacja działa offline po pierwszym otwarciu z internetem.
   Strategia: od razu podaj plik z pamięci, w tle pobierz świeży na następne otwarcie.
   Dzięki temu poprawki docierają same (przy drugim otwarciu po wdrożeniu).
   WERSJA podbijaj, gdy zmieniasz listę PLIKI — stara pamięć zostanie wtedy wyczyszczona.
   tools/waliduj.js sprawdza, że PLIKI zgadza się z index.html i katalogiem zadania/. */
var PREFIKS = "szachy-";
var WERSJA = PREFIKS + "v2";
var PLIKI = [
  "index.html",
  "manifest.json",
  "icon.svg",
  "zadania/pakiet-00-start.js",
  "zadania/pakiet-01-bicie.js",
  "zadania/pakiet-02-obrona-bierki.js",
  "zadania/pakiet-03-szach.js",
  "zadania/pakiet-04-mat-w-1.js",
  "zadania/pakiet-05-wiszace-bierki.js",
  "zadania/pakiet-06-widelce.js",
  "zadania/pakiet-07-maty-techniczne.js",
  "scal.js",
  "figury/fantasy/bB.svg",
  "figury/fantasy/bK.svg",
  "figury/fantasy/bN.svg",
  "figury/fantasy/bP.svg",
  "figury/fantasy/bQ.svg",
  "figury/fantasy/bR.svg",
  "figury/fantasy/wB.svg",
  "figury/fantasy/wK.svg",
  "figury/fantasy/wN.svg",
  "figury/fantasy/wP.svg",
  "figury/fantasy/wQ.svg",
  "figury/fantasy/wR.svg",
  "figury/halloween/bB.png",
  "figury/halloween/bK.png",
  "figury/halloween/bN.png",
  "figury/halloween/bP.png",
  "figury/halloween/bQ.png",
  "figury/halloween/bR.png",
  "figury/halloween/wB.png",
  "figury/halloween/wK.png",
  "figury/halloween/wN.png",
  "figury/halloween/wP.png",
  "figury/halloween/wQ.png",
  "figury/halloween/wR.png",
  "figury/horsey/bB.svg",
  "figury/horsey/bK.svg",
  "figury/horsey/bN.svg",
  "figury/horsey/bP.svg",
  "figury/horsey/bQ.svg",
  "figury/horsey/bR.svg",
  "figury/horsey/wB.svg",
  "figury/horsey/wK.svg",
  "figury/horsey/wN.svg",
  "figury/horsey/wP.svg",
  "figury/horsey/wQ.svg",
  "figury/horsey/wR.svg",
  "figury/rhosgfx/bB.svg",
  "figury/rhosgfx/bK.svg",
  "figury/rhosgfx/bN.svg",
  "figury/rhosgfx/bP.svg",
  "figury/rhosgfx/bQ.svg",
  "figury/rhosgfx/bR.svg",
  "figury/rhosgfx/wB.svg",
  "figury/rhosgfx/wK.svg",
  "figury/rhosgfx/wN.svg",
  "figury/rhosgfx/wP.svg",
  "figury/rhosgfx/wQ.svg",
  "figury/rhosgfx/wR.svg"
];

/* cache:"reload" omija pamięć HTTP przeglądarki (GitHub Pages: max-age=600),
   inaczej nowa wersja mogłaby zapisać stare pliki. */
function pobierzSwiezy(url){
  return fetch(new Request(url, {cache:"reload"}));
}

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(WERSJA).then(function(c){
    return Promise.all(PLIKI.map(function(u){
      return pobierzSwiezy(u).then(function(r){
        if(!r.ok) throw new Error("sw.js: nie udało się pobrać " + u + " (" + r.status + ")");
        return c.put(u, r);
      });
    }));
  }));
  self.skipWaiting();
});

/* Czyścimy tylko własne stare pamięci — inne aplikacje na *.github.io dzielą ten sam origin. */
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(klucze){
    return Promise.all(klucze.filter(function(k){ return k.indexOf(PREFIKS) === 0 && k !== WERSJA; })
      .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* Lichess i inne domeny idą prosto do sieci. Każde otwarcie strony (./, index.html, ?cokolwiek)
   dostaje zapisany index.html — to aplikacja jednoplikowa. */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  var klucz = req.mode === "navigate" ? "index.html" : req;

  var zSieci = pobierzSwiezy(req.mode === "navigate" ? "index.html" : req.url).then(function(r){
    if(!r.ok) return r;
    var kopia = r.clone();
    return caches.open(WERSJA).then(function(c){ return c.put(klucz, kopia); }).then(function(){ return r; });
  });
  e.waitUntil(zSieci.catch(function(){}));
  e.respondWith(caches.match(klucz).then(function(r){ return r || zSieci; }));
});
