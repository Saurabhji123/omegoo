import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginRegister from './LoginRegister';

// Simple wrapper component for LoginRegister
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    // Redirect to home if already logged in
    if (!loading && user && token) {
      console.log('🔄 User already logged in, redirecting to home');
      navigate('/');
    }
  }, [user, token, loading, navigate]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Only show login if not authenticated
  if (!user && !token) {
    return <LoginRegister />;
  }

  return null;
};

export default Login;