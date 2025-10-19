import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
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
  const { updateUser } = useAuth();
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
    socket.on('match-found', async (data: { 
      sessionId: string; 
      matchUserId: string; 
      isInitiator: boolean;
      coins?: number;
      totalChats?: number;
      dailyChats?: number;
    }) => {
      console.log('💬 Text chat match found:', data);
      console.log('📊 Match data received:', {
        coins: data.coins,
        totalChats: data.totalChats,
        dailyChats: data.dailyChats,
        hasCoinsData: data.coins !== undefined
      });
      
      // Update user coins and chat counts from backend response
      if (data.coins !== undefined) {
        console.log('🔄 CALLING updateUser with:', { 
          coins: data.coins,
          totalChats: data.totalChats || 0,
          dailyChats: data.dailyChats || 0
        });
        
        updateUser({ 
          coins: data.coins,
          totalChats: data.totalChats || 0,
          dailyChats: data.dailyChats || 0
        });
        
        console.log(`✅ updateUser CALLED - New values: coins=${data.coins}, totalChats=${data.totalChats}, dailyChats=${data.dailyChats}`);
      } else {
        console.warn('⚠️ No coins data in match-found event!');
      }
      
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
          <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl flex flex-col bg-black bg-opacity-20 rounded-t-lg sm:rounded-t-xl backdrop-blur-sm border border-white border-opacity-20 mx-2 sm:mx-4" 
               style={{ height: 'calc(100vh - 140px)', minHeight: '500px', maxHeight: '800px' }}>

            {/* Search Content */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <div className="text-center max-w-xs sm:max-w-md">
                <div className="mb-6 sm:mb-8">
                  <div className="relative mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20">
                    <div className="animate-spin rounded-full h-full w-full border-3 sm:border-4 border-purple-400 border-t-transparent"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-full w-full border-2 border-purple-400 opacity-20"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">Finding someone for you...</h3>
                  <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 px-2">
                    Please wait while we connect you with another person
                  </p>
                </div>
                
                <div className="bg-black bg-opacity-30 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-white border-opacity-10">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 text-yellow-400 mb-2 sm:mb-3">
                    <div className="animate-bounce w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
                    <div className="animate-bounce w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                    <div className="animate-bounce w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">Looking for text chat partner...</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface - When Connected */}
        {isMatchConnected && (
          <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl flex flex-col bg-black bg-opacity-20 rounded-t-lg sm:rounded-t-xl backdrop-blur-sm border border-white border-opacity-20 mx-2 sm:mx-4" 
               style={{ height: 'calc(100vh - 140px)', minHeight: '500px', maxHeight: '800px' }}>
            
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-white border-opacity-20">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Chat</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      !socketConnected 
                        ? 'bg-red-500 animate-pulse'
                        : isSearching 
                        ? 'bg-yellow-500 animate-pulse' 
                        : isMatchConnected 
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-500'
                    }`}></div>
                    <span className={`text-xs sm:text-sm font-medium transition-colors ${
                      !socketConnected 
                        ? 'text-red-400'
                        : isSearching 
                        ? 'text-yellow-400' 
                        : isMatchConnected 
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}>
                      {!socketConnected 
                        ? 'Disconnected'
                        : isSearching 
                        ? 'Searching...' 
                        : isMatchConnected 
                        ? 'Connected'
                        : 'Ready'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {isMatchConnected && (
                <div className="flex gap-2 sm:gap-3 mb-2">
                  <button
                    onClick={nextMatch}
                    disabled={!isMatchConnected}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed text-xs sm:text-sm shadow-lg hover:shadow-blue-500/25"
                  >
                    <span className="hidden sm:inline">🔄 Next Person</span>
                    <span className="sm:hidden">🔄 Next</span>
                  </button>
                  <button
                    onClick={exitChat}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm shadow-lg hover:shadow-red-500/25"
                  >
                    <PhoneXMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">End Chat</span>
                    <span className="sm:hidden">End</span>
                  </button>
                </div>
              )}
              
              <p className="text-gray-300 text-xs sm:text-sm opacity-80 px-1">
                {isMatchConnected ? "You're chatting with a stranger" : "Ready to start chatting"}
              </p>
            </div>

            {/* Messages Area - Full Height */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 min-h-0">
              {/* Empty State */}
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400 px-4">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 opacity-40" />
                    <p className="text-base sm:text-lg font-medium mb-2">Start your conversation!</p>
                    <p className="text-xs sm:text-sm opacity-70">Send a message to begin chatting</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 sm:mb-2 px-1 sm:px-0`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                      message.isOwnMessage
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-md'
                        : message.content.includes('Connected!') || message.content.includes('left the chat')
                        ? 'bg-yellow-600 bg-opacity-20 text-yellow-200 border border-yellow-600 border-opacity-30 text-center w-full rounded-xl'
                        : 'bg-white bg-opacity-10 text-white rounded-bl-md backdrop-blur-sm'
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>
                    <div className={`text-xs mt-1 sm:mt-2 ${
                      message.isOwnMessage ? 'text-purple-200' : 'text-gray-300'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {partnerTyping && (
                <div className="flex justify-start mb-2">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md max-w-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-xs text-gray-400 ml-2">typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - WhatsApp Style */}
            <div className="p-2 sm:p-3 lg:p-4 border-t border-white border-opacity-20 bg-black bg-opacity-30">
              <div className="flex items-end gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={!isMatchConnected}
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 backdrop-blur-sm resize-none transition-all duration-200"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || !isMatchConnected}
                  className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 shadow-lg ${
                    messageInput.trim() && isMatchConnected
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hover:shadow-purple-500/25 transform hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initial State - Not searching, not connected */}
        {!isSearching && !isMatchConnected && (
          <div className="text-center max-w-xs sm:max-w-md lg:max-w-lg mx-4 sm:mx-0">
            <div className="mb-6 sm:mb-8">
              <div className="relative mb-6 sm:mb-8">
                <ChatBubbleLeftRightIcon className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-purple-400" />
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Text Chat
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
                Connect with strangers from around the world and have interesting conversations!
              </p>
            </div>
            
            <button
              onClick={() => startNewChat(false)}
              disabled={socketConnecting || !socketConnected}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-purple-500/25 disabled:shadow-none"
            >
              {socketConnecting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Start Text Chat</span>
                </div>
              )}
            </button>
            
            {!socketConnected && (
              <p className="text-red-400 text-xs sm:text-sm mt-3 sm:mt-4 px-2">
                Connection lost. Please refresh the page.
              </p>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default TextChat;