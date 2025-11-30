import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GuestProvider, useGuest } from './contexts/GuestContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { VoiceFilterProvider } from './contexts/VoiceFilterContext';
import { ARFilterProvider } from './contexts/ARFilterContext';
import apiService from './services/api';
import SEOHead from './components/SEO/SEOHead';
import { defaultSEO } from './config/seo.config';

// Components
import Layout from './components/Layout/Layout';
import AgeGate from './components/Auth/AgeGate';
import ScrollToTop from './components/ScrollToTop';
import LoginRegister from './components/Auth/LoginRegister';
import VerifyOTP from './components/Auth/VerifyOTP';
import PhoneVerification from './components/Auth/PhoneVerification';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Home from './components/Home/Home';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
import Admin from './components/Admin/Admin';
import LoadingSpinner from './components/UI/LoadingSpinner';
import PrivacyNotice from './components/UI/PrivacyNotice';

// New Pages
import About from './components/Pages/About';
import Contact from './components/Pages/Contact';
import PrivacyPolicy from './components/Pages/PrivacyPolicy';
import TermsOfService from './components/Pages/TermsOfService';
import SafetyGuidelines from './components/Pages/SafetyGuidelines';
import CountryPage from './components/Country/CountryPage';

// SEO Money Keyword Pages
import NoLoginVideoChat from './components/SEO/NoLoginVideoChat';
import AnonymousVideoChat from './components/SEO/AnonymousVideoChat';
import StrangerCamChat from './components/SEO/StrangerCamChat';
import OmegleLikeApp from './components/SEO/OmegleLikeApp';
import RandomChatNoRegistration from './components/SEO/RandomChatNoRegistration';

// Lazy load chat components for better performance
const Chat = lazy(() => import('./components/Chat/Chat'));
const TextChat = lazy(() => import('./components/Chat/TextChat'));
const AudioChat = lazy(() => import('./components/Chat/AudioChat'));
const VideoChat = lazy(() => import('./components/Chat/VideoChat'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiresVerification?: boolean }> = ({ 
  children, 
  requiresVerification = false 
}) => {
  const { user, loading, token } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { 
    hasUser: !!user, 
    hasToken: !!token,
    loading, 
    userId: user?.id,
    requiresVerification 
  });

  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading...');
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (requiresVerification && user.tier === 'guest') {
    console.log('⚠️ ProtectedRoute: Guest user, redirecting to home');
    // Redirect unverified users to Home; Home component will show verification popup
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
};

// App Routes Component - Now syncs guest ID with API service
const AppRoutes: React.FC = () => {
  const { hasAcceptedTerms, loading } = useAuth();
  const { guestId, isInitialized } = useGuest();
  const [hasError, setHasError] = React.useState(false);

  // Sync guest ID with API service whenever it changes
  useEffect(() => {
    if (guestId && isInitialized) {
      apiService.setGuestId(guestId);
      console.log('[App] Guest ID synced with API service:', guestId.substring(0, 12) + '...');
    }
  }, [guestId, isInitialized]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Caught error:', event.error);
      setHasError(true);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      
      // Silently ignore these common errors that don't affect functionality
      const ignoredErrors = [
        'Failed to fetch',
        'ERR_BLOCKED_BY_CLIENT',
        'NetworkError',
        'Load failed',
        'network'
      ];
      
      const errorMessage = event.reason?.message || String(event.reason);
      const shouldIgnore = ignoredErrors.some(err => 
        errorMessage.toLowerCase().includes(err.toLowerCase())
      );
      
      if (shouldIgnore) {
        console.log('⚠️ Network/blocked request ignored (ad-blocker or connectivity)');
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Show error screen if critical error occurred
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please refresh the page to continue
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while initializing auth or guest
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Omegoo...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Show age gate for first-time users BEFORE any other routes
  // This ensures every new user sees age verification before accessing the app
  if (!hasAcceptedTerms) {
    return <AgeGate />;
  }

  // Allow browsing without login - login required only for chat features
  return (
    <>
      {/* Default SEO for all pages */}
      <SEOHead {...defaultSEO} />
      
      <Router>
        {/* Scroll to top on route change + restore position on back/forward */}
        <ScrollToTop />
        
        <Routes>
          {/* Login/Register route */}
          <Route path="/login" element={<LoginRegister />} />

  {/* Password reset routes */}
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Email OTP Verification route */}
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        {/* Static Pages - Public Access */}
        <Route path="/about" element={
          <Layout>
            <About />
          </Layout>
        } />
        <Route path="/contact" element={
          <Layout>
            <Contact />
          </Layout>
        } />
        <Route path="/privacy" element={
          <Layout>
            <PrivacyPolicy />
          </Layout>
        } />
        <Route path="/terms" element={
          <Layout>
            <TermsOfService />
          </Layout>
        } />
        <Route path="/safety" element={
          <Layout>
            <SafetyGuidelines />
          </Layout>
        } />
        
        {/* SEO Money Keyword Pages - Public Access */}
        <Route path="/no-login-video-chat" element={
          <Layout>
            <NoLoginVideoChat />
          </Layout>
        } />
        <Route path="/anonymous-video-chat" element={
          <Layout>
            <AnonymousVideoChat />
          </Layout>
        } />
        <Route path="/stranger-cam-chat" element={
          <Layout>
            <StrangerCamChat />
          </Layout>
        } />
        <Route path="/omegle-like-app" element={
          <Layout>
            <OmegleLikeApp />
          </Layout>
        } />
        <Route path="/random-chat-no-registration" element={
          <Layout>
            <RandomChatNoRegistration />
          </Layout>
        } />
        
        {/* Country SEO Pages - Public Access */}
        <Route path="/country/:countrySlug" element={
          <Layout>
            <CountryPage />
          </Layout>
        } />
        
        {/* Home - Public Access (No login required) */}
        <Route path="/" element={
          <Layout>
            <Home />
          </Layout>
        } />
        
        {/* Profile - Public Access (Shows login option if not logged in) */}
        <Route path="/profile" element={
          <Layout>
            <Profile />
          </Layout>
        } />
        
        {/* Settings - Public Access */}
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        
        <Route path="/verify" element={
          <ProtectedRoute>
            <Layout>
              <PhoneVerification />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Chat routes - Guest access allowed, login optional for premium features */}
        <Route path="/chat" element={
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading chat...</p>
              </div>
            </div>
          }>
            <Chat />
          </Suspense>
        } />
        
        <Route path="/chat/text" element={
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading text chat...</p>
              </div>
            </div>
          }>
            <TextChat />
          </Suspense>
        } />
        
        <Route path="/chat/audio" element={
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading voice chat...</p>
              </div>
            </div>
          }>
            <AudioChat />
          </Suspense>
        } />
        
        <Route path="/chat/video" element={
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading video chat...</p>
              </div>
            </div>
          }>
            <VideoChat />
          </Suspense>
        } />
        
        {/* Admin routes - Protected */}
  <Route path="/omegoo-admin/*" element={<Admin />} />

  {/* Hide legacy /admin path */}
  <Route path="/admin/*" element={<Navigate to="/" replace />} />
        
        {/* Fallback - Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    
    {/* Privacy Notice - Shows at bottom of all pages */}
    <PrivacyNotice />
  </>
  );
};

