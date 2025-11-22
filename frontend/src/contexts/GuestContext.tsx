/**
 * Guest Context Provider
 * Manages shadow login lifecycle - auto-initializes guest ID on mount
 * Provides reset, delete, and stats functionality
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  ensureGuestId,
  getGuestId,
  resetGuestId,
  clearGuestData,
  getDeviceMeta,
  getFingerprintStats,
  isValidGuestId,
  DeviceMeta,
} from '../utils/fingerprint';

interface GuestContextType {
  guestId: string | null;
  deviceMeta: DeviceMeta | null;
  isInitialized: boolean;
  isGenerating: boolean;
  error: string | null;
  resetGuest: () => Promise<void>;
  deleteGuestData: () => void;
  refreshGuestId: () => Promise<void>;
  getStats: () => any;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within GuestProvider');
  }
  return context;
};

interface GuestProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

export const GuestProvider: React.FC<GuestProviderProps> = ({ 
  children, 
  autoInitialize = true 
}) => {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [deviceMeta, setDeviceMeta] = useState<DeviceMeta | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize guest ID on mount
   * Runs once when component mounts (DOMContentLoaded equivalent)
   */
  const initializeGuest = useCallback(async () => {
    if (isInitialized || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      console.log('[GuestContext] Initializing shadow login...');
      const startTime = performance.now();

      // Check for existing guest ID first
      let existingGuestId = getGuestId();
      
      if (existingGuestId && isValidGuestId(existingGuestId)) {
        // Valid existing guest ID found
        console.log('[GuestContext] Found valid existing guest ID');
        setGuestId(existingGuestId);
        setDeviceMeta(getDeviceMeta());
      } else {
        // Generate new guest ID
        console.log('[GuestContext] Generating new guest ID...');
        const newGuestId = await ensureGuestId();
        setGuestId(newGuestId);
        setDeviceMeta(getDeviceMeta());
      }

      const endTime = performance.now();
      const initTime = Math.round(endTime - startTime);
      
      console.log(`[GuestContext] Shadow login initialized in ${initTime}ms`);
      
      if (initTime > 2000) {
        console.warn('[GuestContext] Initialization took longer than 2s threshold');
      }

      setIsInitialized(true);
      setError(null);

    } catch (err) {
      console.error('[GuestContext] Failed to initialize guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize guest ID');
      setIsInitialized(false);
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized, isGenerating]);

  /**
   * Reset guest identity (generates new ID)
   */
  const resetGuest = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('[GuestContext] Resetting guest identity...');
      const newGuestId = await resetGuestId();
      setGuestId(newGuestId);
      setDeviceMeta(getDeviceMeta());
      console.log('[GuestContext] Guest identity reset successfully');
    } catch (err) {
      console.error('[GuestContext] Failed to reset guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset guest ID');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Delete all guest data from localStorage
   */
  const deleteGuestData = useCallback(() => {
    console.log('[GuestContext] Deleting guest data...');
    clearGuestData();
    setGuestId(null);
    setDeviceMeta(null);
    setIsInitialized(false);
    console.log('[GuestContext] Guest data deleted');
  }, []);

  /**
   * Refresh guest ID from localStorage
   */
  const refreshGuestId = useCallback(async () => {
    const currentGuestId = getGuestId();
    setGuestId(currentGuestId);
    setDeviceMeta(getDeviceMeta());
  }, []);

  /**
   * Get fingerprint stats for debugging
   */
  const getStats = useCallback(() => {
    return {
      ...getFingerprintStats(),
      isInitialized,
      isGenerating,
      error,
    };
  }, [isInitialized, isGenerating, error]);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInitialize && !isInitialized && !isGenerating) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeGuest();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoInitialize, isInitialized, isGenerating, initializeGuest]);

  /**
   * Listen for storage changes (multi-tab sync)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'neenv_guest_id_v1' && e.newValue !== guestId) {
        console.log('[GuestContext] Guest ID changed in another tab, syncing...');
        refreshGuestId();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [guestId, refreshGuestId]);

  const value: GuestContextType = {
    guestId,
    deviceMeta,
    isInitialized,
    isGenerating,
    error,
    resetGuest,
    deleteGuestData,
    refreshGuestId,
    getStats,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
};

export default GuestContext;
