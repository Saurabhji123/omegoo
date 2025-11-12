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
}

const INCIDENT_KEY = 'status:incident:current';
const INCIDENT_DEFAULT_TTL_SECONDS = 60 * 60 * 6; // 6 hours
const INCIDENT_MAX_TTL_SECONDS = 60 * 60 * 48; // 48 hours buffer for scheduled incidents

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

    return {
      uptimeSeconds,
      serverTime: new Date().toISOString(),
      connectedUsers: SocketService.getConnectedUserCount(),
      queue: queueStats,
      activeIncident,
      upcomingIncident,
      lastUpdated: new Date().toISOString()
    };
  }
}
