import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import AdminDashboard from './AdminDashboard';
import { API_BASE_URL } from '../../services/api';
import { setAdminAuthToken, setAdminSession, clearAdminSession, onAdminUnauthorized } from '../../services/adminApi';

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';
const ADMIN_TOKEN_EXPIRY_KEY = 'adminTokenExpiry';
const ADMIN_SESSION_KEY = 'adminSessionId';
const ADMIN_CSRF_KEY = 'adminCsrfToken';
const isBrowser = typeof window !== 'undefined';

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

type AdminSessionPayload = {
  id?: string;
  csrfToken?: string;
  expiresAt?: string;
  ttlSeconds?: number;
};

const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const readFromStorage = (key: string): string | null => {
  if (!isBrowser) {
    return null;
  }

  try {
    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue !== null) {
      return sessionValue;
    }
  } catch {
    // Ignore storage access errors
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const persistToStorage = (key: string, value: string | null) => {
  if (!isBrowser) {
    return;
  }

  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // Ignore sessionStorage write errors
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore localStorage write errors
  }
};

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPersistedSession = useCallback(() => {
    persistToStorage(ADMIN_TOKEN_KEY, null);
    persistToStorage(ADMIN_USER_KEY, null);
    persistToStorage(ADMIN_TOKEN_EXPIRY_KEY, null);
    persistToStorage(ADMIN_SESSION_KEY, null);
    persistToStorage(ADMIN_CSRF_KEY, null);
  }, []);

  const handleLogout = useCallback((message?: string) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    setIsAuthenticated(false);
    setAdmin(null);
    setUsername('');
    setPassword('');
    setError('');
    clearPersistedSession();
    setAdminAuthToken(null);
    clearAdminSession();

    if (message) {
      window.alert(message);
    }
  }, [clearPersistedSession]);

  const scheduleAutoLogout = useCallback((expiryMs?: number) => {
    if (!expiryMs) {
      return;
    }

    const delay = expiryMs - Date.now();
    if (delay <= 0) {
      handleLogout('Admin session expired. Please login again.');
      return;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    logoutTimerRef.current = setTimeout(() => {
      handleLogout('Admin session expired. Please login again.');
    }, delay);
  }, [handleLogout]);

  const persistSession = useCallback((token: string, adminData: any, session?: AdminSessionPayload) => {
    const payload = decodeJwt(token);
    const jwtExpiryMs = payload?.exp ? payload.exp * 1000 : undefined;
    const sessionExpiryMs = session?.expiresAt ? Date.parse(session.expiresAt) : undefined;

    persistToStorage(ADMIN_TOKEN_KEY, token);
    persistToStorage(ADMIN_USER_KEY, JSON.stringify(adminData));
    persistToStorage(ADMIN_SESSION_KEY, session?.id ?? null);
    persistToStorage(ADMIN_CSRF_KEY, session?.csrfToken ?? null);

    setAdminSession(session?.id ?? null, session?.csrfToken ?? null);

    const effectiveExpiry = (() => {
      if (jwtExpiryMs && sessionExpiryMs) {
        return Math.min(jwtExpiryMs, sessionExpiryMs);
      }
      return jwtExpiryMs ?? sessionExpiryMs;
    })();

    if (effectiveExpiry) {
      persistToStorage(ADMIN_TOKEN_EXPIRY_KEY, String(effectiveExpiry));
    } else {
      persistToStorage(ADMIN_TOKEN_EXPIRY_KEY, null);
    }

    scheduleAutoLogout(effectiveExpiry);
  }, [scheduleAutoLogout]);

  useEffect(() => {
    onAdminUnauthorized(() => handleLogout('Admin session expired. Please login again.'));

    const storedToken = readFromStorage(ADMIN_TOKEN_KEY);
    const storedAdminRaw = readFromStorage(ADMIN_USER_KEY);
    const storedExpiryRaw = readFromStorage(ADMIN_TOKEN_EXPIRY_KEY);
    const storedSessionId = readFromStorage(ADMIN_SESSION_KEY);
    const storedCsrfToken = readFromStorage(ADMIN_CSRF_KEY);

    if (storedToken && storedAdminRaw) {
      try {
        const parsedAdmin = JSON.parse(storedAdminRaw);
        const expiryMs = storedExpiryRaw ? Number(storedExpiryRaw) : undefined;
        const hasSessionHeaders = Boolean(storedSessionId && storedCsrfToken);

        if (!hasSessionHeaders) {
          clearPersistedSession();
          return;
        }

        if (expiryMs && expiryMs <= Date.now()) {
          handleLogout();
        } else {
          setAdmin(parsedAdmin);
          setIsAuthenticated(true);
          setAdminAuthToken(storedToken);
          setAdminSession(storedSessionId as string, storedCsrfToken as string);

          if (expiryMs) {
            scheduleAutoLogout(expiryMs);
          } else {
            const decoded = decodeJwt(storedToken);
            const derivedExpiry = decoded?.exp ? decoded.exp * 1000 : undefined;
            if (derivedExpiry && derivedExpiry > Date.now()) {
              persistToStorage(ADMIN_TOKEN_EXPIRY_KEY, String(derivedExpiry));
              scheduleAutoLogout(derivedExpiry);
            }
          }
        }
      } catch (parseError) {
        clearPersistedSession();
      }
    }

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      onAdminUnauthorized(null);
    };
  }, [handleLogout, scheduleAutoLogout, clearPersistedSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/login`,
        { username, password },
        { timeout: 15000 }
      );

      if (response.data.success) {
        const { token: authToken, admin: adminPayload, session } = response.data;

        if (!session?.id || !session?.csrfToken) {
          throw new Error('Admin session missing in response');
        }

        setAdmin(adminPayload);
        setIsAuthenticated(true);
        setPassword('');
        setAdminAuthToken(authToken);
        persistSession(authToken, adminPayload, session);
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && admin) {
    return <AdminDashboard admin={admin} onLogout={() => handleLogout()} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
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
              className="text-white hover:text-gray-300 transition-colors font-medium text-sm sm:text-base"
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
            <div className="inline-block p-4 bg-red-600 rounded-full mb-4">
              <LockClosedIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Admin Panel</h2>
            <p className="text-gray-200">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-6 text-center text-sm text-gray-300">
            <p>Omegoo Admin Panel v1.0</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Admin;