import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { debugLog, debugWarn } from '../utils/debugLogger';
import { VideoUpgradeState } from '../types/videoUpgrade';

export type ChatMode = 'text' | 'audio' | 'video';

interface ModeUserCounts {
  text: number;
  audio: number;
  video: number;
}

interface WSMessage {
  type: string;
  payload: any;
}

interface ChatSession {
  id: string;
  user1Id: string;
  user2Id: string;
  mode: ChatMode;
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
  modeUserCounts: ModeUserCounts;
  activeMode: ChatMode | null;
  videoUpgradeState: VideoUpgradeState;
}

interface SocketContextType extends SocketState {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WSMessage) => void;
  startMatching: (preferences?: any) => void;
  stopMatching: () => void;
  reportUser: (reason: string, description: string) => void;
  setActiveMode: (mode: ChatMode | null) => void;
  sendVideoRequest: (partnerId: string, sessionId: string) => void;
  acceptVideoRequest: () => void;
  declineVideoRequest: (reason?: 'declined' | 'reported') => void;
  sendVideoUpgradeSignaling: (event: string, data: any) => void;
  resetVideoUpgradeState: () => void;
}

type SocketAction =
  | { type: 'SET_SOCKET'; payload: Socket | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: ChatSession | null }
  | { type: 'SET_MATCHING_STATUS'; payload: 'idle' | 'searching' | 'matched' }
  | { type: 'ADD_MODERATION_WARNING'; payload: string }
  | { type: 'CLEAR_MODERATION_WARNINGS' }
  | { type: 'SET_MODE_USER_COUNTS'; payload: ModeUserCounts }
  | { type: 'SET_ACTIVE_MODE'; payload: ChatMode | null }
  | { type: 'SET_VIDEO_UPGRADE_STATE'; payload: Partial<VideoUpgradeState> };

const initialState: SocketState = {
  socket: null,
  connected: false,
  connecting: false,
  currentSession: null,
  matchingStatus: 'idle',
  moderationWarnings: [],
  modeUserCounts: {
    text: 0,
    audio: 0,
    video: 0
  },
  activeMode: null,
  videoUpgradeState: {
    status: 'idle',
    initiator: false
  }
};

function socketReducer(state: SocketState, action: SocketAction): SocketState {
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
      return { ...state, moderationWarnings: [...state.moderationWarnings, action.payload] };
    case 'CLEAR_MODERATION_WARNINGS':
      return { ...state, moderationWarnings: [] };
    case 'SET_MODE_USER_COUNTS':
      return { ...state, modeUserCounts: action.payload };
    case 'SET_ACTIVE_MODE':
      if (state.activeMode === action.payload) {
        return state;
      }
      return { ...state, activeMode: action.payload };
    case 'SET_VIDEO_UPGRADE_STATE':
      return { 
        ...state, 
        videoUpgradeState: { 
          ...state.videoUpgradeState, 
          ...action.payload 
        } 
      };
    default:
      return state;
  }
}

