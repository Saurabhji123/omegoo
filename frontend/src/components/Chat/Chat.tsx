import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WebRTCService from '../../services/webrtc';
import { 
  // PhoneIcon, // Not used currently
  PhoneXMarkIcon, 
  VideoCameraSlashIcon, 
  VideoCameraIcon,
  MicrophoneIcon,
  // ChatBubbleLeftRightIcon, // Not used currently
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [showReportModal, setShowReportModal] = useState(false);
  // const [queueInfo, setQueueInfo] = useState<{ position: number, totalWaiting: number } | null>(null); // Reserved for future use

  useEffect(() => {
    // Initialize WebRTC service
    webRTCRef.current = new WebRTCService();
    
    // Set up event listeners
    webRTCRef.current.onRemoteStreamReceived((stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
      setIsSearching(false);
    });

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      setConnectionState(state);
      if (state === 'disconnected') {
        setIsConnected(false);
      }
    });

    // Removed - matching handled by socket context

    // Start local video
    startLocalVideo();

    return () => {
      if (webRTCRef.current) {
        webRTCRef.current.cleanup();
      }
    };
  }, []);

  const startLocalVideo = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      };
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start local video:', error);
    }
  };

  const findMatch = () => {
    setIsSearching(true);
    // Removed - findMatch handled by socket
  };

  const nextMatch = () => {
    setIsConnected(false);
    setIsSearching(true);
    webRTCRef.current?.nextMatch();
  };

  const endCall = () => {
    webRTCRef.current?.cleanup();
    navigate('/home');
  };

  const toggleCamera = () => {
    const newState = webRTCRef.current?.toggleVideo();
    setIsCameraOn(newState || false);
  };

  const toggleMic = () => {
    const newState = webRTCRef.current?.toggleAudio();
    setIsMicOn(newState || false);
  };

  const reportUser = () => {
    setShowReportModal(true);
  };

  const handleReport = (reason: string) => {
    // TODO: Implement reporting
    console.log('Reporting user for:', reason);
    setShowReportModal(false);
    nextMatch();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-bold">Omegoo</h1>
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
          className="text-gray-400 hover:text-white"
        >
          <PhoneXMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ display: isConnected ? 'block' : 'none' }}
        />

        {/* Local Video */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-gray-600 object-cover"
        />

        {/* Searching Overlay */}
        {isSearching && !isConnected && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center text-white">
              <ArrowPathIcon className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
              <h2 className="text-2xl font-bold mb-2">Finding someone for you...</h2>
              <p className="text-gray-400 mb-4">Please wait while we connect you to a stranger</p>
              {/* Queue info display - reserved for future implementation */}
              {/* {queueInfo && (
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-gray-300">
                    <span className="text-blue-400 font-semibold">{queueInfo.totalWaiting}</span> people waiting
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You're in position <span className="text-blue-400">{queueInfo.position}</span>
                  </p>
                </div>
              )} */}
            </div>
          </div>
        )}

        {/* Not Connected Overlay */}
        {!isSearching && !isConnected && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center text-white">
              <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold mb-4">Ready to meet someone new?</h2>
              <button
                onClick={findMatch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Chatting
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex justify-center space-x-6">
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition-colors ${
            isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <MicrophoneIcon className={`w-6 h-6 ${isMicOn ? 'text-white' : 'text-white'}`} />
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full transition-colors ${
            isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isCameraOn ? (
            <VideoCameraIcon className="w-6 h-6 text-white" />
          ) : (
            <VideoCameraSlashIcon className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Next Button */}
        {isConnected && (
          <button
            onClick={nextMatch}
            className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full transition-colors"
          >
            <ArrowPathIcon className="w-6 h-6" />
          </button>
        )}

        {/* Report Button */}
        {isConnected && (
          <button
            onClick={reportUser}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
          >
            <ExclamationTriangleIcon className="w-6 h-6" />
          </button>
        )}

        {/* End Call */}
        <button
          onClick={endCall}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
        >
          <PhoneXMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Report User</h3>
            <p className="text-gray-600 mb-6">Why are you reporting this user?</p>
            
            <div className="space-y-2">
              {[
                'Inappropriate content',
                'Harassment or bullying',
                'Spam or scam',
                'Nudity or sexual content',
                'Violence or threats',
                'Other'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;