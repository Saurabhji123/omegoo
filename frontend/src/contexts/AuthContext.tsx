import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import apiService, { authAPI, userAPI } from '../services/api';
import { storageService } from '../services/storage';

// Define types locally to avoid import issues
export interface User {
  id: string;
  deviceId: string;
  email?: string;
  username?: string;
  phoneHash?: string;
  hasPassword?: boolean;
  tier: 'guest' | 'verified' | 'premium';
  status: 'active' | 'banned' | 'suspended';
  coins: number;
  isVerified: boolean;
  totalChats?: number;
  dailyChats?: number;
  lastCoinClaim?: Date;
  preferences: {
    language: string;
    interests: string[];
    ageRange?: [number, number];
    genderPreference: 'any' | 'male' | 'female';
    settings?: any;
    videoQuality?: string;
    matchingMode?: string;
    [key: string]: any;
  };
  subscription: {
    type: 'none' | 'starter' | 'standard' | 'premium';
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hasAcceptedTerms: boolean;
}

interface AuthContextType extends AuthState {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<{token?: string; user?: any; requiresOTP?: boolean; message?: string; email?: string; username?: string; pending?: boolean; otpExpiresInSeconds?: number;} | undefined>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  verifyPhone: (phone: string, otp: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  acceptTerms: () => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'ACCEPT_TERMS' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  hasAcceptedTerms: false
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'UPDATE_USER':
      console.log('📝 AuthContext UPDATE_USER action:', {
        before: state.user ? { coins: state.user.coins, totalChats: state.user.totalChats, dailyChats: state.user.dailyChats } : null,
        updates: action.payload,
        after: state.user ? { ...state.user, ...action.payload } : null
      });
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
    case 'ACCEPT_TERMS':
      return { ...state, hasAcceptedTerms: true };
    case 'LOGOUT':
      return { ...initialState, loading: false, hasAcceptedTerms: state.hasAcceptedTerms };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitializing, setIsInitializing] = React.useState(false);

