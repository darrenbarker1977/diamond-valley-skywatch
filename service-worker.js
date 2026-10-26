const CACHE='dvsky-shell-20261026-stargazer-1';
const BASE=new URL('./',self.location.href);
const FILES=['assets/stargazer-header.webp','./','index.html','forecast.html','field-check.html','prototype/navigator.css','prototype/navigator.js','prototype/navigation.js','prototype/equipment-ui.js','prototype/eyepieces.js','prototype/pointing.js','prototype/alignment.js','prototype/positions.js','prototype/catalogue.js','prototype/easy-targets.js','prototype/sensors.js','prototype/location.js','prototype/vendor/astronomy.browser.min.js'];
const PATHS=new Set(FILES.map(path=>new URL(path,BASE).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(path=>new Request(new URL(path,BASE),{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dvsky-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==BASE.origin||!PATHS.has(url.pathname))return;
 const key=new URL(url.pathname,BASE.origin).href;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
  try {const response=await fetch(new Request(event.request,{cache:'no-store',signal:controller.signal}));if(!response.ok)throw Error('HTTP '+response.status);try{await cache.put(key,response.clone());}catch{}return response;}
  catch(error){const saved=await cache.match(key);if(saved)return new Response(await saved.arrayBuffer(),{status:saved.status,headers:saved.headers});throw error;}finally{clearTimeout(timer);}
 })());
});
