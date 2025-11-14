import { RedisService } from './serviceFactory';
import { SocketService } from './socket';

export type IncidentSeverity = 'info' | 'warning' | 'critical';

export interface ActiveIncident {
  message: string;
  severity: IncidentSeverity;
  startedAt: string;
  updatedAt: string;
  fallbackUrl?: string;
  publishAt?: string;
  expiresAt?: string;
  requiresAck?: boolean;
  audience?: 'all' | 'web' | 'mobile';
}

export interface RealtimeUserPoint {
  minute: string;
  connected: number;
}

export interface StatusSummary {
  uptimeSeconds: number;
  serverTime: string;
  connectedUsers: number;
  queue: {
    text: number;
    audio: number;
    video: number;
    total: number;
  };
  activeIncident: ActiveIncident | null;
  upcomingIncident: ActiveIncident | null;
  lastUpdated: string;
  realtimeUsers: RealtimeUserPoint[];
}

const INCIDENT_KEY = 'status:incident:current';
const INCIDENT_DEFAULT_TTL_SECONDS = 60 * 60 * 6; // 6 hours
const INCIDENT_MAX_TTL_SECONDS = 60 * 60 * 48; // 48 hours buffer for scheduled incidents
const REALTIME_SAMPLE_INTERVAL_MS = 60 * 1000;
const REALTIME_SAMPLE_HISTORY = 30; // 30 minutes of history

const parseDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isIncidentLive = (incident: ActiveIncident, now = new Date()): boolean => {
  const publishAt = parseDate(incident.publishAt);
  if (publishAt && publishAt.getTime() > now.getTime()) {
    return false;
  }

  const expiresAt = parseDate(incident.expiresAt);
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return false;
  }

  return true;
};

export class StatusService {
  private static realtimeSamples: Array<{ minute: number; connected: number }> = [];
  private static realtimeSampler: NodeJS.Timeout | null = null;

  private static async getIncidentRecord(): Promise<ActiveIncident | null> {
    const incident = await RedisService.get(INCIDENT_KEY);

    if (!incident) {
      const envIncident = process.env.ACTIVE_INCIDENT_MESSAGE;
      if (!envIncident) {
        return null;
      }

      return {
        message: envIncident,
        severity: (process.env.ACTIVE_INCIDENT_SEVERITY as IncidentSeverity) || 'info',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fallbackUrl: process.env.STATUS_PAGE_URL || undefined
      };
    }

    return incident as ActiveIncident;
  }

  static async getActiveIncident(): Promise<ActiveIncident | null> {
    const incident = await this.getIncidentRecord();
    if (!incident) {
      return null;
    }

    if (!isIncidentLive(incident)) {
      return null;
    }

    return incident;
  }

  static async setActiveIncident(incident: ActiveIncident | null): Promise<void> {
    if (!incident) {
      await RedisService.del(INCIDENT_KEY);
      return;
    }

    const now = Date.now();
    const publishAt = parseDate(incident.publishAt)?.getTime() ?? now;
    const expiresAt = parseDate(incident.expiresAt)?.getTime() ?? (now + INCIDENT_DEFAULT_TTL_SECONDS * 1000);
    const ttlMs = Math.max(expiresAt - now, INCIDENT_DEFAULT_TTL_SECONDS * 1000);
    const boundedTtlSeconds = Math.min(Math.ceil(ttlMs / 1000), INCIDENT_MAX_TTL_SECONDS);

    await RedisService.set(INCIDENT_KEY, incident, boundedTtlSeconds);
  }

  private static startRealtimeSampler(): void {
    if (this.realtimeSampler) {
      return;
    }

    this.realtimeSampler = setInterval(() => {
      this.recordRealtimeSample();
    }, REALTIME_SAMPLE_INTERVAL_MS);

    this.realtimeSampler.unref?.();
  }

  private static recordRealtimeSample(referenceDate: Date = new Date()): void {
    const minuteBucket = Math.floor(referenceDate.getTime() / REALTIME_SAMPLE_INTERVAL_MS) * REALTIME_SAMPLE_INTERVAL_MS;
    const connected = SocketService.getConnectedUserCount();
    const existingIndex = this.realtimeSamples.findIndex((entry) => entry.minute === minuteBucket);

    if (existingIndex >= 0) {
      this.realtimeSamples[existingIndex] = { minute: minuteBucket, connected };
    } else {
      this.realtimeSamples.push({ minute: minuteBucket, connected });
    }

    this.realtimeSamples.sort((a, b) => a.minute - b.minute);

    const cutoff = minuteBucket - (REALTIME_SAMPLE_HISTORY - 1) * REALTIME_SAMPLE_INTERVAL_MS;
    this.realtimeSamples = this.realtimeSamples.filter((entry) => entry.minute >= cutoff);
  }

  private static getRealtimeSeries(referenceDate: Date = new Date()): RealtimeUserPoint[] {
    const baselineMinute = Math.floor(referenceDate.getTime() / REALTIME_SAMPLE_INTERVAL_MS) * REALTIME_SAMPLE_INTERVAL_MS;
    const sampleMap = new Map<number, number>(this.realtimeSamples.map((entry) => [entry.minute, entry.connected]));
    const series: RealtimeUserPoint[] = [];
    let lastValue = 0;

    for (let offset = REALTIME_SAMPLE_HISTORY - 1; offset >= 0; offset -= 1) {
      const minute = baselineMinute - offset * REALTIME_SAMPLE_INTERVAL_MS;
      if (sampleMap.has(minute)) {
        lastValue = sampleMap.get(minute) ?? lastValue;
      }

      series.push({
        minute: new Date(minute).toISOString(),
        connected: Math.max(0, lastValue)
      });
    }

    return series;
  }

  static async getSummary(): Promise<StatusSummary> {
    const uptimeSeconds = Math.floor(process.uptime());
    const modePresence = SocketService.getModePresenceSnapshot();
    const queueStats = {
      text: modePresence.text,
      audio: modePresence.audio,
      video: modePresence.video,
      total: modePresence.text + modePresence.audio + modePresence.video
    };

    const rawIncident = await this.getIncidentRecord();
    const activeIncident = rawIncident && isIncidentLive(rawIncident) ? rawIncident : null;
    const upcomingIncident = rawIncident && !activeIncident ? rawIncident : null;

    this.startRealtimeSampler();
    this.recordRealtimeSample();

    return {
      uptimeSeconds,
      serverTime: new Date().toISOString(),
      connectedUsers: SocketService.getConnectedUserCount(),
      queue: queueStats,
      activeIncident,
      upcomingIncident,
      lastUpdated: new Date().toISOString(),
      realtimeUsers: this.getRealtimeSeries()
    };
  }
}
