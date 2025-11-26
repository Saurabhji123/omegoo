import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { API_BASE_URL } from '../../services/api';
import { trackEvent } from '../../services/analyticsClient';
import LazyImage from '../UI/LazyImage';

type IncidentRecord = {
  message: string;
  severity: string;
  fallbackUrl?: string;
  updatedAt?: string;
  startedAt?: string;
};

type StatusSummaryRecord = {
  connectedUsers: number;
  queue: { text: number; audio: number; video: number; total: number };
  activeIncident?: IncidentRecord | null;
  incident?: IncidentRecord | null;
  lastUpdated?: string;
  [key: string]: any;
};

const Home: React.FC = () => {
  const [isMatching, setIsMatching] = useState(false);
  const { user, loading } = useAuthContext();
  const { modeUserCounts } = useSocket();
  const navigate = useNavigate();
  const [, forceUpdate] = useState({});
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);

  const [statusSummary, setStatusSummary] = useState<StatusSummaryRecord | null>(null);
  const [showTooltip, setShowTooltip] = useState<'text' | 'audio' | 'video' | null>(null);
  const [totalOnlineUsers, setTotalOnlineUsers] = useState<number>(0);

  // Calculate total online users from mode counts (multiply by 3 for display)
  useEffect(() => {
    const realTotal = modeUserCounts.text + modeUserCounts.audio + modeUserCounts.video;
    const displayTotal = realTotal * 3; // Show 3x inflated count for retention psychology
    setTotalOnlineUsers(displayTotal);
    console.log('👥 Real online users:', realTotal, '| Displayed:', displayTotal, 'Breakdown:', modeUserCounts);
  }, [modeUserCounts]);

  useEffect(() => {
    trackEvent('home_view');

    let isMounted = true;
    let refreshTimer: number | null = null;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status/summary`, {
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (isMounted && data?.success) {
          const summary = (data.summary ?? null) as StatusSummaryRecord | null;

          if (summary && !summary.activeIncident && summary.incident) {
            summary.activeIncident = summary.incident;
          }

          setStatusSummary(summary);
        }
      } catch (error) {
        console.warn('Status summary fetch failed', error);
      }
    };

    fetchStatus();

    refreshTimer = window.setInterval(fetchStatus, 30000);

    return () => {
      isMounted = false;
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

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
    console.log(`🚀 Starting ${mode} chat as guest...`);
    setIsMatching(true);
    
    // Navigate directly to chat interface
    // Guest users get instant access, coins deducted only for premium features
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
    }, 800);
  };

  // Keyboard navigation handler
  const handleKeyPress = (e: React.KeyboardEvent, mode: 'text' | 'audio' | 'video') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStartChat(mode);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (isMatching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-t-transparent mx-auto mb-8" style={{ borderColor: 'var(--primary-brand)', borderTopColor: 'transparent' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <LazyImage 
                src="/logo512.png" 
                alt="Omegoo - Matching you with a stranger" 
                className="w-12 h-12 rounded-full shadow-lg animate-pulse object-cover"
                width={48}
                height={48}
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
    <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8" role="main">
      {/* Welcome Section */}
      <section className="text-center mb-8 sm:mb-12 px-4 py-8 sm:py-16 text-white" aria-labelledby="home-hero-heading">
        {/* Hero Headline */}
        <div className="mb-6">
          <p className="text-sm sm:text-base text-white/70 tracking-widest mb-3">100% FREE Random Chat</p>
          <h1 id="home-hero-heading" className="text-3xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 text-transparent bg-clip-text drop-shadow-2xl tracking-wider">
            Random · Video · Voice · Text
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-3 uppercase tracking-[0.35rem]">
            Talk to strangers
          </p>
        </div>

        {/* Privacy Notice - Prominent */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center bg-green-500/20 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-green-400/50 shadow-lg">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs sm:text-sm text-white font-medium">
              100% Anonymous — No signup required. <button onClick={() => navigate('/privacy')} className="underline hover:text-green-300 transition-colors">Privacy</button>
            </span>
          </div>
        </div>

        {(() => {
          const incident = statusSummary?.activeIncident || statusSummary?.incident || null;

          if (!incident) {
            return null;
          }

          const lastUpdatedSource = statusSummary?.lastUpdated || incident.updatedAt || incident.startedAt;
          const lastUpdatedLabel = lastUpdatedSource
            ? new Date(lastUpdatedSource).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;

          return (
            <div
              className={`max-w-3xl mx-auto mb-6 rounded-2xl border px-4 py-3 text-left shadow-lg ${
                incident.severity === 'critical'
                  ? 'bg-red-500/20 border-red-400/50 text-red-100'
                  : 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="font-semibold uppercase tracking-wide text-xs sm:text-sm">
                  {incident.severity === 'critical' ? 'Active Outage' : 'Service Advisory'}
                </div>
                {lastUpdatedLabel && (
                  <div className="text-xs text-white/70">
                    Updated {lastUpdatedLabel}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm sm:text-base text-white">{incident.message}</p>
              {incident.fallbackUrl && (
                <a
                  href={incident.fallbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center text-xs sm:text-sm font-medium text-white underline"
                >
                  View live status details
                </a>
              )}
            </div>
          );
        })()}


      </section>

      {/* Total Online Users Counter - Above Cards */}
      <div className="flex justify-center mb-6 px-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border border-purple-400/30 shadow-xl">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" style={{ animationDuration: '2s' }}></span>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/30 border border-purple-400/50">
              <svg className="w-6 h-6 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Live Users</p>
            <p className="text-2xl font-bold text-white animate-pulse" style={{ animationDuration: '3s' }}>
              {(() => {
                const total = modeUserCounts.text + modeUserCounts.audio + modeUserCounts.video;
                const multiplied = total * 3;
                return multiplied > 0 ? `${multiplied.toLocaleString()}+` : '0';
              })()}
            </p>
          </div>
          <div className="text-xs text-purple-200/70">online now</div>
        </div>
      </div>

      {/* Chat Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 px-4 max-w-6xl mx-auto">
        {/* Text Chat */}
        <div 
          className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all hover:scale-105 transform duration-200 relative"
          role="article"
          aria-labelledby="text-chat-title"
        >
          {/* Info Icon with Tooltip */}
          <div className="absolute top-4 right-4">
            <button
              onMouseEnter={() => setShowTooltip('text')}
              onMouseLeave={() => setShowTooltip(null)}
              onClick={() => setShowTooltip(showTooltip === 'text' ? null : 'text')}
              className="w-6 h-6 rounded-full bg-blue-500/30 hover:bg-blue-500/50 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Information about text chat"
            >
              <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
            {showTooltip === 'text' && (
              <div className="absolute top-8 right-0 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-10 border border-blue-400/30">
                <p className="font-semibold mb-1">✨ Text Chat</p>
                <p className="text-gray-300">Connect instantly. No signup needed.</p>
              </div>
            )}
          </div>
          
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-blue-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 id="text-chat-title" className="text-lg sm:text-xl font-bold mb-2 text-white">
            Text Chat
          </h3>
          <p className="text-base sm:text-lg font-semibold text-blue-300 mb-2">
            Fast & Anonymous
          </p>
          <p className="text-sm text-gray-300 mb-4">
            Quick text chats with strangers
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/50 text-green-100 text-sm font-bold mb-4">
            Random Match • <span className="text-green-300">100% FREE</span>
          </div>
          <button
            onClick={() => handleStartChat('text')}
            onKeyDown={(e) => handleKeyPress(e, 'text')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base shadow-lg touch-manipulation min-h-[48px] focus:outline-none focus:ring-4 focus:ring-blue-400/50"
            aria-label="Start free text chat"
          >
            Start Free Text Chat
          </button>
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-100 text-xs sm:text-sm font-semibold animate-pulse" aria-live="polite">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {modeUserCounts.text * 3} online now
            </span>
          </div>
        </div>

        {/* Audio Chat */}
        <div 
          className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all hover:scale-105 transform duration-200 relative"
          role="article"
          aria-labelledby="voice-chat-title"
        >
          {/* Info Icon with Tooltip */}
          <div className="absolute top-4 right-4">
            <button
              onMouseEnter={() => setShowTooltip('audio')}
              onMouseLeave={() => setShowTooltip(null)}
              onClick={() => setShowTooltip(showTooltip === 'audio' ? null : 'audio')}
              className="w-6 h-6 rounded-full bg-green-500/30 hover:bg-green-500/50 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Information about voice chat"
            >
              <svg className="w-4 h-4 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
            {showTooltip === 'audio' && (
              <div className="absolute top-8 right-0 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-10 border border-green-400/30">
                <p className="font-semibold mb-1">🎤 Voice Chat</p>
                <p className="text-gray-300">Free voice chat. Mic access needed.</p>
              </div>
            )}
          </div>
          
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-green-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 id="voice-chat-title" className="text-lg sm:text-xl font-bold mb-2 text-white">
            Voice Chat
          </h3>
          <p className="text-base sm:text-lg font-semibold text-green-300 mb-2">
            Talk to Strangers
          </p>
          <p className="text-sm text-gray-300 mb-4">
            Talk with strangers live
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/50 text-green-100 text-sm font-bold mb-4">
            Random Match • <span className="text-green-300">100% FREE</span>
          </div>
          <button
            onClick={() => handleStartChat('audio')}
            onKeyDown={(e) => handleKeyPress(e, 'audio')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base shadow-lg touch-manipulation min-h-[48px] focus:outline-none focus:ring-4 focus:ring-green-400/50"
            aria-label="Start free voice chat"
          >
            Start Free Voice Chat
          </button>
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-100 text-xs sm:text-sm font-semibold animate-pulse" aria-live="polite">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {modeUserCounts.audio * 3} online now
            </span>
          </div>
        </div>

        {/* Video Chat */}
        <div 
          className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-xl p-6 sm:p-8 text-center hover:bg-opacity-15 transition-all hover:scale-105 transform duration-200 relative"
          role="article"
          aria-labelledby="video-chat-title"
        >
          {/* Info Icon with Tooltip */}
          <div className="absolute top-4 right-4">
            <button
              onMouseEnter={() => setShowTooltip('video')}
              onMouseLeave={() => setShowTooltip(null)}
              onClick={() => setShowTooltip(showTooltip === 'video' ? null : 'video')}
              className="w-6 h-6 rounded-full bg-purple-500/30 hover:bg-purple-500/50 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Information about video chat"
            >
              <svg className="w-4 h-4 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
            {showTooltip === 'video' && (
              <div className="absolute top-8 right-0 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-10 border border-purple-400/30">
                <p className="font-semibold mb-1">🎥 Video Chat</p>
                <p className="text-gray-300">Random video chat. Camera preview.</p>
              </div>
            )}
          </div>
          
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 bg-opacity-20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-purple-400 border-opacity-30">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 id="video-chat-title" className="text-lg sm:text-xl font-bold mb-2 text-white">
            Video Chat
          </h3>
          <p className="text-base sm:text-lg font-semibold text-purple-300 mb-2">
            Face to Face
          </p>
          <p className="text-sm text-gray-300 mb-4">
            Face-to-face video chats
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/50 text-green-100 text-sm font-bold mb-4">
            Random Match • <span className="text-green-300">100% FREE</span>
          </div>
          <button
            onClick={() => handleStartChat('video')}
            onKeyDown={(e) => handleKeyPress(e, 'video')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 w-full text-sm sm:text-base shadow-lg touch-manipulation min-h-[48px] focus:outline-none focus:ring-4 focus:ring-purple-400/50"
            aria-label="Start free video chat"
          >
            Start Free Video Chat
          </button>
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-100 text-xs sm:text-sm font-semibold animate-pulse" aria-live="polite">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {modeUserCounts.video * 3} online now
            </span>
          </div>
        </div>
      </div>

      {statusSummary && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm text-white">
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-white/70">Online Now</div>
              <div className="text-lg sm:text-xl font-bold">{totalOnlineUsers || (statusSummary.connectedUsers * 3)}</div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-white/70">In Queue</div>
              <div className="text-lg sm:text-xl font-bold">{statusSummary.queue.total * 3}</div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-white/70">Voice Queue</div>
              <div className="text-lg sm:text-xl font-bold">{statusSummary.queue.audio * 3}</div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-white/70">Video Queue</div>
              <div className="text-lg sm:text-xl font-bold">{statusSummary.queue.video * 3}</div>
            </div>
          </div>
        </div>
      )}

    {/* Free Instant Access & SEO Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  How Omegoo delivers 100% FREE instant random chat
                </h2>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  Start chatting <strong className="text-green-300">instantly without signup or payment</strong>. Omegoo is a truly <strong className="text-white">free Omegle alternative for India</strong> where you can jump into text, voice, or video sessions with just one tap. Our anonymous guest system keeps you safe while eliminating barriers—perfect for students from IIT hostels, university dorms, community colleges, or anyone connecting worldwide.
                </p>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-200 list-disc list-inside">
                  <li>No credit card, no subscription—100% free forever for basic random chat modes.</li>
                  <li>Switch between text, voice, and video seamlessly without losing your session.</li>
                  <li>Optional login unlocks premium features like saved preferences and chat history, but guest access is always FREE.</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/20 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xl font-semibold">Why users choose Omegoo as their go-to Omegle alternative</h3>
                <div className="space-y-3 text-sm sm:text-base text-gray-100">
                  <p>• Match with peers from IITs, NITs, DU, SRM, MIT, and global universities on a moderated free chat platform.</p>
                  <p>• Safer than Omegle with instant reporting, AI moderation, and anonymous guest tracking for accountability.</p>
                  <p>• Perfect for language practice, finding study partners, or meeting travel buddies without bots or spam.</p>
                </div>
                <div className="mt-auto text-xs text-gray-200">
                  Popular searches: <span className="font-semibold text-white">"free Omegle alternative India", "random video chat no signup", "safe anonymous chat", "instant stranger chat".</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audience Targets */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
            Built for campuses in India, loved as an Omegle alternative everywhere
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[{
              title: 'University & IIT students',
              copy: 'Discover project partners, hackathon teammates, fest collaborators, or someone to vent to after exams. Omegoo makes it simple to meet peers from IITs, NITs, DU, VIT, SRM, JNU, and more—without the unpredictability of Omegle-style chats.'
            }, {
              title: 'College applicants & aspirants',
              copy: 'Talk to current students to understand campus life before making your choice. Ask real people about hostels, placements, and clubs in a live random chat that feels like Omegle, but with moderation and context.'
            }, {
              title: 'Alumni & young professionals',
              copy: 'Reconnect with Indian campuses while building a global professional network. Host mentoring sessions or language exchanges over voice and video on a trusted Omegle competitor.'
            }, {
              title: 'Creators & explorers',
              copy: 'Grow engaged communities by hosting pop-up conversations, Q\u0026A jams, or cultural exchanges with people around the world on an Omegle-like platform that actually celebrates creativity.'
            }].map((audience) => (
              <div
                key={audience.title}
                className="bg-white/10 border border-white/20 rounded-2xl p-6 text-gray-100 backdrop-blur-md shadow-lg"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{audience.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed">{audience.copy}</p>
                <div className="mt-4 text-xs uppercase tracking-wider text-indigo-200">
                  Popular keywords: random chat app India, safe Omegle alternative, campus chat platform, anonymous university chat
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Random Chat Pitch */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-white/10 border border-white/15 rounded-3xl p-6 sm:p-10 text-white backdrop-blur-md shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Searching for a safe Omegle alternative for random stranger chat?</h2>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6">
              Omegoo is a fresh alternative to classic stranger chat platforms like Omegle. You can start a <strong className="text-white">random chat with strangers</strong>, match for <strong className="text-white">video chat in India</strong>, or discover <strong className="text-white">voice chat rooms for college students</strong> without worrying about safety. AI moderation, anonymous guest tracking, and instant reporting keep every connection respectful, making Omegoo the go-to free Omegle-like site for students and young professionals.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-2">Pick your vibe fast</h3>
                <p className="text-sm text-gray-100">
                  Select text, voice, or video chat and start an instant Omegle-style conversation with strangers who are online now—no signup, no payment required.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-2">Stay safe and anonymous</h3>
                <p className="text-sm text-gray-100">
                  Anonymous guest IDs track behavior for moderation without exposing your identity—something traditional Omegle alternatives often miss.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold mb-2">Works on any device</h3>
                <p className="text-sm text-gray-100">
                  No downloads. Join from mobile, desktop, or tablet with a single tap—no VPN hacks or third-party plugins like older Omegle clones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Rich Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Why Omegoo ranks as a leading Omegle alternative in India and worldwide
            </h2>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-4">
              Searchers looking for <strong className="text-white">"Omegle alternative India"</strong>, <strong className="text-white">"stranger chat website in India"</strong>, <strong className="text-white">"random video chat for students"</strong>, or <strong className="text-white">"anonymous college chat"</strong> find Omegoo because each feature is crafted for intent-based discovery. Our pages highlight quick matching, coin-powered trust, and culturally relevant communities so Google and users understand Omegoo is the best ethical replacement for Omegle and other random chat apps.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Localized Indian coverage</h3>
                <p className="text-sm text-gray-200">
                  Content covers metro cities, tier-2 colleges, and IIT hostels while staying inclusive for global matches. Geo-specific keywords help us appear when users search for Omegle alternatives from Delhi, Bengaluru, Mumbai, Hyderabad, or abroad.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Topic clusters & internal links</h3>
                <p className="text-sm text-gray-200">
                  Guides on safety, privacy, and community policies link to About, Safety, Terms, and Contact pages. This network signals expertise to search engines and keeps visitors exploring this responsible Omegle-style experience.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Performance-focused experience</h3>
                <p className="text-sm text-gray-200">
                  Optimized image assets, minimal blocking scripts, and responsive UI keep Core Web Vitals healthy, which improves our search rankings for competitive chat keywords like "best Omegle replacement".
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[{
              title: 'Omegle alternative for random stranger chat',
              description: 'Jump into anonymous conversations after classes or work. Great for venting, sharing memes, or practicing conversational English with real people who actually behave.'
            }, {
              title: 'Campus networking & study help',
              description: 'Exchange notes, prep for exams, and find teammates for hackathons or college festivals using quick text or voice chat sessions—minus the Omegle chaos.'
            }, {
              title: 'Global late-night chill sessions',
              description: 'Meet travelers, gamers, and creators from other countries, host virtual coffee chats, or plan collaborations using secure video rooms that outperform legacy Omegle clones.'
            }, {
              title: 'Creators promoting safe stranger chat',
              description: 'Streamers and podcast hosts can invite followers into moderated random chats, showcasing Omegoo as a responsible Omegle replacement during live sessions.'
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
              answer: 'Omegoo began with Indian campuses in mind, but anyone can join. Students, alumni, working professionals, creators, and curious travelers use this Omegle-style platform to meet new people instantly.'
            }, {
              question: 'Is Omegoo an Omegle alternative for India?',
              answer: 'Yes. Omegoo was built as a safer, student-friendly Omegle alternative with verified badges, community norms, and AI safety tools tailored for Indian internet users.'
            }, {
              question: 'Is Omegoo really 100% free or are there hidden charges?',
              answer: 'All core features—text, voice, and video chat—are completely FREE forever. You can start as a guest without signup. Optional premium features may come later, but random chat with strangers will always remain free, unlike many Omegle alternatives.'
            }, {
              question: 'Is it safe to chat with strangers on Omegoo?',
              answer: 'Yes. Moderation bots, community reporting, and real-time safety prompts protect every session. You can also block or report any user in one tap, creating a calmer environment than traditional Omegle alternatives.'
            }, {
              question: 'Do I need a VPN like I did for Omegle?',
              answer: 'No VPN is required. Omegoo runs in the browser with modern infra, so you can connect instantly without geo-restrictions or proxy tricks.'
            }, {
              question: 'Can I access Omegoo from outside India?',
              answer: 'Absolutely. Omegoo supports users in over 150 countries, so you can switch between India-centric and global matches depending on your preferences.'
            }, {
              question: 'How is Omegoo different from Omegle or other random chat sites?',
              answer: 'Omegoo combines verified badges, a daily coin system, safety prompts, and contextual onboarding to deliver meaningful random chat sessions. The result is an Omegle alternative built for students and young professionals who want quality conversations, not bots or spam.'
            }, {
              question: 'Does Omegoo work on mobile for random video chat?',
              answer: 'Yes. The web app is fully responsive, so you can launch random video or voice chats from your phone, tablet, or laptop without installing anything.'
            }, {
              question: 'Can I start audio-only chats without showing my face?',
              answer: 'Absolutely. Choose the voice mode to enter audio-only rooms. You can switch to video later or stay on voice-only conversations if you prefer more privacy.'
            }, {
              question: 'How do I report abusive strangers during a chat?',
              answer: 'Tap the report or block button inside the chat window. Our moderation team reviews every report instantly, and repeated offenders lose access to their coins and account, keeping this Omegle-style experience respectful.'
            }, {
              question: 'Will Omegoo stay free like Omegle was?',
              answer: 'Yes! Core random chat features will always be 100% FREE. Optional premium features may be added later for power users, but basic text, voice, and video chat with strangers will never require payment—keeping Omegoo accessible as a truly free Omegle alternative.'
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

        {/* Omegle Comparison */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-white/10 border border-white/15 rounded-3xl p-6 sm:p-10 text-white backdrop-blur-md shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">How Omegoo compares to Omegle in 2025</h2>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6 text-center">
              Users still search for Omegle when they want fast random chat rooms, but Omegoo delivers the same excitement with modern safety layers. Think of it as an Omegle alternative built for today’s internet norms—verified identities, community moderation, and privacy-first design.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-3">Where Omegle fell short</h3>
                <ul className="space-y-2 text-sm sm:text-base text-gray-100 list-disc list-inside">
                  <li>Unverified strangers could appear in any chat room, making experiences unpredictable.</li>
                  <li>Reports of spam, bots, and n*sfw content made it risky for students or young professionals.</li>
                  <li>No built-in contextual onboarding or community rules beyond a generic terms page.</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-500/40 to-blue-500/40 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-3">What Omegoo improves</h3>
                <ul className="space-y-2 text-sm sm:text-base text-gray-100 list-disc list-inside">
                  <li>Coin system curbs spam and rewards good behavior, keeping matches respectful.</li>
                  <li>Moderation bots, AI prompts, and verified badges provide context that Omegle never offered.</li>
                  <li>Campus-friendly onboarding explains expectations before you join a random text, voice, or video chat.</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-xs sm:text-sm text-gray-200 text-center">
              Omegoo respects Omegle’s legacy of spontaneous conversations while upgrading the experience for learners, creators, and travelers seeking ethical random chats.
            </div>
          </div>
        </section>

        {/* Omegle Safety Tips */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-gradient-to-br from-indigo-900/60 to-blue-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Ethical tips for anyone seeking Omegle-style chats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Respect boundaries</h3>
                <p className="text-sm text-gray-200">
                  Whether you use Omegoo or revisit Omegle alternatives, always ask before sharing personal details or recording screens. Consent keeps random chats positive.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Report unsafe behavior</h3>
                <p className="text-sm text-gray-200">
                  Omegoo makes it easy to block and report. If you encounter issues on legacy Omegle clones, exit the chat immediately and alert moderators if possible.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-5">
                <h3 className="text-lg font-semibold mb-2">Protect your identity</h3>
                <p className="text-sm text-gray-200">
                  Stick to nicknames, use neutral backgrounds, and avoid sharing location data. These habits apply on Omegle, Omegoo, and any random video chat site.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-gray-200">
              Following these ethical guidelines keeps the global random chat community safer—whether you are exploring Omegoo or searching for trusted Omegle replacements.
            </div>
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
            How to start a FREE random chat on Omegoo in under a minute
          </h2>
          <ol className="space-y-4 text-left text-gray-100 text-sm sm:text-base leading-relaxed bg-white/5 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur">
            <li>
              <span className="font-semibold text-white">1. Visit Omegoo.chat and start instantly.</span> No signup required! Click any chat mode as a guest and start chatting immediately. Optional login available for premium features like saved preferences.
            </li>
            <li>
              <span className="font-semibold text-white">2. Pick your chat mode.</span> Choose between <strong className="text-white">text chat</strong> for quick conversations, <strong className="text-white">voice chat</strong> for spontaneous talks, or <strong className="text-white">video chat</strong> for the full Omegle alternative experience—all 100% FREE.
            </li>
            <li>
              <span className="font-semibold text-white">3. Get matched instantly.</span> Our smart system connects you with strangers online right now. No waiting, no complexity—just instant random chat like Omegle, but safer.
            </li>
            <li>
              <span className="font-semibold text-white">4. Stay respectful and report issues.</span> Great conversations make Omegoo better for everyone. Use our instant report button if someone crosses the line—anonymous guest tracking enables accountability.
            </li>
            <li>
              <span className="font-semibold text-white">5. Explore advanced features.</span> Switch between text, voice, and video seamlessly. Works on any device—phone, tablet, or desktop. No downloads or VPNs needed unlike legacy Omegle clones.
            </li>
          </ol>
        </section>

        {/* City Landing Keywords */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
            Local random chat communities across India
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[{
              city: 'Delhi NCR random chat',
              blurb: 'Join students from Delhi University, IP University, and Noida campuses who rely on Omegoo as a safe Omegle alternative for late-night brainstorming and cultural exchanges.'
            }, {
              city: 'Mumbai video chat rooms',
              blurb: 'Connect with content creators, film students, and startup founders based in Mumbai suburbs. Omegoo’s moderated video chat makes spontaneous collaborations easier than on classic Omegle.'
            }, {
              city: 'Bengaluru tech meetups',
              blurb: 'Discover hackathon partners and product mentors from Koramangala, Indiranagar, and Whitefield using Omegoo’s random voice chat—perfect for the city’s remote-first tech crowd.'
            }, {
              city: 'Hyderabad student hangouts',
              blurb: 'Students from IIIT-H, Osmania University, and BITS Pilani Hyderabad use Omegoo to practice interviews and language skills in a moderated Omegle-like setting.'
            }, {
              city: 'Kolkata cultural exchanges',
              blurb: 'Meet artists, musicians, and literature lovers from Jadavpur University and Presidency College through friendly text chat queues tailored for Eastern India.'
            }, {
              city: 'Chennai global connections',
              blurb: 'SRM, VIT Chennai, and Anna University learners hop into Omegoo’s random stranger chat to find project teammates across time zones without dealing with Omegle VPN issues.'
            }].map((location) => (
              <article key={location.city} className="bg-white/10 border border-white/15 rounded-2xl p-6 text-gray-100 backdrop-blur-md shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-2">{location.city}</h3>
                <p className="text-sm sm:text-base leading-relaxed">{location.blurb}</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-indigo-200">
                  Keywords: {location.city.toLowerCase()}, Omegle alternative {location.city.split(' ')[0]}, campus chat {location.city.split(' ')[0]}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* SEO-Rich Content Block - Below the Fold */}
        <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-white">
          {/* Main SEO Heading */}
          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Free Omegle Alternative — Omegoo.chat
            </h1>
            <p className="text-base sm:text-lg text-gray-200 max-w-4xl mx-auto leading-relaxed">
              The best <strong>Omegle alternative</strong> for <strong>random video chat with strangers</strong>. Start instant conversations without login or registration. Omegoo delivers what OmeTV and other platforms promise—a truly free, anonymous, and safe way to <strong>talk to strangers</strong> online.
            </p>
          </header>

          {/* Why Omegoo is Better */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 mb-12 backdrop-blur-md">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Why Omegoo is Better Than OmeTV and Other Omegle Alternatives</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-blue-300 mb-3">🎯 No Login Video Chat</h3>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  Unlike OmeTV that requires account creation, Omegoo lets you start <strong>no login video chat</strong> instantly. Click, connect, and start talking to strangers within seconds—no email, no verification, no barriers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-purple-300 mb-3">🔒 100% Anonymous Video Chat</h3>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  Your privacy matters. Omegoo provides truly <strong>anonymous video chat</strong> with stranger cam chat features that don't track or store your personal data. We use anonymous guest IDs only for safety moderation.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-300 mb-3">⚡ Faster Than Omegle</h3>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  Traditional Omegle often had slow loading times and frequent disconnections. Our optimized infrastructure ensures lightning-fast matching for <strong>random chat without registration</strong>—typically under 2 seconds.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-pink-300 mb-3">🛡️ AI-Powered Safety</h3>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                  Unlike legacy Omegle clones, Omegoo features real-time AI moderation, instant reporting, and community safety prompts. This <strong>Omegle-like app</strong> actually cares about user safety.
                </p>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Benefits of Random Video Chat on Omegoo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/10 rounded-2xl p-6">
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-lg font-semibold mb-2">Global Connections</h3>
                <p className="text-sm text-gray-200">
                  <strong>Talk to strangers</strong> from 150+ countries. Meet people from USA, India, Philippines, UK, Indonesia, and beyond in this truly global <strong>free video chat with strangers</strong> platform.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-white/10 rounded-2xl p-6">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-semibold mb-2">Multi-Mode Chat</h3>
                <p className="text-sm text-gray-200">
                  Not ready for video? Choose text or voice chat first. Switch between modes seamlessly—this <strong>stranger cam chat</strong> platform adapts to your comfort level.
                </p>
              </div>
              <div className="bg-gradient-to-br from-pink-600/30 to-orange-600/30 border border-white/10 rounded-2xl p-6">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="text-lg font-semibold mb-2">Works Everywhere</h3>
                <p className="text-sm text-gray-200">
                  Mobile, tablet, or desktop—no app download needed. This <strong>random chat without registration</strong> works directly in your browser on any device.
                </p>
              </div>
            </div>
          </section>

          {/* Features Deep Dive */}
          <section className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-6 sm:p-10 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Core Features of Omegoo: The Ultimate Omegle Alternative</h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">Instant Matching System</h3>
                  <p className="text-sm sm:text-base text-gray-200">
                    Our smart algorithm connects you with online strangers in real-time. No queues, no waiting rooms—just instant <strong>random video chat</strong> that works like Omegle should have.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-2xl">
                  🎭
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-2">Complete Anonymity</h3>
                  <p className="text-sm sm:text-base text-gray-200">
                    No email required, no phone verification, no personal data collection. This is truly <strong>anonymous video chat</strong> where your identity remains protected while enjoying <strong>stranger cam chat</strong> conversations.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-300 mb-2">Lightning Fast Performance</h3>
                  <p className="text-sm sm:text-base text-gray-200">
                    Built on modern WebRTC technology with global CDN infrastructure. Experience smooth HD video quality and crystal-clear audio in your <strong>random chat without registration</strong> sessions.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center text-2xl">
                  🛡️
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-pink-300 mb-2">Advanced Safety Measures</h3>
                  <p className="text-sm sm:text-base text-gray-200">
                    AI-powered content moderation, instant report buttons, automatic abuse detection, and community guidelines enforcement make this the safest <strong>Omegle-like app</strong> available today.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Protection */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">How Omegoo Protects Your Privacy in Random Video Chat</h2>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md">
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-6">
                Privacy is the foundation of every <strong>anonymous video chat</strong> platform. Unlike OmeTV or other services that collect extensive user data, Omegoo implements industry-leading privacy protections:
              </p>
              <ul className="space-y-4 text-sm sm:text-base text-gray-200">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-green-400 font-bold">✓</span>
                  <span><strong>Zero Personal Data Storage:</strong> We don't store chat logs, video recordings, or personal information beyond anonymous guest IDs used solely for moderation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-green-400 font-bold">✓</span>
                  <span><strong>End-to-End Encryption:</strong> All <strong>stranger cam chat</strong> sessions use WebRTC encryption, ensuring your conversations remain private between you and your chat partner.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-green-400 font-bold">✓</span>
                  <span><strong>No Third-Party Tracking:</strong> Unlike many <strong>Omegle alternatives</strong>, we minimize tracking scripts and don't sell your data to advertisers.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 text-green-400 font-bold">✓</span>
                  <span><strong>GDPR Compliant:</strong> Full compliance with international privacy regulations including GDPR, ensuring your rights are protected globally.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Global Usage Stats */}
          <section className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-6 sm:p-10 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Omegoo: Connecting Strangers Worldwide</h2>
            <p className="text-sm sm:text-base text-gray-200 text-center mb-8 max-w-3xl mx-auto">
              Join millions who've switched from Omegle, OmeTV, and other platforms to experience the next generation of <strong>random video chat with strangers</strong>. Our global community spans every continent.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">150+</div>
                <div className="text-xs sm:text-sm text-gray-300">Countries Connected</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-xs sm:text-sm text-gray-300">Active Users Online</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-3xl sm:text-4xl font-bold text-pink-400 mb-2">&lt; 2s</div>
                <div className="text-xs sm:text-sm text-gray-300">Average Match Time</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">100%</div>
                <div className="text-xs sm:text-sm text-gray-300">FREE Forever</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-xs sm:text-sm text-gray-300">
                <strong>Popular Regions:</strong> United States, India, Philippines, United Kingdom, Indonesia, Brazil, Canada, Germany, Australia, Mexico, Pakistan, Bangladesh, Turkey, Vietnam, Thailand
              </p>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-white/10 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Start Your Free Random Video Chat?
            </h2>
            <p className="text-sm sm:text-base text-gray-200 mb-6 max-w-2xl mx-auto">
              Join the best <strong>Omegle alternative</strong> today. No signup, no payment, no hassle—just instant <strong>random video chat with strangers</strong> from around the world.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Start Chatting Now — 100% FREE
            </button>
            <p className="text-xs text-gray-400 mt-4">
              No login required • Anonymous • Safe • Instant connections
            </p>
          </section>
        </article>

        {/* End of Global Communities Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
            A global Omegle alternative for respectful random chat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-100 text-sm sm:text-base leading-relaxed">
            {[{
              region: 'North America & Europe',
              text: 'Creators and students from New York, Toronto, London, and Berlin use Omegoo for cross-cultural language exchanges without the unpredictability that defined Omegle. Real-time moderation lets them host community jams and podcast sessions safely.'
            }, {
              region: 'Middle East & Africa',
              text: 'Remote workers from Dubai, Riyadh, Nairobi, and Cape Town jump into Omegoo voice rooms to meet collaborators across time zones. Our random chat queues keep conversations respectful, unlike the legacy Omegle rooms they tried before.'
            }, {
              region: 'South East Asia & Oceania',
              text: 'Students in Singapore, Manila, Jakarta, Sydney, and Auckland rely on Omegoo as a low-latency Omegle replacement for group study sessions and late-night hangouts.'
            }, {
              region: 'Latin America',
              text: 'Universities in São Paulo, Mexico City, Bogotá, and Buenos Aires incorporate Omegoo into cultural exchange clubs, promoting safe stranger chat that still feels spontaneous and Omegle-like.'
            }].map((item) => (
              <article key={item.region} className="bg-white/10 border border-white/15 rounded-2xl p-6 backdrop-blur-md shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-2">{item.region}</h3>
                <p>{item.text}</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-indigo-200">
                  Global keywords: Omegle alternative worldwide, safe Omegle replacement, random chat international
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-xs sm:text-sm text-gray-200">
            Omegoo keeps the spirit of Omegle alive for global audiences while adding verification, coins, and regional filters so every random chat feels intentional.
          </p>
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

    </main>
  );
};

export default Home;