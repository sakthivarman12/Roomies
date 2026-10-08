/* Roomies service worker: device notifications today, Web Push + offline caching later. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Future: server-sent Web Push (needs Supabase/edge function + VAPID keys).
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Roomies", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "Roomies", {
    body: data.body || "", icon: "/icons/icon.svg", badge: "/icons/icon.svg", data: { url: data.url || "/notifications" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const c of clients) {
      if ("focus" in c) { c.focus(); if ("navigate" in c) c.navigate(url); return; }
    }
    return self.clients.openWindow(url);
  }));
});
