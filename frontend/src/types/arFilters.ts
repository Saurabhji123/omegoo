/**
 * AR Face Filter Types and Constants
 * Defines types for face masks, blur effects, and AR capabilities
 */

// Color filter types (replacing face masks)
export type FaceMaskType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'cool' | 'warm' | 'vibrant';

// Blur state
export type BlurState = 'active' | 'manual' | 'revealed' | 'disabled';

// Face landmark points from TensorFlow FaceMesh
export interface FaceLandmarks {
  keypoints: Array<{ x: number; y: number; z: number; name?: string }>;
  boundingBox: {
    topLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
  confidence: number;
}

// Face mask configuration
export interface FaceMaskConfig {
  type: FaceMaskType;
  enabled: boolean;
  opacity: number; // 0-1
  scale: number; // 0.5-2.0
}

// Face mask preset
export interface FaceMaskPreset {
  id: FaceMaskType;
  name: string;
  description: string;
  emoji: string;
  icon: string; // Asset path
  color: string; // Tailwind gradient classes
  difficulty: 'easy' | 'medium' | 'hard'; // Processing complexity
  landmarks: string[]; // Required landmark names
  cpuImpact: 'low' | 'medium' | 'high';
}

// Blur-Start configuration
export interface BlurStartConfig {
  enabled: boolean;
  duration: number; // seconds
  intensity: number; // 0-20 (blur radius in pixels)
  autoReveal: boolean; // Auto-reveal after duration
}

// AR capabilities detection
export interface ARCapabilities {
  supportsFaceMesh: boolean;
  supportsCanvas: boolean;
  supportsOffscreenCanvas: boolean;
  supportsWebGL: boolean;
  supportsCaptureStream: boolean;
  recommendedMasks: FaceMaskType[];
  warnings: string[];
  devicePerformance: 'high' | 'medium' | 'low';
}

// Performance metrics
export interface ARPerformanceMetrics {
  fps: number;
  faceDetectionTime: number; // ms
  renderTime: number; // ms
  cpuUsage: number; // 0-100
  droppedFrames: number;
  timestamp: number;
}

// AR processing state
export interface ARProcessingState {
  isInitialized: boolean;
  isProcessing: boolean;
  hasFaceDetected: boolean;
  currentMask: FaceMaskType;
  blurState: BlurState;
  revealCountdown: number; // seconds remaining
}

// Constants for AR processing
export const AR_CONSTANTS = {
  // Canvas settings
  CANVAS_WIDTH: 640,
  CANVAS_HEIGHT: 480,
  TARGET_FPS: 30,
  MIN_FPS: 15,
  
  // FaceMesh settings
  MAX_FACES: 1, // Only track one face for performance
  REFINEMENT: false, // Disable iris/lip refinement for speed
  MIN_DETECTION_CONFIDENCE: 0.5,
  MIN_TRACKING_CONFIDENCE: 0.5,
  
  // Blur settings (reduced for visibility)
  BLUR_RADIUS: {
    LOW: 6,
    MEDIUM: 10,
    HIGH: 15,
    MAX: 20,
  },
  DEFAULT_BLUR_DURATION: 10, // seconds
  BLUR_COUNTDOWN_INTERVAL: 1000, // ms
  
  // Performance thresholds
  CPU_WARNING_THRESHOLD: 20, // %
  CPU_DISABLE_THRESHOLD: 40, // %
  FPS_WARNING_THRESHOLD: 20,
  MAX_DROPPED_FRAMES: 30,
  
  // Mask scaling
  MASK_SCALE: {
    MIN: 0.5,
    DEFAULT: 1.0,
    MAX: 2.0,
  },
  
  // Landmark indices (for TensorFlow FaceMesh 468-point model)
  LANDMARKS: {
    // Eyes
    LEFT_EYE_OUTER: 33,
    LEFT_EYE_INNER: 133,
    RIGHT_EYE_OUTER: 362,
    RIGHT_EYE_INNER: 263,
    LEFT_EYE_CENTER: 468, // Iris center (if refinement enabled)
    RIGHT_EYE_CENTER: 473,
    
    // Nose
    NOSE_TIP: 1,
    NOSE_BRIDGE: 168,
    
    // Ears (approximate)
    LEFT_EAR: 234,
    RIGHT_EAR: 454,
    
    // Head top
    FOREHEAD: 10,
    HEAD_TOP: 10,
    
    // Chin
    CHIN: 152,
    
    // Mouth
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291,
    
    // Face contour
    FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  },
};

// Color filter presets (replacing face masks for better performance)
export const FACE_MASK_PRESETS: Record<FaceMaskType, FaceMaskPreset> = {
  none: {
    id: 'none',
    name: 'No Filter',
    description: 'Original colors',
    emoji: '😊',
    icon: '',
    color: 'from-gray-600 to-gray-700',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  grayscale: {
    id: 'grayscale',
    name: 'Grayscale',
    description: 'Black and white filter',
    emoji: '⚪',
    icon: '',
    color: 'from-gray-500 to-gray-700',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    description: 'Vintage brown tone',
    emoji: '🟤',
    icon: '',
    color: 'from-amber-600 to-orange-700',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  invert: {
    id: 'invert',
    name: 'Invert',
    description: 'Negative colors',
    emoji: '🔄',
    icon: '',
    color: 'from-purple-500 to-indigo-600',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  cool: {
    id: 'cool',
    name: 'Cool Blue',
    description: 'Blue color tone',
    emoji: '🔵',
    icon: '',
    color: 'from-blue-500 to-cyan-600',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  warm: {
    id: 'warm',
    name: 'Warm Red',
    description: 'Red/orange tone',
    emoji: '🔴',
    icon: '',
    color: 'from-red-500 to-orange-600',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Enhanced saturation',
    emoji: '🌈',
    icon: '',
    color: 'from-pink-500 to-purple-600',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
};

// Helper functions
export function getMaskPreset(type: FaceMaskType): FaceMaskPreset {
  return FACE_MASK_PRESETS[type];
}

export function formatBlurDuration(seconds: number): string {
  if (seconds <= 0) return 'Revealed';
  if (seconds === 1) return '1 second';
  return `${seconds} seconds`;
}

export function getBlurIntensityLabel(intensity: number): string {
  if (intensity <= 5) return 'Light Blur';
  if (intensity <= 10) return 'Medium Blur';
  if (intensity <= 15) return 'Strong Blur';
  return 'Maximum Blur';
}

export function shouldAutoDisable(metrics: ARPerformanceMetrics): boolean {
  return (
    metrics.cpuUsage > AR_CONSTANTS.CPU_DISABLE_THRESHOLD ||
    metrics.fps < AR_CONSTANTS.FPS_WARNING_THRESHOLD ||
    metrics.droppedFrames > AR_CONSTANTS.MAX_DROPPED_FRAMES
  );
}

export function getDevicePerformance(): 'high' | 'medium' | 'low' {
  // Estimate device performance based on available cores and memory
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4; // GB
  
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
}

export function getRecommendedMasks(performance: 'high' | 'medium' | 'low'): FaceMaskType[] {
  // All color filters are lightweight and work on any device
  return ['grayscale', 'sepia', 'invert', 'cool', 'warm', 'vibrant'];
}

// Get CSS filter string for a given filter type
export function getFilterCSS(filterType: FaceMaskType): string {
  switch (filterType) {
    case 'grayscale':
      return 'grayscale(100%) contrast(1.1)'; // Added contrast for better definition
    case 'sepia':
      return 'sepia(90%) contrast(1.15) brightness(1.05)'; // Increased sepia and added contrast
    case 'invert':
      return 'invert(100%) hue-rotate(180deg)'; // Added hue-rotate for more dramatic effect
    case 'cool':
      return 'saturate(1.4) contrast(1.1) brightness(0.95) hue-rotate(200deg)'; // More pronounced blue
    case 'warm':
      return 'saturate(1.5) contrast(1.2) brightness(1.08) hue-rotate(-20deg)'; // More pronounced warm tones
    case 'vibrant':
      return 'saturate(2.2) contrast(1.25) brightness(1.1)'; // Increased vibrance significantly
    case 'none':
    default:
      return 'none';
  }
}