const SocketContext = createContext<SocketContextType | null>(null);
export const SocketProvider: React.FC<{ children: ReactNode; guestId?: string | null }> = ({ children, guestId }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { token } = useAuth();
  const connectionTokenRef = useRef<string | null>(null);
  const connectionGuestRef = useRef<string | null>(null);

  useEffect(() => {
    debugLog('Socket effect triggered', { hasToken: !!token, hasGuestId: !!guestId });
    connect();

    return () => {
      if (state.socket) {
        debugLog('Cleaning up socket connection');
        state.socket.disconnect();
        connectionTokenRef.current = null;
        connectionGuestRef.current = null;
        dispatch({ type: 'SET_SOCKET', payload: null });
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_CONNECTING', payload: false });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, guestId]);

  const setActiveMode = useCallback((mode: ChatMode | null) => {
    dispatch({ type: 'SET_ACTIVE_MODE', payload: mode });
  }, []);

  function connect() {
    const desiredToken = token || 'dev-guest-token';
    const desiredGuest = guestId || null;

    const currentToken = connectionTokenRef.current;
    const currentGuest = connectionGuestRef.current;
    const isSameConnection = currentToken === desiredToken && 
                            currentGuest === desiredGuest && 
                            state.socket && 
                            state.socket.connected;

    if (isSameConnection) {
      debugLog('Socket already active with desired credentials, skipping new connection');
      return;
    }

    if (state.socket) {
      debugLog('Disposing previous socket before reconnect');
      try {
        state.socket.disconnect();
      } catch (error) {
        debugWarn('Error while disconnecting previous socket', { message: (error as Error)?.message });
      }
      dispatch({ type: 'SET_SOCKET', payload: null });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }

    connectionTokenRef.current = desiredToken;
    connectionGuestRef.current = desiredGuest;
    dispatch({ type: 'SET_CONNECTING', payload: true });

    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = 'https://omegoo-api-clean.onrender.com';

    debugLog('Preparing socket connection', {
      backendUrl,
      hostname: window.location.hostname,
      isLocalhost,
      nodeEnv: process.env.NODE_ENV,
      hasToken: !!token,
      hasGuestId: !!guestId
    });

    const wakeBackend = async () => {
      try {
        debugLog('Waking backend');
        const response = await fetch(`${backendUrl}/keepalive`);
        await response.json();
        debugLog('Backend keepalive response received');
        return true;
      } catch (err) {
        debugWarn('Backend wake-up failed', { message: (err as Error)?.message });
        return false;
      }
    };

    wakeBackend().then((awake) => {
      debugLog('Backend wake result', { awake });
    });

    const socket = io(backendUrl, {
      auth: {
        token: desiredToken,
        guestId: desiredGuest
      },
      transports: ['polling', 'websocket'],
      timeout: 15000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    (socket as Socket & { authToken?: string; guestId?: string | null }).authToken = desiredToken;
    (socket as Socket & { authToken?: string; guestId?: string | null }).guestId = desiredGuest;

    debugLog('Socket instance created, waiting for connection');

    socket.on('connect', () => {
      debugLog('Socket connected', {
        id: socket.id,
        transport: socket.io.engine.transport.name
      });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTING', payload: false });
    });

    socket.on('disconnect', (reason) => {
      debugWarn('Socket disconnected', { reason });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error');
      debugWarn('Socket connection error details', {
        message: error.message,
        backendUrl,
        type: (error as any).type,
        description: (error as any).description,
        context: (error as any).context
      });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_CONNECTING', payload: false });
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      debugLog('Socket reconnection attempt', { attemptNumber });
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    socket.on('match-found', (session: ChatSession) => {
      debugLog('Match found', { sessionId: session?.id, mode: session?.mode });
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'matched' });
    });

    socket.on('match_found', (session: ChatSession) => {
      debugLog('Match found (legacy event)', { sessionId: session?.id, mode: session?.mode });
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'matched' });
    });

    socket.on('match_cancelled', () => {
      debugWarn('Match cancelled by server');
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('session_ended', (data: { reason?: string }) => {
      debugLog('Session ended by server', { reason: data.reason });
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('moderation_warning', (warning: string | { message: string }) => {
      const message = typeof warning === 'string' ? warning : warning.message;
      debugWarn('Moderation warning received', { message });
      dispatch({ type: 'ADD_MODERATION_WARNING', payload: message });

      setTimeout(() => {
        dispatch({ type: 'CLEAR_MODERATION_WARNINGS' });
      }, 5000);
    });

    socket.on('user_banned', () => {
      debugWarn('User banned by server');
      window.location.href = '/banned';
    });

    socket.on('insufficient-coins', (data: { required: number; current: number; message: string }) => {
      debugWarn('Insufficient coins notice', { required: data.required, current: data.current });
      alert(
        `Not enough coins! You need ${data.required} coins but have ${data.current} coins. Get more coins tomorrow!`
      );
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
    });

    socket.on('stats-update', (data: { coins: number; totalChats: number; dailyChats: number }) => {
      debugLog('Stats update received', { coins: data.coins, totalChats: data.totalChats });
      window.dispatchEvent(new CustomEvent('user-stats-update', { detail: data }));
    });

    socket.on('match-retry', (data: { message: string }) => {
      debugWarn('Match retry requested', { message: data.message });
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'searching' });

      setTimeout(() => {
        debugLog('Emitting match retry request');
        socket.emit('find_match', { mode: 'video' });
      }, 1000);
    });

    socket.on('mode-user-counts', (counts: ModeUserCounts) => {
      dispatch({ type: 'SET_MODE_USER_COUNTS', payload: counts });
    });

    // Video Upgrade Socket Listeners
    socket.on('request_video', (data: any) => {
      debugLog('Video upgrade request received', { from: data.from, sessionId: data.sessionId });
      dispatch({ 
        type: 'SET_VIDEO_UPGRADE_STATE', 
        payload: { 
          status: 'incoming', 
          initiator: false,
          remoteUserId: data.from,
          sessionId: data.sessionId,
          requestTimestamp: data.timestamp
        } 
      });
    });

    socket.on('video_request_sent', (data: any) => {
      debugLog('Video request sent confirmation', { to: data.to, sessionId: data.sessionId });
      dispatch({ 
        type: 'SET_VIDEO_UPGRADE_STATE', 
        payload: { 
          status: 'requesting',
          remoteUserId: data.to,
          sessionId: data.sessionId,
          requestTimestamp: data.timestamp
        } 
      });
    });

    socket.on('video_response', (data: any) => {
      debugLog('Video response received', { accept: data.accept, reason: data.reason });
      if (data.accept) {
        dispatch({ 
          type: 'SET_VIDEO_UPGRADE_STATE', 
          payload: { status: 'accepted' } 
        });
      } else {
        dispatch({ 
          type: 'SET_VIDEO_UPGRADE_STATE', 
          payload: { 
            status: 'declined',
            error: data.reason === 'permission_denied' ? 'Partner denied camera permission' : 'Partner declined video request'
          } 
        });
      }
    });

    socket.on('upgrade_offer', (data: any) => {
      debugLog('Video upgrade offer received', { from: data.from });
      // Will be handled by TextChat component
    });

    socket.on('upgrade_answer', (data: any) => {
      debugLog('Video upgrade answer received', { from: data.from });
      // Will be handled by TextChat component
    });

    socket.on('upgrade_ice_candidate', (data: any) => {
      debugLog('Video upgrade ICE candidate received', { from: data.from });
      // Will be handled by TextChat component
    });

    socket.on('video_upgrade_error', (data: any) => {
      debugWarn('Video upgrade error', { message: data.message });
      dispatch({ 
        type: 'SET_VIDEO_UPGRADE_STATE', 
        payload: { 
          status: 'failed',
          error: data.message
        } 
      });
    });

    dispatch({ type: 'SET_SOCKET', payload: socket });
  }

  useEffect(() => {
    if (!state.socket || !state.connected) {
      return;
    }

    state.socket.emit('mode-presence-update', { mode: state.activeMode ?? null });
  }, [state.socket, state.connected, state.activeMode]);

  const disconnect = () => {
    if (state.socket) {
      debugLog('Manual socket disconnect requested');
      try {
        state.socket.emit('mode-presence-update', { mode: null });
      } catch (error) {
        debugWarn('Failed to emit mode presence before disconnect', {
          message: (error as Error)?.message
        });
      }
      state.socket.disconnect();
      connectionTokenRef.current = null;
      dispatch({ type: 'SET_SOCKET', payload: null });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_CONNECTING', payload: false });
      setActiveMode(null);
    }
  };

  const sendMessage = (message: WSMessage) => {
    if (state.socket && state.connected) {
      debugLog('Sending socket message', { type: message.type });
      state.socket.emit('message', message);
    } else {
      debugWarn('Cannot send message while socket disconnected', { type: message.type });
    }
  };

  const startMatching = (preferences?: any) => {
    if (state.socket && state.connected) {
      debugLog('Starting match request', { preferences });
      const maybeMode = typeof preferences?.mode === 'string' ? preferences.mode.toLowerCase() : undefined;
      const requestedMode: ChatMode = (maybeMode === 'text' || maybeMode === 'audio' || maybeMode === 'video')
        ? (maybeMode as ChatMode)
        : 'video';
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'searching' });
      dispatch({ type: 'SET_ACTIVE_MODE', payload: requestedMode });
      const payload = preferences ? { ...preferences, mode: requestedMode } : { mode: requestedMode };
      state.socket.emit('find_match', payload);
    } else {
      debugWarn('Cannot start matching while socket disconnected');
    }
  };

  const stopMatching = () => {
    if (state.socket && state.connected) {
      debugLog('Stopping match request');
      dispatch({ type: 'SET_MATCHING_STATUS', payload: 'idle' });
      dispatch({ type: 'SET_ACTIVE_MODE', payload: null });
      state.socket.emit('stop_matching');
    } else {
      debugWarn('Cannot stop matching while socket disconnected');
    }
  };

  const reportUser = (reason: string, description: string) => {
    if (state.socket && state.connected && state.currentSession) {
      debugLog('Reporting user', { sessionId: state.currentSession.id, reason });
      state.socket.emit('report_user', {
        sessionId: state.currentSession.id,
        reason,
        description
      });
    } else {
      debugWarn('Cannot report user without active session');
    }
  };

  // Video Upgrade Methods
  const sendVideoRequest = useCallback((partnerId: string, sessionId: string) => {
    if (state.socket && state.connected) {
      debugLog('Sending video upgrade request', { partnerId, sessionId });
      dispatch({ 
        type: 'SET_VIDEO_UPGRADE_STATE', 
        payload: { 
          status: 'requesting', 
          initiator: true,
          remoteUserId: partnerId,
          sessionId
        } 
      });
      state.socket.emit('request_video', {
        to: partnerId,
        sessionId,
        chatId: sessionId,
        timestamp: Date.now()
      });
    } else {
      debugWarn('Cannot send video request while disconnected');
    }
  }, [state.socket, state.connected]);

  const acceptVideoRequest = useCallback(() => {
    if (state.socket && state.connected && state.videoUpgradeState.sessionId) {
      debugLog('Accepting video request', { sessionId: state.videoUpgradeState.sessionId });
      dispatch({ 
        type: 'SET_VIDEO_UPGRADE_STATE', 
        payload: { status: 'accepted' } 
      });
      state.socket.emit('video_response', {
        to: state.videoUpgradeState.remoteUserId,
        sessionId: state.videoUpgradeState.sessionId,
        chatId: state.videoUpgradeState.sessionId,
        accept: true,
        timestamp: Date.now()
      });
    }
  }, [state.socket, state.connected, state.videoUpgradeState]);

  const declineVideoRequest = useCallback((reason?: 'declined' | 'reported') => {
    if (state.socket && state.connected && state.videoUpgradeState.sessionId) {
      debugLog('Declining video request', { sessionId: state.videoUpgradeState.sessionId, reason });
      dispatch({ 
        type: 'SET_VIDEO_UPGRADE_STATE', 
        payload: { status: 'idle', initiator: false } 
      });
      state.socket.emit('video_response', {
        to: state.videoUpgradeState.remoteUserId,
        sessionId: state.videoUpgradeState.sessionId,
        chatId: state.videoUpgradeState.sessionId,
        accept: false,
        reason: reason || 'declined',
        timestamp: Date.now()
      });
    }
  }, [state.socket, state.connected, state.videoUpgradeState]);

  const sendVideoUpgradeSignaling = useCallback((event: string, data: any) => {
    if (state.socket && state.connected) {
      debugLog('Sending video upgrade signaling', { event });
      state.socket.emit(event, data);
    }
  }, [state.socket, state.connected]);

  const resetVideoUpgradeState = useCallback(() => {
    debugLog('Resetting video upgrade state');
    dispatch({ 
      type: 'SET_VIDEO_UPGRADE_STATE', 
      payload: { 
        status: 'idle',
        error: undefined,
        initiator: false,
        remoteUserId: undefined,
        sessionId: undefined
      } 
    });
  }, []);

  const value: SocketContextType = {
    ...state,
    connect,
    disconnect,
    sendMessage,
    startMatching,
    stopMatching,
    reportUser,
    setActiveMode,
    sendVideoRequest,
    acceptVideoRequest,
    declineVideoRequest,
    sendVideoUpgradeSignaling,
    resetVideoUpgradeState
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