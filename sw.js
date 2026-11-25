var CACHE = 'ifada-v1';
var FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FICHIERS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

/* Réseau d'abord (pour toujours avoir la dernière version), cache en secours.
   Les appels vers Google (liste des élèves, impression) ne sont jamais mis en cache. */
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function(r){
      var copie = r.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copie); });
      return r;
    }).catch(function(){
      return caches.match(req).then(function(m){ return m || caches.match('./'); });
    })
  );
});
