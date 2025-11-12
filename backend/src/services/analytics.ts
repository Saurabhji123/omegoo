import { RedisService } from './serviceFactory';

interface TrackEventInput {
  type: string;
  origin?: string;
}

export interface AnalyticsEventSummary {
  type: string;
  total: number;
  daily: Array<{
    date: string;
    count: number;
  }>;
}

const EVENT_KEY_PREFIX = 'analytics:event';
const EVENT_RETENTION_SECONDS = 60 * 60 * 24 * 30; // 30 days

const getDateKey = (date = new Date()) => date.toISOString().split('T')[0];

export class AnalyticsService {
  static async trackEvent({ type, origin }: TrackEventInput): Promise<void> {
    const safeType = type.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    if (!safeType) {
      return;
    }

    const dateKey = getDateKey();
    const redisKey = `${EVENT_KEY_PREFIX}:${safeType}:${dateKey}`;

    await RedisService.increment(redisKey, 1, EVENT_RETENTION_SECONDS);

    if (origin) {
      const originKey = `${EVENT_KEY_PREFIX}:${safeType}:${dateKey}:origins:${origin}`;
      await RedisService.increment(originKey, 1, EVENT_RETENTION_SECONDS);
    }
  }

  static async getSummary(days = 7): Promise<AnalyticsEventSummary[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const dateKeys: string[] = [];
    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      dateKeys.push(getDateKey(cursor));
    }

    const pattern = `${EVENT_KEY_PREFIX}:`;
  const allKeys = await RedisService.keys(pattern);

    const summariesMap: Record<string, AnalyticsEventSummary> = {};

    for (const key of allKeys) {
      if (!key.startsWith(pattern)) {
        continue;
      }

      const fragments = key.replace(pattern, '').split(':');
      const [eventType, date] = fragments;

      if (!dateKeys.includes(date) || fragments.length > 2) {
        continue;
      }

  const value = Number(await RedisService.get(key) ?? 0);

      if (!summariesMap[eventType]) {
        summariesMap[eventType] = {
          type: eventType,
          total: 0,
          daily: []
        };
      }

      summariesMap[eventType].total += value;
      summariesMap[eventType].daily.push({ date, count: value });
    }

    return Object.values(summariesMap).map(summary => ({
      ...summary,
      daily: summary.daily.sort((a, b) => a.date.localeCompare(b.date))
    }));
  }
}
