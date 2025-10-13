import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  SpeakerXMarkIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  content: string;
  isSent: boolean;
  timestamp: Date;
}

const AudioChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected } = useSocket();
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
  
  // Chat functionality states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🎤 AudioChat component mounted');
    console.log('📡 Socket status:', { socket: !!socket, connected: socketConnected });
    
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

    // Set up WebRTC message handler
    webRTCRef.current.onMessageReceived((message: string) => {
      console.log('💬 Received message via WebRTC:', message);
      addMessage(message, false);
    });

    // Start local audio immediately for readiness
    startLocalAudio();

    // Socket event listeners
    if (socket) {
      socket.on('match-found', async (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('🎤 Audio chat match found:', data);
        setSessionId(data.sessionId);
        setIsSearching(false);
        setMessages([]);
        
        // Configure WebRTC service with match details
        if (webRTCRef.current) {
          // ENSURE FRESH SETUP: Cleanup any previous connection first
          console.log('🔄 Ensuring fresh WebRTC setup for audio chat');
          webRTCRef.current.cleanup();
          
          // REINITIALIZE: Create fresh WebRTC instance for clean setup
          webRTCRef.current = new WebRTCService();
          
          // Set up new connection
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          // CRITICAL: Set audio stream and message callback on NEW instance
          webRTCRef.current.onRemoteStreamReceived((stream: MediaStream) => {
            console.log('🎤 Remote audio stream received:', stream);
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = stream;
              console.log('✅ Remote audio assigned to element');
            }
            setIsConnected(true);
            setIsSearching(false);
            setCallStartTime(new Date());
          });
          
          webRTCRef.current.onMessageReceived((message: string) => {
            console.log('💬 Received message via WebRTC:', message);
            addMessage(message, false);
          });
          
          webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
            setConnectionState(state);
            if (state === 'disconnected') {
              setIsConnected(false);
              setCallStartTime(null);
              setCallDuration(0);
            }
          });
          
          // IMPORTANT: Start local audio first before setting up peer connection
          try {
            await startLocalAudio();
            console.log('🎤 Local audio started for peer connection');
          } catch (error) {
            console.error('❌ Failed to start local audio:', error);
            console.error('Microphone access required for audio chat');
            return;
          }
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for audio chat partner:', data);
        setQueueInfo(data);
        setIsSearching(true);
        setIsConnected(false); // Ensure we're not showing connected during search
        
        // Add search message if first time
        if (messages.length === 0 || messages[messages.length - 1].content.indexOf('Searching') === -1) {
          addMessage('Searching for someone to chat with...', false);
        }
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Audio chat session ended:', data);
        
        // Reset connection states
        setIsConnected(false);
        setSessionId(null);
        setCallStartTime(null);
        setCallDuration(0);
        setMessages([]);
        setIsSearching(false);
        
        // Don't cleanup WebRTC here - it might be needed for immediate reconnect
        console.log('🔄 Session ended, ready for new match');
      });

      socket.on('chat_message', (data: { message: string, userId?: string }) => {
        console.log('💬 Received audio chat message:', data);
        addMessage(data.message, false);
      });

      // WebRTC signaling event listeners
      socket.on('webrtc-offer', (data: { offer: RTCSessionDescriptionInit, sessionId: string }) => {
        console.log('🤝 Received WebRTC offer for audio chat');
        if (webRTCRef.current && sessionId === data.sessionId) {
          webRTCRef.current.handleOffer(data.offer);
        }
      });

      socket.on('webrtc-answer', (data: { answer: RTCSessionDescriptionInit, sessionId: string }) => {
        console.log('✅ Received WebRTC answer for audio chat');
        if (webRTCRef.current && sessionId === data.sessionId) {
          webRTCRef.current.handleAnswer(data.answer);
        }
      });

      socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit, sessionId: string }) => {
        console.log('🧊 Received ICE candidate for audio chat');
        if (webRTCRef.current && sessionId === data.sessionId) {
          webRTCRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on('user_disconnected', (data: { reason?: string }) => {
        console.log('👋 Audio chat partner disconnected:', data);
        
        // Clean up current connection
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        
        // Reset states
        setIsConnected(false);
        setSessionId(null);
        setCallStartTime(null);
        setCallDuration(0);
        setMessages([]);
        setIsSearching(false);
        
        // Show disconnect message and auto-restart search
        addMessage('Partner disconnected. Searching for someone new...', false);
        
        setTimeout(() => {
          console.log('🔄 Auto-restarting search after partner disconnect');
          startNewChat();
        }, 1000);
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
      socket?.off('chat_message');
      socket?.off('user_disconnected');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      socket?.off('error');
    };
  }, [socket]);

  // Auto-start matching when component mounts and socket is ready (like VideoChat)
  useEffect(() => {
    if (socket && socketConnected && !isConnected && !isSearching) {
      console.log('🎤 Auto-starting audio chat matching...');
      setTimeout(() => {
        startNewChat();
      }, 1000); // Small delay to ensure WebRTC is initialized
    }
  }, [socket, socketConnected]);

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
      console.log('🎤 Starting local audio with enhanced constraints');
      const constraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16
        }
      };
      
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      if (stream && localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        console.log('✅ Local audio stream initialized');
        
        // Set initial mic state based on audio tracks
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          setIsMicOn(audioTracks[0].enabled);
          console.log('🎤 Mic initial state:', audioTracks[0].enabled);
        }
      }
    } catch (error) {
      console.error('❌ Failed to start local audio:', error);
      addMessage('Microphone access denied. Please allow microphone access and refresh.', false);
    }
  };

  const startNewChat = (forceCleanup = false) => {
    if (!socket) {
      console.error('❌ Socket not available');
      addMessage('Connection error. Please refresh the page.', false);
      return;
    }
    
    if (!socketConnected) {
      console.error('❌ Socket not connected to server');
      addMessage('Not connected to server. Please check your internet.', false);
      return;
    }
    
    // INSTANT DISCONNECT: End current session first if exists
    if (sessionId && isConnected) {
      console.log('🔄 Ending current audio session immediately:', sessionId);
      socket.emit('end_session', { 
        sessionId: sessionId,
        duration: callDuration 
      });
      
      // Notify partner immediately
      socket.emit('session_ended', { 
        sessionId: sessionId,
        reason: 'user_clicked_next' 
      });
    }
    
    // FORCE CLEANUP: For fresh reconnects (same users scenario)
    if (forceCleanup) {
      console.log('🧹 Force cleaning audio streams for fresh reconnect');
      
      // Clean local audio
      if (localAudioRef.current?.srcObject) {
        const localStream = localAudioRef.current.srcObject as MediaStream;
        localStream.getTracks().forEach(track => {
          console.log('🛑 Stopping local audio track:', track.kind);
          track.stop();
        });
        localAudioRef.current.srcObject = null;
      }
      
      // Clean remote audio
      if (remoteAudioRef.current?.srcObject) {
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;  
        remoteStream.getTracks().forEach(track => {
          console.log('🛑 Stopping remote audio track:', track.kind);
          track.stop();
        });
        remoteAudioRef.current.srcObject = null;
      }
      
      // Force WebRTC cleanup
      if (webRTCRef.current) {
        console.log('🔌 Force disconnecting WebRTC for fresh audio connection');
        webRTCRef.current.forceDisconnect();
      }
      
      console.log('✅ Force cleanup completed for fresh reconnect');
      
      // REINITIALIZE WebRTC after cleanup for fresh connection
      setTimeout(() => {
        if (webRTCRef.current) {
          console.log('🔄 Reinitializing WebRTC service after cleanup');
          webRTCRef.current = new WebRTCService();
          console.log('✅ Fresh WebRTC instance created');
        }
      }, 100);
    }
    
    // INSTANT STATE RESET
    setIsConnected(false);
    setSessionId(null);
    setMessages([]);
    setIsSearching(true);
    setCallStartTime(null);
    setCallDuration(0);
    
    // START NEW SEARCH (with delay if force cleanup)
    const searchDelay = forceCleanup ? 200 : 0;
    setTimeout(() => {
      console.log('🔍 Starting search for audio chat partner');
      socket.emit('find_match', { mode: 'audio' });
      console.log('✅ Audio chat partner search started');
      addMessage('Searching for someone to chat with...', false);
    }, searchDelay);
  };

  // Legacy findMatch for backward compatibility
  const findMatch = () => {
    startNewChat();
  };

  const nextMatch = () => {
    console.log('🔄 Next Person clicked - using force cleanup for fresh audio reconnect');
    
    // Use startNewChat with force cleanup for same users reconnection
    startNewChat(true);
  };

  const exitChat = () => {
    // Clean up current session
    if (sessionId) {
      socket?.emit('end_session', { sessionId, duration: callDuration });
    }
    
    // Clean up WebRTC
    if (webRTCRef.current) {
      webRTCRef.current.forceDisconnect();
    }
    
    // Navigate to home
    navigate('/');
  };

  const toggleMic = () => {
    console.log('🎤 Toggling microphone:', isMicOn ? 'OFF' : 'ON');
    const newState = webRTCRef.current?.toggleAudio();
    setIsMicOn(newState || false);
    
    // Visual feedback for mic state
    if (newState) {
      console.log('✅ Microphone enabled');
    } else {
      console.log('🔇 Microphone disabled');
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      console.log('🔊 Toggling speaker:', isSpeakerOn ? 'OFF' : 'ON');
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
      
      if (!isSpeakerOn) {
        console.log('✅ Speaker enabled');
      } else {
        console.log('🔇 Speaker disabled');
      }
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

  // Chat messaging functions
  const addMessage = (content: string, isSent: boolean) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      isSent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    
    // Auto scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && sessionId) {
      // Send via WebRTC data channel first
      if (webRTCRef.current) {
        webRTCRef.current.sendMessage(messageInput);
      }
      
      // Also send via socket as backup
      socket?.emit('chat_message', { 
        sessionId, 
        message: messageInput 
      });
      
      addMessage(messageInput, true);
      setMessageInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-bold">Voice Chat</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              !socketConnected ? 'bg-red-500' :
              isConnected && connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' || isSearching ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-300 text-sm capitalize">
              {!socketConnected ? 'disconnected' :
               isConnected && connectionState === 'connected' ? 'connected' :
               isSearching ? 'searching' : connectionState}
            </span>
          </div>
        </div>
        
        <button
          onClick={exitChat}
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
              onClick={() => startNewChat()}
              disabled={!socketConnected || isSearching}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
            >
              {!socketConnected ? 'Connecting...' : 'Find Someone'}
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

      {/* Chat Panel */}
      {showChat && isConnected && (
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border-t border-gray-600 max-h-96 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-64">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start chatting while talking!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.isSent
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <form onSubmit={sendMessage} className="flex p-4 border-t border-gray-600">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-l-lg border border-gray-600 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-r-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Controls */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm p-6">
        <div className="flex justify-center space-x-6">
          {/* Chat Toggle */}
          {isConnected && (
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-4 rounded-full transition-colors shadow-lg ${
                showChat
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
            </button>
          )}

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

          {/* Exit Chat */}
          <button
            onClick={exitChat}
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