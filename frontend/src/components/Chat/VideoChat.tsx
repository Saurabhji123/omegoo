import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import WebRTCService from '../../services/webrtc';
import { 
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
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
  const { socket } = useSocket();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  // const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTextChat, setShowTextChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [cameraBlocked, setCameraBlocked] = useState(false);

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
      // setConnectionState(state);
      if (state === 'disconnected') {
        setIsConnected(false);
      }
    });

    // Socket event listeners
    if (socket) {
      socket.on('match-found', (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('📱 Video chat match found:', data);
        setSessionId(data.sessionId);
        setIsConnected(true);
        setIsSearching(false);
        setMessages([]);
        addMessage('Connected! You can now start video chatting.', false);
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for video chat partner:', data);
        setIsSearching(true);
      });

      socket.on('chat_message', (data: { content: string; timestamp: number; sessionId: string }) => {
        console.log('💬 Received text message in video chat:', data);
        if (data.sessionId === sessionId) {
          addMessage(data.content, false);
        }
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Video chat session ended:', data);
        setIsConnected(false);
        setSessionId(null);
        setMessages([]);
        addMessage(`Chat ended. ${data.reason || 'Your partner left the chat.'}`, false);
      });

      socket.on('error', (data: { message: string }) => {
        console.error('🚨 Video chat error:', data.message);
        addMessage(`Error: ${data.message}`, false);
      });
    }

    // Start local video
    startLocalVideo();

    return () => {
      if (webRTCRef.current) {
        webRTCRef.current.cleanup();
      }
      
      // Remove all socket listeners
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('chat_message');
      socket?.off('session_ended');
      socket?.off('error');
    };
  }, [socket]);

  // Auto-start matching when component mounts and socket is ready
  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket status:', {
        connected: socket.connected,
        id: socket.id,
        transport: socket.io.engine.transport.name
      });
      
      if (socket.connected && !isConnected && !isSearching) {
        console.log('🚀 Auto-starting chat matching...');
        setTimeout(() => {
          startNewChat();
        }, 1000); // Small delay to ensure WebRTC is initialized
      } else if (!socket.connected) {
        addMessage('Connecting to server...', false);
      }
    }
  }, [socket]);

  const startLocalVideo = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        },
        audio: true
      };
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setCameraBlocked(false);
      }
    } catch (error) {
      console.error('Failed to start local video:', error);
      setCameraBlocked(true);
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
    
    if (!socket.connected) {
      console.error('❌ Socket not connected');
      addMessage('Not connected to server. Please check your internet.', false);
      return;
    }
    
    setIsSearching(true);
    setIsConnected(false);
    setMessages([]);
    setSessionId(null);
    
    // Emit to socket for matching with detailed logging
    console.log('🔍 Emitting find_match event with mode: video');
    socket.emit('find_match', { mode: 'video' });
    
    // Initialize WebRTC if needed
    if (webRTCRef.current) {
      webRTCRef.current.findMatch();
    }
    
    console.log('🔍 Started searching for video chat partner');
    addMessage('Searching for someone to chat with...', false);
  };

  const nextMatch = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    startNewChat();
  };

  const stopChat = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
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
    if (!messageInput.trim() || !isConnected || !sessionId || !socket) return;
    
    const content = messageInput.trim();
    addMessage(content, true);
    
    socket.emit('chat_message', {
      sessionId,
      content,
      type: 'text'
    });
    
    setMessageInput('');
    console.log('📤 Sent message:', content);
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
              isConnected ? 'bg-green-400' : 
              isSearching ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-white text-xs lg:text-sm font-medium">
              {isConnected ? 'Connected' : isSearching ? 'Connecting...' : 'Disconnected'}
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
            {isConnected ? (
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
          {/* Main Action Buttons */}
          <div className="flex justify-center space-x-2 lg:space-x-4 mb-3">
            <button
              onClick={startNewChat}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 lg:px-6 lg:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
              disabled={isSearching}
            >
              {isSearching ? 'Connecting...' : 'New'}
            </button>
            
            {isConnected && (
              <>
                <button
                  onClick={nextMatch}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                >
                  Next
                </button>
                
                <button
                  onClick={handleReport}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                >
                  Report
                </button>
              </>
            )}

            <button
              onClick={stopChat}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
            >
              Stop
            </button>

            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
            >
              Home
            </button>
          </div>

          {/* Quick Options - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm">
            <button 
              onClick={() => setShowTextChat(!showTextChat)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation"
            >
              {showTextChat ? 'Hide text' : 'Show text'}
            </button>
            <button 
              onClick={() => navigate('/chat/text')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation"
            >
              Text only
            </button>
            <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation">
              Unmoderated
            </button>
          </div>
        </div>
      </div>

      {/* Text Chat Panel - Responsive */}
      {showTextChat && (
        <div className="absolute lg:relative inset-x-0 bottom-0 lg:inset-auto lg:w-80 bg-gray-800 border-t lg:border-l lg:border-t-0 border-gray-700 flex flex-col max-h-80 lg:max-h-full">
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

          {/* Message Input */}
          {(isConnected || isSearching) && (
            <div className="p-3 lg:p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm touch-manipulation"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded transition-colors touch-manipulation"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoChat;