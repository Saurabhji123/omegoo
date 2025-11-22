/**
 * Type declarations for @fingerprintjs/fingerprintjs
 * This resolves TypeScript module resolution issues
 */

declare module '@fingerprintjs/fingerprintjs' {
  export interface LoadOptions {
    monitoring?: boolean;
    delayFallback?: number;
  }

  export interface GetResult {
    visitorId: string;
    confidence: {
      score: number;
    };
    components: Record<string, any>;
  }

  export interface Agent {
    get(options?: { extendedResult?: boolean }): Promise<GetResult>;
  }

  export interface FingerprintJS {
    load(options?: LoadOptions): Promise<Agent>;
  }

  const FingerprintJS: FingerprintJS;
  export default FingerprintJS;
}
