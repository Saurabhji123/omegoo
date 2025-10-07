import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { storageService } from '../services/storage';

// Define types locally to avoid import issues
export interface User {
  id: string;
  deviceId: string;
  phoneHash?: string;
  tier: 'guest' | 'verified' | 'premium';
  status: 'active' | 'banned' | 'suspended';
  coins: number;
  isVerified: boolean;
  preferences: {
    language: string;
    interests: string[];
    ageRange?: [number, number];
    genderPreference: 'any' | 'male' | 'female';
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
  login: (deviceId: string, userAgent: string, fingerprint?: string) => Promise<void>;
  logout: () => void;
  verifyPhone: (phone: string, otp: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
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
        dispatch({ type: 'SET_TOKEN', payload: token });
        const user = await authAPI.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      storageService.removeToken();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsInitializing(false);
    }
  };

  const login = async (deviceId: string, userAgent: string, fingerprint?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login({ deviceId, userAgent, fingerprint });
      
      dispatch({ type: 'SET_TOKEN', payload: response.token });
      dispatch({ type: 'SET_USER', payload: response.user });
      
      storageService.setToken(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    storageService.removeToken();
    dispatch({ type: 'LOGOUT' });
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
    dispatch({ type: 'UPDATE_USER', payload: updates });
  };

  const acceptTerms = () => {
    storageService.setHasAcceptedTerms(true);
    dispatch({ type: 'ACCEPT_TERMS' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    verifyPhone,
    updateUser,
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