import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/Layout/Layout';
import AgeGate from './components/Auth/AgeGate';
import Login from './components/Auth/Login';
import PhoneVerification from './components/Auth/PhoneVerification';
import Home from './components/Home/Home';
import Chat from './components/Chat/Chat';
import TextChat from './components/Chat/TextChat';
import AudioChat from './components/Chat/AudioChat';
import VideoChat from './components/Chat/VideoChat';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
import Legal from './components/Legal/Legal';
import Admin from './components/Admin/Admin';
import LoadingSpinner from './components/UI/LoadingSpinner';

// New Pages
import About from './components/Pages/About';
import Contact from './components/Pages/Contact';
import PrivacyPolicy from './components/Pages/PrivacyPolicy';
import TermsOfService from './components/Pages/TermsOfService';

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
    return <Navigate to="/verify" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { user, hasAcceptedTerms, loading } = useAuth();

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

  // Show age gate if user hasn't accepted terms
  if (!hasAcceptedTerms) {
    return <AgeGate />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/legal/:page" element={<Legal />} />
        
        {/* Static Pages */}
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
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
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
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        
        <Route path="/chat/text" element={
          <ProtectedRoute>
            <TextChat />
          </ProtectedRoute>
        } />
        
        <Route path="/chat/audio" element={
          <ProtectedRoute>
            <AudioChat />
          </ProtectedRoute>
        } />
        
        <Route path="/chat/video" element={
          <ProtectedRoute>
            <VideoChat />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute requiresVerification>
            <Admin />
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <div className="App min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