  useEffect(() => {
    if (!isInitializing) {
      initializeAuth();
    }
    
    // Listen for stats updates from socket
    const handleStatsUpdate = (event: any) => {
      const stats = event.detail;
      console.log('🔔 AuthContext received stats update:', stats);
      dispatch({ 
        type: 'UPDATE_USER', 
        payload: {
          coins: stats.coins,
          totalChats: stats.totalChats,
          dailyChats: stats.dailyChats
        }
      });
    };
    
    window.addEventListener('user-stats-update', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('user-stats-update', handleStatsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    if (isInitializing) return; // Prevent multiple calls
    
    try {
      setIsInitializing(true);
      
      // For development: Clear localStorage if needed
      if (window.location.search.includes('reset=true')) {
        storageService.clearAll();
      }
      
      const token = storageService.getToken();
      const hasAcceptedTerms = storageService.getHasAcceptedTerms();
      
      console.log('🔐 Auth initialization:', { token: !!token, hasAcceptedTerms });
      
      if (hasAcceptedTerms) {
        dispatch({ type: 'ACCEPT_TERMS' });
      }

      if (token) {
        // Set token in API service
        apiService.setToken(token);
        dispatch({ type: 'SET_TOKEN', payload: token });
        
        try {
          // Fetch current user data from backend
          const response = await authAPI.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: response.user });
          console.log('✅ User data loaded:', { userId: response.user.id, coins: response.user.coins });
        } catch (error) {
          console.error('❌ Failed to fetch user data, clearing auth:', error);
          // Token is invalid, clear it
          storageService.removeToken();
          apiService.setToken(null);
          dispatch({ type: 'SET_TOKEN', payload: null });
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      storageService.removeToken();
      apiService.setToken(null);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsInitializing(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login with:', { email });
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.loginWithEmail(email, password);
      
      console.log('✅ Login response received:', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userId: response.user?.id 
      });
      
      // Set token in API service
      apiService.setToken(response.token);
      
      dispatch({ type: 'SET_TOKEN', payload: response.token });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      storageService.setToken(response.token);
      storageService.setUser(response.user);
      
      console.log('💾 Login data saved to storage');
    } catch (error: any) {
      console.error('❌ Email login failed:', error);
      console.error('Error details:', error.message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Login with JWT token directly (used after OTP verification)
  const loginWithToken = async (token: string) => {
    try {
      console.log('🎟️  Logging in with token...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Set token in API service
      apiService.setToken(token);
      storageService.setToken(token);
      dispatch({ type: 'SET_TOKEN', payload: token });
      
      // Fetch user data
      const response = await authAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: response.user });
      storageService.setUser(response.user);
      
      console.log('✅ Token login successful:', { 
        userId: response.user.id,
        coins: response.user.coins 
      });
    } catch (error: any) {
      console.error('❌ Token login failed:', error);
      // Clear invalid token
      storageService.removeToken();
      apiService.setToken(null);
      dispatch({ type: 'SET_TOKEN', payload: null });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (email: string, username: string, password: string): Promise<{
    token?: string;
    user?: any;
    requiresOTP?: boolean;
    message?: string;
    email?: string;
    username?: string;
    pending?: boolean;
    otpExpiresInSeconds?: number;
  } | undefined> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      console.log('📝 Attempting registration:', { email, username });
      const response = await authAPI.register(email, username, password);
      
      console.log('✅ ===== AUTH CONTEXT REGISTRATION RESPONSE =====');
      console.log('Full response object:', response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('requiresOTP type:', typeof response?.requiresOTP);
      console.log('requiresOTP value:', response?.requiresOTP);
      console.log('requiresOTP === true:', response?.requiresOTP === true);
      console.log('hasToken:', !!response.token);
      console.log('hasUser:', !!response.user);
      console.log('message:', response.message);
      console.log('=================================================');
      
      // 📧 For email registration, ALWAYS return without setting auth
      // Frontend will handle OTP verification flow
      console.log('📧 Email registration - returning response WITHOUT setting auth state');
      return response;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('Error details:', error.message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.loginWithGoogle(idToken);
      
      dispatch({ type: 'SET_TOKEN', payload: response.token });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      apiService.setToken(response.token);
      storageService.setToken(response.token);
      storageService.setUser(response.user);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    console.log('👋 Logging out user');
    storageService.removeToken();
    storageService.removeUser();
    apiService.setToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const deleteAccount = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await userAPI.deleteAccount();
      storageService.clearAll();
      apiService.setToken(null);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('❌ Delete account failed:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyPhone = async (phone: string, otp: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authAPI.verifyPhone({ phone, otp });
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (error) {
      console.error('Phone verification failed:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateUser = (updates: Partial<User>) => {
    console.log('🔄 updateUser function called with:', updates);
    dispatch({ type: 'UPDATE_USER', payload: updates });
    console.log('✅ UPDATE_USER action dispatched');
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data from database...');
      const token = storageService.getToken();
      if (!token) {
        console.log('⚠️ No token found, skipping refresh');
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response && response.user) {
        console.log('✅ Fresh user data received:', {
          username: response.user.username,
          email: response.user.email,
          coins: response.user.coins,
          totalChats: response.user.totalChats,
          dailyChats: response.user.dailyChats
        });
        dispatch({ type: 'SET_USER', payload: response.user });
      }
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
    }
  };

  const acceptTerms = () => {
    storageService.setHasAcceptedTerms(true);
    dispatch({ type: 'ACCEPT_TERMS' });
  };

  const value: AuthContextType = {
    ...state,
    loginWithEmail,
    loginWithToken,
    register,
    loginWithGoogle,
    logout,
    deleteAccount,
    verifyPhone,
    updateUser,
    refreshUser,
    acceptTerms
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export for convenience
export default AuthProvider;
