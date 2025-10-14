import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { 
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
}

const TextChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Core states - following AudioChat pattern
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Text chat specific states
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  // Connection quality state (like AudioChat)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');

  // Add message helper function
  const addMessage = useCallback((content: string, isOwnMessage: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isOwnMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      content,
      isOwnMessage: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // Main socket event listeners - following AudioChat pattern
  useEffect(() => {
    if (!socket) return;

    // Socket event listeners - exact AudioChat pattern
    socket.on('match-found', async (data: { sessionId: string; matchUserId: string; isInitiator: boolean }) => {
      console.log('💬 Text chat match found:', data);
      setSessionId(data.sessionId);
      setIsSearching(false);
      setMessages([]);
      
      setIsMatchConnected(true);
      addSystemMessage('Connected! Say hello to your new friend.');
    });

    socket.on('searching', (data: { position: number; totalWaiting: number }) => {
      console.log('🔍 Searching for text chat partner:', data);
      setIsSearching(true);
    });

    socket.on('chat_message', (data: { content: string; timestamp: number; sessionId: string; fromUserId?: string }) => {
      console.log('📝 RECEIVED MESSAGE IN TEXTCHAT:', data);
      if (data.sessionId === sessionId) {
        addMessage(data.content, false);
        setPartnerTyping(false);
      }
    });

    socket.on('typing', (data: { isTyping: boolean }) => {
      setPartnerTyping(data.isTyping);
    });

    socket.on('session_ended', (data: { reason?: string }) => {
      console.log('❌ Text chat session ended:', data);
      setIsMatchConnected(false);
      setSessionId(null);
      
      addSystemMessage('Your partner has left the chat.');
      
      // Auto-search if partner left
      if (data.reason === 'partner_left' && socket) {
        setIsSearching(true);
        setTimeout(() => {
          socket.emit('find_match', { mode: 'text' });
        }, 2000);
      }
    });

    // Cleanup on unmount
    return () => {
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('chat_message');
      socket?.off('typing');
      socket?.off('session_ended');
    };
  }, [socket, sessionId, addMessage, addSystemMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Multi-device protection on component mount (like AudioChat)
  useEffect(() => {
    const activeSession = localStorage.getItem('omegoo_text_session');
    if (activeSession) {
      const sessionData = JSON.parse(activeSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      
      // Clear old sessions (older than 10 minutes)
      if (sessionAge > 10 * 60 * 1000) {
        localStorage.removeItem('omegoo_text_session');
        console.log('🗑️ Cleared expired text session tracking');
      } else {
        console.log('⚠️ Detected recent text session from another tab/device');
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  // Enhanced session management - following AudioChat pattern
  const performCompleteCleanup = () => {
    console.log('🧹 Performing complete text chat cleanup...');
    
    // Reset states
    setIsMatchConnected(false);
    setSessionId(null);
    setMessages([]);
    setPartnerTyping(false);
    setIsTyping(false);
    
    // Clear multi-device session tracking
    localStorage.removeItem('omegoo_text_session');
    console.log('🗑️ Cleared text session tracking for multi-device protection');
    
    console.log('✅ Complete text chat cleanup finished');
  };

  // Start new chat - following AudioChat pattern
  const startNewChat = (forceCleanup = false) => {
    if (!socket) {
      console.error('❌ Socket not available');
      return;
    }
    
    if (!socketConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    // MULTI-DEVICE PROTECTION: Check if user has active session in another tab/device
    const activeSession = localStorage.getItem('omegoo_text_session');
    if (activeSession && !forceCleanup) {
      const sessionData = JSON.parse(activeSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      
      // If session is less than 5 minutes old, warn user
      if (sessionAge < 5 * 60 * 1000) {
        console.log('⚠️ Active text session detected in another tab/device');
        const shouldContinue = window.confirm(
          'You seem to have an active text chat in another tab or device. Continue anyway? This will end your previous session.'
        );
        
        if (!shouldContinue) {
          return;
        }
      }
    }
    
    // Store current session attempt
    localStorage.setItem('omegoo_text_session', JSON.stringify({
      timestamp: Date.now(),
      userId: socket.id
    }));

    // INSTANT DISCONNECT: End current session first if exists
    if (sessionId && isMatchConnected) {
      console.log('🔚 Ending current text session immediately:', sessionId);
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
    
    // INSTANT STATE RESET
    setIsMatchConnected(false);
    setSessionId(null);
    setIsSearching(true);
    setMessages([]);
    setPartnerTyping(false);
    console.log('🔄 State reset for new text chat connection');
    
    // START NEW SEARCH
    setTimeout(() => {
      console.log('🔍 Starting search for new text chat partner');
      socket.emit('find_match', { mode: 'text' });
      console.log('✅ New text chat partner search started');
    }, 100);
  };

  const nextMatch = () => {
    console.log('🔄 Next Person clicked - starting fresh text chat');
    startNewChat(true);
  };

  const exitChat = () => {
    // Clean up current session
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    
    // Clear multi-device session tracking on exit
    localStorage.removeItem('omegoo_text_session');
    
    navigate('/');
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !isMatchConnected || !sessionId) return;
    
    const content = messageInput.trim();
    addMessage(content, true);
    
    // Send message to backend - matching AudioChat pattern
    socket?.emit('chat_message', {
      sessionId,
      content,
      timestamp: Date.now()
    });
    
    setMessageInput('');
    setIsTyping(false);
    
    // Stop typing indicator
    socket?.emit('typing', { sessionId, isTyping: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socket?.emit('typing', { sessionId, isTyping: true });
      
      // Stop typing after 2 seconds of no input
      setTimeout(() => {
        setIsTyping(false);
        socket?.emit('typing', { sessionId, isTyping: false });
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Connection quality helper (like AudioChat)
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Loading states (like AudioChat)
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
      {/* Enhanced Header with AudioChat styling */}
      <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Text Chat</span>
            <span className="sm:hidden">Chat</span>
          </h1>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <SignalIcon className={`w-4 h-4 ${getConnectionQualityColor()}`} />
            <div className={`w-2 h-2 rounded-full ${
              isMatchConnected ? 'bg-green-400' : 
              isSearching ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-xs text-gray-300 hidden sm:block">
              {isMatchConnected ? 'Connected' : isSearching ? 'Searching...' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <button
          onClick={exitChat}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content - Following AudioChat Layout */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        
        {/* Searching State */}
        {isSearching && !isMatchConnected && (
          <div className="text-center max-w-md">
            <div className="mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-6"></div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Finding someone for you...</h2>
              <p className="text-gray-300 text-lg">
                Please wait while we connect you with another person
              </p>
            </div>
            
            <div className="bg-black bg-opacity-30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="text-sm text-gray-300">Looking for text chat partner...</div>
            </div>
          </div>
        )}

        {/* Chat Interface - When Connected */}
        {isMatchConnected && (
          <div className="w-full max-w-4xl h-full flex flex-col bg-black bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-white border-opacity-20">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl mb-2 font-semibold">Connected!</h2>
                <div className="flex gap-3">
                  <button
                    onClick={nextMatch}
                    disabled={!isMatchConnected}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-xl transition-colors font-medium disabled:cursor-not-allowed text-sm"
                  >
                    Next Person
                  </button>
                  <button
                    onClick={exitChat}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                  >
                    <PhoneXMarkIcon className="w-4 h-4" />
                    End Chat
                  </button>
                </div>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                You're now chatting with a stranger
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-8">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Start the conversation by sending a message!</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                      message.isOwnMessage
                        ? 'bg-purple-600 text-white ml-auto'
                        : message.content.includes('Connected!') || message.content.includes('left the chat')
                        ? 'bg-yellow-600 bg-opacity-20 text-yellow-200 border border-yellow-600 border-opacity-30 text-center w-full'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {partnerTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 px-4 py-2 rounded-xl max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white border-opacity-20">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={!isMatchConnected}
                  className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || !isMatchConnected}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initial State - Not searching, not connected */}
        {!isSearching && !isMatchConnected && (
          <div className="text-center max-w-md">
            <div className="mb-8">
              <ChatBubbleLeftRightIcon className="w-24 h-24 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Text Chat</h2>
              <p className="text-gray-300 text-lg mb-8">
                Connect with strangers from around the world and have interesting conversations!
              </p>
            </div>
            
            <button
              onClick={() => startNewChat(false)}
              disabled={socketConnecting || !socketConnected}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {socketConnecting ? 'Connecting...' : 'Start Text Chat'}
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default TextChat;