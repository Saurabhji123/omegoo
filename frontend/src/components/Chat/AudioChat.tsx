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
  
  // Match VideoChat state pattern exactly
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Chat functionality (same as VideoChat)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio specific states
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [queueInfo, setQueueInfo] = useState<{ position: number, totalWaiting: number } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Define reusable remote stream handler (copy from VideoChat)
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log('🎤 Remote audio stream received:', {
      audio: stream.getAudioTracks().length > 0,
      tracks: stream.getTracks().length,
      id: stream.id
    });
    
    if (remoteAudioRef.current) {
      // Always set the remote stream
      remoteAudioRef.current.srcObject = stream;
      console.log('✅ Remote audio assigned to element');
      
      // Force play the remote audio
      remoteAudioRef.current.play().catch(error => {
        console.warn('Remote audio autoplay prevented:', error);
      });
      
      console.log('🎤 Remote audio setup completed');
    }
    
    // Update connection state
    setIsMatchConnected(true);
    setIsSearching(false);
    setCallStartTime(new Date());
  }, []);

  useEffect(() => {
    console.log('🎤 AudioChat component mounted - following VideoChat pattern');
    console.log('📡 Socket status:', { socket: !!socket, connected: socketConnected });
    
    // Initialize WebRTC service
    webRTCRef.current = new WebRTCService();
    
    // Set up remote audio stream handler
    webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      console.log('🔗 WebRTC connection state:', state);
      if (state === 'disconnected') {
        setIsMatchConnected(false);
        setCallStartTime(null);
        setCallDuration(0);
      }
    });

    // Set up message handler
    webRTCRef.current.onMessageReceived((message: string) => {
      console.log('💬 Received message via WebRTC:', message);
      addMessage(message, false);
    });

    // Socket event listeners (copy VideoChat pattern)
    if (socket) {
      socket.on('match-found', async (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('🎤 Audio chat match found:', data);
        console.log('🎯 Updating state - sessionId:', data.sessionId, 'isSearching: false');
        setSessionId(data.sessionId);
        setIsSearching(false);
        setMessages([]);
        
        // Configure WebRTC service with match details (same as VideoChat)
        if (webRTCRef.current) {
          // ENSURE FRESH SETUP: Cleanup any previous connection first
          console.log('🔄 Ensuring fresh WebRTC setup for audio chat');
          webRTCRef.current.cleanup();
          
          // REINITIALIZE: Create fresh WebRTC instance for clean setup
          webRTCRef.current = new WebRTCService();
          
          // Set up new connection
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          // CRITICAL: Set audio stream and message callback on NEW instance
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          
          webRTCRef.current.onMessageReceived((message: string) => {
            console.log('💬 Received message via WebRTC:', message);
            addMessage(message, false);
          });
          
          webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
            console.log('🔗 WebRTC connection state:', state);
            if (state === 'disconnected') {
              setIsMatchConnected(false);
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
            return;
          }
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Received searching event for audio partner:', data);
        setQueueInfo(data);
        setIsSearching(true);
        setIsMatchConnected(false);
        console.log('🎯 State updated - isSearching: true, isMatchConnected: false');
        
        if (messages.length === 0) {
          addMessage('Searching for someone to chat with...', false);
        }
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Audio session ended:', data);
        setIsMatchConnected(false);
        setSessionId('');
        setCallStartTime(null);
        setCallDuration(0);
        setMessages([]);
        setIsSearching(false);
      });

      socket.on('chat_message', (data: { message: string, userId?: string }) => {
        console.log('💬 Received audio chat message:', data);
        addMessage(data.message, false);
      });

      socket.on('user_disconnected', (data: { reason?: string }) => {
        console.log('👋 Audio partner disconnected:', data);
        
        setIsMatchConnected(false);
        setSessionId('');
        setCallStartTime(null);
        setCallDuration(0);
        setMessages([]);
        setIsSearching(false);
        
        addMessage('Partner disconnected. Searching for someone new...', false);
        
        setTimeout(() => {
          startNewChat();
        }, 1000);
      });

      // WebRTC signaling events (same as VideoChat)
      socket.on('webrtc-offer', (data: { offer: RTCSessionDescriptionInit, sessionId: string }) => {
        console.log('🤝 Received WebRTC offer for audio');
        if (webRTCRef.current && sessionId === data.sessionId) {
          webRTCRef.current.handleOffer(data.offer);
        }
      });

      socket.on('webrtc-answer', (data: { answer: RTCSessionDescriptionInit, sessionId: string }) => {
        console.log('✅ Received WebRTC answer for audio');
        if (webRTCRef.current && sessionId === data.sessionId) {
          webRTCRef.current.handleAnswer(data.answer);
        }
      });

      socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit, sessionId: string }) => {
        console.log('🧊 Received ICE candidate for audio');
        if (webRTCRef.current && sessionId === data.sessionId) {
          webRTCRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on('error', (data: { message: string }) => {
        console.error('🚨 Audio chat error:', data.message);
      });
    }

    // Start local audio immediately
    startLocalAudio();

    return () => {
      console.log('🧹 AudioChat component cleanup');
      
      // Clean up WebRTC
      if (webRTCRef.current) {
        webRTCRef.current.forceDisconnect();
      }
      
      // Clean up audio elements
      if (localAudioRef.current?.srcObject) {
        const localStream = localAudioRef.current.srcObject as MediaStream;
        localStream.getTracks().forEach(track => track.stop());
        localAudioRef.current.srcObject = null;
      }
      
      if (remoteAudioRef.current?.srcObject) {
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;
        remoteStream.getTracks().forEach(track => track.stop());
        remoteAudioRef.current.srcObject = null;
      }
      
      // Remove all socket listeners
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('session_ended');
      socket?.off('chat_message');
      socket?.off('user_disconnected');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      socket?.off('error');
      
      console.log('✅ AudioChat cleanup completed');
    };
  }, [socket, handleRemoteStream]);

  // Remove auto-start - user must click "Find Someone" like VideoChat
  // useEffect(() => {
  //   if (socket && socketConnected && !isMatchConnected && !isSearching) {
  //     console.log('🎤 Auto-starting audio chat search');
  //     setTimeout(() => {
  //       startNewChat();
  //     }, 1000);
  //   }
  // }, [socket, socketConnected]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStartTime && isMatchConnected) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStartTime, isMatchConnected]);

  const startLocalAudio = async () => {
    try {
      console.log('🎤 Starting local audio');
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
        console.log('✅ Local audio initialized');
        
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          setIsMicOn(audioTracks[0].enabled);
        }
      }
    } catch (error) {
      console.error('❌ Failed to start local audio:', error);
      addMessage('Microphone access required. Please allow and refresh.', false);
    }
  };

  // Chat messaging functions (same as VideoChat)
  const addMessage = (content: string, isSent: boolean) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      isSent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    
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

  // Session management functions (copy VideoChat pattern)
  const startNewChat = (forceCleanup = false) => {
    console.log('🎤 startNewChat called with:', { forceCleanup, socket: !!socket, socketConnected, isSearching, isMatchConnected });
    
    if (!socket) {
      console.error('❌ Socket not available');
      addMessage('Connection error. Please refresh the page.', false);
      return;
    }
    
    if (!socketConnected) {
      console.error('❌ Socket not connected');
      addMessage('Not connected to server. Please check your internet.', false);
      return;
    }
    
    // INSTANT DISCONNECT: End current session first if exists
    if (sessionId && isMatchConnected) {
      console.log('🔄 Ending current session immediately:', sessionId);
      socket.emit('end_session', { 
        sessionId: sessionId,
        duration: callDuration 
      });
      
      socket.emit('session_ended', { 
        sessionId: sessionId,
        reason: 'user_clicked_next' 
      });
    }
    
    // FORCE CLEANUP: For fresh reconnects (same users scenario)
    if (forceCleanup) {
      console.log('🧹 Force cleaning audio streams for fresh reconnect');
      
      if (localAudioRef.current?.srcObject) {
        const localStream = localAudioRef.current.srcObject as MediaStream;
        localStream.getTracks().forEach(track => track.stop());
        localAudioRef.current.srcObject = null;
      }
      
      if (remoteAudioRef.current?.srcObject) {
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;  
        remoteStream.getTracks().forEach(track => track.stop());
        remoteAudioRef.current.srcObject = null;
      }
      
      if (webRTCRef.current) {
        webRTCRef.current.forceDisconnect();
      }
      
      setTimeout(() => {
        if (webRTCRef.current) {
          webRTCRef.current = new WebRTCService();
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
        }
      }, 100);
    }
    
    // INSTANT STATE RESET
    setIsMatchConnected(false);
    setSessionId('');
    setMessages([]);
    setIsSearching(true);
    setCallStartTime(null);
    setCallDuration(0);
    
    // START NEW SEARCH
    const searchDelay = forceCleanup ? 200 : 0;
    setTimeout(() => {
      console.log('🔍 Starting search for audio partner');
      console.log('📡 Emitting find_match with mode: audio');
      socket.emit('find_match', { mode: 'audio' });
      console.log('✅ find_match event emitted successfully');
      addMessage('Searching for someone to chat with...', false);
    }, searchDelay);
  };

  const nextMatch = () => {
    console.log('🔄 Next Person clicked for audio chat');
    startNewChat(true);
  };

  const exitChat = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId, duration: callDuration });
    }
    
    if (webRTCRef.current) {
      webRTCRef.current.forceDisconnect();
    }
    
    navigate('/');
  };

  const toggleMic = () => {
    console.log('🎤 Toggling microphone');
    const newState = webRTCRef.current?.toggleAudio();
    setIsMicOn(newState || false);
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      console.log('🔊 Toggling speaker');
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
              !socketConnected ? 'bg-red-500' :
              isMatchConnected ? 'bg-green-500' : 
              isSearching ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-300 text-sm capitalize">
              {!socketConnected ? 'disconnected' :
               isMatchConnected ? 'connected' :
               isSearching ? 'searching' : 'ready'}
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
        {!isSearching && !isMatchConnected && (
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
        {isSearching && !isMatchConnected && (
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
        {isMatchConnected && (
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
      {showChat && isMatchConnected && (
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border-t border-gray-600 max-h-96 flex flex-col">
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
          {isMatchConnected && (
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
          {isMatchConnected && (
            <button
              onClick={nextMatch}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-full transition-colors shadow-lg"
            >
              <ArrowPathIcon className="w-8 h-8" />
            </button>
          )}

          {/* Report Button */}
          {isMatchConnected && (
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
            {isMicOn && isSpeakerOn && isMatchConnected && "🎤 Voice chat active"}
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