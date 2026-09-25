// Service Worker Registration
if ('serviceWorker' in navigator) {
  var isLocalhost =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '[::1]';

  if (isLocalhost) {
    // The dev server rebuilds modules on every request; a cached copy served by
    // the worker breaks hot reloading and module MIME types.
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      registrations.forEach(function (registration) {
        registration.unregister();
      });
    });

    if (window.caches) {
      caches.keys().then(function (keys) {
        keys.forEach(function (key) {
          caches.delete(key);
        });
      });
    }
  } else {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js')
        .then(function (registration) {
          console.log('[App] Service Worker registered:', registration);
        })
        .catch(function (error) {
          console.error('[App] Service Worker registration failed:', error);
        });
    });
  }
}
