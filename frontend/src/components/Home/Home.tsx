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
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to make a new friend?
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Connect with interesting people from around the world
        </p>
        
        {/* User Status */}
        <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.tier === 'guest' ? 'Guest User' : 'Verified User'}
            </span>
            {user?.isVerified && (
              <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>



      {/* Chat Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Text Chat */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Text Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start with safe text conversations
          </p>
          <button
            onClick={() => handleStartChat('text')}
            className="btn-primary w-full"
          >
            Start Text Chat
          </button>
          <p className="text-xs text-success-600 dark:text-success-400 mt-2">
            ✓ Available for all users
          </p>
        </div>

        {/* Audio Chat */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full mb-6">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Voice Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Have real conversations with voice
          </p>
          <button
            onClick={() => handleStartChat('audio')}
            className="btn-primary w-full"
          >
            Start Voice Chat
          </button>
          <p className="text-xs text-success-600 dark:text-success-400 mt-2">
            ✓ Available for all users
          </p>
        </div>

        {/* Video Chat */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-6">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Video Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Face-to-face conversations
          </p>
          <button
            onClick={() => handleStartChat('video')}
            className="btn-primary w-full"
          >
            Start Video Chat
          </button>
          <p className="text-xs text-success-600 dark:text-success-400 mt-2">
            ✓ Available for all users
          </p>
        </div>
      </div>


    </div>
  );
};

export default Home;