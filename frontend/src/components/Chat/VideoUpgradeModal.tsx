import React, { useEffect, useState } from 'react';
import { VideoUpgradeState } from '../../types/videoUpgrade';

interface VideoUpgradeModalProps {
  state: VideoUpgradeState;
  onAccept: () => void;
  onDecline: () => void;
  onDeclineAndReport: () => void;
  onClose: () => void;
}

const VideoUpgradeModal: React.FC<VideoUpgradeModalProps> = ({
  state,
  onAccept,
  onDecline,
  onDeclineAndReport,
  onClose
}) => {
  const [showPrivacyTooltip, setShowPrivacyTooltip] = useState(false);

  useEffect(() => {
    // Show privacy tooltip for first-time video upgrade (check localStorage)
    const hasSeenVideoTooltip = localStorage.getItem('omegoo_video_upgrade_tooltip_seen');
    if (!hasSeenVideoTooltip && state.status === 'incoming') {
      setShowPrivacyTooltip(true);
    }
  }, [state.status]);

  const dismissTooltip = () => {
    localStorage.setItem('omegoo_video_upgrade_tooltip_seen', 'true');
    setShowPrivacyTooltip(false);
  };

  if (state.status === 'idle') return null;

  // Incoming request modal
  if (state.status === 'incoming') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
          {/* Privacy Tooltip */}
          {showPrivacyTooltip && (
            <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-gray-100 font-medium mb-2">
                    Starting video will share your camera — allow only if comfortable.
                  </p>
                  <button
                    onClick={dismissTooltip}
                    className="text-xs text-yellow-300 hover:text-yellow-200 font-semibold"
                  >
                    Got it, don't show again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-center text-white mb-2">
            Video Chat Request
          </h3>

          {/* Description */}
          <p className="text-center text-gray-300 mb-6">
            Your chat partner wants to upgrade to video chat. Would you like to accept?
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAccept}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Accept Video
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onDecline}
                className="bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-white/20"
              >
                Decline
              </button>

              <button
                onClick={onDeclineAndReport}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-red-500/50"
              >
                Decline & Report
              </button>
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-400 text-center mt-4">
            You can always end the video chat and return to text mode
          </p>
        </div>
      </div>
    );
  }

  // Requesting status
  if (state.status === 'requesting') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
          {/* Animated Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-white mb-2">
            Waiting for Response...
          </h3>

          <p className="text-center text-gray-300 mb-6">
            Your video request has been sent. Waiting for your partner to respond.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-white/20"
          >
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  // Connecting status
  if (state.status === 'connecting') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-white mb-2">
            Connecting Video...
          </h3>

          <p className="text-center text-gray-300">
            Establishing peer-to-peer connection...
          </p>
        </div>
      </div>
    );
  }

  // Failed status
  if (state.status === 'failed') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-white mb-2">
            Connection Failed
          </h3>

          <p className="text-center text-gray-300 mb-2">
            {state.error || 'Unable to establish video connection'}
          </p>

          <p className="text-sm text-gray-400 text-center mb-6">
            You can continue chatting in text mode or try again later.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            Continue in Text Mode
          </button>
        </div>
      </div>
    );
  }

  // Declined status
  if (state.status === 'declined') {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-white mb-2">
            Request Declined
          </h3>

          <p className="text-center text-gray-300 mb-6">
            Your partner declined the video request. Continue enjoying your chat in text mode!
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
          >
            Continue Chatting
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoUpgradeModal;
