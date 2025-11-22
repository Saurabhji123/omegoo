/**
 * Shadow Login Fingerprinting Utility
 * Generates a unique persistent guest ID using device fingerprinting
 * Privacy-focused: hashes device data, respects DNT, provides fallback
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

const STORAGE_KEY = 'neenv_guest_id_v1';
const DEVICE_META_KEY = 'neenv_device_meta_v1';
const FINGERPRINT_VERSION = '1.0';

export interface DeviceMeta {
  version: string;
  timestamp: number;
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  platform: string;
  doNotTrack: boolean;
  fingerprintMethod: 'fpjs' | 'basic' | 'random';
}

/**
 * Generates a unique guest ID using device fingerprinting
 * Falls back to random ID if fingerprinting fails or is blocked
 */
export async function generateGuestId(): Promise<string> {
  try {
    // Check if user has DNT enabled
    const doNotTrack = navigator.doNotTrack === '1' || 
                       (window as any).doNotTrack === '1' ||
                       (navigator as any).msDoNotTrack === '1';

    let guestId: string;
    let method: 'fpjs' | 'basic' | 'random';

    // Try FingerprintJS first (most reliable)
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      guestId = await hashString(result.visitorId + Date.now() + Math.random().toString(36));
      method = 'fpjs';
    } catch (fpError) {
      console.warn('FingerprintJS failed, falling back to basic fingerprint:', fpError);
      
      // Fallback: Basic fingerprint from browser features
      if (!doNotTrack) {
        const basicFingerprint = await generateBasicFingerprint();
        guestId = await hashString(basicFingerprint + Date.now() + Math.random().toString(36));
        method = 'basic';
      } else {
        // DNT enabled or fingerprint blocked: use random ID
        guestId = await hashString(crypto.randomUUID() + Date.now());
        method = 'random';
      }
    }

    // Store device metadata (privacy-safe, no raw data)
    const deviceMeta: DeviceMeta = {
      version: FINGERPRINT_VERSION,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100), // Truncate for privacy
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      platform: navigator.platform,
      doNotTrack: doNotTrack,
      fingerprintMethod: method,
    };

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, guestId);
    localStorage.setItem(DEVICE_META_KEY, JSON.stringify(deviceMeta));

    console.log('[Shadow Login] Guest ID generated:', guestId.substring(0, 12) + '...', 'Method:', method);
    return guestId;

  } catch (error) {
    console.error('[Shadow Login] Fingerprint generation failed:', error);
    // Ultimate fallback: pure random ID
    const fallbackId = await hashString(crypto.randomUUID() + Date.now());
    localStorage.setItem(STORAGE_KEY, fallbackId);
    return fallbackId;
  }
}

/**
 * Generates a basic fingerprint from browser features
 * Used as fallback when FingerprintJS fails
 */
async function generateBasicFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    window.screen.width + 'x' + window.screen.height,
    window.screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '0',
    (navigator as any).deviceMemory?.toString() || '0',
    navigator.maxTouchPoints?.toString() || '0',
    navigator.platform,
  ];

  // Add canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Omegoo 🌐', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Shadow Login', 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    console.warn('Canvas fingerprint failed:', e);
  }

  // Add WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch (e) {
    console.warn('WebGL fingerprint failed:', e);
  }

  return components.join('|');
}

/**
 * SHA-256 hash function for privacy-safe ID generation
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves existing guest ID from localStorage
 * Returns null if not found
 */
export function getGuestId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Gets or creates a guest ID
 * Checks localStorage first, generates new one if needed
 */
export async function ensureGuestId(): Promise<string> {
  let guestId = getGuestId();
  
  if (!guestId) {
    console.log('[Shadow Login] No existing guest ID, generating new one...');
    guestId = await generateGuestId();
  } else {
    console.log('[Shadow Login] Using existing guest ID:', guestId.substring(0, 12) + '...');
  }
  
  return guestId;
}

/**
 * Retrieves device metadata from localStorage
 */
export function getDeviceMeta(): DeviceMeta | null {
  try {
    const metaStr = localStorage.getItem(DEVICE_META_KEY);
    return metaStr ? JSON.parse(metaStr) : null;
  } catch (error) {
    console.error('[Shadow Login] Failed to parse device meta:', error);
    return null;
  }
}

/**
 * Resets guest identity by clearing localStorage and generating new ID
 * Used when user explicitly requests identity reset
 */
export async function resetGuestId(): Promise<string> {
  console.log('[Shadow Login] Resetting guest identity...');
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DEVICE_META_KEY);
  return await generateGuestId();
}

/**
 * Clears all guest data from localStorage
 * Used before account deletion or privacy reset
 */
export function clearGuestData(): void {
  console.log('[Shadow Login] Clearing all guest data...');
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DEVICE_META_KEY);
}

/**
 * Validates guest ID format
 */
export function isValidGuestId(guestId: string | null): boolean {
  if (!guestId) return false;
  // SHA-256 produces 64-character hex string
  return /^[a-f0-9]{64}$/i.test(guestId);
}

/**
 * Checks if browser supports required features
 */
export function isFingerprintSupported(): boolean {
  return !!(
    window.crypto &&
    window.crypto.subtle &&
    window.localStorage &&
    window.TextEncoder
  );
}

/**
 * Gets fingerprint initialization stats for debugging
 */
export function getFingerprintStats() {
  const guestId = getGuestId();
  const deviceMeta = getDeviceMeta();
  const supported = isFingerprintSupported();
  const valid = isValidGuestId(guestId);

  return {
    hasGuestId: !!guestId,
    guestIdValid: valid,
    guestIdPreview: guestId ? guestId.substring(0, 12) + '...' : null,
    deviceMeta,
    fingerprintSupported: supported,
    storageKey: STORAGE_KEY,
  };
}
