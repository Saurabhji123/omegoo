import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import AdminDashboard from './AdminDashboard';

// Use production URL when deployed, localhost only for local dev
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocalhost ? 'http://localhost:3001' : 'https://omegoo-api-clean.onrender.com';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>('');
  const [admin, setAdmin] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Admin login started');
    console.log('📡 API URL:', API_URL);
    console.log('📧 Email/Username:', username);

    try {
      console.log('📤 Sending login request...');
      const response = await axios.post(`${API_URL}/api/admin/login`, {
        username,
        password
      });

      console.log('✅ Login response received:', response.data);

      if (response.data.success) {
        console.log('✅ Login successful!');
        setToken(response.data.token);
        setAdmin(response.data.admin);
        setIsAuthenticated(true);
        
        // Store in localStorage
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken('');
    setAdmin(null);
    setUsername('');
    setPassword('');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // Check for existing session on mount
  React.useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('adminUser');
    
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
      setIsAuthenticated(true);
    }
  }, []);

  if (isAuthenticated && token && admin) {
    return <AdminDashboard token={token} admin={admin} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navbar */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Image */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg"
              />
              <div className="text-xl sm:text-2xl font-bold text-white">
                Omegoo
              </div>
            </Link>

            {/* Right side - Home link */}
            <Link 
              to="/"
              className="text-white hover:text-purple-300 transition-colors font-medium text-sm sm:text-base"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-purple-600 rounded-full mb-4">
              <LockClosedIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Admin Panel</h2>
            <p className="text-purple-200">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-purple-300">
            <p>Omegoo Admin Panel v1.0</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Admin;