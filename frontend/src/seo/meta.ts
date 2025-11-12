export interface PageMeta {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  robots?: string;
}

const defaultTitle = 'Omegoo – Random Video, Voice & Text Chat for Safer Connections';
const defaultDescription = 'Omegoo pairs students, creators, and explorers for moderated random video, voice, and text chat with a daily coin system that keeps conversations safe and meaningful.';
const defaultImage = 'https://www.omegoo.chat/logo512.png';

export const DEFAULT_META: PageMeta = {
  title: defaultTitle,
  description: defaultDescription,
  keywords: [
    'omegoo',
    'random video chat',
    'omegle alternative india',
    'anonymous chat app',
    'student chat platform',
    'talk to strangers live',
    'sites like omegle',
    'safe omegle alternative',
    'omegle for students',
    'omegle replacement 2025',
    'moderated stranger chat'
  ],
  image: defaultImage,
  robots: 'index,follow'
};

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Omegoo – Random Video Chat App for Students, Creators & Explorers',
    description:
      'Match instantly with genuine people across India and beyond. Omegoo offers moderated random video, voice, and text chat with coins to deter spam and keep conversations high quality.',
    keywords: [
      'random chat omegoo',
      'random video chat india',
      'omegle alternative',
      'safe stranger chat',
      'video voice text chat app',
      'omegle alternative for students',
      'omegle india 2025',
      'omegle like website',
      'best omegle alternative'
    ],
    image: defaultImage
  },
  '/about': {
    title: 'About Omegoo – Safer Random Chat for the Campus Generation',
    description:
      'Discover how Omegoo protects users with AI moderation, verified badges, and a fair coin system. Learn about our mission to deliver safer random chat across campuses.',
    keywords: [
      'about omegoo',
      'omegoo mission',
      'safe random chat story',
      'omegle alternative story',
      'who created omegle alternative'
    ],
    image: defaultImage
  },
  '/contact': {
    title: 'Contact Omegoo – Partner, Collaborate or Report an Issue',
    description:
      'Reach the Omegoo team for partnerships, press inquiries, safety reports, or campus collaborations. We reply to every legitimate request within 24 hours.',
    keywords: [
      'contact omegoo',
      'omegoo support',
      'omegoo partnership',
      'contact omegle alternative',
      'report issue omegle replacement'
    ],
    image: defaultImage,
    robots: 'index,follow'
  },
  '/privacy': {
    title: 'Omegoo Privacy Policy – How We Protect Every Conversation',
    description:
      'Read how Omegoo handles personal data, session transcripts, and moderation logs while delivering a safe random chat experience for global communities.',
    image: defaultImage,
    keywords: [
      'omegoo privacy policy',
      'random chat privacy',
      'omegoo data policy',
      'omegle alternative privacy',
      'secure omegle type chat'
    ],
    robots: 'index,follow'
  },
  '/terms': {
    title: 'Omegoo Terms of Service – Rules for Safer Random Chat',
    description:
      'Review the Omegoo terms covering eligibility, acceptable behaviour, prohibited content, and dispute resolution for random video, voice, and text chat sessions.',
    image: defaultImage,
    keywords: [
      'omegoo terms',
      'omegoo legal',
      'random chat rules',
      'omegle alternative rules',
      'terms for omegle like site'
    ],
    robots: 'index,follow'
  },
  '/safety': {
    title: 'Safety Guidelines – Tips for Respectful Random Video & Voice Chat',
    description:
      'Follow Omegoo safety guidelines to report bad actors, protect your privacy, and maintain respectful random chat experiences on video, voice, or text.',
    image: defaultImage,
    keywords: [
      'omegoo safety',
      'random chat safety tips',
      'omegle alternative safety',
      'safe omegle tips',
      'how to stay safe on omegle alternative'
    ],
    robots: 'index,follow'
  },
  '/chat/text': {
    title: 'Random Text Chat – Meet New People with Omegoo Coins',
    description:
      'Start anonymous text chats with verified users worldwide. Spend a coin to unlock curated random pairings backed by moderation and instant reporting.',
    image: defaultImage,
    keywords: [
      'random text chat',
      'chat with strangers text',
      'omegoo coins text chat',
      'omegle text alternative',
      'text chat sites like omegle'
    ],
    robots: 'index,follow'
  },
  '/chat/audio': {
    title: 'Random Voice Chat – High Quality Audio Conversations on Omegoo',
    description:
      'Drop into real-time voice chats that use Omegoo’s AI moderation and coin system to keep matches respectful, engaging, and spam-free.',
    image: defaultImage,
    keywords: [
      'random voice chat',
      'talk to strangers voice',
      'voice omegle alternative',
      'omegle voice replacement',
      'audio chat sites like omegle'
    ],
    robots: 'index,follow'
  },
  '/chat/video': {
    title: 'Random Video Chat – Safer Omegle Alternative for Campus Communities',
    description:
      'Enjoy moderated random video chat with fellow students, creators, and explorers. Omegoo coins, verified badges, and AI safety make every match count.',
    image: defaultImage,
    keywords: [
      'random video chat',
      'omegle alternative video',
      'safe video chat',
      'omegle video replacement',
      'video chat sites like omegle'
    ],
    robots: 'index,follow'
  },
  '/chat': {
    title: 'Omegoo Chat Lobby – Launch Video, Voice or Text Sessions',
    description:
      'Select your preferred random chat mode and let Omegoo match you with respectful strangers in seconds. Switch between video, voice, and text without losing your queue.',
    image: defaultImage,
    keywords: [
      'omegoo chat',
      'random chat lobby',
      'switch chat modes',
      'omegle dashboard',
      'omegle lobby alternative'
    ],
    robots: 'noindex,nofollow'
  },
  '/login': {
    title: 'Login or Register – Join Omegoo Random Chat in Seconds',
    description:
      'Create an Omegoo account to unlock coins, verified badges, and access to safe random chat via video, voice, and text.',
    image: defaultImage,
    keywords: [
      'omegoo login',
      'register omegle alternative',
      'sign up omegle replacement'
    ],
    robots: 'index,follow'
  },
  '/profile': {
    title: 'Your Omegoo Profile – Track Coins, Badges & Random Chat Stats',
    description:
      'Review your Omegoo coins, verification status, chat history, and safety reports from one streamlined profile dashboard.',
    image: defaultImage,
    keywords: [
      'omegoo profile',
      'omegle alternative profile',
      'random chat account dashboard'
    ]
  },
  '/settings': {
    title: 'Account Settings – Control Your Omegoo Random Chat Experience',
    description:
      'Manage privacy preferences, device security, and notification settings to personalise your Omegoo random chat sessions.',
    image: defaultImage,
    keywords: [
      'omegoo settings',
      'omegle alternative settings',
      'manage omegle replacement account'
    ]
  }
};

export function getMetaForPath(pathname: string): PageMeta {
  return PAGE_META[pathname] || DEFAULT_META;
}
