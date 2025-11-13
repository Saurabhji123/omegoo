import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export type AcquisitionRegionBreakdown = {
  regionCode?: string;
  subdivisionCode?: string;
  name: string;
  signups: number;
  share: number;
};

export type AcquisitionMapCountry = {
  countryCode: string;
  name: string;
  signups: number;
  share: number;
  regions: AcquisitionRegionBreakdown[];
};

export type AcquisitionMapSummary = {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totalSignups: number;
  unknown: number;
  countries: AcquisitionMapCountry[];
};

export type AcquisitionSourceEntry = {
  source: string;
  medium?: string;
  campaign?: string;
  signups: number;
  share: number;
  previousSignups?: number;
  trendDelta?: number;
};

export type AcquisitionSourcesSummary = {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totalSignups: number;
  uniqueSources: number;
  unknown: number;
  sources: AcquisitionSourceEntry[];
};

type AcquisitionAnalyticsProps = {
  map: AcquisitionMapSummary | null;
  sources: AcquisitionSourcesSummary | null;
  loading: boolean;
  mapError: string | null;
  sourcesError: string | null;
  onRetry: () => void;
  onSelectCountry: (countryCode: string | null) => void;
  selectedCountry: string | null;
  rangeLabel: string;
};

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type SimpleMapFeature = {
  rsmKey: string;
  properties?: {
    ISO_A2?: string;
    NAME?: string;
    ADMIN?: string;
    [key: string]: unknown;
  };
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const formatSourceLabel = (entry: AcquisitionSourceEntry): string => {
  const parts = [entry.source];
  if (entry.medium) {
    parts.push(entry.medium);
  }
  if (entry.campaign) {
    parts.push(entry.campaign);
  }
  return parts.join(' - ');
};

const AcquisitionAnalytics: React.FC<AcquisitionAnalyticsProps> = ({
  map,
  sources,
  loading,
  mapError,
  sourcesError,
  onRetry,
  onSelectCountry,
  selectedCountry,
  rangeLabel
}) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const countriesByCode = useMemo(() => {
    const lookup = new Map<string, AcquisitionMapCountry>();
    if (map) {
      map.countries.forEach((country) => {
        lookup.set(country.countryCode.toUpperCase(), country);
      });
    }
    return lookup;
  }, [map]);

  const maxShare = useMemo(() => {
    if (!map || map.countries.length === 0) {
      return 0;
    }
    return map.countries.reduce((acc, country) => Math.max(acc, country.share), 0);
  }, [map]);

  const hasMapData = Boolean(map && map.countries.length > 0);

  const topCountries = useMemo(() => {
    if (!map || map.countries.length === 0) {
      return [];
    }
    return map.countries.slice(0, 8);
  }, [map]);

  const topSources = useMemo(() => {
    if (!sources) {
      return [];
    }
    return sources.sources.slice(0, 10);
  }, [sources]);

  const selectedMetrics = selectedCountry ? countriesByCode.get(selectedCountry.toUpperCase()) || null : null;
  const hoveredMetrics = hoveredCountry ? countriesByCode.get(hoveredCountry.toUpperCase()) || null : null;

  const currentRangeLabel = useMemo(() => {
    if (map?.window) {
      return `${map.window.start} → ${map.window.end}`;
    }
    if (sources?.window) {
      return `${sources.window.start} → ${sources.window.end}`;
    }
    return rangeLabel;
  }, [map, rangeLabel, sources]);

  const computeFill = (share: number): string => {
    if (!maxShare || share <= 0) {
      return '#0f172a';
    }
    const intensity = Math.min(1, Math.max(0, share / maxShare));
    const base = 99; // base indigo hue (rgb: 99, 102, 241)
    const green = 102;
    const blue = 241;
    const alpha = 0.25 + intensity * 0.6;
    return `rgba(${base}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
  };

  const showEmptyMapState = !loading && !mapError && !hasMapData;

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-lg shadow-indigo-950/30 transition hover:border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Acquisition map</h3>
            <p className="text-xs uppercase tracking-wide text-white/50">Signup distribution by country</p>
          </div>
          <div className="text-right text-[11px] uppercase tracking-wide text-white/50">{currentRangeLabel}</div>
        </div>

        {loading && (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-8 text-white/60">
            <LoadingSpinner message="Loading acquisition analytics" />
          </div>
        )}

        {!loading && mapError && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">
            <p>{mapError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-full border border-red-300/40 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
            >
              Retry request
            </button>
          </div>
        )}

        {showEmptyMapState && (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
            No acquisition data available for this window yet.
          </div>
        )}

        {!loading && !mapError && hasMapData && map && (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
              <div className="rounded-2xl border border-white/10 bg-black/40">
                <div className="h-[420px] w-full">
                  <ComposableMap
                    projectionConfig={{ scale: 120 }}
                    width={960}
                    height={420}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }: { geographies: SimpleMapFeature[] }) =>
                        geographies.map((geo) => {
                          const isoCode = typeof geo.properties?.ISO_A2 === 'string' ? geo.properties.ISO_A2.toUpperCase() : '';
                          if (!isoCode || isoCode === '-99') {
                            return null;
                          }
                          const metrics = countriesByCode.get(isoCode) || null;
                          const titleParts: string[] = [];
                          if (metrics) {
                            titleParts.push(`${metrics.name || isoCode}`);
                            titleParts.push(`${metrics.signups.toLocaleString()} signups`);
                            titleParts.push(formatPercent(metrics.share));
                          } else if (typeof geo.properties?.NAME === 'string') {
                            titleParts.push(`${geo.properties.NAME}`);
                            titleParts.push('No data');
                          }

                          const isSelected = selectedCountry?.toUpperCase() === isoCode;
                          const isHovered = hoveredCountry?.toUpperCase() === isoCode;

                          const fill = isSelected
                            ? 'rgba(129, 140, 248, 0.9)'
                            : isHovered
                              ? 'rgba(129, 140, 248, 0.7)'
                              : metrics
                                ? computeFill(metrics.share)
                                : '#111827';

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo as unknown as Record<string, unknown>}
                              fill={fill}
                              stroke="#0f172a"
                              strokeWidth={0.4}
                              onMouseEnter={() => {
                                setHoveredCountry(isoCode);
                              }}
                              onMouseLeave={() => {
                                setHoveredCountry((current) => (current === isoCode ? null : current));
                              }}
                              onClick={() => {
                                if (metrics) {
                                  onSelectCountry(isSelected ? null : isoCode);
                                }
                              }}
                              style={{
                                default: { outline: 'none', transition: 'fill 200ms ease-out' },
                                hover: { outline: 'none' },
                                pressed: { outline: 'none' }
                              }}
                              title={titleParts.join(' - ')}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <h4 className="text-sm font-semibold text-white">Top countries</h4>
                <p className="text-[11px] uppercase tracking-wide text-white/40">Share of total signups</p>
                <div className="mt-3 space-y-3">
                  {topCountries.map((country) => (
                    <button
                      key={country.countryCode}
                      type="button"
                      onClick={() => onSelectCountry(selectedCountry?.toUpperCase() === country.countryCode.toUpperCase() ? null : country.countryCode)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition hover:border-white/40 ${
                        selectedCountry?.toUpperCase() === country.countryCode.toUpperCase()
                          ? 'border-indigo-400/70 bg-indigo-500/20 text-white'
                          : 'border-white/10 bg-black/40 text-white/80'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {country.name}
                          <span className="ml-2 text-xs uppercase tracking-wide text-white/60">{country.countryCode}</span>
                        </p>
                        <p className="text-xs text-white/60">{country.signups.toLocaleString()} signups</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatPercent(country.share)}</span>
                    </button>
                  ))}
                  {map.countries.length === 0 && (
                    <p className="text-sm text-white/60">No country data available.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <h4 className="text-sm font-semibold text-white">Window totals</h4>
                <p className="text-[11px] uppercase tracking-wide text-white/40">Signups captured in this range</p>
                <dl className="mt-3 space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                    <dt>Total signups</dt>
                    <dd className="font-semibold text-white">{map.totalSignups.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                    <dt>Unknown geolocation</dt>
                    <dd className="font-semibold text-white">{map.unknown.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                    <dt>Tracked days</dt>
                    <dd className="font-semibold text-white">{map.window.days}</dd>
                  </div>
                </dl>
                {hoveredMetrics && (
                  <div className="mt-3 rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100/90">
                    <p>
                      {hoveredMetrics.name} - {hoveredMetrics.signups.toLocaleString()} signups - {formatPercent(hoveredMetrics.share)} share
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedMetrics && (
              <div className="mt-4 rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{selectedMetrics.name}</h4>
                    <p className="text-[11px] uppercase tracking-wide text-indigo-100/70">{selectedMetrics.countryCode} - {formatPercent(selectedMetrics.share)} of total</p>
                  </div>
                  <div className="text-right text-sm font-semibold text-white">
                    {selectedMetrics.signups.toLocaleString()} signups
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  {selectedMetrics.regions.length > 0 ? (
                    <table className="min-w-full table-fixed border-separate border-spacing-y-2 text-left text-sm text-white/80">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-xs uppercase tracking-wide text-indigo-100/70">Region</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-indigo-100/70">Signups</th>
                          <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-indigo-100/70">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMetrics.regions.map((region) => (
                          <tr key={`${selectedMetrics.countryCode}-${region.subdivisionCode || region.regionCode || region.name}`} className="rounded-xl border border-indigo-200/30 bg-indigo-500/10">
                            <td className="px-3 py-2 text-sm font-semibold text-white">{region.name}</td>
                            <td className="px-3 py-2 text-right font-mono text-sm text-white/80">{region.signups.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-sm font-semibold text-white">{formatPercent(region.share)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/70">
                      No region detail available for this country yet.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCountry(null)}
                  className="mt-3 rounded-full border border-white/20 bg-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/40"
                >
                  Clear selection
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-lg shadow-purple-950/30 transition hover:border-white/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Top acquisition sources</h3>
              <p className="text-xs uppercase tracking-wide text-white/50">Source - medium - campaign</p>
            </div>
            <div className="text-right text-[11px] uppercase tracking-wide text-white/50">{currentRangeLabel}</div>
          </div>

          {loading && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-8 text-white/60">
              <LoadingSpinner message="Loading source rankings" />
            </div>
          )}

            {!loading && sourcesError && (
            <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">
                <p>{sourcesError}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-full border border-red-300/40 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
              >
                Retry request
              </button>
            </div>
          )}

          {!loading && !sourcesError && (!sources || sources.sources.length === 0) && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
              No tracked sources yet.
            </div>
          )}

          {!loading && !sourcesError && sources && sources.sources.length > 0 && (
            <div className="mt-6 space-y-3">
              {topSources.map((entry, index) => {
                const trendLabel = typeof entry.trendDelta === 'number' ? `${entry.trendDelta >= 0 ? '+' : ''}${entry.trendDelta.toFixed(1)}%` : '—';
                const previousLabel = typeof entry.previousSignups === 'number' ? `${entry.previousSignups.toLocaleString()} prev` : '—';
                return (
                  <div
                    key={`${entry.source}-${entry.medium || 'all'}-${entry.campaign || 'all'}`}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-100/90">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-white">{formatSourceLabel(entry)}</span>
                      </div>
                      <div className="text-right text-xs uppercase tracking-wide text-white/50">
                        <p>{entry.signups.toLocaleString()} signups</p>
                        <p>{formatPercent(entry.share)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide text-white/50">
                      <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2 py-0.5 text-purple-100/80">{trendLabel} vs prior window</span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-white/70">{previousLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !sourcesError && sources && (
            <dl className="mt-6 space-y-2 text-sm text-white/80">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                <dt>Total sources</dt>
                <dd className="font-semibold text-white">{sources.uniqueSources.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                <dt>Unknown sources</dt>
                <dd className="font-semibold text-white">{sources.unknown.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                <dt>Total signups</dt>
                <dd className="font-semibold text-white">{sources.totalSignups.toLocaleString()}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcquisitionAnalytics;
