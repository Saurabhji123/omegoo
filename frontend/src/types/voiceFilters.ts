// Voice Filter Types - Real-time Voice Processing

// Filter type enumeration
export type VoiceFilterType = 'none' | 'chipmunk' | 'deep' | 'robot';

// Filter configuration interface
export interface VoiceFilterConfig {
  type: VoiceFilterType;
  intensity: number; // 0.0 - 1.0
  enabled: boolean;
}

// Filter preset definitions
export interface VoiceFilterPreset {
  id: VoiceFilterType;
  name: string;
  description: string;
  icon: string;
  emoji: string;
  color: string; // Tailwind gradient colors
  minIntensity: number;
  maxIntensity: number;
  defaultIntensity: number;
  cpuImpact: 'low' | 'medium' | 'high';
}

// Performance metrics
export interface AudioPerformanceMetrics {
  cpuUsage: number; // percentage 0-100
  processingLatency: number; // milliseconds
  bufferUnderruns: number; // glitch count
  audioContextState: AudioContextState;
  timestamp: number;
}

// Browser compatibility info
export interface AudioCapabilities {
  supportsAudioWorklet: boolean;
  supportsMediaStream: boolean;
  supportsWebAudio: boolean;
  recommendedFilters: VoiceFilterType[];
  warnings: string[];
}

// Analytics event types
export interface VoiceFilterAnalytics {
  event: 'filter_activated' | 'filter_changed' | 'filter_preview' | 'filter_disabled' | 'cpu_warning';
  filterType: VoiceFilterType;
  intensity: number;
  sessionId?: string;
  duration?: number; // seconds
  cpuUsage?: number;
  timestamp: number;
}

// Audio processing constants
export const AUDIO_CONSTANTS = {
  SAMPLE_RATE: 48000, // Hz - WebRTC standard
  BUFFER_SIZE: 4096, // samples - balance latency vs processing
  MIN_BUFFER_SIZE: 256, // for low-latency mode
  MAX_BUFFER_SIZE: 16384, // for high-quality mode
  FREQUENCY_BINS: 2048, // for FFT analysis
  
  // Pitch shift ratios
  PITCH_SHIFT: {
    CHIPMUNK_MIN: 1.2,
    CHIPMUNK_MAX: 2.5,
    CHIPMUNK_DEFAULT: 1.7,
    DEEP_MIN: 0.5,
    DEEP_MAX: 0.85,
    DEEP_DEFAULT: 0.65,
  },
  
  // Filter frequencies
  FREQUENCIES: {
    LOW_PASS_CUTOFF: 800, // Hz - for deep/bass filter
    HIGH_PASS_CUTOFF: 200, // Hz - for clarity
    RING_MOD_MIN: 150, // Hz - for robot effect
    RING_MOD_MAX: 1000, // Hz
    RING_MOD_DEFAULT: 400, // Hz
  },
  
  // Performance thresholds
  PERFORMANCE: {
    CPU_WARNING_THRESHOLD: 15, // %
    CPU_DISABLE_THRESHOLD: 25, // %
    MAX_LATENCY_MS: 300, // milliseconds
    TARGET_LATENCY_MS: 50, // milliseconds
    GLITCH_THRESHOLD: 5, // buffer underruns per minute
  },
  
  // Audio quality settings
  QUALITY: {
    ECHO_CANCELLATION: true,
    NOISE_SUPPRESSION: true,
    AUTO_GAIN_CONTROL: true,
    CHANNEL_COUNT: 1, // mono for voice
  },
} as const;

// Filter presets configuration
export const VOICE_FILTER_PRESETS: Record<VoiceFilterType, VoiceFilterPreset> = {
  none: {
    id: 'none',
    name: 'Natural Voice',
    description: 'Your natural voice without any filters',
    icon: '🎤',
    emoji: '😊',
    color: 'from-gray-600 to-gray-700',
    minIntensity: 0,
    maxIntensity: 0,
    defaultIntensity: 0,
    cpuImpact: 'low',
  },
  chipmunk: {
    id: 'chipmunk',
    name: 'Chipmunk',
    description: 'High-pitched, cute voice effect',
    icon: '🐿️',
    emoji: '🐿️',
    color: 'from-yellow-600 to-orange-600',
    minIntensity: 0.2,
    maxIntensity: 1.0,
    defaultIntensity: 0.6,
    cpuImpact: 'medium',
  },
  deep: {
    id: 'deep',
    name: 'Deep Bass',
    description: 'Low-pitched, powerful voice effect',
    icon: '🎸',
    emoji: '🎸',
    color: 'from-blue-600 to-indigo-600',
    minIntensity: 0.2,
    maxIntensity: 1.0,
    defaultIntensity: 0.6,
    cpuImpact: 'medium',
  },
  robot: {
    id: 'robot',
    name: 'Robot',
    description: 'Metallic, digital voice effect',
    icon: '🤖',
    emoji: '🤖',
    color: 'from-purple-600 to-pink-600',
    minIntensity: 0.3,
    maxIntensity: 1.0,
    defaultIntensity: 0.7,
    cpuImpact: 'high',
  },
} as const;

// Helper function to get filter preset
export function getFilterPreset(type: VoiceFilterType): VoiceFilterPreset {
  return VOICE_FILTER_PRESETS[type];
}

// Helper function to calculate pitch shift ratio from intensity
export function calculatePitchShift(type: VoiceFilterType, intensity: number): number {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  
  switch (type) {
    case 'chipmunk': {
      const min = AUDIO_CONSTANTS.PITCH_SHIFT.CHIPMUNK_MIN;
      const max = AUDIO_CONSTANTS.PITCH_SHIFT.CHIPMUNK_MAX;
      return min + (max - min) * clampedIntensity;
    }
    case 'deep': {
      const min = AUDIO_CONSTANTS.PITCH_SHIFT.DEEP_MIN;
      const max = AUDIO_CONSTANTS.PITCH_SHIFT.DEEP_MAX;
      return min + (max - min) * clampedIntensity;
    }
    case 'robot': {
      // Robot uses ring modulation frequency, not pitch shift
      const min = AUDIO_CONSTANTS.FREQUENCIES.RING_MOD_MIN;
      const max = AUDIO_CONSTANTS.FREQUENCIES.RING_MOD_MAX;
      return min + (max - min) * clampedIntensity;
    }
    case 'none':
    default:
      return 1.0; // no change
  }
}

// Helper function to format intensity as percentage
export function formatIntensity(intensity: number): string {
  return `${Math.round(intensity * 100)}%`;
}

// Helper function to get intensity label
export function getIntensityLabel(intensity: number): string {
  if (intensity < 0.33) return 'Subtle';
  if (intensity < 0.67) return 'Medium';
  return 'Strong';
}
