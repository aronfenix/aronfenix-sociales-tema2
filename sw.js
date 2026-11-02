/*
 * Service worker sencillo · Sociales 5.º · Tema 2
 * Guarda la app (páginas, estilos, scripts, fuentes, datos, pósteres) para que cargue rápido en las tablets.
 * NO guarda los vídeos (.mp4): esos siempre van por la red.
 * Estrategia: primero la red (para tener siempre lo último); si la red tarda más de 3 s o no hay conexión,
 * se usa la copia guardada. Si algo falla, el navegador sigue como si no existiera este archivo.
 * Para forzar una limpieza tras cambios grandes, sube el número de VERSION.
 */
'use strict';
var VERSION = 'v2';
var CACHE = 'sociales5-tema2-' + VERSION;
var BASICOS = [
  './', 'index.html', 'leccion.html', 'repaso.html',
  'actividades/', 'actividades/index.html', 'actividades/actividad.html',
  'assets/css/estilos.css', 'assets/css/app.css',
  'assets/js/motor.js', 'assets/js/app.js', 'assets/js/europa.js',
  'assets/fonts/nunito-latin-wght-normal.woff2', 'assets/fonts/nunito-latin-ext-wght-normal.woff2',
  'assets/img/icono.svg', 'assets/img/icono-192.png',
  'data/guiones.json', 'data/preguntas.json', 'data/tiempos.json', 'data/capitulos.json',
  'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // uno a uno: si falta alguno, los demás se guardan igual
    return Promise.all(BASICOS.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () {}); }));
  }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('sociales5-tema2-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).catch(function () {}).then(function () { return self.clients.claim(); }));
});

function esVideo(req, url) {
  return /\.(mp4|webm|m4v|mov)$/i.test(url.pathname) || req.headers.has('range') || req.destination === 'video' || req.destination === 'audio';
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  if (esVideo(req, url)) return;               // los vídeos, directos a la red
  if (url.pathname.indexOf('/produccion/') >= 0) return;

  e.respondWith(new Promise(function (resolver) {
    var hecho = false;
    function dar(r) { if (!hecho && r) { hecho = true; resolver(r); } }
    var copia = caches.match(req, { ignoreSearch: req.mode === 'navigate' }).catch(function () { return null; });
    var red = fetch(req).then(function (r) {
      if (r && r.ok && r.type === 'basic') {
        var clon = r.clone();
        caches.open(CACHE).then(function (c) { return c.put(req, clon); }).catch(function () {});
      }
      return r;
    });
    // red primero; a los 3 s, si hay copia, se usa la copia
    var espera = setTimeout(function () { copia.then(dar); }, 3000);
    red.then(function (r) {
      clearTimeout(espera);
      if (r.ok) return dar(r);
      return copia.then(function (c) { dar(c || r); });
    }, function () {
      clearTimeout(espera);
      return copia.then(function (c) { dar(c || Response.error()); });
    });
  }));
});
