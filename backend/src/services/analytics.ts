import { RedisService } from './serviceFactory';
import type { AnalyticsFilterParams } from '../types/services';

interface TrackEventInput {
  type: string;
  origin?: string;
  segments?: {
    gender?: string;
    platform?: string;
    signupSource?: string;
    campaignId?: string;
  };
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
const SEGMENT_COMBO_MARKER = 'combo';

const getDateKey = (date = new Date()) => date.toISOString().split('T')[0];

const sanitizeSegmentValue = (value?: string | null): string => {
  if (!value) {
    return 'unknown';
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
};

const sanitizeFilterList = (values?: string[]): string[] | null => {
  if (!values || values.length === 0) {
    return null;
  }

  const normalized = values
    .map((value) => sanitizeSegmentValue(value))
    .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

  return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
};

export class AnalyticsService {
  static async trackEvent({ type, origin, segments }: TrackEventInput): Promise<void> {
    const safeType = type.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    if (!safeType) {
      return;
    }

    const dateKey = getDateKey();
    const redisKey = `${EVENT_KEY_PREFIX}:${safeType}:${dateKey}`;

    await RedisService.increment(redisKey, 1, EVENT_RETENTION_SECONDS);

    const segmentPayload = {
      gender: sanitizeSegmentValue(segments?.gender),
      platform: sanitizeSegmentValue(segments?.platform),
      signupSource: sanitizeSegmentValue(segments?.signupSource),
      campaignId: sanitizeSegmentValue(segments?.campaignId)
    };

    const segmentKey = `${EVENT_KEY_PREFIX}:${safeType}:${dateKey}:${SEGMENT_COMBO_MARKER}:${segmentPayload.gender}:${segmentPayload.platform}:${segmentPayload.signupSource}:${segmentPayload.campaignId}`;
    await RedisService.increment(segmentKey, 1, EVENT_RETENTION_SECONDS);

    if (origin) {
      const originKey = `${EVENT_KEY_PREFIX}:${safeType}:${dateKey}:origins:${origin}`;
      await RedisService.increment(originKey, 1, EVENT_RETENTION_SECONDS);
    }
  }

  static async getSummary(days = 7, filters: AnalyticsFilterParams = {}): Promise<AnalyticsEventSummary[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const dateKeys: string[] = [];
    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      dateKeys.push(getDateKey(cursor));
    }

    const filtersNormalized = {
      genders: sanitizeFilterList(filters.genders),
      platforms: sanitizeFilterList(filters.platforms),
      signupSources: sanitizeFilterList(filters.signupSources),
      campaigns: sanitizeFilterList(filters.campaigns)
    };

    const filtersApplied = Boolean(
      filtersNormalized.genders ||
      filtersNormalized.platforms ||
      filtersNormalized.signupSources ||
      filtersNormalized.campaigns
    );

    const pattern = `${EVENT_KEY_PREFIX}:`;
    const allKeys = await RedisService.keys(pattern);

    const baseKeyMap = new Map<string, string>();
    const comboKeyMap = new Map<string, Array<{ key: string; segments: {
      gender: string;
      platform: string;
      signupSource: string;
      campaignId: string;
    } }>>();
    const eventTypes = new Set<string>();
    const keysToFetch = new Set<string>();

    for (const key of allKeys) {
      if (!key.startsWith(pattern)) {
        continue;
      }

      const fragments = key.replace(pattern, '').split(':');
      if (fragments.length < 2) {
        continue;
      }

      const [eventType, date, marker, ...rest] = fragments;
      if (!eventType || !date || !dateKeys.includes(date)) {
        continue;
      }

      eventTypes.add(eventType);
      const mapKey = `${eventType}|${date}`;

      if (marker === undefined || marker === '') {
        baseKeyMap.set(mapKey, key);
        keysToFetch.add(key);
        continue;
      }

      if (marker === 'origins') {
        continue;
      }

      if (marker === SEGMENT_COMBO_MARKER && rest.length >= 4) {
        const [genderSegment, platformSegment, signupSegment, campaignSegment] = rest;
        if (!comboKeyMap.has(mapKey)) {
          comboKeyMap.set(mapKey, []);
        }
        comboKeyMap.get(mapKey)!.push({
          key,
          segments: {
            gender: genderSegment || 'unknown',
            platform: platformSegment || 'unknown',
            signupSource: signupSegment || 'unknown',
            campaignId: campaignSegment || 'unknown'
          }
        });
        keysToFetch.add(key);
      }
    }

    if (eventTypes.size === 0) {
      return [];
    }

    const keyValueMap = new Map<string, number>();
    if (keysToFetch.size > 0) {
      const fetchKeys = Array.from(keysToFetch);
      const values = await Promise.all(fetchKeys.map((k) => RedisService.get(k)));
      fetchKeys.forEach((key, index) => {
        const valueRaw = values[index];
        const numericValue = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw ?? 0);
        keyValueMap.set(key, Number.isFinite(numericValue) ? numericValue : 0);
      });
    }

    const matchesSegmentFilters = (segments: { gender: string; platform: string; signupSource: string; campaignId: string }): boolean => {
      if (filtersNormalized.genders && !filtersNormalized.genders.includes(segments.gender)) {
        return false;
      }
      if (filtersNormalized.platforms && !filtersNormalized.platforms.includes(segments.platform)) {
        return false;
      }
      if (filtersNormalized.signupSources && !filtersNormalized.signupSources.includes(segments.signupSource)) {
        return false;
      }
      if (filtersNormalized.campaigns && !filtersNormalized.campaigns.includes(segments.campaignId)) {
        return false;
      }
      return true;
    };

    const summaries: AnalyticsEventSummary[] = [];

    for (const eventType of eventTypes) {
      const hasBaseData = dateKeys.some((date) => baseKeyMap.has(`${eventType}|${date}`));
      const hasComboData = dateKeys.some((date) => (comboKeyMap.get(`${eventType}|${date}`)?.length ?? 0) > 0);

      if (!hasBaseData && !hasComboData) {
        continue;
      }

      const summary: AnalyticsEventSummary = {
        type: eventType,
        total: 0,
        daily: []
      };

      for (const date of dateKeys) {
        const mapKey = `${eventType}|${date}`;
        let dayCount = 0;

        if (!filtersApplied) {
          const baseKey = baseKeyMap.get(mapKey);
          if (baseKey) {
            dayCount = keyValueMap.get(baseKey) ?? 0;
          } else {
            const combos = comboKeyMap.get(mapKey) ?? [];
            dayCount = combos.reduce((acc, combo) => acc + (keyValueMap.get(combo.key) ?? 0), 0);
          }
        } else {
          const combos = comboKeyMap.get(mapKey) ?? [];
          if (combos.length > 0) {
            for (const combo of combos) {
              if (matchesSegmentFilters(combo.segments)) {
                dayCount += keyValueMap.get(combo.key) ?? 0;
              }
            }
          }
        }

        summary.total += dayCount;
        summary.daily.push({ date, count: dayCount });
      }

      summary.daily.sort((a, b) => a.date.localeCompare(b.date));
      summaries.push(summary);
    }

    return summaries;
  }
}
