// Voice Avatar Picker - Modal for selecting voice filters before joining call

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, StopIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useVoiceFilter } from '../../contexts/VoiceFilterContext';
import {
  VoiceFilterType,
  VOICE_FILTER_PRESETS,
  getFilterPreset,
  formatIntensity,
  getIntensityLabel,
  AUDIO_CONSTANTS,
} from '../../types/voiceFilters';

interface VoiceAvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const VoiceAvatarPicker: React.FC<VoiceAvatarPickerProps> = ({ isOpen, onClose, onConfirm }) => {
  const {
    selectedFilter,
    intensity,
    isPreviewMode,
    isProcessing,
    capabilities,
    performanceMetrics,
    setFilter,
    adjustIntensity,
    togglePreview,
  } = useVoiceFilter();
  
  const [selectedFilterLocal, setSelectedFilterLocal] = useState<VoiceFilterType>(selectedFilter);
  const [intensityLocal, setIntensityLocal] = useState<number>(intensity);

  // Sync with context when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFilterLocal(selectedFilter);
      setIntensityLocal(intensity);
    }
  }, [isOpen, selectedFilter, intensity]);

  // Handle filter selection
  const handleFilterSelect = async (filter: VoiceFilterType) => {
    setSelectedFilterLocal(filter);
    await setFilter(filter);
    
    // Set default intensity for filter
    const preset = getFilterPreset(filter);
    const defaultIntensity = preset.defaultIntensity;
    setIntensityLocal(defaultIntensity);
    await adjustIntensity(defaultIntensity);
  };

  // Handle intensity change
  const handleIntensityChange = async (newIntensity: number) => {
    setIntensityLocal(newIntensity);
    await adjustIntensity(newIntensity);
  };

  // Handle confirm
  const handleConfirm = () => {
    // Stop preview before closing
    if (isPreviewMode) {
      togglePreview();
    }
    onConfirm();
  };

  // Handle close
  const handleClose = () => {
    // Stop preview before closing
    if (isPreviewMode) {
      togglePreview();
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentPreset = getFilterPreset(selectedFilterLocal);
  const showWarning = performanceMetrics && performanceMetrics.cpuUsage > AUDIO_CONSTANTS.PERFORMANCE.CPU_WARNING_THRESHOLD;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-purple-500/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Voice</h2>
              <p className="text-gray-300 text-sm">
                Select a voice filter to mask your identity and have fun!
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Browser Compatibility Warning */}
        {capabilities && capabilities.warnings.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-yellow-600 bg-opacity-20 border border-yellow-600 border-opacity-30 rounded-xl">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-200 text-sm font-medium mb-1">Browser Compatibility Notice</p>
                {capabilities.warnings.map((warning, idx) => (
                  <p key={idx} className="text-yellow-300 text-xs">{warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Selection Grid */}
        <div className="p-6">
          <label className="block text-white font-semibold mb-4">Select Voice Filter:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(VOICE_FILTER_PRESETS).map((preset) => {
              const isSelected = selectedFilterLocal === preset.id;
              const isRecommended = capabilities?.recommendedFilters.includes(preset.id);
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handleFilterSelect(preset.id)}
                  disabled={isProcessing}
                  className={`relative p-6 rounded-xl border-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-purple-500 bg-gradient-to-br ' + preset.color + ' shadow-lg'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  {/* Recommended badge */}
                  {isRecommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      ✓ Best
                    </div>
                  )}
                  
                  {/* Filter icon and name */}
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-4xl">{preset.emoji}</span>
                    <div className="text-left flex-1">
                      <h3 className="text-white font-bold text-lg">{preset.name}</h3>
                      <p className="text-gray-300 text-sm">{preset.description}</p>
                    </div>
                  </div>
                  
                  {/* CPU impact indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">CPU Impact:</span>
                    <span className={`font-semibold ${
                      preset.cpuImpact === 'low' ? 'text-green-400' :
                      preset.cpuImpact === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {preset.cpuImpact.toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intensity Slider (only show if filter selected) */}
        {selectedFilterLocal !== 'none' && (
          <div className="px-6 pb-6">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white font-semibold">Filter Intensity:</label>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold text-lg">
                    {formatIntensity(intensityLocal)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({getIntensityLabel(intensityLocal)})
                  </span>
                </div>
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min={currentPreset.minIntensity}
                max={currentPreset.maxIntensity}
                step="0.05"
                value={intensityLocal}
                onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider-purple"
                style={{
                  background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${intensityLocal * 100}%, rgba(255,255,255,0.2) ${intensityLocal * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              
              {/* Preset buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleIntensityChange(0.3)}
                  className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                >
                  Subtle
                </button>
                <button
                  onClick={() => handleIntensityChange(0.6)}
                  className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                >
                  Medium
                </button>
                <button
                  onClick={() => handleIntensityChange(0.9)}
                  className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                >
                  Strong
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Button */}
        {selectedFilterLocal !== 'none' && (
          <div className="px-6 pb-6">
            <button
              onClick={togglePreview}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                isPreviewMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              {isPreviewMode ? (
                <>
                  <StopIcon className="w-5 h-5" />
                  Stop Preview
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5" />
                  Preview Filter
                </>
              )}
            </button>
            <p className="text-center text-gray-400 text-xs mt-2">
              {isPreviewMode ? 'You are hearing your filtered voice' : 'Click to hear how you will sound'}
            </p>
          </div>
        )}

        {/* Performance Warning */}
        {showWarning && (
          <div className="mx-6 mb-6 p-4 bg-orange-600 bg-opacity-20 border border-orange-600 border-opacity-30 rounded-xl">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-orange-200 text-sm font-medium mb-1">High CPU Usage Detected</p>
                <p className="text-orange-300 text-xs">
                  Current usage: {performanceMetrics?.cpuUsage.toFixed(1)}% - 
                  Consider using a simpler filter or disabling for better performance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Confirm/Cancel */}
        <div className="p-6 border-t border-white/10 flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              'Join with Filter'
            )}
          </button>
        </div>

        {/* Info Footer */}
        <div className="px-6 pb-6">
          <div className="p-4 bg-blue-600 bg-opacity-20 border border-blue-600 border-opacity-30 rounded-xl">
            <p className="text-blue-200 text-xs text-center">
              ℹ️ <strong>Note:</strong> Voice filters modify your voice in real-time. 
              You can change or disable the filter anytime during the call. 
              Filters may increase battery usage on mobile devices.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .slider-purple::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgb(168, 85, 247);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        .slider-purple::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgb(168, 85, 247);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  );
};

export default VoiceAvatarPicker;
