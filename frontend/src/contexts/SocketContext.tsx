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
  connecting: boolean;
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
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: ChatSession | null }
  | { type: 'SET_MATCHING_STATUS'; payload: 'idle' | 'searching' | 'matched' }
  | { type: 'ADD_MODERATION_WARNING'; payload: string }
  | { type: 'CLEAR_MODERATION_WARNINGS' };const initialState: SocketState = {
  socket: null,
  connected: false,
  connecting: false,
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
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload };
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
    // For development, always connect once (guest mode enabled on backend)
    connect();

    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, []); // No dependencies - connect only once

  const connect = () => {
    if (state.socket && state.socket.connected) {
      console.log('🔌 Socket already connected/connecting, skipping');
      return;
    }

    // Disconnect old socket if exists
    if (state.socket) {
      state.socket.disconnect();
    }

    // Set connecting state
    dispatch({ type: 'SET_CONNECTING', payload: true });

    // Always use production URL for deployed app, localhost only for dev
    // FORCE USE RENDER BACKEND FOR DEVELOPMENT TOO (LOCAL BACKEND NOT RUNNING)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = 'https://omegoo-api-clean.onrender.com'; // Always use Render backend
    console.log('🔗 Connecting to backend:', backendUrl);
    console.log('🌍 Current location:', {
      hostname: window.location.hostname,
      isLocalhost: isLocalhost,
      nodeEnv: process.env.NODE_ENV
    });

    console.log('🚀 Creating socket connection with config:', {
      url: backendUrl,
      token: token || 'guest'
    });

    // Test backend connectivity and wake up if needed
    const wakeBackend = async () => {
      try {
        console.log('🔄 Waking up backend...');
        const response = await fetch(`${backendUrl}/keepalive`);
        const data = await response.json();
        console.log('✅ Backend awake:', data);
        return true;
      } catch (err) {
        console.error('❌ Backend wake-up failed:', err);
        return false;
      }
    };

    // Try to wake backend first, then test connection
    wakeBackend().then((awake) => {
      if (awake) {
        console.log('🚀 Backend is ready, proceeding with socket connection');
      } else {
        console.log('⏳ Backend might be cold starting, socket will retry...');
      }
    });

    const socket = io(backendUrl, {
      auth: {
        token: 'dev-token'  // Simple token for development
      },
      transports: ['polling', 'websocket'],
      timeout: 15000,
      forceNew: false,  // Allow connection reuse
      reconnection: true,
      reconnectionAttempts: 3,  // Reduced attempts
      reconnectionDelay: 1000,  // Faster reconnection
      reconnectionDelayMax: 5000
    });

    console.log('🚀 Socket instance created, waiting for connection...');

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!', {
        id: socket.id,
        transport: socket.io.engine.transport.name
      });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTING', payload: false });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error.message);
      console.error('Backend URL:', backendUrl);
      console.error('Error type:', (error as any).type);
      console.error('Error description:', (error as any).description);
      console.error('Error context:', (error as any).context);
      console.error('Full error object:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_CONNECTING', payload: false });
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