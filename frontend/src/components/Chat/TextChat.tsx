import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { 
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
}

const TextChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queueInfo, setQueueInfo] = useState<{ position: number, totalWaiting: number } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('match-found', (data: { sessionId: string; matchUserId: string }) => {
      setSessionId(data.sessionId);
      setIsConnected(true);
      setIsSearching(false);
      setMessages([]);
      addSystemMessage('Connected! Say hello to your new friend.');
    });

    socket.on('searching', (data: { position: number; totalWaiting: number }) => {
      setQueueInfo(data);
      setIsSearching(true);
    });

    socket.on('chat_message', (data: { content: string; timestamp: number }) => {
      addMessage(data.content, false);
      setPartnerTyping(false);
    });

    socket.on('typing', (data: { isTyping: boolean }) => {
      setPartnerTyping(data.isTyping);
    });

    socket.on('session_ended', () => {
      setIsConnected(false);
      setSessionId(null);
      addSystemMessage('Your partner has left the chat.');
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      addSystemMessage('Connection error occurred.');
    });

    return () => {
      socket.off('match-found');
      socket.off('searching');
      socket.off('chat_message');
      socket.off('typing');
      socket.off('session_ended');
      socket.off('error');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start matching when component mounts
  useEffect(() => {
    if (socket && !isConnected && !isSearching) {
      findMatch();
    }
  }, [socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      content,
      isOwnMessage: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, { ...systemMessage, isOwnMessage: false }]);
  };

  const findMatch = () => {
    setIsSearching(true);
    setMessages([]);
    addSystemMessage('Searching for someone to chat with...');
    socket?.emit('find_match', { mode: 'text' });
  };

  const nextMatch = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    setIsConnected(false);
    setSessionId(null);
    setMessages([]);
    findMatch();
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !isConnected || !sessionId) return;
    
    const content = messageInput.trim();
    addMessage(content, true);
    
    socket?.emit('chat_message', {
      sessionId,
      content,
      type: 'text'
    });
    
    setMessageInput('');
    setIsTyping(false);
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

  const reportUser = () => {
    setShowReportModal(true);
  };

  const handleReport = (reason: string) => {
    if (sessionId) {
      socket?.emit('report_user', {
        sessionId,
        reason,
        description: `Reported for: ${reason}`
      });
    }
    setShowReportModal(false);
    nextMatch();
  };

  const endChat = () => {
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Text Chat</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 
              isSearching ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              {isConnected ? 'Connected' : isSearching ? 'Searching...' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <button
          onClick={endChat}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isSearching && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">Ready to start chatting?</h2>
              <p className="mb-6">Connect with a random stranger and have a conversation!</p>
              <button
                onClick={findMatch}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Text Chat
              </button>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isOwnMessage
                    ? 'bg-primary-600 text-white'
                    : message.content.includes('Connected!') || message.content.includes('Searching') || message.content.includes('left the chat')
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center text-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.isOwnMessage ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {partnerTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {(isConnected || isSearching) && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={nextMatch}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Next</span>
              </button>
              
              <button
                onClick={reportUser}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Report</span>
              </button>
            </div>

            <div className="flex space-x-3">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Queue Info */}
        {isSearching && queueInfo && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border-t border-primary-200 dark:border-primary-800 p-4">
            <div className="text-center text-primary-700 dark:text-primary-300">
              <div className="flex justify-center mb-2">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-sm">
                <span className="font-semibold">{queueInfo.totalWaiting}</span> people waiting
              </p>
              <p className="text-xs mt-1">
                You're in position <span className="font-semibold">{queueInfo.position}</span>
              </p>
            </div>
          </div>
        )}
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

export default TextChat;