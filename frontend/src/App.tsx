import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/Layout/Layout';
import AgeGate from './components/Auth/AgeGate';
import LoginRegister from './components/Auth/LoginRegister';
import VerifyOTP from './components/Auth/VerifyOTP';
import PhoneVerification from './components/Auth/PhoneVerification';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Home from './components/Home/Home';
import Chat from './components/Chat/Chat';
import TextChat from './components/Chat/TextChat';
import AudioChat from './components/Chat/AudioChat';
import VideoChat from './components/Chat/VideoChat';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
import Admin from './components/Admin/Admin';
import LoadingSpinner from './components/UI/LoadingSpinner';

// New Pages
import About from './components/Pages/About';
import Contact from './components/Pages/Contact';
import PrivacyPolicy from './components/Pages/PrivacyPolicy';
import TermsOfService from './components/Pages/TermsOfService';
import SafetyGuidelines from './components/Pages/SafetyGuidelines';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiresVerification?: boolean }> = ({ 
  children, 
  requiresVerification = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiresVerification && user.tier === 'guest') {
    // Redirect unverified users to Home; Home component will show verification popup
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { hasAcceptedTerms, loading } = useAuth();

  // Show loading spinner while initializing auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
    <Router>
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
        
        {/* Chat routes */}
        <Route path="/chat" element={
          <ProtectedRoute requiresVerification>
            <Chat />
          </ProtectedRoute>
        } />
        
        {/* Chat routes - Protected (Login required) */}
        <Route path="/chat/text" element={
          <ProtectedRoute requiresVerification>
            <TextChat />
          </ProtectedRoute>
        } />
        
        <Route path="/chat/audio" element={
          <ProtectedRoute requiresVerification>
            <AudioChat />
          </ProtectedRoute>
        } />
        
        <Route path="/chat/video" element={
          <ProtectedRoute requiresVerification>
            <VideoChat />
          </ProtectedRoute>
        } />
        
        {/* Admin routes - Protected */}
  <Route path="/omegoo-admin/*" element={<Admin />} />

  {/* Hide legacy /admin path */}
  <Route path="/admin/*" element={<Navigate to="/" replace />} />
        
        {/* Fallback - Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  // Google OAuth Client ID - From your Google Cloud Console
  // Note: React Scripts uses process.env, not import.meta.env
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '493047971159-6089h729jnghpfo7scujvjjhcb0lmg8d.apps.googleusercontent.com';

  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <div className="App min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <AppRoutes />
              </div>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
};

export default App;
