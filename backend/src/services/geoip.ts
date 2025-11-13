import type { Request } from 'express';
import geoip from 'geoip-lite';

export interface AcquisitionMetadata {
  signupCountryCode?: string;
  signupCountryName?: string;
  signupRegionCode?: string;
  signupRegionName?: string;
  signupSubdivisionCode?: string;
  signupCity?: string;
  signupLatitude?: number;
  signupLongitude?: number;
  signupAccuracyRadius?: number;
  referrerUrl?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface TrackingOverrides {
  referrer?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface TrackingPayloadResult {
  tracking: TrackingOverrides;
  signupSource?: string;
  campaignId?: string;
}

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i
];

const REGION_DISPLAY = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch (error) {
    return null;
  }
})();

const cleanString = (value?: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeCode = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.toUpperCase();
};

const isPrivateIp = (ip?: string | null): boolean => {
  if (!ip) {
    return true;
  }
  return PRIVATE_IP_RANGES.some((regex) => regex.test(ip));
};

const toDisplayName = (code?: string): string | undefined => {
  if (!code) {
    return undefined;
  }
  try {
    return REGION_DISPLAY?.of(code) || undefined;
  } catch (error) {
    return undefined;
  }
};

const resolveCountryName = (countryCode?: string): string | undefined => {
  if (!countryCode) {
    return undefined;
  }
  return toDisplayName(countryCode) || countryCode;
};

const resolveRegionName = (
  countryCode?: string,
  regionCode?: string,
  explicitSubdivision?: string
): { regionCode?: string; subdivisionCode?: string; regionName?: string } => {
  const normalizedCountry = normalizeCode(countryCode);
  const normalizedRegion = normalizeCode(regionCode);
  const normalizedSubdivision = normalizeCode(explicitSubdivision);

  if (!normalizedCountry && !normalizedSubdivision) {
    return {};
  }

  const subdivisionCode = normalizedSubdivision || (normalizedCountry && normalizedRegion ? `${normalizedCountry}-${normalizedRegion}` : undefined);

  if (!subdivisionCode) {
    return {
      regionCode: normalizedRegion,
      subdivisionCode: undefined,
      regionName: normalizedRegion ? normalizedRegion : undefined
    };
  }

  return {
    regionCode: normalizedRegion,
    subdivisionCode,
    regionName: toDisplayName(subdivisionCode) || toDisplayName(normalizedRegion || undefined) || normalizedRegion || subdivisionCode
  };
};

