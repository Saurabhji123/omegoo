import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import WebRTCService from '../../services/webrtc';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PhoneXMarkIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

const AudioChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queueInfo, setQueueInfo] = useState<{ position: number, totalWaiting: number } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize WebRTC service for audio only
    webRTCRef.current = new WebRTCService();
    
    // Set up event listeners
    webRTCRef.current.onRemoteStreamReceived((stream: MediaStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
      setIsConnected(true);
      setIsSearching(false);
      setCallStartTime(new Date());
    });

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      setConnectionState(state);
      if (state === 'disconnected') {
        setIsConnected(false);
        setCallStartTime(null);
        setCallDuration(0);
      }
    });

    // Removed - matching handled by socket context

    // Socket event listeners
    if (socket) {
      socket.on('match-found', (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('🎤 Audio chat match found:', data);
        setSessionId(data.sessionId);
        setIsSearching(false);
        // WebRTC will handle the connection
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for audio chat partner:', data);
        setQueueInfo(data);
        setIsSearching(true);
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Audio chat session ended:', data);
        setIsConnected(false);
        setSessionId(null);
        setCallStartTime(null);
      });

      socket.on('error', (data: { message: string }) => {
        console.error('🚨 Audio chat error:', data.message);
      });
    }

    // Start local audio
    startLocalAudio();

    return () => {
      if (webRTCRef.current) {
        webRTCRef.current.cleanup();
      }
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('session_ended');
      socket?.off('error');
    };
  }, [socket]);

  // Auto-start matching when component mounts and socket is ready
  useEffect(() => {
    if (socket && !isConnected && !isSearching) {
      setTimeout(() => {
        findMatch();
      }, 1000); // Small delay to ensure WebRTC is initialized
    }
  }, [socket]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStartTime && isConnected) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStartTime, isConnected]);

  const startLocalAudio = async () => {
    try {
      const constraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      if (stream && localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start local audio:', error);
    }
  };

  const findMatch = () => {
    if (!socket) {
      console.error('Socket not available');
      return;
    }
    
    setIsSearching(true);
    setIsConnected(false);
    setCallStartTime(null);
    setCallDuration(0);
    
    // Emit to socket for matching
    socket.emit('find_match', { mode: 'audio' });
    
    // Initialize WebRTC for audio
    if (webRTCRef.current) {
      // Removed - findMatch handled by socket
    }
    
    console.log('🔍 Started searching for audio chat partner');
  };

  const nextMatch = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId, duration: callDuration });
    }
    setIsConnected(false);
    setIsSearching(true);
    setCallStartTime(null);
    setCallDuration(0);
    webRTCRef.current?.nextMatch();
  };

  const endCall = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId, duration: callDuration });
    }
    webRTCRef.current?.cleanup();
    navigate('/');
  };

  const toggleMic = () => {
    const newState = webRTCRef.current?.toggleAudio();
    setIsMicOn(newState || false);
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const reportUser = () => {
    setShowReportModal(true);
  };

  const handleReport = (reason: string) => {
    if (sessionId) {
      socket?.emit('report_user', {
        sessionId,
        reason,
        description: `Audio chat reported for: ${reason}`
      });
    }
    setShowReportModal(false);
    nextMatch();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-bold">Voice Chat</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-300 text-sm capitalize">{connectionState}</span>
          </div>
        </div>
        
        <button
          onClick={endCall}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Audio Elements (Hidden) */}
      <audio ref={localAudioRef} muted autoPlay />
      <audio ref={remoteAudioRef} autoPlay />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        {/* Not Connected State */}
        {!isSearching && !isConnected && (
          <div className="text-center text-white">
            <div className="w-32 h-32 mx-auto mb-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MicrophoneIcon className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready for a voice chat?</h2>
            <p className="text-xl text-gray-300 mb-8">Connect with someone and have a real conversation!</p>
            <button
              onClick={findMatch}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
            >
              Start Voice Chat
            </button>
          </div>
        )}

        {/* Searching State */}
        {isSearching && !isConnected && (
          <div className="text-center text-white">
            <div className="w-32 h-32 mx-auto mb-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <ArrowPathIcon className="w-16 h-16 text-white animate-spin" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Finding someone to talk to...</h2>
            <p className="text-xl text-gray-300 mb-8">Please wait while we connect you</p>
            {queueInfo && (
              <div className="bg-black bg-opacity-30 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-lg text-purple-300">
                  <span className="text-white font-bold">{queueInfo.totalWaiting}</span> people waiting
                </p>
                <p className="text-gray-400 mt-2">
                  Position <span className="text-purple-300 font-semibold">{queueInfo.position}</span> in queue
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connected State */}
        {isConnected && (
          <div className="text-center text-white">
            <div className="w-40 h-40 mx-auto mb-8 bg-green-500 bg-opacity-30 rounded-full flex items-center justify-center animate-pulse">
              <SpeakerWaveIcon className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Connected!</h2>
            <p className="text-xl text-gray-300 mb-4">You're now talking with a stranger</p>
            
            {/* Call Duration */}
            <div className="bg-black bg-opacity-30 rounded-xl p-4 mb-8 inline-block">
              <p className="text-2xl font-mono text-green-400">{formatDuration(callDuration)}</p>
            </div>

            {/* Audio Visualization */}
            <div className="flex justify-center space-x-4 mb-8">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 bg-purple-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 40 + 20}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <div className="text-gray-400 px-4">♪</div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 40 + 20}px`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm p-6">
        <div className="flex justify-center space-x-8">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition-colors shadow-lg ${
              isMicOn 
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <MicrophoneIcon className="w-8 h-8 text-white" />
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full transition-colors shadow-lg ${
              isSpeakerOn 
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSpeakerOn ? (
              <SpeakerWaveIcon className="w-8 h-8 text-white" />
            ) : (
              <SpeakerXMarkIcon className="w-8 h-8 text-white" />
            )}
          </button>

          {/* Next Button */}
          {isConnected && (
            <button
              onClick={nextMatch}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-full transition-colors shadow-lg"
            >
              <ArrowPathIcon className="w-8 h-8" />
            </button>
          )}

          {/* Report Button */}
          {isConnected && (
            <button
              onClick={reportUser}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors shadow-lg"
            >
              <ExclamationTriangleIcon className="w-8 h-8" />
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors shadow-lg"
          >
            <PhoneXMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center mt-4">
          <p className="text-gray-300 text-sm">
            {!isMicOn && "🔇 Microphone off"} 
            {!isSpeakerOn && " 🔈 Speaker off"}
            {isMicOn && isSpeakerOn && isConnected && "🎤 Voice chat active"}
          </p>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Report User</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Why are you reporting this user?</p>
            
            <div className="space-y-2">
              {[
                'Inappropriate content',
                'Harassment or bullying',
                'Spam or scam',
                'Offensive language',
                'Background noise/disturbance',
                'Other'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
                >
                  {reason}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full mt-4 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioChat;