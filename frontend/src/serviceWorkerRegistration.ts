const SERVICE_WORKER_PATH = '/service-worker.js';
const CHECK_UPDATE_INTERVAL = 60000; // Check for updates every 60 seconds

export function registerServiceWorker() {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  // Listen for cache update messages from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('🔄 Cache updated to version:', event.data.version);
        console.log('🔄 Reloading page to get fresh content...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });
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
                  console.log('ℹ️ New content detected! Updating now...');
                  
                  // Skip waiting and activate immediately
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  
                  // Force reload after brief delay
                  setTimeout(() => {
                    console.log('🔄 Reloading to show updated content...');
                    window.location.reload();
                  }, 500);
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

      // Periodically check for updates
      setInterval(() => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            console.log('🔍 Checking for service worker updates...');
            reg.update();
          }
        });
      }, CHECK_UPDATE_INTERVAL);
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
