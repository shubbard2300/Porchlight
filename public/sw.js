// Porchlight service worker: shows push alerts and opens the right page when one is tapped.
// It caches nothing, so the site always loads fresh.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let alert = { title: 'Porchlight', body: '', url: '/' };
  try { alert = { ...alert, ...event.data.json() }; } catch { if (event.data) alert.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(alert.title, {
    body: alert.body,
    tag: alert.tag,
    icon: '/app-icons/icon-192.png',
    badge: '/app-icons/icon-192.png',
    data: { url: alert.url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const tab = tabs.find((t) => t.url.startsWith(self.location.origin));
    if (tab) { await tab.focus(); return tab.navigate(url); }
    return self.clients.openWindow(url);
  })());
});
