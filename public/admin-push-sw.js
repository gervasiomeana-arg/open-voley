/* Notifications only. No fetch handler, page cache, authentication or app data. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { /* Show generic notice */ }
  event.waitUntil(self.registration.showNotification('OPEN VOLEY', {
    body: data.body === 'Avisos activados en este dispositivo.' ? data.body : 'Un nuevo cliente activó su prueba.',
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 80) : 'openvoley-new-trial',
    data: { url: '/' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async windows => {
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.focus();
    return self.clients.openWindow('/');
  }));
});
