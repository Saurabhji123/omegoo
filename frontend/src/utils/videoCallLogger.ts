/**
 * Video Call Logger
 * Privacy-safe diagnostic logging for video calls
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  event: string;
  details: Record<string, any>;
}

export class VideoCallLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 200; // Keep last 200 logs
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate unique session ID for this call
   */
  private generateSessionId(): string {
    return `vc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create log entry
   */
  private createLogEntry(level: LogLevel, category: string, event: string, details: Record<string, any> = {}): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      category,
      event,
      details: this.sanitizeDetails(details)
    };
  }

  /**
   * Sanitize log details to be privacy-safe
   * Removes PII and sensitive data
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      // Skip sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDetails(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if field contains sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'userId', 'email', 'phone', 'ip', 'address', 'location',
      'password', 'token', 'credential', 'secret', 'key'
    ];

    const lowerField = fieldName.toLowerCase();
    return sensitiveFields.some(sensitive => lowerField.includes(sensitive));
  }

  /**
   * Add log entry to history
   */
  private addLog(entry: LogEntry): void {
    if (!this.isEnabled) return;

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[VideoCall:${entry.category}]`;
      const message = `${entry.event}`;
      const data = Object.keys(entry.details).length > 0 ? entry.details : '';

      switch (entry.level) {
        case 'error':
          console.error(prefix, message, data);
          break;
        case 'warn':
          console.warn(prefix, message, data);
          break;
        default:
          console.log(prefix, message, data);
      }
    }
  }

  /**
   * Log ICE connection state change
   */
  logICEState(state: RTCIceConnectionState, details: Record<string, any> = {}): void {
    this.addLog(this.createLogEntry('info', 'ICE', `Connection state: ${state}`, {
      state,
      ...details
    }));
  }

  /**
   * Log ICE gathering state change
   */
  logICEGathering(state: RTCIceGatheringState, candidatesCount: number = 0): void {
    this.addLog(this.createLogEntry('info', 'ICE', `Gathering state: ${state}`, {
      state,
      candidatesCount
    }));
  }

  /**
   * Log ICE candidate
   */
  logICECandidate(candidate: RTCIceCandidate | null, isLocal: boolean): void {
    if (!candidate) {
      this.addLog(this.createLogEntry('info', 'ICE', 'Candidate gathering complete', {
        isLocal
      }));
      return;
    }

    this.addLog(this.createLogEntry('info', 'ICE', `New ${isLocal ? 'local' : 'remote'} candidate`, {
      type: candidate.type,
      protocol: candidate.protocol,
      isLocal
    }));
  }

  /**
   * Log peer connection state change
   */
  logPeerConnectionState(state: RTCPeerConnectionState): void {
    const level: LogLevel = state === 'failed' || state === 'disconnected' ? 'error' : 'info';
    
    this.addLog(this.createLogEntry(level, 'PeerConnection', `State: ${state}`, {
      state
    }));
  }

  /**
   * Log signaling state change
   */
  logSignalingState(state: RTCSignalingState): void {
    this.addLog(this.createLogEntry('info', 'Signaling', `State: ${state}`, {
      state
    }));
  }

  /**
   * Log video fallback to audio-only
   */
  logVideoFallback(reason: string, details: Record<string, any> = {}): void {
    this.addLog(this.createLogEntry('warn', 'Video', 'Fallback to audio-only', {
      reason,
      ...details
    }));
  }

  /**
   * Log resolution change
   */
  logResolutionChange(from: string, to: string, reason: string): void {
    this.addLog(this.createLogEntry('info', 'Resolution', `Changed: ${from} → ${to}`, {
      from,
      to,
      reason
    }));
  }

  /**
   * Log network degradation
   */
  logNetworkDegradation(quality: string, stats: Record<string, any>): void {
    this.addLog(this.createLogEntry('warn', 'Network', `Quality degraded to ${quality}`, {
      quality,
      rtt: stats.rtt,
      packetLoss: stats.packetLoss,
      bitrate: stats.bitrate
    }));
  }

  /**
   * Log network improvement
   */
  logNetworkImprovement(quality: string, stats: Record<string, any>): void {
    this.addLog(this.createLogEntry('info', 'Network', `Quality improved to ${quality}`, {
      quality,
      rtt: stats.rtt,
      packetLoss: stats.packetLoss,
      bitrate: stats.bitrate
    }));
  }

  /**
   * Log media track added
   */
  logTrackAdded(kind: string, isLocal: boolean): void {
    this.addLog(this.createLogEntry('info', 'Media', `${isLocal ? 'Local' : 'Remote'} ${kind} track added`, {
      kind,
      isLocal
    }));
  }

  /**
   * Log media track removed
   */
  logTrackRemoved(kind: string, isLocal: boolean): void {
    this.addLog(this.createLogEntry('info', 'Media', `${isLocal ? 'Local' : 'Remote'} ${kind} track removed`, {
      kind,
      isLocal
    }));
  }

  /**
   * Log getUserMedia success
   */
  logGetUserMediaSuccess(constraints: MediaStreamConstraints): void {
    this.addLog(this.createLogEntry('info', 'Media', 'getUserMedia success', {
      hasVideo: !!constraints.video,
      hasAudio: !!constraints.audio
    }));
  }

  /**
   * Log getUserMedia error
   */
  logGetUserMediaError(error: Error, constraints: MediaStreamConstraints): void {
    this.addLog(this.createLogEntry('error', 'Media', 'getUserMedia failed', {
      errorName: error.name,
      errorMessage: error.message,
      requestedVideo: !!constraints.video,
      requestedAudio: !!constraints.audio
    }));
  }

  /**
   * Log call start
   */
  logCallStart(mode: 'video' | 'audio'): void {
    this.addLog(this.createLogEntry('info', 'Call', `Call started (${mode})`, {
      mode,
      sessionId: this.sessionId
    }));
  }

  /**
   * Log call end
   */
  logCallEnd(duration: number, reason: string): void {
    this.addLog(this.createLogEntry('info', 'Call', `Call ended`, {
      durationMs: duration,
      reason,
      sessionId: this.sessionId
    }));
  }

  /**
   * Log generic error
   */
  logError(category: string, message: string, error: Error | unknown): void {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message
    } : {
      error: String(error)
    };

    this.addLog(this.createLogEntry('error', category, message, errorDetails));
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs from specific time range
   */
  getLogsInRange(startTime: number, endTime: number): LogEntry[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    const exportData = {
      sessionId: this.sessionId,
      exportedAt: Date.now(),
      totalLogs: this.logs.length,
      logs: this.logs
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export logs for diagnostics (formatted)
   */
  exportDiagnostics(): string {
    const lines: string[] = [
      `Video Call Diagnostics Report`,
      `Session ID: ${this.sessionId}`,
      `Generated: ${new Date().toISOString()}`,
      `Total Events: ${this.logs.length}`,
      ``,
      `Event Log:`,
      `${'='.repeat(80)}`
    ];

    this.logs.forEach(log => {
      const time = new Date(log.timestamp).toISOString();
      const level = log.level.toUpperCase().padEnd(5);
      const category = log.category.padEnd(15);
      const details = Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : '';
      
      lines.push(`[${time}] ${level} ${category} ${log.event}`);
      if (details) {
        lines.push(`  └─ ${details}`);
      }
    });

    return lines.join('\n');
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Start new session
   */
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.clearLogs();
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const videoCallLogger = new VideoCallLogger();
