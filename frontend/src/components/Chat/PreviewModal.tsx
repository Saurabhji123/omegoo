import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cameraPreviewService, CameraDevice, PreviewOptions, CameraPreviewService } from '../../services/cameraPreview';

interface PreviewModalProps {
  onStart: (stream: MediaStream) => void;
  onCancel: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ onStart, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Device and settings state
  const [videoDevices, setVideoDevices] = useState<CameraDevice[]>([]);
  // Removed unused: audioDevices, selectedVideoDevice, selectedAudioDevice
  
  // Preview settings
  const [resolution, setResolution] = useState<'360p' | '480p' | '720p'>(cameraPreviewService.getDefaultResolution());
  const [isMirrored, setIsMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [brightness, setBrightness] = useState(50);
  
  // Device info
  const [isMobile, setIsMobile] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<{ width: number; height: number; frameRate: number } | null>(null);

  const initializePreview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Check browser support
      if (!CameraPreviewService.isSupported()) {
        throw new Error('Your browser does not support camera access. Please use a modern browser.');
      }

      // Check permissions
      const permissionStatus = await cameraPreviewService.checkPermissions();
      if (permissionStatus === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in browser settings.');
      }

      // Enumerate devices
      await cameraPreviewService.enumerateDevices();
      const videoDevs = cameraPreviewService.getVideoDevices();

      setVideoDevices(videoDevs);

      // Detect if mobile
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase()
      ) || window.innerWidth <= 768;
      setIsMobile(mobile);

      // Start preview with default settings
      const defaultResolution = cameraPreviewService.getDefaultResolution();
      setResolution(defaultResolution);

      const previewOptions: PreviewOptions = {
        resolution: defaultResolution,
        facingMode: mobile ? 'user' : undefined,
        enableAudio: true
      };

      const previewStream = await cameraPreviewService.startPreview(previewOptions);
      setStream(previewStream);

      // Set video element
      if (videoRef.current) {
        videoRef.current.srcObject = previewStream;
      }

      // Get actual stream settings
      updateStreamSettings();

      setLoading(false);
    } catch (err: any) {
      console.error('Preview initialization error:', err);
      setError(err.message || 'Failed to initialize camera preview');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializePreview();
    return () => {
      cameraPreviewService.stopPreview();
    };
  }, [initializePreview]);

  const updateStreamSettings = () => {
    const settings = cameraPreviewService.getStreamSettings();
    setCurrentSettings(settings);
  };

  const handleResolutionChange = async (newResolution: '360p' | '480p' | '720p') => {
    try {
      setLoading(true);
      await cameraPreviewService.changeResolution(newResolution);
      setResolution(newResolution);
      updateStreamSettings();
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCameraFlip = async () => {
    try {
      setLoading(true);
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      const newStream = await cameraPreviewService.switchCamera(newFacingMode, resolution);
      
      setStream(newStream);
      setFacingMode(newFacingMode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      updateStreamSettings();
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value);
    try {
      await cameraPreviewService.adjustBrightness(value);
    } catch (err) {
      // Brightness not supported, ignore
    }
  };

  const handleStart = () => {
    if (stream) {
      onStart(stream);
    }
  };

  const handleCancel = () => {
    cameraPreviewService.stopPreview();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div style={{ backgroundColor: 'var(--primary-brand)' }} className="p-4 rounded-t-lg">
          <h2 className="text-white text-xl font-bold">Camera Preview</h2>
          <p className="text-white text-sm opacity-90">Check your video and audio before starting</p>
        </div>

        {/* Video Preview */}
        <div className="p-6">
          <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading camera...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50">
                <div className="text-white text-center p-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-bold mb-2">Camera Error</p>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={initializePreview}
                    className="mt-3 px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-200 transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
            />

            {/* Resolution indicator */}
            {currentSettings && !loading && !error && (
              <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                {resolution} ({currentSettings.width}x{currentSettings.height}@{currentSettings.frameRate}fps)
              </div>
            )}

            {/* Mirror indicator */}
            {isMirrored && !loading && !error && (
              <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                Mirrored
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Resolution selector */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Resolution</label>
              <div className="flex space-x-2">
                {(['360p', '480p', '720p'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => handleResolutionChange(res)}
                    disabled={loading || !!error}
                    className={`flex-1 py-2 px-4 rounded transition ${
                      resolution === res
                        ? 'btn-primary'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera controls */}
            <div className="flex space-x-2">
              {/* Mirror toggle */}
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                disabled={loading || !!error}
                className="flex-1 py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {isMirrored ? 'Mirrored' : 'Normal'}
              </button>

              {/* Camera flip (mobile) */}
              {isMobile && videoDevices.length > 1 && (
                <button
                  onClick={handleCameraFlip}
                  disabled={loading || !!error}
                  className="flex-1 py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Flip Camera
                </button>
              )}
            </div>

            {/* Brightness control */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Brightness: {brightness}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                disabled={loading || !!error}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="bg-gray-800 p-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={loading || !!error || !stream}
            className="px-6 py-2 btn-primary rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Video Call
          </button>
        </div>
      </div>
    </div>
  );
};
