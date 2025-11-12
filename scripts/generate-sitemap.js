const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.SITEMAP_BASE_URL || process.env.FRONTEND_URL || 'https://www.omegoo.chat').replace(/\/$/, '');
const OUTPUT_PATH = path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml');
const BUILD_OUTPUT_PATH = path.join(__dirname, '..', 'frontend', 'build', 'sitemap.xml');

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about', priority: 0.8, changefreq: 'weekly' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.5, changefreq: 'yearly' },
  { path: '/terms', priority: 0.5, changefreq: 'yearly' },
  { path: '/safety', priority: 0.6, changefreq: 'monthly' },
  { path: '/login', priority: 0.4, changefreq: 'monthly' },
  { path: '/profile', priority: 0.6, changefreq: 'weekly' },
  { path: '/settings', priority: 0.6, changefreq: 'weekly' },
  { path: '/forgot-password', priority: 0.4, changefreq: 'monthly' },
  { path: '/reset-password', priority: 0.4, changefreq: 'monthly' },
];

const CHAT_ROUTES = ['text', 'audio', 'video'].map((mode) => ({
  path: `/chat/${mode}`,
  priority: 0.7,
  changefreq: 'daily'
}));

const SUPPORT_ROUTES = [
  { path: '/verify', priority: 0.4, changefreq: 'monthly' },
  { path: '/verify-otp', priority: 0.4, changefreq: 'monthly' },
  { path: '/omegoo-admin', priority: 0.2, changefreq: 'monthly' }
];

const LASTMOD = new Date().toISOString();

function toAbsoluteUrl(routePath) {
  if (!routePath.startsWith('/')) {
    return `${BASE_URL}/${routePath}`;
  }
  return `${BASE_URL}${routePath}`;
}

function buildEntry({ path: routePath, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${toAbsoluteUrl(routePath)}</loc>`,
    `    <lastmod>${LASTMOD}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    '  </url>'
  ].join('\n');
}

function dedupeRoutes(routes) {
  const seen = new Set();
  return routes.filter((route) => {
    const key = route.path;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeSitemap(filePath, entries) {
  ensureDirectory(filePath);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join('\n'),
    '</urlset>',
    ''
  ].join('\n');

  fs.writeFileSync(filePath, xml, 'utf8');
}

function main() {
  const routes = dedupeRoutes([
    ...STATIC_ROUTES,
    ...CHAT_ROUTES,
    ...SUPPORT_ROUTES
  ]);

  const entries = routes.map(buildEntry);
  writeSitemap(OUTPUT_PATH, entries);

  if (fs.existsSync(path.dirname(BUILD_OUTPUT_PATH))) {
    writeSitemap(BUILD_OUTPUT_PATH, entries);
  }

  console.log(`✅ Sitemap generated for ${routes.length} routes at ${OUTPUT_PATH}`);
}

main();
