import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Define types locally to avoid import issues
interface WSMessage {
  type: string;
  payload: any;
}

interface ChatSession {
  id: string;
  user1Id: string;
  user2Id: string;
  mode: string;
  status: string;
  startedAt: Date;
}

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  currentSession: ChatSession | null;
  matchingStatus: 'idle' | 'searching' | 'matched';
  moderationWarnings: string[];
}

interface SocketContextType extends SocketState {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WSMessage) => void;
  startMatching: (preferences?: any) => void;
  stopMatching: () => void;
  reportUser: (reason: string, description: string) => void;
}

type SocketAction =
  | { type: 'SET_SOCKET'; payload: Socket | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_SESSION'; payload: ChatSession | null }
  | { type: 'SET_MATCHING_STATUS'; payload: 'idle' | 'searching' | 'matched' }
  | { type: 'ADD_MODERATION_WARNING'; payload: string }
  | { type: 'CLEAR_MODERATION_WARNINGS' };

const initialState: SocketState = {
  socket: null,
  connected: false,
  currentSession: null,
  matchingStatus: 'idle',
  moderationWarnings: []
};

const socketReducer = (state: SocketState, action: SocketAction): SocketState => {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_MATCHING_STATUS':
      return { ...state, matchingStatus: action.payload };
    case 'ADD_MODERATION_WARNING':
      return {
        ...state,
        moderationWarnings: [...state.moderationWarnings, action.payload]
      };
    case 'CLEAR_MODERATION_WARNINGS':
      return { ...state, moderationWarnings: [] };
    default:
      return state;
  }
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { user, token } = useAuth();

  useEffect(() => {
    // For development, always connect (guest mode enabled on backend)
    connect();

    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, [user, token]);

  const connect = () => {
    if (state.socket?.connected) {
      console.log('🔌 Socket already connected, skipping');
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    console.log('🔗 Connecting to backend:', backendUrl);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('📦 All env vars:', {
      REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT
    });

    const socket = io(backendUrl, {
      auth: {
        token: token || 'guest'
      },
      transports: ['websocket', 'polling'],
      timeout: 30000, // Increased timeout for production
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    console.log('🚀 Socket instance created, waiting for connection...');

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!', {
        id: socket.id,
        transport: socket.io.engine.transport.name
      });
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error.message);
      console.error('Backend URL:', backendUrl);
      console.error('Error details:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    // Updated event names to match backend
    socket.on('match-found', (session: ChatSession) => {
      console.log('Match found:', session);
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'matched' });
    });

    socket.on('match_found', (session: ChatSession) => {
      console.log('Match found (legacy):', session);
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'matched' });
    });

    socket.on('match_cancelled', () => {
      console.log('Match cancelled');
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('session_ended', () => {
      console.log('Session ended');
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('moderation_warning', (warning: string) => {
      console.log('Moderation warning:', warning);
      dispatch({ type: 'ADD_MODERATION_WARNING', payload: warning });
      
      // Auto-clear warning after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'CLEAR_MODERATION_WARNINGS' });
      }, 5000);
    });

    socket.on('user_banned', () => {
      console.log('User banned');
      // Handle ban - redirect to banned page or logout
      window.location.href = '/banned';
    });

    dispatch({ type: 'SET_SOCKET', payload: socket });
  };

  const disconnect = () => {
    if (state.socket) {
      state.socket.disconnect();
      dispatch({ type: 'SET_SOCKET', payload: null });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  };

  const sendMessage = (message: WSMessage) => {
    if (state.socket && state.connected) {
      state.socket.emit('message', message);
    }
  };

  const startMatching = (preferences?: any) => {
    if (state.socket && state.connected) {
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'searching' });
      state.socket.emit('find_match', preferences || { mode: 'video' });
    }
  };

  const stopMatching = () => {
    if (state.socket && state.connected) {
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
      state.socket.emit('stop_matching');
    }
  };

  const reportUser = (reason: string, description: string) => {
    if (state.socket && state.connected && state.currentSession) {
      state.socket.emit('report_user', {
        sessionId: state.currentSession.id,
        reason,
        description
      });
    }
  };

  const value: SocketContextType = {
    ...state,
    connect,
    disconnect,
    sendMessage,
    startMatching,
    stopMatching,
    reportUser
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};