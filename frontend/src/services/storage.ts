// Storage Service for Omegoo Frontend

class StorageService {
  // Token management
  setToken(token: string): void {
    localStorage.setItem('omegoo_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('omegoo_token');
  }

  removeToken(): void {
    localStorage.removeItem('omegoo_token');
  }

  // Terms acceptance
  setHasAcceptedTerms(accepted: boolean): void {
    localStorage.setItem('omegoo_terms_accepted', JSON.stringify(accepted));
  }

  getHasAcceptedTerms(): boolean {
    const stored = localStorage.getItem('omegoo_terms_accepted');
    return stored ? JSON.parse(stored) : false;
  }

  // User preferences
  setUserPreferences(preferences: any): void {
    localStorage.setItem('omegoo_preferences', JSON.stringify(preferences));
  }

  getUserPreferences(): any {
    const stored = localStorage.getItem('omegoo_preferences');
    return stored ? JSON.parse(stored) : null;
  }

  // Device ID
  setDeviceId(deviceId: string): void {
    localStorage.setItem('omegoo_device_id', deviceId);
  }

  getDeviceId(): string | null {
    return localStorage.getItem('omegoo_device_id');
  }

  // Generate device ID if not exists
  getOrCreateDeviceId(): string {
    let deviceId = this.getDeviceId();
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      this.setDeviceId(deviceId);
    }
    return deviceId;
  }

  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Chat history (temporary storage)
  setChatHistory(sessionId: string, messages: any[]): void {
    sessionStorage.setItem(`omegoo_chat_${sessionId}`, JSON.stringify(messages));
  }

  getChatHistory(sessionId: string): any[] {
    const stored = sessionStorage.getItem(`omegoo_chat_${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  }

  clearChatHistory(sessionId: string): void {
    sessionStorage.removeItem(`omegoo_chat_${sessionId}`);
  }

  // Onboarding state
  setOnboardingComplete(complete: boolean): void {
    localStorage.setItem('omegoo_onboarding_complete', JSON.stringify(complete));
  }

  getOnboardingComplete(): boolean {
    const stored = localStorage.getItem('omegoo_onboarding_complete');
    return stored ? JSON.parse(stored) : false;
  }

  // Privacy settings
  setPrivacySettings(settings: any): void {
    localStorage.setItem('omegoo_privacy_settings', JSON.stringify(settings));
  }

  getPrivacySettings(): any {
    const stored = localStorage.getItem('omegoo_privacy_settings');
    return stored ? JSON.parse(stored) : {
      allowAudio: true,
      allowVideo: false,
      shareLocation: false,
      receiveNotifications: true
    };
  }

  // Report cooldown tracking
  setLastReportTime(timestamp: number): void {
    localStorage.setItem('omegoo_last_report', timestamp.toString());
  }

  getLastReportTime(): number {
    const stored = localStorage.getItem('omegoo_last_report');
    return stored ? parseInt(stored, 10) : 0;
  }

  canReport(): boolean {
    const lastReport = this.getLastReportTime();
    const cooldownMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastReport > cooldownMs;
  }

  // Session management
  setLastActiveTime(): void {
    localStorage.setItem('omegoo_last_active', Date.now().toString());
  }

  getLastActiveTime(): number {
    const stored = localStorage.getItem('omegoo_last_active');
    return stored ? parseInt(stored, 10) : 0;
  }

  // Clear all data (logout/account deletion)
  clearAll(): void {
    const keysToKeep = ['omegoo_terms_accepted', 'omegoo_device_id'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (key.startsWith('omegoo_') && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('omegoo_')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Analytics opt-out
  setAnalyticsOptOut(optOut: boolean): void {
    localStorage.setItem('omegoo_analytics_opt_out', JSON.stringify(optOut));
  }

  getAnalyticsOptOut(): boolean {
    const stored = localStorage.getItem('omegoo_analytics_opt_out');
    return stored ? JSON.parse(stored) : false;
  }

  // PWA install tracking
  setPWAInstalled(installed: boolean): void {
    localStorage.setItem('omegoo_pwa_installed', JSON.stringify(installed));
  }

  getPWAInstalled(): boolean {
    const stored = localStorage.getItem('omegoo_pwa_installed');
    return stored ? JSON.parse(stored) : false;
  }

  // Feature flags (for A/B testing)
  setFeatureFlags(flags: Record<string, boolean>): void {
    localStorage.setItem('omegoo_feature_flags', JSON.stringify(flags));
  }

  getFeatureFlags(): Record<string, boolean> {
    const stored = localStorage.getItem('omegoo_feature_flags');
    return stored ? JSON.parse(stored) : {};
  }

  getFeatureFlag(flag: string): boolean {
    const flags = this.getFeatureFlags();
    return flags[flag] || false;
  }
}

export const storageService = new StorageService();
export default storageService;