const App: React.FC = () => {
  // Google OAuth Client ID - From your Google Cloud Console
  // Note: React Scripts uses process.env, not import.meta.env
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '493047971159-6089h729jnghpfo7scujvjjhcb0lmg8d.apps.googleusercontent.com';

  // Force cache refresh on app load
  useEffect(() => {
    const APP_VERSION = '2.0.4'; // Increment version for new deployment
    const storedVersion = localStorage.getItem('app_version');
    const hasReloadedKey = `has_reloaded_${APP_VERSION}`; // Version-specific reload flag
    const hasReloaded = sessionStorage.getItem(hasReloadedKey);

    if (storedVersion !== APP_VERSION && !hasReloaded) {
      console.log('🔄 New version detected, clearing cache...');
      console.log('Old version:', storedVersion, '→ New version:', APP_VERSION);
      
      // Mark that we're about to reload to prevent infinite loop (version-specific)
      sessionStorage.setItem(hasReloadedKey, 'true');
      
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        });
        
        // Clear cache storage
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
      }
      
      // Update version
      localStorage.setItem('app_version', APP_VERSION);
      console.log('✅ Cache cleared, version updated to', APP_VERSION);
      
      // Reload ONCE after a short delay
      console.log('🔄 Forcing hard reload in 300ms...');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else if (hasReloaded && storedVersion === APP_VERSION) {
      // Clear old reload flags for previous versions
      console.log('✅ App loaded successfully on version', APP_VERSION);
      // Clean up old version flags
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('has_reloaded_') && key !== hasReloadedKey) {
          sessionStorage.removeItem(key);
        }
      }
    }
  }, []);

  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <GuestProvider>
            <AuthProvider>
              <SocketProviderWrapper>
                <div className="App min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  <AppRoutes />
                </div>
              </SocketProviderWrapper>
            </AuthProvider>
          </GuestProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
};

// Wrapper component to pass guestId to SocketProvider
const SocketProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { guestId } = useGuest();
  
  return (
    <SocketProvider guestId={guestId}>
      <TranslationProvider>
        <VoiceFilterProvider>
          <ARFilterProvider>
            {children}
          </ARFilterProvider>
        </VoiceFilterProvider>
      </TranslationProvider>
    </SocketProvider>
  );
};

export default App;
