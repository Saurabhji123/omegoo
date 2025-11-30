/**
 * Version Checker - Automatically detects new deployments and reloads
 * 
 * SMART APPROACH:
 * - React builds include hash in filenames (main.abc123.js)
 * - When new build deploys, hash changes automatically
 * - We only check meta version tag to trigger reload
 * - NO cache clearing needed (React handles it via hash)
 * - localStorage/sessionStorage PRESERVED (user stays logged in)
 */

const CHECK_INTERVAL = 120000; // Check every 2 minutes
let currentVersion: string | null = null;

export function startVersionChecker() {
  // Get initial version from meta tag
  currentVersion = getAppVersion();
  console.log('📌 Current app version:', currentVersion);

  // Check for updates periodically
  setInterval(async () => {
    try {
      const newVersion = await fetchLatestVersion();
      
      if (newVersion && currentVersion && newVersion !== currentVersion) {
        console.log('🆕 New version detected!');
        console.log(`📦 Current: ${currentVersion} → New: ${newVersion}`);
        
        // NO CACHE CLEARING! React build hashes handle cache busting
        // localStorage/sessionStorage preserved = user stays logged in ✅
        
        // Show user notification
        showUpdateNotification();
        
        // Simple reload (browser fetches new index.html due to no-cache header)
        // New index.html has new JS/CSS hashes, so fresh files load automatically
        setTimeout(() => {
          console.log('🔄 Reloading to get latest version (login preserved)...');
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Version check failed:', error);
    }
  }, CHECK_INTERVAL);
}

function getAppVersion(): string | null {
  const metaTag = document.querySelector('meta[name="app-version"]');
  return metaTag?.getAttribute('content') || null;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    // Fetch index.html with cache-busting
    const response = await fetch(`/?v=${Date.now()}`, {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const html = await response.text();
    
    // Extract version from meta tag
    const match = html.match(/<meta name="app-version" content="([^"]+)"/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Failed to fetch latest version:', error);
    return null;
  }
}

function showUpdateNotification() {
  // Create a simple notification banner
  const banner = document.createElement('div');
  banner.id = 'version-update-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease-out;
  `;
  banner.innerHTML = '🎉 New version available! Updating now...';
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(banner);
}
