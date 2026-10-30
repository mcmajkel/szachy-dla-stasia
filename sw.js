/* Service worker — aplikacja działa offline po pierwszym otwarciu z internetem.
   PO KAŻDEJ ZMIANIE index.html, zadań albo ikon podbij WERSJA, inaczej
   telefony dalej pokazują starą wersję z pamięci podręcznej. */
var WERSJA = "szachy-v1";
var PLIKI = [
  "./",
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
  "zadania/pakiet-07-maty-techniczne.js"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(WERSJA).then(function(c){ return c.addAll(PLIKI); }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(klucze){
    return Promise.all(klucze.filter(function(k){ return k !== WERSJA; })
      .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* Najpierw pamięć podręczna, potem sieć. Lichess i inne domeny idą prosto do sieci. */
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(function(r){
    return r || fetch(e.request);
  }));
});