const parseReferrer = (referrer?: string, fallbackDomain?: string): { referrerUrl?: string; referrerDomain?: string } => {
  const cleanedReferrer = cleanString(referrer);
  const cleanedDomain = cleanString(fallbackDomain);

  if (!cleanedReferrer && cleanedDomain) {
    return {
      referrerUrl: undefined,
      referrerDomain: cleanedDomain
    };
  }

  if (!cleanedReferrer) {
    return {
      referrerUrl: undefined,
      referrerDomain: undefined
    };
  }

  try {
    const url = new URL(cleanedReferrer);
    const hostname = url.hostname.replace(/^www\./i, '');
    return {
      referrerUrl: url.toString(),
      referrerDomain: hostname || cleanedDomain
    };
  } catch (error) {
    return {
      referrerUrl: cleanedReferrer,
      referrerDomain: cleanedDomain || cleanedReferrer.replace(/^https?:\/\//i, '')
    };
  }
};

const parseIpHeaderList = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .join(',')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const resolveClientIp = (req: Request): { ip?: string; source: string } => {
  const headersToInspect: Array<{ header: string; value: string | string[] | undefined }> = [
    { header: 'cf-connecting-ip', value: req.headers['cf-connecting-ip'] as string | undefined },
    { header: 'x-client-ip', value: req.headers['x-client-ip'] as string | undefined },
    { header: 'x-forwarded-for', value: req.headers['x-forwarded-for'] },
    { header: 'x-real-ip', value: req.headers['x-real-ip'] as string | undefined }
  ];

  for (const entry of headersToInspect) {
    const ips = parseIpHeaderList(entry.value);
    for (const candidate of ips) {
      if (!isPrivateIp(candidate)) {
        return { ip: candidate, source: entry.header };
      }
    }
  }

  const directIp = cleanString(req.ip);
  if (directIp && !isPrivateIp(directIp)) {
    return { ip: directIp, source: 'request-ip' };
  }

  return { ip: undefined, source: 'unknown' };
};

const normalizeTrackingObject = (input: any, prefix?: string): TrackingOverrides => {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const tracking: TrackingOverrides = {};
  const read = (key: string): string | undefined => {
    const value = input[key] ?? (prefix ? input[`${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`] : undefined);
    return cleanString(value);
  };

  const referrer = read('referrer');
  if (referrer) {
    tracking.referrer = referrer;
  }

  const refDomain = read('referrerDomain');
  if (refDomain) {
    tracking.referrerDomain = refDomain;
  }

  const utmSource = read('utmSource') ?? read('source');
  if (utmSource) {
    tracking.utmSource = utmSource;
  }

  const utmMedium = read('utmMedium') ?? read('medium');
  if (utmMedium) {
    tracking.utmMedium = utmMedium;
  }

  const utmCampaign = read('utmCampaign') ?? read('campaign');
  if (utmCampaign) {
    tracking.utmCampaign = utmCampaign;
  }

  const utmTerm = read('utmTerm') ?? read('term');
  if (utmTerm) {
    tracking.utmTerm = utmTerm;
  }

  const utmContent = read('utmContent') ?? read('content');
  if (utmContent) {
    tracking.utmContent = utmContent;
  }

  return tracking;
};

export class GeoIPService {
  static parseTrackingPayload(input: any): TrackingPayloadResult {
    if (!input || typeof input !== 'object') {
      return { tracking: {} };
    }

    const tracking: TrackingOverrides = {
      ...normalizeTrackingObject(input),
      ...normalizeTrackingObject(input.utm, 'utm')
    };

    const signupSource = cleanString(input.signupSource ?? input.source);
    const campaignId = cleanString(input.campaignId ?? input.campaign ?? tracking.utmCampaign);

    return {
      tracking,
      signupSource,
      campaignId
    };
  }

  static extractAcquisition(req: Request, overrides: TrackingOverrides = {}): AcquisitionMetadata {
    const { ip, source } = resolveClientIp(req);
    const lookup = ip ? geoip.lookup(ip) : null;

    const countryCode = normalizeCode(lookup?.country);
    const regionCode = normalizeCode(lookup?.region);
    const subdivisionCode = normalizeCode((lookup as any)?.subdivisions?.[0]);
    const { regionCode: resolvedRegionCode, subdivisionCode: resolvedSubdivision, regionName } = resolveRegionName(
      countryCode,
      regionCode,
      subdivisionCode
    );

    const [latitude, longitude] = Array.isArray(lookup?.ll) ? lookup!.ll : [undefined, undefined];

    const headerReferrer = cleanString(req.get('referer'));
    const { referrerUrl, referrerDomain } = parseReferrer(
      overrides.referrer ?? headerReferrer,
      overrides.referrerDomain
    );

    return {
      signupCountryCode: countryCode,
      signupCountryName: resolveCountryName(countryCode),
      signupRegionCode: resolvedRegionCode,
      signupRegionName: regionName,
      signupSubdivisionCode: resolvedSubdivision,
      signupCity: cleanString((lookup as any)?.city),
      signupLatitude: typeof latitude === 'number' ? latitude : undefined,
      signupLongitude: typeof longitude === 'number' ? longitude : undefined,
      signupAccuracyRadius: typeof (lookup as any)?.area === 'number' ? (lookup as any).area : undefined,
      referrerUrl,
      referrerDomain,
      utmSource: cleanString(overrides.utmSource),
      utmMedium: cleanString(overrides.utmMedium),
      utmCampaign: cleanString(overrides.utmCampaign),
      utmTerm: cleanString(overrides.utmTerm),
      utmContent: cleanString(overrides.utmContent)
    };
  }
}
