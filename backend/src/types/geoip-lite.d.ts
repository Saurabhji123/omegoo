declare module 'geoip-lite' {
  export type GeoLookup = {
    range?: [number, number];
    country?: string;
    region?: string;
    eu?: string;
    timezone?: string;
    city?: string;
    ll?: [number, number];
    metro?: number;
    area?: number;
  } | null;

  export interface GeoIpLite {
    lookup(ip: string): GeoLookup;
    lookup6(ip: string): GeoLookup;
    startWatcher(): void;
    stopWatcher(): void;
  }

  const geoip: GeoIpLite;
  export default geoip;
  export function lookup(ip: string): GeoLookup;
  export function lookup6(ip: string): GeoLookup;
  export function startWatcher(): void;
  export function stopWatcher(): void;
}
