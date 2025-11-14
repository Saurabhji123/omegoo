const REALTIME_SAMPLE_INTERVAL_MS = 60 * 1000;
const REALTIME_SAMPLE_HISTORY = 30;

type EntryBucket = {
  minute: number;
  userIds: Set<string>;
};

export interface RealtimeEntryPoint {
  minute: string;
  entries: number;
}

export class RealtimeUserTracker {
  private static buckets: EntryBucket[] = [];

  static recordUserEntry(userId: string, referenceDate: Date = new Date()): void {
    if (!userId) {
      return;
    }

    const minuteBucket = Math.floor(referenceDate.getTime() / REALTIME_SAMPLE_INTERVAL_MS) * REALTIME_SAMPLE_INTERVAL_MS;
    let bucket = this.buckets.find((entry) => entry.minute === minuteBucket);

    if (!bucket) {
      bucket = { minute: minuteBucket, userIds: new Set<string>() };
      this.buckets.push(bucket);
    }

    bucket.userIds.add(userId);
    this.pruneBuckets(minuteBucket);
  }

  static getSeries(referenceDate: Date = new Date()): RealtimeEntryPoint[] {
    const baselineMinute = Math.floor(referenceDate.getTime() / REALTIME_SAMPLE_INTERVAL_MS) * REALTIME_SAMPLE_INTERVAL_MS;
    const bucketMap = new Map<number, EntryBucket>(this.buckets.map((bucket) => [bucket.minute, bucket]));
    const series: RealtimeEntryPoint[] = [];

    for (let offset = REALTIME_SAMPLE_HISTORY - 1; offset >= 0; offset -= 1) {
      const minute = baselineMinute - offset * REALTIME_SAMPLE_INTERVAL_MS;
      const bucket = bucketMap.get(minute);
      const entries = bucket ? bucket.userIds.size : 0;

      series.push({
        minute: new Date(minute).toISOString(),
        entries
      });
    }

    return series;
  }

  private static pruneBuckets(currentMinute: number): void {
    const cutoff = currentMinute - (REALTIME_SAMPLE_HISTORY - 1) * REALTIME_SAMPLE_INTERVAL_MS;
    this.buckets = this.buckets.filter((bucket) => bucket.minute >= cutoff);
  }
}

export const REALTIME_ENTRY_INTERVAL_MS = REALTIME_SAMPLE_INTERVAL_MS;
export const REALTIME_ENTRY_HISTORY = REALTIME_SAMPLE_HISTORY;
