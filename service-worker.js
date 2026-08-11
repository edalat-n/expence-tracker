const CACHE='expense-tracker-corrected-final-v1';
const CORE=['./','./index.html'];
const OPTIONAL=[
 './manifest.webmanifest',
 './purple-reticle-final-32.png',
 './purple-reticle-final-180.png',
 './purple-reticle-final-192.png',
 './purple-reticle-final-512.png',
 './purple-reticle-final-maskable-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.allSettled(OPTIONAL.map(async url=>{
      try{
        const r=await fetch(url,{cache:'reload'});
        if(r.ok)await cache.put(url,r);
      }catch(_){
      }
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(r=>{
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put('./index.html',copy));
          return r;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{
      if(r&&r.ok){
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put(event.request,copy));
      }
      return r;
    }))
  );
});
