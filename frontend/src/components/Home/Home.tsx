import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';

// Coin costs for each mode
const COIN_COSTS = {
  text: 1,
  audio: 2,
  video: 3
};

const Home: React.FC = () => {
  const [isMatching, setIsMatching] = useState(false);
  const { user, loading } = useAuthContext();
  const { modeUserCounts } = useSocket();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);

  // Listen for real-time stats updates
  useEffect(() => {
    const handleStatsUpdate = (event: any) => {
      console.log('🏠 Home received stats update:', event.detail);
      forceUpdate({}); // Force re-render to show updated coins
    };
    
    window.addEventListener('user-stats-update', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('user-stats-update', handleStatsUpdate);
    };
  }, []);

  // 📧 Check if user needs email verification
  useEffect(() => {
    if (user && !user.isVerified && user.email) {
      console.log('⚠️  User email not verified, showing popup');
      setShowVerificationPopup(true);
    }
  }, [user]);

  // No redirect - allow browsing without login
  const handleStartChat = (mode: 'text' | 'audio' | 'video') => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login page with return URL
      console.log('🔒 User not logged in, redirecting to login...');
      navigate('/login', { state: { returnTo: '/', chatMode: mode } });
      return;
    }

    // 📧 Check if user email is verified
    if (!user.isVerified) {
      console.log('⚠️  User email not verified, showing popup');
      setShowVerificationPopup(true);
      return;
    }

    const cost = COIN_COSTS[mode];
    
    // Check if user has enough coins (frontend validation)
    if ((user.coins || 0) < cost) {
      alert(`Not enough coins! You need ${cost} coin for ${mode} chat. You have ${user?.coins || 0} coins.`);
      return;
    }

    console.log(`🚀 Starting ${mode} chat search...`);
    setIsMatching(true);
    
    // Navigate to appropriate chat interface based on mode
    // Backend will deduct coins when match is found
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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (isMatching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-200 border-t-purple-600 mx-auto mb-8"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="w-12 h-12 rounded-full shadow-lg animate-pulse object-cover"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Finding your chat partner...
          </h2>
          <p className="text-gray-400 mb-6">
            We're matching you with someone who shares your interests
          </p>
          <button
            onClick={() => setIsMatching(false)}
            className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-6 py-3 rounded-full font-semibold border border-white border-opacity-30 transition-all"
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
      <div className="text-center mb-8 sm:mb-12 px-4 py-8 sm:py-16 text-white">
        {/* Hero Headline */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 text-transparent bg-clip-text drop-shadow-2xl tracking-wider">
            Random video chat, built for Strangers
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-3 uppercase tracking-[0.35rem]">
            Meet new people in seconds
          </p>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
          50 daily coins · Video · Voice · Text
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Verified strangers, friends, and creators connect instantly—spend coins to jump into spam-free chats from anywhere.
        </p>
        
        {/* User Status & Coins - Only show if logged in */}
        {user ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <div className="inline-flex items-center bg-white bg-opacity-10 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white border-opacity-30">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                  {user?.tier === 'guest' ? 'Guest User' : 'Verified User'}
                </span>
                {user?.isVerified && (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            {/* Coins Display - Mobile Responsive */}
            <div className="w-full sm:w-auto">
              <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl sm:rounded-full px-4 sm:px-6 py-3 sm:py-3 border-2 border-yellow-400 shadow-lg w-full sm:w-auto">
                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                    {user?.coins || 0} Coins
                  </span>
                </div>
                <div className="text-xs text-white text-center sm:text-left sm:ml-2 sm:pl-2 sm:border-l sm:border-yellow-300">
                  🔄 Resets to 50 at 12 AM
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="inline-flex items-center bg-blue-500 bg-opacity-20 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-blue-400 border-opacity-50 shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm text-white font-medium text-center">
                👋 Welcome to Omegoo! Login to unlock your 50 daily coins
              </span>
            </div>
          </div>
        )}
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
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">
            Text Chat
          </h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
            Quick anonymous conversations. Say hello and keep it light.
          </p>
          <button
            onClick={() => handleStartChat('text')}
            disabled={!!(user && (user?.coins || 0) < COIN_COSTS.text)}
            className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base ${
              user && (user?.coins || 0) < COIN_COSTS.text ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {user ? 'Start Text Chat' : '🔒 Login to Start Text Chat'}
          </button>
          {user && (
            <p className="text-xs sm:text-sm text-yellow-400 mt-2">
              💰 {COIN_COSTS.text} coins per session
            </p>
          )}
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-100 text-xs sm:text-sm font-semibold animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {modeUserCounts.text} online now
            </span>
          </div>
        </div>

        {/* Audio Chat */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-green-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">
            Voice Chat
          </h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
            Drop into real-time voice rooms for more natural chats.
          </p>
          <button
            onClick={() => handleStartChat('audio')}
            disabled={!!(user && (user?.coins || 0) < COIN_COSTS.audio)}
            className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base ${
              user && (user?.coins || 0) < COIN_COSTS.audio ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {user ? 'Start Voice Chat' : '🔒 Login to Start Voice Chat'}
          </button>
          {user && (
            <p className="text-xs sm:text-sm text-yellow-400 mt-2">
              💰 {COIN_COSTS.audio} coins per session
            </p>
          )}
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-100 text-xs sm:text-sm font-semibold animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {modeUserCounts.audio} online now
            </span>
          </div>
        </div>

        {/* Video Chat */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-purple-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">
            Video Chat
          </h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
            Meet face-to-face with verified matches in secure rooms.
          </p>
          <button
            onClick={() => handleStartChat('video')}
            disabled={!!(user && (user?.coins || 0) < COIN_COSTS.video)}
            className={`bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base ${
              user && (user?.coins || 0) < COIN_COSTS.video ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {user ? 'Start Video Chat' : '🔒 Login to Start Video Chat'}
          </button>
          {user && (
            <p className="text-xs sm:text-sm text-yellow-400 mt-2">
              💰 {COIN_COSTS.video} coins per session
            </p>
          )}
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-100 text-xs sm:text-sm font-semibold animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {modeUserCounts.video} online now
            </span>
          </div>
        </div>
      </div>

    {/* Coin System & SEO Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  How the Omegoo coin system keeps chats high-quality
                </h2>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  Receive <strong className="text-yellow-300">50 free coins every midnight (IST)</strong> and spend them on text (1 coin), voice (2 coins), or video (3 coins) sessions. The coin economy limits spam, rewards verified users, and ensures every match feels valuable—whether you are from an IIT hostel, an Indian university dorm, a community college, or connecting from overseas.
                </p>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-200 list-disc list-inside">
                  <li>Earn bonus coins by verifying your email and staying active.</li>
                  <li>Switch between chat modes without losing your queue position.</li>
                  <li>Upcoming: invite friends from any campus worldwide and unlock extra coins.</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/20 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xl font-semibold">Why students choose Omegoo</h3>
                <div className="space-y-3 text-sm sm:text-base text-gray-100">
                  <p>• Match with peers from IITs, NITs, DU, SRM, MIT, and global universities.</p>
                  <p>• Safe, anonymous matching with instant moderation tools and verified badges.</p>
                  <p>• Perfect for language practice, hackathon teaming, or meeting new travel buddies.</p>
                </div>
                <div className="mt-auto text-xs text-gray-200">
                  Popular searches we rank for: <span className="font-semibold text-white">"random video chat for students", "college chat India", "anonymous campus chat", "meet strangers online India".</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audience Targets */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
            Built for campuses in India, loved by communities everywhere
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[{
              title: 'University & IIT students',
              copy: 'Discover project partners, hackathon teammates, fest collaborators, or someone to vent to after exams. Omegoo makes it simple to meet peers from IITs, NITs, DU, VIT, SRM, JNU, and more.'
            }, {
              title: 'College applicants & aspirants',
              copy: 'Talk to current students to understand campus life before making your choice. Ask real people about hostels, placements, and clubs in a live random chat.'
            }, {
              title: 'Alumni & young professionals',
              copy: 'Reconnect with Indian campuses while building a global professional network. Host mentoring sessions or language exchanges over voice and video.'
            }, {
              title: 'Creators & explorers',
              copy: 'Grow engaged communities by hosting pop-up conversations, Q\u0026A jams, or cultural exchanges with people around the world.'
            }].map((audience) => (
              <div
                key={audience.title}
                className="bg-white/10 border border-white/20 rounded-2xl p-6 text-gray-100 backdrop-blur-md shadow-lg"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{audience.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed">{audience.copy}</p>
                <div className="mt-4 text-xs uppercase tracking-wider text-indigo-200">
                  Popular keywords: random chat app India, campus chat platform, anonymous university chat
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Random Chat Pitch */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-white/10 border border-white/15 rounded-3xl p-6 sm:p-10 text-white backdrop-blur-md shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Searching for a safe random stranger chat?</h2>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6">
              Omegoo is a fresh alternative to classic stranger chat platforms. You can start a <strong className="text-white">random chat with strangers</strong>, match for <strong className="text-white">video chat in India</strong>, or discover <strong className="text-white">voice chat rooms for college students</strong> without worrying about safety. AI moderation, verified badges, and the coin system keep every connection respectful.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-2">Pick your vibe fast</h3>
                <p className="text-sm text-gray-100">
                  Select text, voice, or video chat, share a quick intro, and start an instant random chat with strangers who are online now.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-2">Skip anonymous spam</h3>
                <p className="text-sm text-gray-100">
                  Coins cost per session discourages trolls yet keeps random chat free and fun for genuine users.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-2">Works on any device</h3>
                <p className="text-sm text-gray-100">
                  No downloads. Join from mobile, desktop, or tablet with a single tap and continue chatting on the go.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Rich Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Why Omegoo ranks for random chat keywords in India and worldwide
            </h2>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-4">
              Searchers looking for <strong className="text-white">"stranger chat website in India"</strong>, <strong className="text-white">"random video chat for students"</strong>, or <strong className="text-white">"anonymous college chat"</strong> find Omegoo because each feature is crafted for intent-based discovery. Our pages highlight quick matching, coin-powered trust, and culturally relevant communities so Google and users understand Omegoo is the best alternative to traditional random chat apps.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Localized Indian coverage</h3>
                <p className="text-sm text-gray-200">
                  Content covers metro cities, tier-2 colleges, and IIT hostels while staying inclusive for global matches. Geo-specific keywords help us appear when users search from Delhi, Bengaluru, Mumbai, Hyderabad, or abroad.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Topic clusters & internal links</h3>
                <p className="text-sm text-gray-200">
                  Guides on safety, privacy, and community policies link to About, Safety, Terms, and Contact pages. This network signals expertise to search engines and keeps visitors exploring the product.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Performance-focused experience</h3>
                <p className="text-sm text-gray-200">
                  Optimized image assets, minimal blocking scripts, and responsive UI keep Core Web Vitals healthy, which improves our search rankings for competitive chat keywords.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
            Popular ways people use Omegoo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              title: 'Random stranger chat India',
              description: 'Jump into anonymous conversations after classes or work. Great for venting, sharing memes, or practicing conversational English with real people.'
            }, {
              title: 'Campus networking & study help',
              description: 'Exchange notes, prep for exams, and find teammates for hackathons or college festivals using quick text or voice chat sessions.'
            }, {
              title: 'Global late-night chill sessions',
              description: 'Meet travelers, gamers, and creators from other countries, host virtual coffee chats, or plan collaborations using secure video rooms.'
            }].map((useCase) => (
              <div key={useCase.title} className="bg-white/10 border border-white/15 rounded-2xl p-6 text-gray-100 backdrop-blur-md shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-3">{useCase.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
            Frequently asked questions about Omegoo
          </h2>
          <div className="space-y-4">
            {[{
              question: 'Is Omegoo only for college and university students?',
              answer: 'Omegoo began with Indian campuses in mind, but anyone can join. Students, alumni, working professionals, creators, and curious travelers use the platform to meet new people instantly.'
            }, {
              question: 'How do I get more Omegoo coins?',
              answer: 'Verified accounts receive 50 coins every midnight (IST). You can unlock bonus coins for streak logins, inviting friends, and participating in moderated community events.'
            }, {
              question: 'Is it safe to chat with strangers on Omegoo?',
              answer: 'Yes. Moderation bots, community reporting, and real-time safety prompts protect every session. You can also block or report any user in one tap.'
            }, {
              question: 'Can I access Omegoo from outside India?',
              answer: 'Absolutely. Omegoo supports users in over 150 countries, so you can switch between India-centric and global matches depending on your preferences.'
            }, {
              question: 'How is Omegoo different from Omegle or other random chat sites?',
              answer: 'Omegoo combines verified badges, a daily coin system, and AI moderation to deliver safer random chat sessions. It is designed for students and young professionals who want meaningful conversations, not bots or spam.'
            }, {
              question: 'Does Omegoo work on mobile for random video chat?',
              answer: 'Yes. The web app is fully responsive, so you can launch random video or voice chats from your phone, tablet, or laptop without installing anything.'
            }, {
              question: 'Can I start audio-only chats without showing my face?',
              answer: 'Absolutely. Choose the voice mode to enter audio-only rooms. You can switch to video later or stay on voice-only conversations if you prefer more privacy.'
            }, {
              question: 'How do I report abusive strangers during a chat?',
              answer: 'Tap the report or block button inside the chat window. Our moderation team reviews every report instantly, and repeated offenders lose access to their coins and account.'
            }].map((item) => (
              <details key={item.question} className="group bg-white/10 border border-white/15 rounded-2xl px-5 py-4 text-gray-100">
                <summary className="cursor-pointer text-lg font-semibold text-white flex items-center justify-between">
                  {item.question}
                  <span className="text-indigo-300 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-sm sm:text-base text-gray-200 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center text-sm text-indigo-200">
            Still curious? Explore our{' '}
            <a href="/about" className="underline hover:text-white">About</a>,{' '}
            <a href="/safety" className="underline hover:text-white">Safety Guidelines</a>, and{' '}
            <a href="/contact" className="underline hover:text-white">Contact</a> pages for more details.
          </div>
        </section>

      {/* GitHub Star Section - Centered */}
      <div className="text-center mb-6 sm:mb-8 px-4">
        <a
          href="https://github.com/Saurabhji123/omegoo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-white border-opacity-20 backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-sm sm:text-base font-semibold">⭐ Star us on GitHub</span>
        </a>
        <p className="text-xs sm:text-sm text-gray-300 mt-2">Made with ❤️ by Saurabh Shukla</p>
      </div>

      {/* 📧 Email Verification Popup */}
      {showVerificationPopup && user && !user.isVerified && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-br from-purple-800 via-blue-800 to-indigo-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-white border-opacity-20 backdrop-blur-lg">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 bg-opacity-20 rounded-full mb-4 backdrop-blur-sm border-2 border-yellow-400 border-opacity-30">
                <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ⚠️ Email Verification Required
              </h2>
              <p className="text-gray-300 text-sm">
                Please verify your email to unlock every feature
              </p>
            </div>

            {/* Message */}
            <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl p-4 mb-6">
              <p className="text-white text-sm">
                We have sent a verification code to <span className="font-semibold">{user.email}</span>. Please check your inbox.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const token = localStorage.getItem('auth_token');
                  if (token) {
                    navigate('/verify-otp', {
                      state: {
                        token,
                        email: user.email
                      }
                    });
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                ✅ Verify Now
              </button>

              <button
                onClick={async () => {
                  setResendingOTP(true);
                  try {
                    const token = localStorage.getItem('auth_token');
                    await axios.post(
                      `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/resend-otp`,
                      {},
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      }
                    );
                    alert('✅ New OTP sent to your email!');
                  } catch (error) {
                    console.error('Resend OTP error:', error);
                    alert('❌ Failed to resend OTP. Please try again.');
                  } finally {
                    setResendingOTP(false);
                  }
                }}
                disabled={resendingOTP}
                className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold py-3 rounded-xl transition-all border border-white border-opacity-20 disabled:opacity-50"
              >
                {resendingOTP ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  '🔄 Resend OTP'
                )}
              </button>

              <button
                onClick={() => setShowVerificationPopup(false)}
                className="w-full text-gray-300 hover:text-white font-medium py-2 transition-colors text-sm"
              >
                Remind me later
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-400 text-center mt-4">
              💡 Verification required to use Text, Audio, and Video chat
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;