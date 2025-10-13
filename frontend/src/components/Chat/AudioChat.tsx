import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import WebRTCService from '../../services/webrtc';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
  PhoneXMarkIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSlashIcon } from '@heroicons/react/24/solid';

const AudioChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting } = useSocket();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Core states
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Enhanced audio states
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [micBlocked, setMicBlocked] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // Audio level 0-100
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // Remote stream handler with enhanced audio processing
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log('🎤 Remote audio stream received:', {
      audio: stream.getAudioTracks().length > 0,
      tracks: stream.getTracks().length,
      id: stream.id
    });
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      console.log('✅ Remote audio assigned to element');
      
      // Enhanced audio playback
      remoteAudioRef.current.play().catch(error => {
        console.warn('Remote audio autoplay prevented, trying user gesture:', error);
        const playPromise = () => {
          remoteAudioRef.current?.play().catch(e => 
            console.log('Manual audio play failed:', e)
          );
        };
        document.addEventListener('click', playPromise, { once: true });
      });
      
      console.log('🎤 Remote audio setup completed');
    }
    
    setIsMatchConnected(true);
    setIsSearching(false);
  }, []);

  // Initialize audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyserRef.current && isMicOn) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(Math.round((average / 255) * 100));
      } else {
        setMicLevel(0);
      }
      animationRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }, [isMicOn]);

  useEffect(() => {
    // Initialize WebRTC service
    webRTCRef.current = new WebRTCService();
    webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      console.log('Connection state:', state);
      
      // Update connection quality based on state
      if (state === 'connected') {
        setConnectionQuality('excellent');
      } else if (state === 'connecting') {
        setConnectionQuality('good');
      } else if (state === 'disconnected') {
        setIsMatchConnected(false);
        setConnectionQuality('poor');
      }
    });

    // Socket event listeners - exact VideoChat pattern
    if (socket) {
      socket.on('match-found', async (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('🎤 Audio match found:', data);
        setSessionId(data.sessionId);
        setIsSearching(false);
        
        if (webRTCRef.current) {
          console.log('🔄 Setting up fresh WebRTC connection');
          webRTCRef.current.cleanup();
          webRTCRef.current = new WebRTCService();
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          try {
            await startLocalAudio();
            console.log('🎤 Local audio ready for connection');
          } catch (error) {
            console.error('❌ Failed to start local audio:', error);
            return;
          }
          
          // Set up ICE candidate handling
          webRTCRef.current.setIceCandidateCallback((candidate: RTCIceCandidate) => {
            socket.emit('ice-candidate', {
              candidate: candidate,
              targetUserId: data.matchUserId,
              sessionId: data.sessionId
            });
          });
          
          // If initiator, create offer
          if (data.isInitiator) {
            setTimeout(async () => {
              const offer = await webRTCRef.current!.createWebRTCOffer();
              socket.emit('webrtc-offer', { 
                offer, 
                targetUserId: data.matchUserId,
                sessionId: data.sessionId 
              });
            }, 1000);
          }
          
          setIsMatchConnected(true);
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for audio partner:', data);
        setIsSearching(true);
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Audio session ended:', data);
        setIsMatchConnected(false);
        setSessionId(null);
        
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        
        // Auto-search if partner left
        if (data.reason === 'partner_left' && socket) {
          setIsSearching(true);
          setTimeout(() => {
            socket.emit('find_match', { mode: 'audio' });
          }, 2000);
        }
      });

      // WebRTC signaling
      socket.on('webrtc-offer', async (data: any) => {
        if (webRTCRef.current) {
          const answer = await webRTCRef.current.handleOffer(data.offer);
          socket.emit('webrtc-answer', { 
            answer, 
            targetUserId: data.fromUserId,
            sessionId: sessionId 
          });
        }
      });

      socket.on('webrtc-answer', async (data: any) => {
        if (webRTCRef.current) {
          await webRTCRef.current.handleAnswer(data.answer);
        }
      });

      socket.on('ice-candidate', async (data: any) => {
        if (webRTCRef.current && data.candidate) {
          await webRTCRef.current.handleIceCandidate(data.candidate);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('session_ended');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      
      if (webRTCRef.current) {
        webRTCRef.current.cleanup();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [socket, handleRemoteStream, startAudioLevelMonitoring]);

  const startLocalAudio = async () => {
    try {
      setIsProcessingAudio(true);
      console.log('🎤 Initializing enhanced audio');
      
      const constraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Enhanced audio constraints
          sampleRate: 44100,
          channelCount: 1,
          volume: 1.0
        }
      };
      
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      if (stream && localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        
        // Start audio level monitoring
        startAudioLevelMonitoring(stream);
        
        console.log('✅ Enhanced local audio initialized');
        setIsProcessingAudio(false);
        return stream;
      }
      
      throw new Error('Failed to initialize audio stream');
    } catch (error: any) {
      setIsProcessingAudio(false);
      console.error('❌ Enhanced audio setup failed:', error);
      
      if (error.name === 'NotAllowedError') {
        setMicBlocked(true);
        throw new Error('Microphone access denied');
      }
      throw error;
    }
  };

  const startChat = () => {
    if (!socket || !socketConnected) return;
    
    console.log('🔍 Starting audio chat search...');
    setIsSearching(true);
    setIsMatchConnected(false);
    socket.emit('find_match', { mode: 'audio' });
  };

  const nextPerson = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    
    if (webRTCRef.current) {
      webRTCRef.current.cleanup();
    }
    
    setTimeout(() => startChat(), 500);
  };

  const endChat = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    
    if (webRTCRef.current) {
      webRTCRef.current.cleanup();
    }
    
    navigate('/');
  };

  const toggleMic = () => {
    if (webRTCRef.current) {
      const newState = webRTCRef.current.toggleAudio();
      setIsMicOn(newState || false);
      console.log('🎤 Mic toggled:', newState ? 'ON' : 'OFF');
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      // Fix: Logic was inverted - when isSpeakerOn is true, we want to mute it (set muted = true)
      const newMutedState = isSpeakerOn; // If speaker is on, we want to mute it
      remoteAudioRef.current.muted = newMutedState;
      setIsSpeakerOn(!isSpeakerOn);
      console.log('🔊 Speaker toggled:', isSpeakerOn ? 'MUTED' : 'UNMUTED');
    }
  };

  // Connection quality indicator
  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Loading states
  if (socketConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Connecting to server...</div>
        </div>
      </div>
    );
  }

  if (!socketConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Connection Error</div>
          <div className="text-gray-300">Please check your internet connection and refresh.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      {/* Enhanced Header with status moved to side */}
      <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <MicrophoneIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Voice Chat</span>
            <span className="sm:hidden">Voice</span>
          </h1>
          
          {/* Status indicator moved to side */}
          {isSearching && (
            <span className="bg-yellow-500 px-2 py-1 rounded-full text-black text-sm font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Searching</span>
              <span className="sm:hidden">•••</span>
            </span>
          )}
          {isMatchConnected && (
            <span className="bg-green-500 px-2 py-1 rounded-full text-black text-sm font-medium flex items-center gap-1">
              <SignalIcon className={`w-3 h-3 ${getQualityColor()}`} />
              <span className="hidden sm:inline">Connected</span>
              <span className="sm:hidden">ON</span>
            </span>
          )}
        </div>
        
        <button
          onClick={endChat}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Audio Area - Enhanced for mobile */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        
        {/* Idle State */}
        {!isSearching && !isMatchConnected && (
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-6 sm:mb-8">
              <MicrophoneIcon className="w-20 h-20 sm:w-32 sm:h-32 mx-auto opacity-50" />
            </div>
            <h2 className="text-2xl sm:text-3xl mb-4 font-semibold">Ready for Voice Chat</h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              Connect instantly with people worldwide through high-quality voice conversations
            </p>
            <button
              onClick={startChat}
              disabled={!socketConnected}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 px-8 py-4 rounded-xl text-lg sm:text-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed shadow-lg"
            >
              {!socketConnected ? 'Connecting...' : 'Find Someone'}
            </button>
          </div>
        )}

        {/* Searching State - Enhanced */}
        {isSearching && (
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative">
                {/* Animated rings */}
                <div className="absolute inset-0 border-4 border-purple-300 border-opacity-20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-purple-400 border-opacity-40 rounded-full animate-ping animation-delay-200"></div>
                <div className="absolute inset-4 border-4 border-purple-500 border-opacity-60 rounded-full animate-ping animation-delay-400"></div>
                <MicrophoneIcon className="w-8 h-8 sm:w-12 sm:h-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl mb-4">Finding someone to talk to...</h2>
            <p className="text-gray-300 text-sm sm:text-base">Connecting you with another person for a voice conversation</p>
          </div>
        )}

        {/* Connected State - Enhanced with audio visualizer */}
        {isMatchConnected && (
          <div className="text-center max-w-md mx-auto w-full">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center relative overflow-hidden">
                <MicrophoneIcon className="w-10 h-10 sm:w-16 sm:h-16 text-white z-10" />
                
                {/* Audio level indicator */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-30 transition-all duration-150"
                  style={{ height: `${micLevel}%` }}
                />
              </div>
              
              {/* Mic level text */}
              {isMicOn && (
                <div className="text-xs sm:text-sm text-gray-300 mt-2">
                  Audio Level: {micLevel}%
                </div>
              )}
            </div>
            
            <h2 className="text-xl sm:text-2xl mb-2 font-semibold">Connected!</h2>
            <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              You're now in a voice conversation with a stranger
            </p>
            
            {/* Compact Audio Controls */}
            <div className="flex gap-4 justify-center mb-6 sm:mb-8">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isMicOn 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } shadow-md`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? (
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                ) : (
                  <MicrophoneSlashIcon className="w-6 h-6 text-white" />
                )}
              </button>
              
              <button
                onClick={toggleSpeaker}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isSpeakerOn 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } shadow-md`}
                title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              >
                {isSpeakerOn ? (
                  <SpeakerWaveIcon className="w-6 h-6 text-white" />
                ) : (
                  <SpeakerXMarkIcon className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={nextPerson}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-colors font-medium"
              >
                Next Person
              </button>
              <button
                onClick={endChat}
                className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <PhoneXMarkIcon className="w-5 h-5" />
                End Chat
              </button>
            </div>
          </div>
        )}

        {/* Hidden audio elements */}
        <audio ref={localAudioRef} muted autoPlay playsInline />
        <audio ref={remoteAudioRef} autoPlay playsInline />
      </div>

      {/* Enhanced Microphone blocked modal */}
      {micBlocked && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
            <div className="text-center">
              <MicrophoneSlashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Microphone Access Required</h3>
              <p className="text-gray-300 mb-6">
                Voice chat needs access to your microphone. Please allow microphone access in your browser settings and try again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMicBlocked(false)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={endChat}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioChat;