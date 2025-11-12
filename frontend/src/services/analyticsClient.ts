import { API_BASE_URL } from './api';

const isBrowser = typeof window !== 'undefined';

export type AnalyticsEventType =
  | 'home_view'
  | 'match_attempt'
  | 'status_page_view'
  | 'transparency_view'
  | 'blog_safe_chat_view';

const analyticsQueue: { type: AnalyticsEventType; timestamp: number }[] = [];
let flushTimer: number | null = null;

const enqueue = (type: AnalyticsEventType) => {
  analyticsQueue.push({ type, timestamp: Date.now() });

  if (!flushTimer) {
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      flushQueue();
    }, 2000);
  }
};

const flushQueue = async () => {
  if (analyticsQueue.length === 0 || !isBrowser) {
    return;
  }

  const event = analyticsQueue.shift();
  if (!event) {
    return;
  }

  try {
  await fetch(`${API_BASE_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: event.type })
    });
  } catch (error) {
    console.warn('Analytics send failed, will retry next flush.', error);
    analyticsQueue.push(event);
  }
};

export const trackEvent = (type: AnalyticsEventType) => {
  if (!isBrowser) {
    return;
  }

  const key = `analytics:${type}:seen`;
  if (type.endsWith('_view') && sessionStorage.getItem(key)) {
    return;
  }

  enqueue(type);

  if (type.endsWith('_view')) {
    sessionStorage.setItem(key, new Date().toISOString());
  }
};
