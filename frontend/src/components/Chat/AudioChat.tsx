import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import WebRTCService from '../../services/webrtc';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  PhoneXMarkIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSlashIcon } from '@heroicons/react/24/solid';

// Use EXACT same Message interface as VideoChat for consistency
interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
}

const AudioChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting } = useSocket();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  // Use EXACT same state pattern as VideoChat for consistency
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false); // Renamed for clarity - this is for match connection
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTextChat, setShowTextChat] = useState(true); // Default show for better UX
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [micBlocked, setMicBlocked] = useState(false);

  // Define reusable remote stream handler (EXACT copy from VideoChat pattern)
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
        console.warn('Remote audio autoplay prevented, trying user gesture:', error);
        // Try to play on next user interaction
        const playPromise = () => {
          remoteAudioRef.current?.play().catch(e => 
            console.log('Manual audio play also failed:', e)
          );
        };
        document.addEventListener('click', playPromise, { once: true });
      });
      
      console.log('🎤 Remote audio setup completed for both users');
    }
    
    // Update connection state
    setIsMatchConnected(true);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    // Initialize WebRTC service without socket (we'll use the context socket) - EXACT VideoChat pattern
    webRTCRef.current = new WebRTCService();
    
    // Set up remote audio stream handler (works for both initial and reconnections)
    webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      if (state === 'disconnected') {
        setIsMatchConnected(false);
      }
    });

    // Socket event listeners - EXACT VideoChat pattern
    if (socket) {
      socket.on('match-found', async (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
        console.log('🎤 Audio chat match found:', data);
        setSessionId(data.sessionId);
        setIsSearching(false);
        setMessages([]);
        // Match found - no system message needed
        
        // Configure WebRTC service with match details - EXACT VideoChat pattern
        if (webRTCRef.current) {
          // ENSURE FRESH SETUP: Cleanup any previous connection first
          console.log('🔄 Ensuring fresh WebRTC setup for reconnection');
          webRTCRef.current.cleanup();
          
          // REINITIALIZE: Create fresh WebRTC instance for clean setup
          webRTCRef.current = new WebRTCService();
          
          // CRITICAL: Set remote audio callback on NEW instance
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          
          // Set up new connection
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          // IMPORTANT: Start local audio first before setting up peer connection
          try {
            await startLocalAudio();
            console.log('🎤 Local audio started for peer connection');
          } catch (error) {
            console.error('❌ Failed to start local audio:', error);
            console.error('Microphone access required for voice chat');
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
              console.error('Failed to establish audio connection');
            }
          }
          
          console.log('Audio chat ready!');
          setIsMatchConnected(true);
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for audio chat partner:', data);
        setIsSearching(true);
      });

      socket.on('chat_message', (data: { content: string; timestamp: number; sessionId: string; fromUserId?: string }) => {
        console.log('💬 RECEIVED MESSAGE IN FRONTEND:', data);
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
        console.log('❌ Audio chat session ended:', data);
        setIsMatchConnected(false);
        setSessionId(null);
        setMessages([]);
        console.log(`Chat ended. ${data.reason || 'Your partner left the chat.'}`);
        
        // Clean up WebRTC connection
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        
        // Auto-search if partner left (optional - for better UX)
        if (data.reason === 'partner_left' && socket) {
          console.log('🔄 Partner left, starting auto-search...');
          setIsSearching(true);
          setTimeout(() => {
            socket.emit('find_match', { mode: 'audio' });
          }, 2000); // Longer delay for stability
        }
      });

      socket.on('user_disconnected', (data: { userId: string }) => {
        console.log('👋 User disconnected:', data.userId);
        // This will help clean up any stale connections
        if (webRTCRef.current) {
          // Could add specific cleanup for this user if needed
        }
      });

      // WebRTC signaling events - EXACT VideoChat pattern
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
        console.error('Socket error:', data.message);
      });
    }

    // Cleanup on unmount
    return () => {
      // Clean up socket listeners
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('chat_message');
      socket?.off('session_ended');
      socket?.off('user_disconnected');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      socket?.off('error');
      
      // Clean up WebRTC
      if (webRTCRef.current) {
        webRTCRef.current.cleanup();
      }
    };
  }, [socket, handleRemoteStream]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startLocalAudio = async () => {
    try {
      console.log('🎤 Starting local audio');
      const constraints = {
        video: false, // Audio only
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      if (stream && localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        console.log('✅ Local audio initialized successfully');
        return stream;
      }
      
      throw new Error('Failed to initialize audio stream');
    } catch (error: any) {
      console.error('❌ Failed to start local audio:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicBlocked(true);
        throw new Error('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else {
        throw new Error('Failed to access microphone. Please check your audio settings.');
      }
    }
  };

  const addMessage = (content: string, isOwnMessage: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isOwnMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !isMatchConnected || !sessionId) return;

    const message = messageInput.trim();
    
    // Add to local messages immediately
    addMessage(message, true);
    
    // Send via WebRTC data channel (preferred for P2P)
    if (webRTCRef.current) {
      webRTCRef.current.sendMessage(message);
    }
    
    // Also send via socket as fallback
    socket?.emit('chat_message', {
      content: message,
      sessionId: sessionId
    });
    
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startChat = () => {
    if (!socket || !socketConnected) {
      console.error('Socket not available');
      return;
    }

    console.log('🔍 Starting audio chat search...');
    setIsSearching(true);
    setIsMatchConnected(false);
    setMessages([]);
    socket.emit('find_match', { mode: 'audio' });
  };

  const nextPerson = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    
    if (webRTCRef.current) {
      webRTCRef.current.cleanup();
    }
    
    // Start new search immediately
    setTimeout(() => {
      startChat();
    }, 500);
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
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  // Loading state
  if (socketConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  // Connection error state
  if (!socketConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Connection Error</div>
          <div className="text-gray-300">Please check your internet connection and refresh the page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MicrophoneIcon className="w-8 h-8" />
          Voice Chat
        </h1>
        <div className="flex items-center gap-2">
          {isSearching && (
            <span className="bg-yellow-500 px-3 py-1 rounded-full text-black font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              Searching
            </span>
          )}
          {isMatchConnected && (
            <span className="bg-green-500 px-3 py-1 rounded-full text-black font-medium">
              Connected
            </span>
          )}
        </div>
        <button
          onClick={endChat}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Main Audio Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {!isSearching && !isMatchConnected && (
            <div className="text-center">
              <MicrophoneIcon className="w-24 h-24 mx-auto mb-6 opacity-50" />
              <h2 className="text-3xl mb-4">Ready for Voice Chat</h2>
              <p className="text-xl text-gray-300 mb-8">Click "Find Someone" to start talking with a random person</p>
              <button
                onClick={startChat}
                disabled={!socketConnected}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 px-8 py-3 rounded-full text-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed"
              >
                {!socketConnected ? 'Connecting...' : 'Find Someone'}
              </button>
            </div>
          )}

          {isSearching && (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-purple-300 border-opacity-30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                <MicrophoneIcon className="w-16 h-16 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-2xl mb-4">Finding someone to talk to...</h2>
              <p className="text-gray-300">Please wait while we connect you</p>
            </div>
          )}

          {isMatchConnected && (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <MicrophoneIcon className="w-16 h-16" />
              </div>
              <h2 className="text-2xl mb-4">Connected!</h2>
              <p className="text-gray-300 mb-8">You're now talking with a stranger</p>
              
              {/* Audio Controls */}
              <div className="flex gap-4 justify-center mb-6">
                <button
                  onClick={toggleMic}
                  className={`p-4 rounded-full transition-all duration-300 ${
                    isMicOn 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isMicOn ? (
                    <MicrophoneIcon className="w-6 h-6" />
                  ) : (
                    <MicrophoneSlashIcon className="w-6 h-6" />
                  )}
                </button>
                
                <button
                  onClick={toggleSpeaker}
                  className={`p-4 rounded-full transition-all duration-300 ${
                    isSpeakerOn 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <SpeakerWaveIcon className="w-6 h-6" />
                </button>
                
                <button
                  onClick={() => setShowTextChat(!showTextChat)}
                  className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-300"
                >
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={nextPerson}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full transition-colors"
                >
                  Next Person
                </button>
                <button
                  onClick={endChat}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full transition-colors flex items-center gap-2"
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

        {/* Text Chat Sidebar */}
        {showTextChat && isMatchConnected && (
          <div className="w-80 bg-black bg-opacity-30 border-l border-white border-opacity-20 flex flex-col">
            <div className="p-4 border-b border-white border-opacity-20">
              <h3 className="font-semibold flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Text Chat
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.isOwnMessage
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-white border-opacity-20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 p-2 rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Microphone blocked modal */}
      {micBlocked && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">Microphone Access Required</h3>
            <p className="text-gray-300 mb-4">
              Please allow microphone access to use voice chat. Click the microphone icon in your browser's address bar and allow access.
            </p>
            <button
              onClick={() => setMicBlocked(false)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
            >
              I'll allow access
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioChat;