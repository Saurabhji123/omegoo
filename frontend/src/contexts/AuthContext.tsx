import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
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
  gender?: 'male' | 'female' | 'others';
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
  register: (
    email: string,
    username: string,
    password: string,
    gender: 'male' | 'female' | 'others'
  ) => Promise<{
    token?: string;
    user?: any;
    requiresOTP?: boolean;
    message?: string;
    email?: string;
    username?: string;
    pending?: boolean;
    otpExpiresInSeconds?: number;
  } | undefined>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  verifyPhone: (phone: string, otp: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  acceptTerms: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; code?: string }>;
  validateResetToken: (token: string) => Promise<{ success: boolean; message: string; code?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string; code?: string }>;
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
  const userRef = React.useRef<User | null>(null);

  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!mounted) return;
      if (isInitializing) {
        console.log('⏭️  Auth init already in progress, skipping duplicate call');
        return;
      }
      await initializeAuth();
    };
    
    init();
    
    // Listen for stats updates from socket
    const handleStatsUpdate = (event: any) => {
      if (!mounted) return;
      const stats = event.detail;
      console.log('🔔 AuthContext received stats update:', stats);
      const payload = {
        coins: stats.coins,
        totalChats: stats.totalChats,
        dailyChats: stats.dailyChats
      };
      dispatch({ type: 'UPDATE_USER', payload });

      if (userRef.current) {
        const mergedUser = { ...userRef.current, ...payload };
        userRef.current = mergedUser;
        storageService.setUser(mergedUser);
      } else {
        const storedUser = storageService.getUser();
        if (storedUser) {
          const mergedUser = { ...storedUser, ...payload };
          storageService.setUser(mergedUser);
        }
      }
    };
    
    window.addEventListener('user-stats-update', handleStatsUpdate);
    
    return () => {
      mounted = false;
      window.removeEventListener('user-stats-update', handleStatsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    if (isInitializing) {
      console.log('⏭️  Auth already initializing, skipping...');
      return;
    }
    
    try {
      setIsInitializing(true);
      console.log('🔐 Starting auth initialization...');
      
      // For development: Clear localStorage if needed
      if (window.location.search.includes('reset=true')) {
        console.log('🔄 Reset flag detected, clearing storage');
        storageService.clearAll();
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
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
          // Fetch current user data from backend with timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 10000)
          );
          
          const response = await Promise.race([
            authAPI.getCurrentUser(),
            timeoutPromise
          ]) as { user: User };
          
          dispatch({ type: 'SET_USER', payload: response.user });
          storageService.setUser(response.user);
          userRef.current = response.user;
          console.log('✅ User data loaded:', { userId: response.user.id, coins: response.user.coins });
        } catch (error: any) {
          console.error('❌ Failed to fetch user data:', error.message);
          // Token is invalid or request timed out, clear it
          storageService.removeToken();
          storageService.removeUser();
          apiService.setToken(null);
          dispatch({ type: 'SET_TOKEN', payload: null });
          dispatch({ type: 'SET_USER', payload: null });
          userRef.current = null;
        }
      }
    } catch (error: any) {
      console.error('❌ Auth initialization failed:', error.message);
      // Clear everything on critical error
      storageService.removeToken();
      storageService.removeUser();
      apiService.setToken(null);
      dispatch({ type: 'SET_TOKEN', payload: null });
      dispatch({ type: 'SET_USER', payload: null });
      userRef.current = null;
    } finally {
      console.log('✅ Auth initialization complete');
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
        userId: response.user?.id,
        userEmail: response.user?.email,
        userName: response.user?.username
      });
      
      if (!response.token || !response.user) {
        throw new Error('Invalid login response - missing token or user data');
      }
      
      // CRITICAL: Set everything in correct order
      // 1. Set token in API service FIRST so subsequent requests work
      apiService.setToken(response.token);
      
      // 2. Save to storage SECOND for persistence
      storageService.setToken(response.token);
      storageService.setUser(response.user);
      
      // 3. Update ref THIRD for immediate access
      userRef.current = response.user;
      
      // 4. Update state LAST to trigger re-renders
      dispatch({ type: 'SET_TOKEN', payload: response.token });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      console.log('💾 Login data saved successfully:', {
        tokenLength: response.token.length,
        userId: response.user.id,
        storageToken: !!storageService.getToken(),
        storageUser: !!storageService.getUser()
      });
    } catch (error: any) {
      console.error('❌ Email login failed:', error);
      console.error('Error details:', error.message);
      // Clean up any partial state on error
      apiService.setToken(null);
      storageService.removeToken();
      storageService.removeUser();
      userRef.current = null;
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
      userRef.current = response.user;
      
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

  const register = async (
    email: string,
    username: string,
    password: string,
    gender: 'male' | 'female' | 'others'
  ): Promise<{
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
      const response = await authAPI.register(email, username, password, gender);
      
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
      console.log('🔐 Attempting Google login...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.loginWithGoogle(idToken);
      
      console.log('✅ Google login response received:', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userId: response.user?.id
      });
      
      if (!response.token || !response.user) {
        throw new Error('Invalid Google login response - missing token or user data');
      }
      
      // CRITICAL: Set everything in correct order (same as email login)
      apiService.setToken(response.token);
      storageService.setToken(response.token);
      storageService.setUser(response.user);
      userRef.current = response.user;
      dispatch({ type: 'SET_TOKEN', payload: response.token });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      console.log('💾 Google login data saved successfully');
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      console.error('Error details:', error.message);
      // Clean up on error
      apiService.setToken(null);
      storageService.removeToken();
      storageService.removeUser();
      userRef.current = null;
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
    userRef.current = null;
    dispatch({ type: 'LOGOUT' });
  };

  const deleteAccount = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await userAPI.deleteAccount();
      storageService.clearAll();
      apiService.setToken(null);
  userRef.current = null;
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
      if (userRef.current) {
        const mergedUser = { ...userRef.current, ...user };
        userRef.current = mergedUser;
        storageService.setUser(mergedUser);
      } else {
        const storedUser = storageService.getUser();
        if (storedUser) {
          const mergedUser = { ...storedUser, ...user };
          storageService.setUser(mergedUser);
          userRef.current = mergedUser;
        }
      }
    } catch (error) {
      console.error('Phone verification failed:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      return await authAPI.requestPasswordReset(email.trim().toLowerCase());
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }, []);

  const validateResetToken = useCallback(async (token: string) => {
    try {
      return await authAPI.validateResetToken(token);
    } catch (error) {
      console.error('Reset token validation failed:', error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      return await authAPI.resetPassword(token, password);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }, []);

  const updateUser = (updates: Partial<User>) => {
    console.log('🔄 updateUser function called with:', updates);
    const mergedUser = userRef.current ? { ...userRef.current, ...updates } : null;
    dispatch({ type: 'UPDATE_USER', payload: updates });
    if (mergedUser) {
      userRef.current = mergedUser;
      storageService.setUser(mergedUser);
    } else {
      const storedUser = storageService.getUser();
      if (storedUser) {
        const updatedUser = { ...storedUser, ...updates };
        storageService.setUser(updatedUser);
        userRef.current = updatedUser;
      }
    }
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

      const requestToken = token;
      const response = await authAPI.getCurrentUser();

      const activeToken = storageService.getToken();
      if (!activeToken || activeToken !== requestToken) {
        console.log('⏭️ Skipping refresh update - auth token changed mid-request');
        return;
      }

      if (response && response.user) {
        console.log('✅ Fresh user data received:', {
          username: response.user.username,
          email: response.user.email,
          coins: response.user.coins,
          totalChats: response.user.totalChats,
          dailyChats: response.user.dailyChats
        });
        dispatch({ type: 'SET_USER', payload: response.user });
        storageService.setUser(response.user);
        userRef.current = response.user;
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
    acceptTerms,
    requestPasswordReset,
    validateResetToken,
    resetPassword
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
