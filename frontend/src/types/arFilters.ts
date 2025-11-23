/**
 * AR Face Filter Types and Constants
 * Defines types for face masks, blur effects, and AR capabilities
 */

// Face mask types
export type FaceMaskType = 'none' | 'sunglasses' | 'dog_ears' | 'cat_ears' | 'party_hat';

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
  
  // Blur settings
  BLUR_RADIUS: {
    LOW: 5,
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

// Face mask presets
export const FACE_MASK_PRESETS: Record<FaceMaskType, FaceMaskPreset> = {
  none: {
    id: 'none',
    name: 'No Mask',
    description: 'Show your natural face',
    emoji: '😊',
    icon: '',
    color: 'from-gray-600 to-gray-700',
    difficulty: 'easy',
    landmarks: [],
    cpuImpact: 'low',
  },
  sunglasses: {
    id: 'sunglasses',
    name: 'Cool Shades',
    description: 'Classic sunglasses look',
    emoji: '😎',
    icon: '/assets/masks/sunglasses.png',
    color: 'from-yellow-500 to-orange-600',
    difficulty: 'easy',
    landmarks: ['LEFT_EYE_OUTER', 'RIGHT_EYE_OUTER', 'NOSE_BRIDGE'],
    cpuImpact: 'low',
  },
  dog_ears: {
    id: 'dog_ears',
    name: 'Puppy Ears',
    description: 'Adorable dog ears',
    emoji: '🐶',
    icon: '/assets/masks/dog_ears.png',
    color: 'from-orange-500 to-amber-600',
    difficulty: 'medium',
    landmarks: ['HEAD_TOP', 'LEFT_EAR', 'RIGHT_EAR'],
    cpuImpact: 'medium',
  },
  cat_ears: {
    id: 'cat_ears',
    name: 'Kitty Ears',
    description: 'Cute cat ears',
    emoji: '🐱',
    icon: '/assets/masks/cat_ears.png',
    color: 'from-pink-500 to-purple-600',
    difficulty: 'medium',
    landmarks: ['HEAD_TOP', 'LEFT_EAR', 'RIGHT_EAR'],
    cpuImpact: 'medium',
  },
  party_hat: {
    id: 'party_hat',
    name: 'Party Hat',
    description: 'Celebration time!',
    emoji: '🎉',
    icon: '/assets/masks/party_hat.png',
    color: 'from-blue-500 to-indigo-600',
    difficulty: 'easy',
    landmarks: ['HEAD_TOP', 'FOREHEAD'],
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
  if (performance === 'high') {
    return ['sunglasses', 'dog_ears', 'cat_ears', 'party_hat'];
  } else if (performance === 'medium') {
    return ['sunglasses', 'party_hat'];
  } else {
    return ['sunglasses'];
  }
}
