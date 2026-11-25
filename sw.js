// يخلّي الصفحة نفسها (والخط والصور) تفتح من غير نت
// الأسعار نفسها بتتخزن من جوه الصفحة (localStorage) مش من هنا
const V = "egic-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => c.addAll(["./index.html"]).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);

  // ملف الأسعار بتتعامل معاه الصفحة بنفسها
  if (u.hostname === "docs.google.com") return;

  // فتح الصفحة: النت الأول، ولو مفيش نت النسخة المحفوظة
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then(res => {
          const cp = res.clone();
          caches.open(V).then(c => c.put("./index.html", cp));
          return res;
        })
        .catch(() =>
          caches.match("./index.html").then(m => m || Response.error())
        )
    );
    return;
  }

  // الخطوط والصور: المحفوظ الأول، وبيتحدث في الخلفية
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r)
        .then(res => {
          if (res && (res.ok || res.type === "opaque")) {
            const cp = res.clone();
            caches.open(V).then(c => c.put(r, cp));
          }
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || net;
    })
  );
});
