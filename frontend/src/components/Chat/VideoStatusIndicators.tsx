import React from 'react';
import { NetworkQuality } from '../../services/networkMonitor';
import { ResolutionTier } from '../../services/resolutionManager';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'audio-only' | 'disconnected';

interface VideoStatusIndicatorsProps {
  connectionStatus: ConnectionStatus;
  networkQuality: NetworkQuality;
  currentResolution: ResolutionTier;
  isVideoEnabled: boolean;
  onRetryVideo?: () => void;
}

export const VideoStatusIndicators: React.FC<VideoStatusIndicatorsProps> = ({
  connectionStatus,
  networkQuality,
  currentResolution,
  isVideoEnabled,
  onRetryVideo
}) => {
  // Status color and text
  const getStatusInfo = (): { color: string; text: string; bgColor: string } => {
    switch (connectionStatus) {
      case 'connecting':
        return { color: 'text-yellow-400', text: 'Connecting...', bgColor: 'bg-yellow-900' };
      case 'connected':
        return { color: 'text-green-400', text: 'Connected', bgColor: 'bg-green-900' };
      case 'reconnecting':
        return { color: 'text-yellow-400', text: 'Reconnecting...', bgColor: 'bg-yellow-900' };
      case 'audio-only':
        return { color: 'text-orange-400', text: 'Audio Only', bgColor: 'bg-orange-900' };
      case 'disconnected':
        return { color: 'text-red-400', text: 'Disconnected', bgColor: 'bg-red-900' };
    }
  };

  // Network quality color
  const getQualityColor = (): string => {
    switch (networkQuality) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-green-400';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
    }
  };

  const statusInfo = getStatusInfo();
  const qualityColor = getQualityColor();
  const showPoorNetworkWarning = networkQuality === 'poor' || networkQuality === 'critical';

  return (
    <div className="absolute top-0 left-0 right-0 z-10">
      {/* Poor network warning banner */}
      {showPoorNetworkWarning && connectionStatus === 'connected' && (
        <div className="bg-red-600 bg-opacity-90 text-white px-4 py-2 text-sm flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Poor Network Connection - Video quality reduced</span>
        </div>
      )}

      {/* Audio-only message with retry */}
      {connectionStatus === 'audio-only' && (
        <div className="bg-orange-600 bg-opacity-90 text-white px-4 py-3 text-sm">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0-7.072a5 5 0 00-1.414 1.414" />
              </svg>
              <div>
                <p className="font-medium">Audio-Only Mode</p>
                <p className="text-xs opacity-90">Video could not be established. You can still hear each other.</p>
              </div>
            </div>
            {onRetryVideo && (
              <button
                onClick={onRetryVideo}
                className="ml-4 px-4 py-1.5 bg-white text-orange-600 rounded hover:bg-gray-100 transition text-sm font-medium"
              >
                Retry Video
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status and resolution indicators */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex flex-col space-y-2">
          {/* Connection status */}
          <div className={`${statusInfo.bgColor} bg-opacity-80 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center space-x-2 shadow-lg`}>
            <div className={`w-2 h-2 rounded-full ${statusInfo.color} ${connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>

          {/* Network quality (only when connected) */}
          {connectionStatus === 'connected' && (
            <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                {/* Signal strength bars */}
                <div className="flex items-end space-x-0.5 h-4">
                  <div className={`w-1 ${networkQuality !== 'critical' ? qualityColor.replace('text-', 'bg-') : 'bg-gray-600'} rounded-sm h-2`} />
                  <div className={`w-1 ${networkQuality !== 'critical' && networkQuality !== 'poor' ? qualityColor.replace('text-', 'bg-') : 'bg-gray-600'} rounded-sm h-3`} />
                  <div className={`w-1 ${networkQuality === 'good' || networkQuality === 'excellent' ? qualityColor.replace('text-', 'bg-') : 'bg-gray-600'} rounded-sm h-4`} />
                  <div className={`w-1 ${networkQuality === 'excellent' ? qualityColor.replace('text-', 'bg-') : 'bg-gray-600'} rounded-sm h-full`} />
                </div>
                <span className={`text-xs font-medium ${qualityColor} capitalize`}>
                  {networkQuality}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Resolution indicator (only when video enabled) */}
        {isVideoEnabled && connectionStatus !== 'audio-only' && (
          <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-white">{currentResolution}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
