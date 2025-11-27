const SERVICE_WORKER_PATH = '/service-worker.js';

export function registerServiceWorker() {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(SERVICE_WORKER_PATH)
        .then((registration) => {
          console.log('✅ Service worker registered:', registration.scope);

          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) {
              return;
            }

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('ℹ️ New content is available; reloading to activate.');
                  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
                  
                  // Force immediate reload to show new version
                  console.log('🔄 Forcing reload for new service worker...');
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                } else {
                  console.log('🎉 Content cached for offline use.');
                }
              }
            };
          };
        })
        .catch((registrationError) => {
          console.error('❌ Service worker registration failed:', registrationError);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => {
        console.error('Failed to unregister service worker:', error);
      });
  }
}
