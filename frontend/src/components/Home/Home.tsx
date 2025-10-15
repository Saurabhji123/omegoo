import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
// import { useSocket } from '../../contexts/SocketContext';

const Home: React.FC = () => {
  const [isMatching, setIsMatching] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartChat = (mode: 'text' | 'audio' | 'video') => {
    setIsMatching(true);
    
    // Navigate to appropriate chat interface based on mode
    setTimeout(() => {
      switch (mode) {
        case 'text':
          navigate('/chat/text');
          break;
        case 'audio':
          navigate('/chat/audio');
          break;
        case 'video':
          navigate('/chat/video');
          break;
        default:
          navigate('/chat/video');
      }
    }, 1500);
  };

  if (isMatching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-primary-200 border-t-primary-600 mx-auto mb-8"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="w-12 h-12 rounded-full shadow-lg animate-pulse object-cover"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Finding your chat partner...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're matching you with someone who shares your interests
          </p>
          <button
            onClick={() => setIsMatching(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      {/* Welcome Section */}
      <div className="text-center mb-8 sm:mb-12 text-white px-4 py-8 sm:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
          Ready to make a new friend?
        </h1>
        <p className="text-lg sm:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Connect with interesting people from around the world
        </p>
        
        {/* User Status */}
        <div className="inline-flex items-center bg-white bg-opacity-10 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white border-opacity-30 mx-2">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-white">
              {user?.tier === 'guest' ? 'Guest User' : 'Verified User'}
            </span>
            {user?.isVerified && (
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>



      {/* Chat Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 px-4 max-w-6xl mx-auto">
        {/* Text Chat */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-blue-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
            Text Chat
          </h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
            Start with safe text conversations
          </p>
          <button
            onClick={() => handleStartChat('text')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base"
          >
            Start Text Chat
          </button>
          <p className="text-xs sm:text-sm text-blue-400 mt-2">
            ✓ Available for all users
          </p>
        </div>

        {/* Audio Chat */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-green-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
            Voice Chat
          </h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
            Have real conversations with voice
          </p>
          <button
            onClick={() => handleStartChat('audio')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base"
          >
            Start Voice Chat
          </button>
          <p className="text-xs sm:text-sm text-green-400 mt-2">
            ✓ Available for all users
          </p>
        </div>

        {/* Video Chat */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-purple-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
            Video Chat
          </h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
            Face-to-face conversations
          </p>
          <button
            onClick={() => handleStartChat('video')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base"
          >
            Start Video Chat
          </button>
          <p className="text-xs sm:text-sm text-purple-400 mt-2">
            ✓ Available for all users
          </p>
        </div>
      </div>


    </div>
  );
};

export default Home;