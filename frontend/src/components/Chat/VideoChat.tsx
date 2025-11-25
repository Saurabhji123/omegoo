import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import WebRTCService from '../../services/webrtc';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSlashIcon } from '@heroicons/react/24/solid';
import ReportModal from './ReportModal';
import { PreviewModal } from './PreviewModal';
import LoginRegister from '../Auth/LoginRegister';
import { useARFilter } from '../../contexts/ARFilterContext';
import { FACE_MASK_PRESETS, FaceMaskType, BlurState, AR_CONSTANTS } from '../../types/arFilters';

interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
}

const VideoChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting, modeUserCounts, setActiveMode } = useSocket();
  const { updateUser, user } = useAuth();
  const { selectedMask, blurState, revealCountdown, revealVideo, setMask, startBlurCountdown, enableManualBlur } = useARFilter();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // Track local stream for mic control
  const remoteStreamRef = useRef<MediaStream | null>(null); // Track remote stream for speaker control
  const rawStreamRef = useRef<MediaStream | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const arActiveRef = useRef(false);
  const prevBlurStateRef = useRef<BlurState>('disabled'); // Track previous blur state for auto-reveal detection
  
  const getStoredBoolean = (key: string, fallback: boolean): boolean => {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const storedValue = window.sessionStorage.getItem(key);
    if (storedValue === null) {
      return fallback;
    }
    return storedValue === 'true';
  };
  
  // Track latest state values for event handlers (prevent stale closures)
  const isMatchConnectedRef = useRef(false);
  const partnerIdRef = useRef<string>('');
  const currentStateRef = useRef<'disconnected' | 'finding' | 'connected'>('disconnected');
  const sessionIdRef = useRef<string | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false); // Renamed for clarity - this is for match connection
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(() => getStoredBoolean('videoChat:isMicOn', true));
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(() => getStoredBoolean('videoChat:isSpeakerOn', true));
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Track camera facing mode
  const [isLocalMirrored, setIsLocalMirrored] = useState(true); // Track local video mirror state (for PC toggle)
  const [cameraBlocked, setCameraBlocked] = useState(false);
  // const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>(''); // Track partner user ID
  const [currentState, setCurrentState] = useState<'disconnected' | 'finding' | 'connected'>('disconnected'); // Track chat state
  const [showTextChat, setShowTextChat] = useState(true); // Default show for better UX
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Optional preview modal
  const [isAudioOnly, setIsAudioOnly] = useState(false); // Track audio-only mode
  const [showMaskMenu, setShowMaskMenu] = useState(false);
  
  // Swipe gesture states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState<'left' | 'right' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false); // Track if typing in message input
  const lastTapTimeRef = useRef<number>(0);
  
  // Auto-typing indicator states (for retention boost)
  const [isAutoTyping, setIsAutoTyping] = useState(false); // Fake typing indicator
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<number>(Date.now());
  
  const videoOnlineCount = modeUserCounts.video * 3; // 3x multiplier for retention psychology

  const micStateRef = useRef<boolean>(isMicOn);
  const speakerStateRef = useRef<boolean>(isSpeakerOn);

  // Helper function to check if swipe gestures should be enabled
  const isSwipeEnabled = useCallback(() => {
    // 🔐 Edge Case 1: Disable during typing
    if (isInputFocused) {
      console.log('🚫 Swipe disabled: User is typing');
      return false;
    }
    
    // 🔐 Edge Case 2: Disable during modal/popup states
    if (showReportModal || showLoginModal || showPreview || showMaskMenu) {
      console.log('🚫 Swipe disabled: Modal/popup is open');
      return false;
    }
    
    // 🔐 Edge Case 4: Disable during network issues
    if (!socketConnected || socketConnecting) {
      console.log('🚫 Swipe disabled: Network reconnecting');
      return false;
    }
    
    // ✅ All conditions passed - swipes enabled
    return true;
  }, [isInputFocused, showReportModal, showLoginModal, showPreview, showMaskMenu, socketConnected, socketConnecting]);

  // 🎯 Auto-Typing Indicator System (Retention Boost)
  const startInactivityTimer = useCallback(() => {
    // Clear any existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (autoTypingTimerRef.current) {
      clearTimeout(autoTypingTimerRef.current);
    }
    
    // Start 4-second inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      console.log('💭 4 seconds of inactivity - showing auto-typing indicator');
      setIsAutoTyping(true);
      
      // Auto-typing will turn off after 2.5 seconds
      autoTypingTimerRef.current = setTimeout(() => {
        console.log('⏰ Auto-typing indicator duration ended');
        setIsAutoTyping(false);
        
        // Restart the cycle if still no message
        if (isMatchConnected && Date.now() - lastMessageTimeRef.current > 6500) {
          startInactivityTimer();
        }
      }, 2500);
    }, 4000);
  }, [isMatchConnected]);
  
  const cancelAutoTyping = useCallback(() => {
    console.log('🚫 Canceling auto-typing (real activity detected)');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (autoTypingTimerRef.current) {
      clearTimeout(autoTypingTimerRef.current);
      autoTypingTimerRef.current = null;
    }
    setIsAutoTyping(false);
  }, []);
  
  const resetMessageTimer = useCallback(() => {
    lastMessageTimeRef.current = Date.now();
    cancelAutoTyping();
    if (isMatchConnected) {
      startInactivityTimer();
    }
  }, [isMatchConnected, cancelAutoTyping, startInactivityTimer]);

  const applyMicState = useCallback(() => {
    const currentMicState = micStateRef.current;
    const localStream = localStreamRef.current;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = currentMicState;
      }
    }
    webRTCRef.current?.updateAudioSenders(currentMicState);
  }, []);

  // Start auto-typing timer when match connects
  useEffect(() => {
    if (isMatchConnected) {
      console.log('✅ Match connected - starting auto-typing timer system');
      lastMessageTimeRef.current = Date.now();
      startInactivityTimer();
    } else {
      // Cleanup timers when disconnected
      cancelAutoTyping();
    }
    
    return () => {
      cancelAutoTyping();
    };
  }, [isMatchConnected, startInactivityTimer, cancelAutoTyping]);

  const applySpeakerState = useCallback(() => {
    const currentSpeakerState = speakerStateRef.current;
    const remoteVideo = remoteVideoRef.current;
    if (remoteVideo) {
      remoteVideo.muted = !currentSpeakerState;
      remoteVideo.volume = currentSpeakerState ? 1 : 0;
    }
  }, []);

  useEffect(() => {
    setActiveMode('video');
    return () => {
      setActiveMode(null);
    };
  }, [setActiveMode]);

  // Sync refs with state values to avoid stale closures
  useEffect(() => {
    isMatchConnectedRef.current = isMatchConnected;
    partnerIdRef.current = partnerId;
    currentStateRef.current = currentState;
    sessionIdRef.current = sessionId;
  }, [isMatchConnected, partnerId, currentState, sessionId]);

  useEffect(() => {
    micStateRef.current = isMicOn;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('videoChat:isMicOn', String(isMicOn));
    }
    applyMicState();
  }, [isMicOn, applyMicState]);

  useEffect(() => {
    speakerStateRef.current = isSpeakerOn;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('videoChat:isSpeakerOn', String(isSpeakerOn));
    }
    applySpeakerState();
  }, [isSpeakerOn, applySpeakerState]);

  const applyEffectsToCurrentStream = useCallback(async () => {
    const rawStream = rawStreamRef.current;
    if (!rawStream) {
      console.log('⏭️ [APPLY EFFECTS] No raw stream available yet');
      return;
    }

    const shouldUseFilters = selectedMask !== 'none' || blurState === 'active' || blurState === 'manual';

    console.log(`📊 [APPLY EFFECTS] Filter check: mask="${selectedMask}", blur="${blurState}", shouldUseFilters=${shouldUseFilters}`);

    if (shouldUseFilters) {
      try {
        console.log('🎭 [APPLY EFFECTS] Enabling filter pipeline for remote streaming');
        
        // Get AR service instance
        const ARFilterService = (await import('../../services/arFilter')).default;
        const arService = ARFilterService.getInstance();
        
        // Initialize if needed
        const capabilities = arService.getCapabilities?.() || null;
        if (!capabilities) {
          console.log('⚙️ [APPLY EFFECTS] Initializing AR service...');
          await arService.initialize();
        }
        
        // CRITICAL: Pass the local video element so canvas can read from it
        // DO NOT change local video's srcObject - keep it showing raw stream
        console.log(`📹 [APPLY EFFECTS] Starting processing with local video element (ready: ${localVideoRef.current?.readyState})`);
        
        const processedStream = await arService.startProcessing(
          rawStream,
          selectedMask,
          blurState,
          AR_CONSTANTS.BLUR_RADIUS.MEDIUM,
          localVideoRef.current || undefined
        );
        
        processedStreamRef.current = processedStream;
        arActiveRef.current = true;

        // Verify processed stream has video track
        const videoTracks = processedStream.getVideoTracks();
        console.log(`📹 [APPLY EFFECTS] Processed stream created: ${videoTracks.length} video tracks`);
        
        if (videoTracks.length === 0) {
          throw new Error('Processed stream has no video tracks!');
        }

        // IMPORTANT: Keep local video showing raw stream
        localStreamRef.current = rawStream;

        // Send processed stream to remote user via WebRTC
        if (webRTCRef.current) {
          const videoTrack = processedStream.getVideoTracks()[0];
          console.log(`🔄 [APPLY EFFECTS] Replacing WebRTC video track (id: ${videoTrack.id}, enabled: ${videoTrack.enabled}, readyState: ${videoTrack.readyState})`);
          
          await webRTCRef.current.replaceVideoTrack(videoTrack);
          console.log('✅ [APPLY EFFECTS] Remote user will now see filtered video');
        } else {
          console.warn('⚠️ [APPLY EFFECTS] WebRTC not available, cannot send filtered stream to remote');
        }

        console.log('✅ [APPLY EFFECTS] Filter pipeline enabled successfully');
      } catch (error) {
        console.error('❌ [APPLY EFFECTS] Failed to enable filter pipeline:', error);
        // Fallback to raw stream
        arActiveRef.current = false;
        processedStreamRef.current = null;
        localStreamRef.current = rawStream;
      }
    } else {
      // No filters needed
      if (arActiveRef.current && processedStreamRef.current) {
        console.log('🛑 [APPLY EFFECTS] Disabling filters, switching to raw stream');
        const ARFilterService = (await import('../../services/arFilter')).default;
        const arService = ARFilterService.getInstance();
        arService.stopProcessing();
        arActiveRef.current = false;
        processedStreamRef.current = null;
        
        // Switch back to raw stream for remote user
        localStreamRef.current = rawStream;
        
        // Send raw stream to remote user
        if (webRTCRef.current) {
          const videoTrack = rawStream.getVideoTracks()[0];
          if (videoTrack) {
            await webRTCRef.current.replaceVideoTrack(videoTrack);
            console.log('✅ [APPLY EFFECTS] Remote user will now see unfiltered video');
          }
        }
      } else {
        console.log('ℹ️ [APPLY EFFECTS] No filters active, no action needed');
      }
    }

    applyMicState();
    const activeStream = localStreamRef.current || rawStream;
    const videoTrack = activeStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = isCameraOn;
    }

    // Ensure local video element has raw stream
    if (localVideoRef.current) {
      if (!localVideoRef.current.srcObject) {
        console.log('📹 [APPLY EFFECTS] Setting raw stream on local video element');
        localVideoRef.current.srcObject = rawStream;
        try {
          await localVideoRef.current.play();
        } catch (playError) {
          console.warn('Auto-play prevented after stream update');
        }
      }
    }
  }, [selectedMask, blurState, applyMicState, isCameraOn]);

  // Handle window resize for responsive video aspect ratio
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mask menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMaskMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.mask-menu-container')) {
          setShowMaskMenu(false);
        }
      }
    };

    if (showMaskMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMaskMenu]);

  // Track blur state changes and emit socket event for auto-reveal
  useEffect(() => {
    // Detect auto-reveal (transition from 'active' to 'revealed')
    if (prevBlurStateRef.current === 'active' && blurState === 'revealed' && revealCountdown === 0) {
      console.log('⏰ Auto-reveal detected, emitting socket event...');
      
      if (socket && sessionId) {
        socket.emit('reveal_video', {
          sessionId,
          maskType: selectedMask,
          isAutoReveal: true,
          timestamp: Date.now()
        });
        console.log('✅ Auto-reveal event emitted to backend');
      }
    }
    
    prevBlurStateRef.current = blurState;
  }, [blurState, revealCountdown, socket, sessionId, selectedMask]);

  useEffect(() => {
    // Only attempt to apply effects after raw stream captured
    if (!rawStreamRef.current) {
      return;
    }
    void applyEffectsToCurrentStream();
  }, [selectedMask, blurState, applyEffectsToCurrentStream]);

  // Update filters in real-time when mask or blur changes
  useEffect(() => {
    if (arActiveRef.current) {
      const updateFilters = async () => {
        const ARFilterService = (await import('../../services/arFilter')).default;
        const arService = ARFilterService.getInstance();
        arService.setMask(selectedMask);
        arService.setBlurState(blurState, AR_CONSTANTS.BLUR_RADIUS.LOW); // Reduced blur intensity
        console.log('🔄 Filter settings updated in real-time for remote stream');
      };
      updateFilters();
    }
  }, [selectedMask, blurState]);

  // Define reusable remote stream handler
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log('📺 Remote stream received:', {
      video: stream.getVideoTracks().length > 0,
      audio: stream.getAudioTracks().length > 0,
      tracks: stream.getTracks().length,
      id: stream.id
    });
    
    remoteStreamRef.current = stream;
    
    if (remoteVideoRef.current) {
      // Always set the remote stream
      remoteVideoRef.current.srcObject = stream;
      applySpeakerState();
      console.log('✅ Remote stream assigned to video element');
      
      // Force play the remote video
      remoteVideoRef.current.play().catch(error => {
        console.warn('Remote video autoplay prevented, trying user gesture:', error);
        // Try to play on next user interaction
        const playPromise = () => {
          remoteVideoRef.current?.play().catch(e => 
            console.log('Manual play also failed:', e)
          );
        };
        document.addEventListener('click', playPromise, { once: true });
      });
      
      console.log('📺 Remote video setup completed for both users');
    }
    
    // Update connection state
    setIsMatchConnected(true);
    setCurrentState('connected');
    setIsSearching(false);
  }, [applySpeakerState]);

  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log('🔌 WebRTC Connection State Changed:', state);

    if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      console.log('⚠️ WebRTC connection lost - Remote user disconnected!');
      console.log('Current state (from refs):', {
        isMatchConnected: isMatchConnectedRef.current,
        sessionId: sessionIdRef.current
      });

      // CRITICAL FIX: Auto-find next partner when remote disconnects
      if (isMatchConnectedRef.current && sessionIdRef.current) {
        console.log('🔄 Starting auto-search for next partner...');
        
        // Clean up remote stream
        if (remoteVideoRef.current) {
          if (remoteVideoRef.current.srcObject) {
            const stream = remoteVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
          remoteVideoRef.current.pause();
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.load();
        }

        // Update UI state
        setIsMatchConnected(false);
        setCurrentState('finding');
        setIsSearching(true);
        addMessage('Partner disconnected. Finding someone new...', false);
        
        // Clean up session
        if (socket && sessionIdRef.current) {
          socket.emit('end_session', { sessionId: sessionIdRef.current });
        }
        setSessionId(null);
        setPartnerId('');
        
        // Force cleanup WebRTC
        if (webRTCRef.current) {
          webRTCRef.current.forceDisconnect();
        }
        
        // Auto-search for next partner after 500ms
        setTimeout(() => {
          if (socket && socket.connected) {
            console.log('🔍 Emitting find_match for next partner...');
            socket.emit('find_match', { mode: 'video' });
          }
        }, 500);
      }
    } else if (state === 'connected') {
      setIsMatchConnected(true);
      setCurrentState('connected');
      applyMicState();
    }
  }, [socket, applyMicState]);

  useEffect(() => {
    // Initialize WebRTC service without socket (we'll use the context socket)
    webRTCRef.current = new WebRTCService();
    
    // Set up remote video stream handler (works for both initial and reconnections)
    webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
    webRTCRef.current.onConnectionStateChanged(handleConnectionStateChange);

    // Socket event listeners
    if (socket) {
      console.log('🔌 Setting up socket event listeners for VideoChat');
      
      socket.on('match-found', async (data: { 
        sessionId: string; 
        matchUserId: string; 
        isInitiator: boolean;
        coins?: number;
        totalChats?: number;
        dailyChats?: number;
      }) => {
        console.log('📱 Video chat match found:', data);
        console.log('📊 Match data received:', {
          coins: data.coins,
          totalChats: data.totalChats,
          dailyChats: data.dailyChats,
          hasCoinsData: data.coins !== undefined
        });
        
        // Update user coins and chat counts from backend
        if (data.coins !== undefined) {
          console.log('🔄 CALLING updateUser with:', { 
            coins: data.coins,
            totalChats: data.totalChats || 0,
            dailyChats: data.dailyChats || 0
          });
          
          updateUser({ 
            coins: data.coins,
            totalChats: data.totalChats || 0,
            dailyChats: data.dailyChats || 0
          });
          
          console.log(`✅ updateUser CALLED - New values: coins=${data.coins}, totalChats=${data.totalChats}, dailyChats=${data.dailyChats}`);
        } else {
          console.warn('⚠️ No coins data in match-found event!');
        }
        
        setSessionId(data.sessionId);
        setPartnerId(data.matchUserId); // Set partner ID
        setCurrentState('connected'); // Set state to connected
        setIsSearching(false);
        setMessages([]);
        // Match found - no system message needed
        
        // 🎭 BLUR RESTART: Check if blur should be applied for this new match
        const blurEnabled = localStorage.getItem('omegoo_blur_enabled') === 'true';
        const blurDuration = parseInt(localStorage.getItem('omegoo_blur_duration') || '5', 10);
        if (blurEnabled && blurDuration > 0) {
          console.log(`👁️ Re-applying blur for new match: ${blurDuration}s countdown`);
          setTimeout(() => {
            startBlurCountdown(blurDuration);
          }, 1000); // Small delay to ensure video stream is ready
        }
        
        // Configure WebRTC service with match details
        if (webRTCRef.current) {
          // ENSURE FRESH SETUP: Cleanup any previous connection first
          console.log('🔄 Ensuring fresh WebRTC setup for reconnection');
          webRTCRef.current.cleanup();
          
          // REINITIALIZE: Create fresh WebRTC instance for clean setup
          webRTCRef.current = new WebRTCService();
          
          // CRITICAL: Set remote video callback on NEW instance
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          webRTCRef.current.onConnectionStateChanged(handleConnectionStateChange);
          
          // Set up new connection
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          // IMPORTANT: Start local video first before setting up peer connection
          try {
            await startLocalVideo();
            console.log('📹 Local video started for peer connection');
          } catch (error) {
            console.error('❌ Failed to start local video:', error);
            console.error('Camera access required for video chat');
            return;
          }
          
          // Set up ICE candidate handling through main socket
          webRTCRef.current.setIceCandidateCallback((candidate: RTCIceCandidate) => {
            console.log('🧊 Sending ICE candidate to peer');
            socket.emit('ice-candidate', {
              candidate: candidate,
              targetUserId: data.matchUserId,
              sessionId: data.sessionId
            });
          });
          
          // Set up data channel message handling
          webRTCRef.current.onMessageReceived((message: string) => {
            console.log('📩 Received data channel message:', message);
            addMessage(message, false);
          });
          
          // If we're the initiator, create and send offer
          if (data.isInitiator) {
            try {
              // Small delay to ensure local stream is properly added
              setTimeout(async () => {
                const offer = await webRTCRef.current!.createWebRTCOffer();
                socket.emit('webrtc-offer', { 
                  offer, 
                  targetUserId: data.matchUserId,
                  sessionId: data.sessionId 
                });
                console.log('📞 Sent WebRTC offer as initiator');
              }, 1000);
            } catch (error) {
              console.error('❌ Failed to create offer:', error);
              console.error('Failed to establish video connection');
            }
          }
          
          console.log('Video chat ready!');
          setIsMatchConnected(true);
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for video chat partner:', data);
        setIsSearching(true);
        setCurrentState('finding'); // Set state to finding
      });

      socket.on('chat_message', (data: { content: string; timestamp: number; sessionId: string; fromUserId?: string }) => {
        console.log('📨 RECEIVED MESSAGE IN FRONTEND:', data);
        console.log('🔍 Current sessionId state:', sessionId);
        console.log('🔍 isMatchConnected state:', isMatchConnected);
        console.log('🔍 Session comparison:', { 
          received: data.sessionId, 
          current: sessionId, 
          match: data.sessionId === sessionId,
          receivedType: typeof data.sessionId,
          currentType: typeof sessionId,
          receivedLength: data.sessionId?.length,
          currentLength: sessionId?.length
        });
        
        // Display clean message without username
        addMessage(data.content, false);
        
        // 🔄 Reset auto-typing timer (stranger sent a message)
        resetMessageTimer();
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Video chat session ended:', data);
        
        // Clean up WebRTC connection first
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        
        // Stop remote stream tracks explicitly with proper video element cleanup
        if (remoteVideoRef.current) {
          // Stop all tracks first
          if (remoteVideoRef.current.srcObject) {
            const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
            remoteStream.getTracks().forEach(track => track.stop());
          }
          // CRITICAL: Pause video, clear srcObject, and force reload
          remoteVideoRef.current.pause();
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.load(); // Force video element to reset
        }
        remoteStreamRef.current = null;
        remoteStreamRef.current = null;
        
        // Reset all state
        setIsMatchConnected(false);
        setSessionId(null);
        setPartnerId('');
        setCurrentState('finding'); // IMPORTANT: Set to finding, not disconnected
        setMessages([]);
        setIsSearching(true); // Start searching immediately
        
        console.log(`Chat ended. ${data.reason || 'Your partner left the chat.'}`);
        
        // ALWAYS auto-search when session ends (partner disconnected/next person)
        addMessage('Partner left. Searching for someone new...', false);
        
        setTimeout(() => {
          if (socket && socket.connected) {
            console.log('🔍 Auto-searching after session end...');
            socket.emit('find_match', { mode: 'video' });
          }
        }, 500); // Quick restart for better UX
      });

      socket.on('user_disconnected', (data: { userId: string }) => {
        console.log('👋 User disconnected:', data.userId);
        console.log('Current state (from refs):', { 
          isMatchConnected: isMatchConnectedRef.current, 
          partnerId: partnerIdRef.current, 
          currentState: currentStateRef.current,
          sessionId: sessionIdRef.current
        });

        // CRITICAL FIX: Use refs for latest state values to avoid stale closures
        const shouldReconnect = 
          isMatchConnectedRef.current || 
          data.userId === partnerIdRef.current || 
          currentStateRef.current === 'connected';
        
        if (shouldReconnect) {
          console.log('🔄 Partner disconnected, automatically finding new partner...');

          // Clean up current connection
          if (webRTCRef.current) {
            webRTCRef.current.forceDisconnect();
          }

          // Stop and clear remote video stream explicitly with proper cleanup
          if (remoteVideoRef.current) {
            // Stop all tracks first
            if (remoteVideoRef.current.srcObject) {
              const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
              remoteStream.getTracks().forEach(track => {
                console.log('🛑 Stopping remote track on disconnect:', track.kind);
                track.stop();
              });
            }
            // CRITICAL: Pause video, clear srcObject, and force reload
            remoteVideoRef.current.pause();
            remoteVideoRef.current.srcObject = null;
            remoteVideoRef.current.load(); // Force video element to reset
          }

          // Reset partner info and state - ALWAYS reset to prevent stuck state
          setPartnerId('');
          setSessionId(null);
          setIsMatchConnected(false);
          setCurrentState('finding');
          setIsSearching(true);
          setMessages([]); // Clear messages for fresh start

          // Add message to chat
          addMessage('Your partner disconnected. Finding someone new...', false);

          // Start searching for new partner immediately
          setTimeout(() => {
            if (socket && socket.connected) {
              console.log('🔍 Auto-searching for new partner after disconnect...');
              socket.emit('find_match', { mode: 'video' });
            }
          }, 500); // Reduced delay for faster reconnection
        } else {
          console.log('⚠️ Disconnect event ignored - not in active session');
        }
      });

      // WebRTC signaling events
      socket.on('webrtc-offer', async (data: any) => {
        console.log('📞 Received WebRTC offer from:', data.fromUserId);
        if (webRTCRef.current) {
          try {
            const answer = await webRTCRef.current.handleOffer(data.offer);
            socket.emit('webrtc-answer', { 
              answer, 
              targetUserId: data.fromUserId,
              sessionId: sessionId 
            });
          } catch (error) {
            console.error('Error handling WebRTC offer:', error);
          }
        }
      });

      socket.on('webrtc-answer', async (data: any) => {
        console.log('📞 Received WebRTC answer from:', data.fromUserId);
        if (webRTCRef.current) {
          try {
            await webRTCRef.current.handleAnswer(data.answer);
          } catch (error) {
            console.error('Error handling WebRTC answer:', error);
          }
        }
      });

      socket.on('ice-candidate', async (data: any) => {
        console.log('🧊 Received ICE candidate from:', data.fromUserId);
        if (webRTCRef.current && data.candidate) {
          try {
            await webRTCRef.current.handleIceCandidate(data.candidate);
          } catch (error) {
            console.error('Error handling ICE candidate:', error);
          }
        }
      });

      socket.on('error', (data: { message: string }) => {
        console.error('🚨 Video chat error:', data.message);
        console.error(`Error: ${data.message}`);
      });
    }

    // Start local video
    startLocalVideo();

    // Copy refs to local variables for cleanup to avoid stale closure warnings
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;

    return () => {
      console.log('🧹 VideoChat component cleanup');
      
      // Clean up WebRTC
      if (webRTCRef.current) {
        webRTCRef.current.forceDisconnect();
      }
      
      // Clean up local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log('🛑 Stopping local track:', track.kind);
          track.stop();
        });
        localStreamRef.current = null;
      }
      
      // Clean up video elements with proper reset using copied refs
      if (localVideo) {
        if (localVideo.srcObject) {
          localVideo.pause();
          localVideo.srcObject = null;
          localVideo.load();
        }
      }
      
      if (remoteVideo) {
        if (remoteVideo.srcObject) {
          const remoteStream = remoteVideo.srcObject as MediaStream;
          remoteStream.getTracks().forEach(track => track.stop());
          remoteVideo.pause();
          remoteVideo.srcObject = null;
          remoteVideo.load();
        }
        remoteStreamRef.current = null;
      }
      
      // Remove all socket listeners
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('chat_message');
      socket?.off('session_ended');
      socket?.off('user_disconnected');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      socket?.off('error');
      
      console.log('✅ VideoChat cleanup completed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Auto-start matching when component mounts and socket is ready
  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket status:', {
        connected: socket.connected,
        id: socket.id,
        transport: socket.io.engine?.transport?.name || 'unknown',
        backendUrl: window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://omegoo-api-clean.onrender.com'
      });
      
      // Add more socket event debugging
      socket.on('connect', () => {
        console.log('✅ Socket connected!', socket.id);
        console.log('Connected to server!');
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected!');
        console.log('Disconnected from server');
      });

      socket.on('connect_error', (error: Error) => {
        console.error('🚨 Socket connection error:', error);
        console.error('Connection error: ' + error.message);
      });

      // Debug specific events
      socket.on('match-found', (data: any) => {
        console.log('🎯 MATCH-FOUND EVENT RECEIVED:', data);
      });

      socket.on('searching', (data: any) => {
        console.log('🔍 SEARCHING EVENT RECEIVED:', data);
      });

      socket.on('error', (data: any) => {
        console.log('🚨 ERROR EVENT RECEIVED:', data);
      });

      // Handle multi-device connection replacement
      socket.on('connection_replaced', (data: any) => {
        console.log('🔄 Connection replaced by new device:', data);
        alert('This session was replaced by a new device connection. Please refresh to reconnect.');
        // Clean up current session
        if (webRTCRef.current) {
          webRTCRef.current.cleanup();
        }
        setIsMatchConnected(false);
        setIsSearching(false);
        setMessages([]);
        navigate('/');
      });
      
      // Only show connection status, don't auto-start
      if (!socket.connected) {
        console.log('⏳ Socket not connected yet, waiting...');
        console.log('Connecting to server...');
      } else {
        console.log('Ready to chat! Click "New" to find someone.');
      }
    } else {
      console.error('❌ No socket available! Please refresh the page.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const startLocalVideo = async () => {
    try {
      // Stop any existing filter processing
      if (arActiveRef.current) {
        console.log('🛑 Stopping existing AR pipeline before restarting camera');
        const ARFilterService = (await import('../../services/arFilter')).default;
        const arService = ARFilterService.getInstance();
        arService.stopProcessing();
        arActiveRef.current = false;
        processedStreamRef.current = null;
      }

      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: facingMode,
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('🎥 Requesting user media with constraints:', constraints);
      const rawStream = await webRTCRef.current?.initializeMedia(constraints);
      
      if (!rawStream) {
        throw new Error('Failed to get media stream');
      }
      
      // CRITICAL: Always set raw stream on local video element
      rawStreamRef.current = rawStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = rawStream;
      }
      localStreamRef.current = rawStream;

      // Apply filters if needed (this will process for remote user only)
      await applyEffectsToCurrentStream();

      setCameraBlocked(false);
      console.log('✅ Local video stream ready');
    } catch (error) {
      console.error('❌ Failed to start local video:', error);
      setCameraBlocked(true);
      addMessage('Camera/microphone access denied. Please allow access and refresh.', false);
    }
  };

  const addMessage = (content: string, isOwnMessage: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      content,
      isOwnMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    // Auto scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const startNewChat = (forceCleanup = false) => {
    if (!socket) {
      console.error('❌ Socket not available');
      addMessage('Connection error. Please refresh the page.', false);
      return;
    }
    
    if (!socketConnected) {
      console.error('❌ Socket not connected');
      addMessage('Not connected to server. Please check your internet.', false);
      return;
    }
    
    // INSTANT DISCONNECT: End current session first if exists
    if (sessionId && isMatchConnected) {
      console.log('🔚 Ending current session immediately:', sessionId);
      socket.emit('end_session', { 
        sessionId: sessionId,
        duration: Date.now() 
      });
      
      // Notify partner immediately
      socket.emit('session_ended', { 
        sessionId: sessionId,
        reason: 'user_clicked_next' 
      });
    }
    
    // FORCE CLEANUP: For fresh reconnects (same users scenario)
    if (forceCleanup) {
      console.log('🧹 Force cleaning video streams for fresh reconnect');
      
      // Clean local video
      if (localVideoRef.current?.srcObject) {
        const localStream = localVideoRef.current.srcObject as MediaStream;
        localStream.getTracks().forEach(track => {
          console.log('🛑 Stopping local track:', track.kind);
          track.stop();
        });
        localVideoRef.current.srcObject = null;
      }
      
      // Clean remote video
      if (remoteVideoRef.current?.srcObject) {
        const remoteStream = remoteVideoRef.current.srcObject as MediaStream;  
        remoteStream.getTracks().forEach(track => {
          console.log('🛑 Stopping remote track:', track.kind);
          track.stop();
        });
        remoteVideoRef.current.srcObject = null;
      }
      
      // Force WebRTC cleanup
      if (webRTCRef.current) {
        console.log('🔌 Force disconnecting WebRTC for fresh connection');
        webRTCRef.current.forceDisconnect();
      }
      
      console.log('✅ Force cleanup completed for fresh reconnect');
      
      // REINITIALIZE WebRTC after cleanup for fresh connection
      setTimeout(() => {
        if (webRTCRef.current) {
          console.log('🔄 Reinitializing WebRTC service after cleanup');
          webRTCRef.current = new WebRTCService();
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          webRTCRef.current.onConnectionStateChanged(handleConnectionStateChange);
          console.log('✅ Fresh WebRTC instance created');
        }
      }, 100);
    }
    
    // INSTANT STATE RESET including mic/camera state
    setIsMatchConnected(false);
    setSessionId(null);
    setPartnerId(''); // Reset partner ID
    setCurrentState('finding'); // Set to finding state
    setMessages([]);
    setIsSearching(true);
    setFacingMode('user'); // Reset to front camera
    setIsLocalMirrored(true); // Reset to mirrored for front camera
  console.log('🔄 State reset for new connection - preserving mic and speaker states');
    
    // START NEW SEARCH (with delay if force cleanup)
    const searchDelay = forceCleanup ? 200 : 0;
    setTimeout(() => {
      console.log('🔍 Starting search for new partner');
      socket.emit('find_match', { mode: 'video' });
      console.log('✅ New partner search started');
      addMessage('Searching for someone to chat with...', false);
    }, searchDelay);
  };

  const nextMatch = () => {
    try {
      console.log('🔄 Next Person clicked - using force cleanup for fresh reconnect');
      
      // Use startNewChat with force cleanup for same users reconnection
      startNewChat(true);
    } catch (error) {
      console.error('❌ Error in nextMatch:', error);
      addMessage('Failed to find next match. Please try again.', false);
    }
  };

  const exitChat = () => {
    try {
      console.log('🚪 Exit Chat clicked');
      
      // Clean up current session
      if (sessionId) {
        socket?.emit('end_session', { sessionId });
      }
      
      // Clean up WebRTC
      if (webRTCRef.current) {
        webRTCRef.current.forceDisconnect();
      }
      
      // Reset state
      setCurrentState('disconnected');
      setIsMatchConnected(false);
      setSessionId(null);
      setPartnerId('');
      setIsSearching(false);
      
      console.log('✅ Exit chat cleanup completed');
      
      setActiveMode(null);
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('❌ Error in exitChat:', error);
      // Still try to navigate even if cleanup fails
      setActiveMode(null);
      navigate('/');
    }
  };

  const handleRevealVideo = () => {
    try {
      console.log('👁️ Revealing video...');
      
      // Emit socket event to notify partner
      if (socket && sessionId) {
        socket.emit('reveal_video', {
          sessionId,
          maskType: selectedMask,
          isAutoReveal: false,
          timestamp: Date.now()
        });
        console.log('✅ Reveal video event emitted to backend');
      }
      
      // Call AR context method to update state
      revealVideo();
    } catch (error) {
      console.error('❌ Error revealing video:', error);
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMatchConnected) return;
    
    // 🔐 Edge Case 3: Detect multi-touch (pinch zoom) - ignore for swipe
    if (e.touches.length > 1) {
      console.log('🔍 Multi-touch detected (pinch/zoom) - ignoring swipe');
      resetSwipeState();
      return;
    }
    
    // 🔐 Check if swipes are enabled based on edge cases
    if (!isSwipeEnabled()) {
      return;
    }
    
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    
    // Check for double tap (like gesture)
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      // Double tap detected
      handleDoubleTap();
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMatchConnected || touchStartX === null || touchStartY === null) return;
    
    // 🔐 Edge Case 3: If multi-touch started, abort swipe
    if (e.touches.length > 1) {
      console.log('🔍 Multi-touch during move - canceling swipe');
      resetSwipeState();
      return;
    }
    
    // 🔐 Check if swipes are still enabled (conditions might change mid-swipe)
    if (!isSwipeEnabled()) {
      resetSwipeState();
      return;
    }
    
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    
    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
      setSwipeOffset(diffX);
      
      // Show hint when threshold reached
      if (diffX < -100) {
        setShowSwipeHint('left');
      } else if (diffX > 100) {
        setShowSwipeHint('right');
      } else {
        setShowSwipeHint(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isMatchConnected || touchStartX === null) {
      resetSwipeState();
      return;
    }
    
    // 🔐 Final check before executing swipe action
    if (!isSwipeEnabled()) {
      console.log('🚫 Swipe action blocked by edge case protection');
      resetSwipeState();
      return;
    }
    
    const swipeThreshold = 150;
    
    // Swipe left - Next person
    if (swipeOffset < -swipeThreshold) {
      console.log('👈 Swipe left detected - Next person');
      nextMatch();
    }
    // Swipe right - Add friend (placeholder)
    else if (swipeOffset > swipeThreshold) {
      console.log('👉 Swipe right detected - Add friend');
      handleAddFriend();
    }
    
    resetSwipeState();
  };

  const handleDoubleTap = () => {
    console.log('❤️ Double tap detected - Like animation');
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1500);
    
    // Optional: Send like event to backend
    if (socket && sessionId) {
      socket.emit('send_like', { sessionId, timestamp: Date.now() });
    }
  };

  const handleAddFriend = () => {
    // Check if user is logged in
    if (!user || !user.email) {
      console.log('⚠️ User not logged in, showing login modal');
      setShowLoginModal(true);
      return;
    }
    
    // Check if we have partner info
    if (!partnerId || !sessionId) {
      console.log('⚠️ No active session to add favourite');
      addMessage('No one to add as favourite. Connect with someone first!', false);
      return;
    }
    
    // Add to favourites via socket
    console.log('⭐ Adding user to favourites:', {
      currentUser: user.email,
      favouriteUserId: partnerId,
      sessionId
    });
    
    if (socket) {
      socket.emit('add_favourite', {
        favouriteUserId: partnerId,
        sessionId
      });
      
      // Show success message (will be confirmed by socket event)
      addMessage('⭐ Added to favourites!', false);
    }
  };

  const resetSwipeState = () => {
    setTouchStartX(null);
    setTouchStartY(null);
    setSwipeOffset(0);
    setShowSwipeHint(null);
  };

  const toggleCamera = () => {
    try {
      console.log('📹 CAMERA TOGGLE: Current state =', isCameraOn);
      
      if (!webRTCRef.current) {
        console.error('❌ WebRTC reference not available');
        return;
      }
      
      const newState = webRTCRef.current?.toggleVideo();
      setIsCameraOn(newState || false);
      
      console.log('✅ Camera toggled:', newState);
    } catch (error) {
      console.error('❌ Error toggling camera:', error);
      addMessage('Failed to toggle camera. Please try again.', false);
    }
  };

  const toggleMic = () => {
    try {
      console.log('🎤 MIC TOGGLE: Current state =', isMicOn);
      
      if (!localStreamRef.current) {
        console.error('❌ No local stream available for mic toggle');
        addMessage('Microphone not available. Please refresh the page.', false);
        return;
      }

      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (!audioTrack) {
        console.error('❌ Audio track not found');
        addMessage('Microphone not found. Please check permissions.', false);
        return;
      }

      if (audioTrack.readyState !== 'live') {
        console.error('❌ Audio track not live:', audioTrack.readyState);
        addMessage('Microphone is not active. Please refresh.', false);
        console.log('🔄 Attempting audio recovery...');
        startLocalVideo().catch(console.error);
        return;
      }

      const newState = !isMicOn;
      audioTrack.enabled = newState;

      if (webRTCRef.current) {
        webRTCRef.current.updateAudioSenders(newState);
      }

      setIsMicOn(newState);

      console.log('✅ Mic toggle complete:', {
        newState,
        trackEnabled: audioTrack.enabled,
        trackId: audioTrack.id
      });
      
    } catch (error) {
      console.error('❌ Error toggling microphone:', error);
      addMessage('Failed to toggle microphone. Please try again.', false);
    }
  };

  const toggleSpeaker = () => {
    try {
      if (!remoteVideoRef.current) {
        console.error('❌ Remote video element not available for speaker toggle');
        return;
      }

      console.log('🔊 SPEAKER TOGGLE: Current state =', isSpeakerOn);
      const newSpeakerState = !isSpeakerOn;

      remoteVideoRef.current.muted = !newSpeakerState;
      remoteVideoRef.current.volume = newSpeakerState ? 1 : 0;

      setIsSpeakerOn(newSpeakerState);

      console.log('🔊 SPEAKER TOGGLE COMPLETE:', {
        oldSpeakerState: isSpeakerOn,
        newSpeakerState,
        videoElementMuted: remoteVideoRef.current.muted,
        videoVolume: remoteVideoRef.current.volume
      });

      if (remoteVideoRef.current.srcObject) {
        const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
        const audioTracks = remoteStream.getAudioTracks();
        console.log('🔊 Remote audio verification:', {
          tracks: audioTracks.length,
          firstTrackEnabled: audioTracks[0]?.enabled
        });
      } else {
        console.warn('🔊 No remote stream found for speaker verification');
      }
    } catch (error) {
      console.error('❌ Error toggling speaker:', error);
      addMessage('Failed to toggle speaker. Please try again.', false);
    }
  };

  const switchCamera = async () => {
    console.log('📷 CAMERA SWITCH: Current facing mode =', facingMode);
    
    const isMobile = windowWidth < 768;
    
    // PC/Desktop: Just toggle mirror effect, don't try to switch camera
    if (!isMobile) {
      console.log('💻 Desktop detected - toggling mirror effect');
      setIsLocalMirrored(prev => !prev);
      console.log('✅ Mirror toggled to:', !isLocalMirrored);
      return;
    }
    
    // Mobile: Switch between front and back camera
    console.log('📱 Mobile detected - switching camera');
    
    // Prevent multiple simultaneous calls
    if (!localStreamRef.current) {
      console.warn('⚠️ No local stream available');
      return;
    }
    
    try {
      // Toggle facing mode - FIXED: Properly toggle between user and environment
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      console.log('🔄 Switching from', facingMode, 'to', newFacingMode);
      
      // Stop current video track
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        console.log('🛑 Stopped current video track');
      }
      
      // Get new stream with switched camera - FIXED: Use same constraints as initial video
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: { exact: newFacingMode }, // FIXED: Use exact mode
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('🎥 Requesting new stream with constraints:', constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got new stream with facingMode:', newFacingMode);
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        await localVideoRef.current.play().catch(err => {
          console.warn('Video autoplay warning (non-critical):', err);
        });
        console.log('✅ Updated local video element');
      }
      
      // Preserve audio track from old stream
      const oldAudioTrack = localStreamRef.current?.getAudioTracks()[0];
      const newAudioTrack = newStream.getAudioTracks()[0];
      
      // Update stream reference BEFORE updating peer connection
      localStreamRef.current = newStream;
      
      // Apply mic state to audio track
      if (newAudioTrack && oldAudioTrack) {
        newAudioTrack.enabled = oldAudioTrack.enabled;
        console.log('✅ Preserved mic state:', newAudioTrack.enabled);
      }
      
      // Update WebRTC peer connection with new video track
      if (webRTCRef.current && isMatchConnected) {
        const pc = (webRTCRef.current as any).peerConnection;
        if (pc && pc.connectionState === 'connected') {
          const newVideoTrack = newStream.getVideoTracks()[0];
          const senders = pc.getSenders();
          const videoSender = senders.find((sender: RTCRtpSender) => sender.track?.kind === 'video');
          
          if (videoSender && newVideoTrack) {
            await videoSender.replaceTrack(newVideoTrack);
            console.log('✅ Replaced video track in peer connection');
          } else {
            console.warn('⚠️ Video sender not found in peer connection');
          }
        } else {
          console.warn('⚠️ Peer connection not in connected state:', pc?.connectionState);
        }
      }
      
      // FIXED: Update facing mode state AFTER successful switch
      setFacingMode(newFacingMode);
      // Update mirror state based on camera (front = mirrored, back = normal)
      setIsLocalMirrored(newFacingMode === 'user');
      console.log('✅ Camera switched successfully to:', newFacingMode);
      
    } catch (error: any) {
      console.error('❌ Failed to switch camera:', error);
      
      // Better error handling with user feedback
      if (error.name === 'OverconstrainedError') {
        console.error('Camera not available:', error.constraint);
        addMessage('This device does not have the requested camera.', false);
      } else if (error.name === 'NotAllowedError') {
        addMessage('Camera permission denied. Please allow camera access.', false);
      } else if (error.name === 'NotFoundError') {
        addMessage('No camera found on this device.', false);
      } else {
        addMessage('Failed to switch camera. Please try again.', false);
      }
      
      // DO NOT revert facing mode - keep the state consistent
      console.log('⚠️ Keeping facing mode as:', facingMode);
    }
  };

  const sendMessage = () => {
    try {
      if (!messageInput.trim() || !isMatchConnected || !sessionId || !socket) {
        console.warn('❌ Cannot send message:', {
          hasInput: !!messageInput.trim(),
          isMatchConnected,
          hasSessionId: !!sessionId,
          hasSocket: !!socket
        });
        return;
      }
      
      const content = messageInput.trim();
      addMessage(content, true);
      
      // Send message via socket
      socket.emit('chat_message', {
        sessionId,
        content,
        type: 'text'
      });
      
      setMessageInput('');
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      addMessage('Failed to send message. Please try again.', false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Preview Modal handlers
  const handlePreviewStart = (stream: MediaStream) => {
    console.log('[VideoChat] Preview confirmed, starting match with stream');
    setShowPreview(false);
    // Use the preview stream for local video
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    localStreamRef.current = stream;
    // Now start finding match
    if (socket) {
      setIsSearching(true);
      setCurrentState('finding');
      socket.emit('find_match', { mode: 'video' });
      console.log('[VideoChat] Finding match with preview stream');
    }
  };

  const handlePreviewCancel = () => {
    console.log('[VideoChat] Preview cancelled');
    setShowPreview(false);
    navigate('/');
  };

  // Check if remote stream is audio-only
  useEffect(() => {
    const stream = remoteStreamRef.current;
    if (stream) {
      const hasVideo = stream.getVideoTracks().length > 0 && 
                       stream.getVideoTracks().some(track => track.enabled);
      setIsAudioOnly(!hasVideo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMatchConnected]); // Re-check when match connection changes

  const handleReport = () => {
    try {
      if (partnerId && sessionId) {
        setShowReportModal(true);
        console.log('📢 Report modal opened for partner:', partnerId);
      } else {
        console.warn('⚠️ No active session to report');
        alert('No active session to report');
      }
    } catch (error) {
      console.error('❌ Error in handleReport:', error);
      alert('Failed to open report dialog. Please try again.');
    }
  };

  const blurEnabled = blurState === 'active' || blurState === 'manual';
  const blurButtonAriaLabel = blurEnabled ? 'Reveal my video' : 'Blur my video';

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col lg:flex-row">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Enhanced Header with logo - matching AudioChat theme */}
        <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm object-cover"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="hidden sm:inline">Video Chat</span>
                <span className="sm:hidden">Video</span>
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs text-purple-100 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {videoOnlineCount} online
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
              socketConnected && isMatchConnected ? 'bg-green-400' : 
              socketConnected && isSearching ? 'bg-yellow-400' : 
              socketConnecting ? 'bg-orange-400' :
              socketConnected ? 'bg-purple-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            <span className="text-white text-xs lg:text-sm font-medium">
              {socketConnected && isMatchConnected ? 'Connected' : 
               socketConnected && isSearching ? 'Finding Partner...' : 
               socketConnecting ? 'Connecting to Server...' :
               socketConnected ? 'Ready' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Video Container - Responsive */}
        <div className="flex-1 bg-black relative min-h-0">
          {/* Camera Blocked Warning */}
          {cameraBlocked && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded text-sm z-10">
              Camera blocked. Please enable it and try again.
            </div>
          )}

          {/* Remote Video */}
          <div 
            className="w-full h-full relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={resetSwipeState}
          >
            {isMatchConnected ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // FIXED: Use contain to show full original video without zoom
                    backgroundColor: '#000',
                    transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
                    transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                  }}
                />
                
                {/* Swipe Hint - Left (Next) */}
                {showSwipeHint === 'left' && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <div className="text-white text-6xl animate-bounce">←</div>
                    <div className="text-white text-sm font-bold bg-black bg-opacity-50 px-3 py-1 rounded-full mt-2">
                      Next
                    </div>
                  </div>
                )}
                
                {/* Swipe Hint - Right (Friend) */}
                {showSwipeHint === 'right' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <div className="text-white text-6xl animate-bounce">→</div>
                    <div className="text-white text-sm font-bold bg-black bg-opacity-50 px-3 py-1 rounded-full mt-2">
                      Favourite
                    </div>
                  </div>
                )}
                
                {/* Like Animation */}
                {showLikeAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="text-red-500 text-9xl animate-ping">❤️</div>
                  </div>
                )}
                
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 p-4">
                {isSearching ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-sm lg:text-base">Looking for someone you can chat with...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoCameraSlashIcon className="w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 text-gray-600" />
                    <p className="text-sm lg:text-base">Your partner's video will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Omegoo Watermark - always visible with continuous blink */}
          <div className="pointer-events-none absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
            <div className="flex items-center gap-2 bg-black bg-opacity-40 backdrop-blur-sm px-3 py-2 rounded-xl border border-white border-opacity-20">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm object-cover animate-pulse"
                style={{ animationDuration: '2s' }}
              />
              <span className="text-white text-sm sm:text-base font-bold tracking-wider drop-shadow-lg animate-pulse"
                style={{ animationDuration: '2s' }}>
                Omegoo
              </span>
            </div>
          </div>

          {/* Local Video - FIXED: 1:1 aspect ratio for consistency across all devices */}
          <div className="absolute bottom-20 right-2 lg:bottom-4 lg:right-4 xl:bottom-6 xl:right-6">
            <div className={`bg-gray-800 rounded-lg border-2 border-white border-opacity-30 overflow-hidden shadow-2xl ${
              // FIXED: Square aspect ratio (1:1) - increased sizes: mobile 36x36, tablet 56x56, desktop 64x64, xl 72x72
              windowWidth < 768 ? 'w-36 h-36' : windowWidth < 1024 ? 'w-56 h-56' : windowWidth < 1280 ? 'w-64 h-64' : 'w-72 h-72'
            }`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full"
                style={{
                  // FIXED: Use isLocalMirrored state for consistent mirror control
                  transform: isLocalMirrored ? 'scaleX(-1)' : 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // FIXED: Use cover to fill square container
                  backgroundColor: '#1f2937'
                }}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoCameraSlashIcon className={`text-gray-400 ${windowWidth < 768 ? 'w-4 h-4' : 'w-6 h-6 lg:w-12 lg:h-12'}`} />
                </div>
              )}
            </div>
          </div>

          {/* Controls - Mobile friendly */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 lg:bottom-4">
            <div className="flex space-x-2 lg:space-x-3">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`p-2 lg:p-3 rounded-full ${
                  isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                } text-white transition-colors touch-manipulation`}
              >
                {isMicOn ? (
                  <MicrophoneIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                ) : (
                  <MicrophoneSlashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                )}
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`p-2 lg:p-3 rounded-full ${
                  isSpeakerOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                } text-white transition-colors touch-manipulation`}
                title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              >
                {isSpeakerOn ? (
                  <SpeakerWaveIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                ) : (
                  <SpeakerXMarkIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                )}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleCamera}
                className={`p-2 lg:p-3 rounded-full ${
                  isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                } text-white transition-colors touch-manipulation`}
              >
                {isCameraOn ? (
                  <VideoCameraIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                ) : (
                  <VideoCameraSlashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                )}
              </button>

              {/* Camera Switch */}
              <button
                onClick={switchCamera}
                className="p-2 lg:p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors touch-manipulation"
                title="Switch Camera"
              >
                <ArrowPathIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>

              {/* AR Face Mask Toggle */}
              <div className="relative mask-menu-container">
                <button
                  onClick={() => setShowMaskMenu(!showMaskMenu)}
                  className="p-2 lg:p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors touch-manipulation"
                  title="Face Masks"
                >
                  {selectedMask !== 'none' ? (
                    <span className="text-lg lg:text-xl">{FACE_MASK_PRESETS[selectedMask].emoji}</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 lg:w-5 lg:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  )}
                </button>

                {/* Mask Selection Menu */}
                {showMaskMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-800 dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-3 min-w-[200px] z-50">
                    <div className="text-xs text-gray-400 mb-2 px-2">Face Masks</div>
                    <div className="space-y-1">
                      {(Object.keys(FACE_MASK_PRESETS) as FaceMaskType[]).map((maskType) => (
                        <button
                          key={maskType}
                          onClick={() => {
                            setMask(maskType);
                            setShowMaskMenu(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            selectedMask === maskType
                              ? 'bg-purple-600 text-white'
                              : 'hover:bg-gray-700 text-white'
                          }`}
                        >
                          <span className="text-xl">{FACE_MASK_PRESETS[maskType].emoji}</span>
                          <span className="text-sm font-medium">{FACE_MASK_PRESETS[maskType].name}</span>
                          {selectedMask === maskType && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                    

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Actions - Mobile Responsive */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-3 lg:px-4 lg:py-4 safe-area-bottom">
          {/* Main Action Buttons - Simplified */}
          <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4 mb-3">
            {!isMatchConnected ? (
              <button
                onClick={async () => {
                  // Start camera and search directly without preview modal
                  try {
                    console.log('🎥 Starting camera before search...');
                    await startLocalVideo();
                    console.log('✅ Camera started successfully');
                    startNewChat(false);
                  } catch (error) {
                    console.error('❌ Failed to start camera:', error);
                    alert('Camera access is required for video chat. Please allow camera permissions.');
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 lg:px-8 lg:py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/50 text-sm lg:text-base touch-manipulation"
                disabled={isSearching}
              >
                {isSearching ? 'Connecting...' : 'Find Someone'}
              </button>
            ) : (
              <>
                <button
                  onClick={nextMatch}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/50 text-sm lg:text-base touch-manipulation"
                >
                  Next Person
                </button>
                
                <button
                  onClick={handleReport}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                >
                  Report
                </button>
              </>
            )}

            <button
              onClick={exitChat}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
            >
              Exit
            </button>

            <button
              onClick={blurEnabled ? handleRevealVideo : enableManualBlur}
              className={`p-3 lg:p-3.5 rounded-full border border-white/10 shadow-lg transition-colors ${
                blurEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              aria-pressed={blurEnabled}
              aria-label={blurButtonAriaLabel}
            >
              {blurEnabled ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Options - Enhanced with Purple Gradient Theme */}
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-3 space-y-2 sm:space-y-0 text-xs lg:text-sm">
            <button 
              onClick={() => setShowTextChat(!showTextChat)}
              className="group relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/50 touch-manipulation flex items-center justify-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>{showTextChat ? 'Hide Chat' : 'Show Chat'}</span>
            </button>
            <button 
              onClick={() => navigate('/chat/text')}
              className="group relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/50 touch-manipulation"
            >
              Text Only Mode
            </button>
          </div>
        </div>
      </div>

      {/* Text Chat Panel - Enhanced for Video + Chat */}
      {showTextChat && (
        <div className="absolute lg:relative inset-x-0 bottom-0 lg:inset-auto lg:w-80 bg-gray-800 bg-opacity-95 backdrop-blur-sm border-t lg:border-l lg:border-t-0 border-gray-700 flex flex-col max-h-72 lg:max-h-full shadow-lg">
          {/* Chat Header */}
          <div className="bg-gray-700 px-3 py-2 lg:px-4 lg:py-3 border-b border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm lg:text-base">Text Chat</h3>
              <button
                onClick={() => setShowTextChat(false)}
                className="text-gray-400 hover:text-white text-lg lg:text-xl touch-manipulation"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-4 lg:mt-8">
                <ChatBubbleLeftRightIcon className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 text-gray-600" />
                <p className="text-xs lg:text-sm">Start typing to chat with your partner</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-2 py-1 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm ${
                        message.isOwnMessage
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : message.content.includes('Connected!') || message.content.includes('ended') || message.content.includes('Error:')
                          ? 'bg-gray-600 text-gray-200 text-center'
                          : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      {!message.content.includes('Connected!') && !message.content.includes('ended') && !message.content.includes('Error:') && (
                        <p className={`text-xs mt-1 ${
                          message.isOwnMessage ? 'text-purple-100' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Auto-Typing Indicator (Retention Boost) */}
                {isAutoTyping && isMatchConnected && (
                  <div className="flex justify-start mb-2 animate-fade-in">
                    <div className="bg-gray-700 text-white px-4 py-2 rounded-2xl max-w-xs shadow-lg">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input - Always Available */}
          <div className="p-3 lg:p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={socketConnected ? (isMatchConnected ? "Type a message..." : "Find someone to chat") : "Connecting to server..."}
                disabled={!socketConnected || !isMatchConnected}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-sm touch-manipulation disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-300"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || !socketConnected || !isMatchConnected}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white p-2 rounded transition-all duration-300 shadow-lg hover:shadow-purple-500/50 touch-manipulation"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {socketConnected && isMatchConnected ? "Chat while video is on for silent communication" : 
               socketConnected && isSearching ? "Connecting to someone..." : 
               socketConnected ? "Find someone to start chatting" : "Connecting to server..."}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {partnerId && sessionId && user?.id && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          sessionId={sessionId}
          reportedUserId={partnerId}
          reporterUserId={user.id}
          chatMode="video"
        />
      )}

      {/* Login/Signup Modal - For Friend System */}
      {/* Inline Login Modal - No redirect, stay on video chat */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* LoginRegister component - inline */}
            <LoginRegister
              onSuccess={() => {
                console.log('✅ Login successful on video chat page');
                setShowLoginModal(false);
                // User is now logged in, can continue chatting
                addMessage('✅ Login successful! You can now add favourites.', false);
              }}
            />
          </div>
        </div>
      )}

      {/* Preview Modal - Optional camera preview before matching */}
      {showPreview && (
        <PreviewModal
          onStart={handlePreviewStart}
          onCancel={handlePreviewCancel}
        />
      )}

      {/* Audio-Only Mode Banner */}
      {isMatchConnected && isAudioOnly && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-orange-500 border-2 border-orange-600 rounded-lg shadow-2xl p-4 animate-slide-down">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">Audio-Only Mode</h3>
                <p className="text-white text-xs mt-1 opacity-90">
                  Video unavailable. You're connected in audio-only mode. The connection may improve shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;