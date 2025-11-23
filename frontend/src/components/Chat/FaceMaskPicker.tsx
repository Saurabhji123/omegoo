/**
 * Face Mask Picker Modal
 * Allows users to select AR face masks and configure blur-start before joining video chat
 */

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlayIcon, StopIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useARFilter } from '../../contexts/ARFilterContext';
import { FACE_MASK_PRESETS, FaceMaskType, AR_CONSTANTS, formatBlurDuration } from '../../types/arFilters';

interface FaceMaskPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FaceMaskPicker: React.FC<FaceMaskPickerProps> = ({ isOpen, onClose, onConfirm }) => {
  const {
    selectedMask,
    setMask,
    startBlurCountdown,
    capabilities,
    performanceMetrics,
    faceDetected,
  } = useARFilter();

  const [enableBlurStart, setEnableBlurStart] = useState(false);
  const [blurDuration, setBlurDuration] = useState(AR_CONSTANTS.DEFAULT_BLUR_DURATION);
  const [previewActive, setPreviewActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedBlurEnabled = localStorage.getItem('omegoo_blur_enabled');
    const savedBlurDuration = localStorage.getItem('omegoo_blur_duration');
    
    if (savedBlurEnabled === 'true') {
      setEnableBlurStart(true);
    }
    
    if (savedBlurDuration) {
      setBlurDuration(parseInt(savedBlurDuration, 10));
    }
  }, []);

  // Start preview
  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setPreviewActive(true);
    } catch (error) {
      console.error('Failed to start preview:', error);
    }
  };

  // Stop preview
  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setPreviewActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  const handleClose = () => {
    stopPreview();
    onClose();
  };

  const handleConfirm = () => {
    stopPreview();
    
    // Save preferences
    localStorage.setItem('omegoo_blur_enabled', enableBlurStart.toString());
    localStorage.setItem('omegoo_blur_duration', blurDuration.toString());
    
    // Start blur countdown if enabled
    if (enableBlurStart) {
      startBlurCountdown(blurDuration);
    }
    
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-3xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm px-6 py-4 border-b border-white/10 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">AR Face Masks & Blur</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Choose a face mask and enable blur-start for privacy
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Preview */}
          {previewActive && (
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {faceDetected && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-white text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Face Detected
                </div>
              )}
            </div>
          )}

          {/* Face Mask Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Choose Face Mask</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(FACE_MASK_PRESETS) as FaceMaskType[]).map((maskType) => {
                const preset = FACE_MASK_PRESETS[maskType];
                const isSelected = selectedMask === maskType;
                const isRecommended = capabilities?.recommendedMasks.includes(maskType);
                
                return (
                  <button
                    key={maskType}
                    onClick={() => setMask(maskType)}
                    className={`relative p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? `border-purple-500 bg-gradient-to-br ${preset.color} shadow-lg shadow-purple-500/50`
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{preset.emoji}</div>
                      <div className="font-medium text-white text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          preset.cpuImpact === 'low' ? 'bg-green-500/20 text-green-400' :
                          preset.cpuImpact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {preset.cpuImpact === 'low' ? 'Low CPU' :
                           preset.cpuImpact === 'medium' ? 'Medium CPU' : 'High CPU'}
                        </span>
                      </div>
                    </div>
                    {isRecommended && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        ✓ Best
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1">
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blur-Start Configuration */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Blur-Start Privacy</h3>
                <p className="text-sm text-gray-400">Your video will be blurred until you reveal</p>
              </div>
              <button
                onClick={() => setEnableBlurStart(!enableBlurStart)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full border border-white/15 transition-all duration-200 ${
                  enableBlurStart ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg shadow-blue-500/30' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                    enableBlurStart ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {enableBlurStart && (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Blur Duration</span>
                    <span className="text-sm font-medium text-white">{formatBlurDuration(blurDuration)}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={blurDuration}
                    onChange={(e) => setBlurDuration(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5s</span>
                    <span>15s</span>
                    <span>30s</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
                  <div className="flex items-start gap-2">
                    <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>How it works:</strong> Your video will be blurred for {blurDuration} seconds. 
                      You can reveal yourself anytime by clicking the "Reveal Me" button.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Button */}
          <button
            onClick={previewActive ? stopPreview : startPreview}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              previewActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            }`}
          >
            {previewActive ? (
              <>
                <StopIcon className="w-5 h-5" />
                Stop Preview
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                Preview Camera
              </>
            )}
          </button>

          {/* Browser Compatibility Warning */}
          {capabilities && capabilities.warnings.length > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-200 text-sm mb-1">Compatibility Notice</div>
                  <ul className="text-yellow-200/80 text-sm space-y-1">
                    {capabilities.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Performance Warning */}
          {performanceMetrics && performanceMetrics.cpuUsage > AR_CONSTANTS.CPU_WARNING_THRESHOLD && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <div className="text-orange-200 text-sm">
                  <strong>High CPU Usage:</strong> AR effects may affect performance. Consider using simpler masks or disabling effects.
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-100 text-sm">
            <div className="flex items-start gap-2">
              <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>AR Face Masks:</strong> Real-time face tracking applies masks as you move. 
                Face masks and blur effects are applied locally - only the final video is sent to your partner.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm px-6 py-4 border-t border-white/10 rounded-b-3xl">
          {/* Skip AR Option for unsupported browsers */}
          {((capabilities?.warnings && capabilities.warnings.length > 0) || capabilities?.devicePerformance === 'low') && (
            <div className="mb-3 text-center">
              <button
                onClick={() => {
                  // Skip AR features and join directly
                  setMask('none');
                  localStorage.setItem('omegoo_ar_mask', 'none');
                  localStorage.setItem('omegoo_blur_enabled', 'false');
                  onConfirm();
                }}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Skip AR features and join now →
              </button>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={capabilities?.devicePerformance === 'low' && selectedMask !== 'none'}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={capabilities?.devicePerformance === 'low' && selectedMask !== 'none' ? 'AR masks not recommended for low-end devices' : ''}
            >
              Join with {selectedMask !== 'none' ? 'Mask' : enableBlurStart ? 'Blur' : 'Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceMaskPicker;
