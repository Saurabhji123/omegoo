import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import WebRTCService from '../../services/webrtc';
import { 
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSlashIcon } from '@heroicons/react/24/solid';

interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
}

const VideoChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting } = useSocket();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false); // Renamed for clarity - this is for match connection
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  // const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTextChat, setShowTextChat] = useState(true); // Default show for better UX
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [cameraBlocked, setCameraBlocked] = useState(false);

  useEffect(() => {
    // Initialize WebRTC service without socket (we'll use the context socket)
    webRTCRef.current = new WebRTCService();
    
    // Set up event listeners
    webRTCRef.current.onRemoteStreamReceived((stream: MediaStream) => {
      console.log('📺 Remote stream received in component:', {
        video: stream.getVideoTracks().length > 0,
        audio: stream.getAudioTracks().length > 0,
        sessionId: sessionId
      });
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        console.log('✅ Remote stream assigned to video element');
        
        // Ensure remote video plays
        remoteVideoRef.current.play().catch(error => {
          console.warn('Remote video autoplay prevented:', error);
        });
        
        // Video connected - no system message needed
      }
      
      setIsMatchConnected(true);
      setIsSearching(false);
    });

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      // setConnectionState(state);
      if (state === 'disconnected') {
        setIsMatchConnected(false);
      }
    });

    // Socket event listeners
    if (socket) {
      socket.on('match-found', async (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('📱 Video chat match found:', data);
        setSessionId(data.sessionId);
        setIsSearching(false);
        setMessages([]);
        // Match found - no system message needed
        
        // Configure WebRTC service with match details
        if (webRTCRef.current) {
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          // IMPORTANT: Start local video first before setting up peer connection
          try {
            await startLocalVideo();
            console.log('📹 Local video started for peer connection');
          } catch (error) {
            console.error('❌ Failed to start local video:', error);
            console.error('Camera access required for video chat');
            return;
          }
          
          // Set up ICE candidate handling through main socket
          webRTCRef.current.setIceCandidateCallback((candidate: RTCIceCandidate) => {
            console.log('🧊 Sending ICE candidate to peer');
            socket.emit('ice-candidate', {
              candidate: candidate,
              targetUserId: data.matchUserId,
              sessionId: data.sessionId
            });
          });
          
          // Set up data channel message handling
          webRTCRef.current.onMessageReceived((message: string) => {
            console.log('📩 Received data channel message:', message);
            addMessage(message, false);
          });
          
          // If we're the initiator, create and send offer
          if (data.isInitiator) {
            try {
              // Small delay to ensure local stream is properly added
              setTimeout(async () => {
                const offer = await webRTCRef.current!.createWebRTCOffer();
                socket.emit('webrtc-offer', { 
                  offer, 
                  targetUserId: data.matchUserId,
                  sessionId: data.sessionId 
                });
                console.log('📞 Sent WebRTC offer as initiator');
              }, 1000);
            } catch (error) {
              console.error('❌ Failed to create offer:', error);
              console.error('Failed to establish video connection');
            }
          }
          
          console.log('Video chat ready!');
          setIsMatchConnected(true);
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for video chat partner:', data);
        setIsSearching(true);
      });

      socket.on('chat_message', (data: { content: string; timestamp: number; sessionId: string; fromUserId?: string }) => {
        console.log('� RECEIVED MESSAGE IN FRONTEND:', data);
        console.log('🔍 Current sessionId state:', sessionId);
        console.log('🔍 isMatchConnected state:', isMatchConnected);
        console.log('🔍 Session comparison:', { 
          received: data.sessionId, 
          current: sessionId, 
          match: data.sessionId === sessionId,
          receivedType: typeof data.sessionId,
          currentType: typeof sessionId,
          receivedLength: data.sessionId?.length,
          currentLength: sessionId?.length
        });
        
        // Display clean message without username
        addMessage(data.content, false);
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Video chat session ended:', data);
        
        // INSTANT CLEANUP
        setIsMatchConnected(false);
        setSessionId(null);
        setMessages([]);
        
        // Clean up WebRTC connection immediately
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        
        // AUTO-START NEW SEARCH if partner left
        if (data.reason === 'partner_left' && socket) {
          console.log('🔄 Partner left, automatically searching for new partner...');
          setIsSearching(true);
          setTimeout(() => {
            socket.emit('find_match', { mode: 'video' });
            console.log('✅ Auto-search started after partner left');
          }, 1000); // Small delay for smoother UX
        }
        
        console.log(`Chat ended. ${data.reason || 'Your partner left the chat.'}`);
      });

      socket.on('user_disconnected', (data: { userId: string }) => {
        console.log('👋 User disconnected:', data.userId);
        // This will help clean up any stale connections
        if (webRTCRef.current) {
          // Could add specific cleanup for this user if needed
        }
      });

      // WebRTC signaling events
      socket.on('webrtc-offer', async (data: any) => {
        console.log('📞 Received WebRTC offer from:', data.fromUserId);
        if (webRTCRef.current) {
          try {
            const answer = await webRTCRef.current.handleOffer(data.offer);
            socket.emit('webrtc-answer', { 
              answer, 
              targetUserId: data.fromUserId,
              sessionId: sessionId 
            });
          } catch (error) {
            console.error('Error handling WebRTC offer:', error);
          }
        }
      });

      socket.on('webrtc-answer', async (data: any) => {
        console.log('📞 Received WebRTC answer from:', data.fromUserId);
        if (webRTCRef.current) {
          try {
            await webRTCRef.current.handleAnswer(data.answer);
          } catch (error) {
            console.error('Error handling WebRTC answer:', error);
          }
        }
      });

      socket.on('ice-candidate', async (data: any) => {
        console.log('🧊 Received ICE candidate from:', data.fromUserId);
        if (webRTCRef.current && data.candidate) {
          try {
            await webRTCRef.current.handleIceCandidate(data.candidate);
          } catch (error) {
            console.error('Error handling ICE candidate:', error);
          }
        }
      });

      socket.on('error', (data: { message: string }) => {
        console.error('🚨 Video chat error:', data.message);
        console.error(`Error: ${data.message}`);
      });
    }

    // Start local video
    startLocalVideo();

    return () => {
      console.log('🧹 VideoChat component cleanup');
      
      // Clean up WebRTC
      if (webRTCRef.current) {
        webRTCRef.current.forceDisconnect();
      }
      
      // Clean up video elements
      if (localVideoRef.current?.srcObject) {
        const localStream = localVideoRef.current.srcObject as MediaStream;
        localStream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
      
      if (remoteVideoRef.current?.srcObject) {
        const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
        remoteStream.getTracks().forEach(track => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
      
      // Remove all socket listeners
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('chat_message');
      socket?.off('session_ended');
      socket?.off('user_disconnected');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      socket?.off('error');
      
      console.log('✅ VideoChat cleanup completed');
    };
  }, [socket]);

  // Auto-start matching when component mounts and socket is ready
  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket status:', {
        connected: socket.connected,
        id: socket.id,
        transport: socket.io.engine?.transport?.name || 'unknown',
        backendUrl: window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://omegoo-api-clean.onrender.com'
      });
      
      // Add more socket event debugging
      socket.on('connect', () => {
        console.log('✅ Socket connected!', socket.id);
        console.log('Connected to server!');
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected!');
        console.log('Disconnected from server');
      });

      socket.on('connect_error', (error) => {
        console.error('🚨 Socket connection error:', error);
        console.error('Connection error: ' + error.message);
      });

      // Debug specific events
      socket.on('match-found', (data) => {
        console.log('🎯 MATCH-FOUND EVENT RECEIVED:', data);
      });

      socket.on('searching', (data) => {
        console.log('� SEARCHING EVENT RECEIVED:', data);
      });

      socket.on('error', (data) => {
        console.log('🚨 ERROR EVENT RECEIVED:', data);
      });

      // Handle multi-device connection replacement
      socket.on('connection_replaced', (data) => {
        console.log('🔄 Connection replaced by new device:', data);
        alert('This session was replaced by a new device connection. Please refresh to reconnect.');
        // Clean up current session
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        setIsMatchConnected(false);
        setIsSearching(false);
        setMessages([]);
        navigate('/');
      });
      
      // Only show connection status, don't auto-start
      if (!socket.connected) {
        console.log('⏳ Socket not connected yet, waiting...');
        console.log('Connecting to server...');
      } else {
        console.log('Ready to chat! Click "New" to find someone.');
      }
    } else {
      console.error('❌ No socket available! Please refresh the page.');
    }
  }, [socket]);

  const startLocalVideo = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('🎥 Requesting user media with constraints:', constraints);
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setCameraBlocked(false);
        console.log('✅ Local video stream set to video element');
        
        // Ensure video plays
        try {
          await localVideoRef.current.play();
        } catch (playError) {
          console.warn('Auto-play prevented, user interaction needed');
        }
      }
    } catch (error) {
      console.error('❌ Failed to start local video:', error);
      setCameraBlocked(true);
      addMessage('Camera/microphone access denied. Please allow access and refresh.', false);
    }
  };

  const addMessage = (content: string, isOwnMessage: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      content,
      isOwnMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    // Auto scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const startNewChat = () => {
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
      console.log('� Ending current session immediately:', sessionId);
      socket.emit('end_session', { 
        sessionId: sessionId,
        duration: Date.now() 
      });
      
      // Notify partner immediately
      socket.emit('session_ended', { 
        sessionId: sessionId,
        reason: 'user_clicked_next' 
      });
    }
    
    // INSTANT CLEANUP: Clear WebRTC connection immediately
    if (webRTCRef.current) {
      webRTCRef.current.cleanup();
      console.log('🧹 WebRTC cleaned up instantly');
    }
    
    // INSTANT STATE RESET
    setIsMatchConnected(false);
    setSessionId(null);
    setMessages([]);
    setIsSearching(true);
    
    // START NEW SEARCH IMMEDIATELY
    console.log('🔍 Starting immediate search for new partner');
    socket.emit('find_match', { mode: 'video' });
    console.log('✅ New partner search started');
    addMessage('Searching for someone to chat with...', false);
  };

  const nextMatch = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    startNewChat();
  };

  const exitChat = () => {
    // Clean up current session
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    
    // Clean up WebRTC
    if (webRTCRef.current) {
      webRTCRef.current.forceDisconnect();
    }
    
    // Navigate to home
    navigate('/');
  };

  const toggleCamera = () => {
    const newState = webRTCRef.current?.toggleVideo();
    setIsCameraOn(newState || false);
  };

  const toggleMic = () => {
    const newState = webRTCRef.current?.toggleAudio();
    setIsMicOn(newState || false);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !isMatchConnected || !sessionId || !socket) {
      console.warn('❌ Cannot send message:', {
        hasInput: !!messageInput.trim(),
        isMatchConnected,
        hasSessionId: !!sessionId,
        hasSocket: !!socket
      });
      return;
    }
    
    const content = messageInput.trim();
    addMessage(content, true);
    
    // Send message via socket
    socket.emit('chat_message', {
      sessionId,
      content,
      type: 'text'
    });
    
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleReport = () => {
    if (sessionId) {
      socket?.emit('report_user', {
        sessionId,
        reason: 'Inappropriate behavior',
        description: 'Reported from video chat'
      });
    }
    nextMatch();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col lg:flex-row">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header - More compact on mobile */}
        <div className="bg-primary-600 dark:bg-primary-700 px-3 py-2 lg:px-4 lg:py-3 flex items-center justify-between shadow-lg safe-area-top">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <h1 className="text-white text-lg lg:text-2xl font-bold">Omegoo</h1>
            <span className="text-primary-100 text-xs lg:text-sm hidden sm:inline">Talk to strangers!</span>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
              socketConnected && isMatchConnected ? 'bg-green-400' : 
              socketConnected && isSearching ? 'bg-yellow-400' : 
              socketConnecting ? 'bg-orange-400' :
              socketConnected ? 'bg-blue-400' : 'bg-red-400'
            }`}></div>
            <span className="text-white text-xs lg:text-sm font-medium">
              {socketConnected && isMatchConnected ? 'Connected' : 
               socketConnected && isSearching ? 'Finding Partner...' : 
               socketConnecting ? 'Connecting to Server...' :
               socketConnected ? 'Ready' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Video Container - Responsive */}
        <div className="flex-1 bg-black relative min-h-0">
          {/* Camera Blocked Warning */}
          {cameraBlocked && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded text-sm z-10">
              Camera blocked. Please enable it and try again.
            </div>
          )}

          {/* Remote Video */}
          <div className="w-full h-full">
            {isMatchConnected ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 p-4">
                {isSearching ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-sm lg:text-base">Looking for someone you can chat with...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoCameraSlashIcon className="w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 text-gray-600" />
                    <p className="text-sm lg:text-base">Your partner's video will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Local Video - Responsive positioning */}
          <div className="absolute bottom-20 right-2 lg:bottom-4 lg:left-4">
            <div className="w-24 h-18 lg:w-40 lg:h-28 bg-gray-800 rounded border-2 border-gray-600 overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoCameraSlashIcon className="w-4 h-4 lg:w-8 lg:h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Controls - Mobile friendly */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 lg:bottom-4">
            <div className="flex space-x-2 lg:space-x-3">
              {/* Camera Toggle */}
              <button
                onClick={toggleCamera}
                className={`p-2 lg:p-3 rounded-full ${
                  isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                } text-white transition-colors touch-manipulation`}
              >
                {isCameraOn ? (
                  <VideoCameraIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                ) : (
                  <VideoCameraSlashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                )}
              </button>

              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`p-2 lg:p-3 rounded-full ${
                  isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                } text-white transition-colors touch-manipulation`}
              >
                {isMicOn ? (
                  <MicrophoneIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                ) : (
                  <MicrophoneSlashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions - Mobile Responsive */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-3 lg:px-4 lg:py-4 safe-area-bottom">
          {/* Main Action Buttons - Simplified */}
          <div className="flex justify-center space-x-3 lg:space-x-4 mb-3">
            {!isMatchConnected ? (
              <button
                onClick={startNewChat}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 lg:px-8 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                disabled={isSearching}
              >
                {isSearching ? 'Connecting...' : 'Find Someone'}
              </button>
            ) : (
              <>
                <button
                  onClick={nextMatch}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                >
                  Next Person
                </button>
                
                <button
                  onClick={handleReport}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                >
                  Report
                </button>
              </>
            )}

            <button
              onClick={exitChat}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
            >
              Exit
            </button>
          </div>

          {/* Quick Options - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm">
            <button 
              onClick={() => setShowTextChat(!showTextChat)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation flex items-center space-x-1"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>{showTextChat ? 'Hide Chat' : 'Show Chat'}</span>
            </button>
            <button 
              onClick={() => navigate('/chat/text')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation"
            >
              Text Only Mode
            </button>
          </div>
        </div>
      </div>

      {/* Text Chat Panel - Enhanced for Video + Chat */}
      {showTextChat && (
        <div className="absolute lg:relative inset-x-0 bottom-0 lg:inset-auto lg:w-80 bg-gray-800 bg-opacity-95 backdrop-blur-sm border-t lg:border-l lg:border-t-0 border-gray-700 flex flex-col max-h-72 lg:max-h-full shadow-lg">
          {/* Chat Header */}
          <div className="bg-gray-700 px-3 py-2 lg:px-4 lg:py-3 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm lg:text-base">Text Chat</h3>
              <button
                onClick={() => setShowTextChat(false)}
                className="text-gray-400 hover:text-white text-lg lg:text-xl touch-manipulation"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-4 lg:mt-8">
                <ChatBubbleLeftRightIcon className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 text-gray-600" />
                <p className="text-xs lg:text-sm">Start typing to chat with your partner</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-2 py-1 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm ${
                        message.isOwnMessage
                          ? 'bg-primary-600 text-white'
                          : message.content.includes('Connected!') || message.content.includes('ended') || message.content.includes('Error:')
                          ? 'bg-gray-600 text-gray-200 text-center'
                          : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      {!message.content.includes('Connected!') && !message.content.includes('ended') && !message.content.includes('Error:') && (
                        <p className={`text-xs mt-1 ${
                          message.isOwnMessage ? 'text-primary-200' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input - Always Available */}
          <div className="p-3 lg:p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={socketConnected ? (isMatchConnected ? "Type a message..." : "Find someone to chat") : "Connecting to server..."}
                disabled={!socketConnected || !isMatchConnected}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm touch-manipulation disabled:bg-gray-800 disabled:text-gray-500"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || !socketConnected || !isMatchConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded transition-colors touch-manipulation"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {socketConnected && isMatchConnected ? "Chat while video is on for silent communication" : 
               socketConnected && isSearching ? "Connecting to someone..." : 
               socketConnected ? "Find someone to start chatting" : "Connecting to server..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;