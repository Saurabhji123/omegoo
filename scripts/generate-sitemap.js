const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.SITEMAP_BASE_URL || process.env.FRONTEND_URL || 'https://www.omegoo.chat').replace(/\/$/, '');
const OUTPUT_PATH = path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml');
const BUILD_OUTPUT_PATH = path.join(__dirname, '..', 'frontend', 'build', 'sitemap.xml');

// Static Pages
const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.5, changefreq: 'yearly' },
  { path: '/terms', priority: 0.5, changefreq: 'yearly' },
  { path: '/safety', priority: 0.6, changefreq: 'monthly' },
];

// Money Keyword Pages - High Priority for SEO
const MONEY_KEYWORD_PAGES = [
  { path: '/no-login-video-chat', priority: 0.9, changefreq: 'weekly' },
  { path: '/anonymous-video-chat', priority: 0.9, changefreq: 'weekly' },
  { path: '/stranger-cam-chat', priority: 0.9, changefreq: 'weekly' },
  { path: '/omegle-like-app', priority: 0.9, changefreq: 'weekly' },
  { path: '/random-chat-no-registration', priority: 0.9, changefreq: 'weekly' },
];

// Top 12 High-Traffic Countries - Keep ONLY These
const TOP_COUNTRIES = [
  'india',
  'usa',
  'uk',
  'philippines',
  'indonesia',
  'pakistan',
  'canada',
  'australia',
  'germany',
  'brazil',
  'mexico',
  'russia'
].map(slug => ({
  path: `/country/${slug}`,
  priority: 0.9,
  changefreq: 'weekly'
}));

const CHAT_ROUTES = ['text', 'audio', 'video'].map((mode) => ({
  path: `/chat/${mode}`,
  priority: 0.7,
  changefreq: 'daily'
}));

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
    ...MONEY_KEYWORD_PAGES,
    ...TOP_COUNTRIES,
    ...CHAT_ROUTES
  ]);

  const entries = routes.map(buildEntry);
  writeSitemap(OUTPUT_PATH, entries);

  if (fs.existsSync(path.dirname(BUILD_OUTPUT_PATH))) {
    writeSitemap(BUILD_OUTPUT_PATH, entries);
  }

  console.log(`✅ Sitemap generated with ${routes.length} routes:`);
  console.log(`   - ${STATIC_ROUTES.length} static pages`);
  console.log(`   - ${MONEY_KEYWORD_PAGES.length} money keyword pages`);
  console.log(`   - ${TOP_COUNTRIES.length} top country pages`);
  console.log(`   - ${CHAT_ROUTES.length} chat routes`);
  console.log(`\n📍 Sitemap location: ${OUTPUT_PATH}`);
}

main();
