// Centralized SEO Configuration for Omegoo
export const siteConfig = {
  siteName: 'Omegoo',
  siteUrl: 'https://www.omegoo.chat',
  defaultTitle: 'Omegoo - Free Random Video Chat with Strangers | No Login Required',
  defaultDescription: 'Meet new people worldwide with Omegoo\'s free random video chat. No registration, 100% anonymous, instant matching. Text, voice & video chat available.',
  defaultKeywords: [
    'random video chat',
    'stranger chat',
    'omegle alternative',
    'free video chat',
    'anonymous chat',
    'no login video chat',
    'talk to strangers',
    'random chat',
    'video call strangers',
    'webcam chat'
  ],
  twitterHandle: '@omegoochat',
  logo: '/logo192.png',
  favicon: '/favicon.ico',
  themeColor: '#3B82F6'
};

export const defaultSEO = {
  title: siteConfig.defaultTitle,
  description: siteConfig.defaultDescription,
  canonical: siteConfig.siteUrl,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: [
      {
        url: `${siteConfig.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Omegoo - Random Video Chat',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    handle: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=5'
    },
    {
      name: 'keywords',
      content: siteConfig.defaultKeywords.join(', ')
    },
    {
      name: 'author',
      content: 'Omegoo Team'
    },
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    },
    {
      httpEquiv: 'Content-Type',
      content: 'text/html; charset=utf-8'
    },
    {
      name: 'language',
      content: 'English'
    },
    {
      name: 'revisit-after',
      content: '7 days'
    },
    {
      name: 'theme-color',
      content: siteConfig.themeColor
    }
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: siteConfig.favicon,
    },
    {
      rel: 'apple-touch-icon',
      href: '/logo192.png',
      sizes: '192x192'
    },
    {
      rel: 'manifest',
      href: '/manifest.json'
    }
  ]
};

// Country Page SEO Generator
export const generateCountrySEO = (country: {
  name: string;
  slug: string;
  keywords: string[];
  description: string;
  population: string;
  languages: string[];
}) => ({
  title: `Random Video Chat ${country.name} | Talk to Strangers – Omegoo`,
  description: `Meet new people in ${country.name} with Omegoo's free random video chat. No login, anonymous, fast matching, and safe chatting with ${country.population} users.`,
  canonical: `${siteConfig.siteUrl}/country/${country.slug}`,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteConfig.siteUrl}/country/${country.slug}`,
    siteName: siteConfig.siteName,
    title: `Random Video Chat ${country.name} | Talk to Strangers – Omegoo`,
    description: `Meet new people in ${country.name} with Omegoo's free random video chat. No login, anonymous, fast matching.`,
    images: [
      {
        url: `${siteConfig.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `Omegoo Video Chat in ${country.name}`,
        type: 'image/png',
      }
    ],
  },
  twitter: {
    handle: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'keywords',
      content: country.keywords.join(', ')
    },
    {
      name: 'geo.region',
      content: country.slug.toUpperCase()
    },
    {
      name: 'geo.placename',
      content: country.name
    },
    {
      name: 'language',
      content: country.languages.join(', ')
    }
  ]
});

// Money Keyword SEO Generator
export const generateMoneyKeywordSEO = (config: {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}) => ({
  title: `${config.title} | Omegoo`,
  description: config.description,
  canonical: `${siteConfig.siteUrl}/${config.slug}`,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteConfig.siteUrl}/${config.slug}`,
    siteName: siteConfig.siteName,
    title: `${config.title} | Omegoo`,
    description: config.description,
    images: [
      {
        url: `${siteConfig.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: config.title,
        type: 'image/png',
      }
    ],
  },
  twitter: {
    handle: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'keywords',
      content: config.keywords.join(', ')
    }
  ]
});
