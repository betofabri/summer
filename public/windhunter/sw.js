/* Service worker do "Vai ventar?" — network-first.
   Sempre busca a versão fresca quando online (nunca serve conteúdo velho);
   o cache só entra como reserva quando o aparelho está offline.
   Respostas da API (open-meteo, cross-origin) nunca são cacheadas: previsão sempre atual. */
const CACHE = "vaiventar-v12";
const SHELL = ["./", "./index.html", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./manifest.json"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (sameOrigin && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});

/* ===== alertas de vento (Web Push sem payload) =====
   O push chega sem corpo; buscamos o texto da notificação em /api/summary
   (o Worker guardou a mensagem calculada no cron) e mostramos. */
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let data = { title: "Vai ventar?", body: "Tem vento chegando nos seus spots." };
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const res = await fetch(new URL("api/summary", self.registration.scope), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub && sub.endpoint })
      });
      if (res.ok) data = await res.json();
    } catch (_) { /* usa o texto padrão */ }
    await self.registration.showNotification(data.title || "Vai ventar?", {
      body: data.body || "",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: "vaiventar-wind",
      data: { url: data.url || self.registration.scope }
    });
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.includes("/windhunter") && "focus" in c) return c.focus();
    }
    return clients.openWindow(url);
  }));
});
