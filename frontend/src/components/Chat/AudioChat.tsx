import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import WebRTCService from '../../services/webrtc';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
  PhoneXMarkIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSlashIcon } from '@heroicons/react/24/solid';
import ReportModal from './ReportModal';
import VoiceAvatarPicker from './VoiceAvatarPicker';
import { useVoiceFilter } from '../../contexts/VoiceFilterContext';
import { VOICE_FILTER_PRESETS, VoiceFilterType } from '../../types/voiceFilters';

const AudioChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting, modeUserCounts, setActiveMode } = useSocket();
  const { updateUser, user } = useAuth();
  const { selectedFilter, getProcessedStream, setFilter, adjustIntensity, intensity, performanceMetrics } = useVoiceFilter();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Core states
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false);
  const [showVoiceAvatarPicker, setShowVoiceAvatarPicker] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>(''); // Track partner user ID
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Enhanced audio states
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [micBlocked, setMicBlocked] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // Audio level 0-100
  const [remoteMicLevel, setRemoteMicLevel] = useState(0); // Remote audio level 0-100
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState({ packetLoss: 0, jitter: 0, bitrate: 0 });
  const audioOnlineCount = modeUserCounts.audio;
  
  // Voice filter states
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Swipe gesture states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState<'left' | 'right' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Audio chat has no text input, so isInputFocused is always false (no typing to block swipes)
  const isInputFocused = false;
  const lastTapTimeRef = useRef<number>(0);

  useEffect(() => {
    setActiveMode('audio');
    return () => {
      setActiveMode(null);
    };
  }, [setActiveMode]);

  // Helper function to check if swipe gestures should be enabled
  const isSwipeEnabled = useCallback(() => {
    // 🔐 Edge Case 1: Disable during typing
    if (isInputFocused) {
      console.log('🚫 Swipe disabled: User is typing');
      return false;
    }
    
    // 🔐 Edge Case 2: Disable during modal states
    if (showReportModal || showLoginModal || showFilterMenu) {
      console.log('🚫 Swipe disabled: Modal/menu is open');
      return false;
    }
    
    // 🔐 Edge Case 4: Disable during network issues
    if (!socketConnected || socketConnecting) {
      console.log('🚫 Swipe disabled: Network reconnecting');
      return false;
    }
    
    // ✅ All conditions passed
    return true;
  }, [isInputFocused, showReportModal, showLoginModal, showFilterMenu, socketConnected, socketConnecting]);

  // Debug mic state changes
  useEffect(() => {
    console.log('🎤 MIC STATE CHANGED: UI isMicOn =', isMicOn);
  }, [isMicOn]);

  // Multi-device protection on component mount
  useEffect(() => {
    const activeSession = localStorage.getItem('omegoo_audio_session');
    if (activeSession) {
      const sessionData = JSON.parse(activeSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      
      // Clear old sessions (older than 10 minutes)
      if (sessionAge > 10 * 60 * 1000) {
        localStorage.removeItem('omegoo_audio_session');
        console.log('🗑️ Cleared expired session tracking');
      } else {
        console.log('⚠️ Detected recent session from another tab/device');
      }
    }
  }, []);

  // Remote stream handler - VideoChat pattern
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log('🎤 Remote audio stream received:', {
      audio: stream.getAudioTracks().length > 0,
      tracks: stream.getTracks().length,
      id: stream.id
    });
    
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      console.log('✅ Remote audio assigned to element');
      
      // Enhanced audio playback
      remoteAudioRef.current.play().catch(error => {
        console.warn('Remote audio autoplay prevented, trying user gesture:', error);
        const playPromise = () => {
          remoteAudioRef.current?.play().catch(e => 
            console.log('Manual audio play failed:', e)
          );
        };
        document.addEventListener('click', playPromise, { once: true });
      });
      
      // Monitor remote audio level
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const remoteAnalyser = audioContext.createAnalyser();
      const remoteSource = audioContext.createMediaStreamSource(stream);
      
      remoteAnalyser.fftSize = 256;
      remoteSource.connect(remoteAnalyser);
      
      const remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount);
      
      const updateRemoteLevel = () => {
        remoteAnalyser.getByteFrequencyData(remoteDataArray);
        const average = remoteDataArray.reduce((a, b) => a + b) / remoteDataArray.length;
        const level = Math.round((average / 255) * 100);
        setRemoteMicLevel(level);
        
        if (isMatchConnected) {
          requestAnimationFrame(updateRemoteLevel);
        }
      };
      
      updateRemoteLevel();
      
      console.log('🎤 Remote audio setup completed with level monitoring');
    }
    
    setIsMatchConnected(true);
    setIsSearching(false);
  }, [isMatchConnected]);

  // Initialize audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    if (!stream) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = Math.round((average / 255) * 100);
        
        // Stabilize voice percentage - show minimum 1% when mic is on to prevent disappearing
        const stabilizedLevel = level === 0 && localStreamRef.current?.getAudioTracks()[0]?.enabled ? 1 : level;
        setMicLevel(stabilizedLevel);
      } else {
        setMicLevel(0);
      }
      animationRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }, []);

  // Stop audio level monitoring
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setMicLevel(0);
    if (analyserRef.current) {
      // Disconnect analyser if possible, but since context is local, it's fine to let GC handle
      analyserRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initialize WebRTC service
    webRTCRef.current = new WebRTCService();
    webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      console.log('Connection state:', state);
      
      // Update connection quality based on state
      if (state === 'connected') {
        setConnectionQuality('excellent');
      } else if (state === 'connecting') {
        setConnectionQuality('good');
      } else if (state === 'disconnected') {
        setIsMatchConnected(false);
        setConnectionQuality('poor');
      }
    });

    // Socket event listeners - exact VideoChat pattern
    if (socket) {
      socket.on('match-found', async (data: { 
        sessionId: string; 
        matchUserId: string; 
        isInitiator: boolean;
        coins?: number;
        totalChats?: number;
        dailyChats?: number;
      }) => {
        console.log('🎤 Audio match found:', data);
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
        setPartnerId(data.matchUserId); // Track partner ID for reporting
        setIsSearching(false);
        setCallStartTime(Date.now());
        
        if (webRTCRef.current) {
          console.log('🔄 Setting up fresh WebRTC connection');
          webRTCRef.current.cleanup();
          webRTCRef.current = new WebRTCService();
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          webRTCRef.current.setSocket(socket, data.sessionId, data.matchUserId);
          
          // Setup stats monitoring
          webRTCRef.current.onStatsUpdated((stats) => {
            setQualityMetrics({
              packetLoss: Math.round(stats.packetLoss * 10) / 10,
              jitter: Math.round(stats.jitter * 1000), // ms
              bitrate: stats.bitrate
            });
            
            // Update connection quality
            if (stats.packetLoss > 10) {
              setConnectionQuality('poor');
            } else if (stats.packetLoss > 3) {
              setConnectionQuality('good');
            } else {
              setConnectionQuality('excellent');
            }
            
            // Emit metrics to backend
            socket.emit('audio-metrics', {
              sessionId: data.sessionId,
              packetLoss: stats.packetLoss,
              jitter: stats.jitter,
              bitrate: stats.bitrate,
              roundTripTime: stats.roundTripTime,
              timestamp: Date.now()
            });
          });
          
          // Start stats monitoring
          webRTCRef.current.startStatsMonitoring(2000);
          
          try {
            await startLocalAudio();
            console.log('🎤 Local audio ready for connection');
            
            // Emit call connected event
            socket.emit('audio-metrics', {
              sessionId: data.sessionId,
              eventType: 'call_connected',
              timestamp: Date.now()
            });
          } catch (error) {
            console.error('❌ Failed to start local audio:', error);
            
            // Emit call failed event
            socket.emit('audio-metrics', {
              sessionId: data.sessionId,
              eventType: 'call_failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now()
            });
            return;
          }
          
          // Set up ICE candidate handling
          webRTCRef.current.setIceCandidateCallback((candidate: RTCIceCandidate) => {
            socket.emit('ice-candidate', {
              candidate: candidate,
              targetUserId: data.matchUserId,
              sessionId: data.sessionId
            });
          });
          
          // If we're the initiator, create and send offer - VideoChat pattern
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
              console.error('Failed to establish audio connection');
            }
          }
          
          setIsMatchConnected(true);
        }
      });

      socket.on('searching', (data: { position: number; totalWaiting: number }) => {
        console.log('🔍 Searching for audio partner:', data);
        setIsSearching(true);
      });

      socket.on('session_ended', (data: { reason?: string }) => {
        console.log('❌ Audio session ended:', data);
        
        // Enhanced cleanup for multiple device reliability
        performCompleteAudioCleanup();
        
        // Auto-search if partner left
        if (data.reason === 'partner_left' && socket) {
          setIsSearching(true);
          setTimeout(() => {
            socket.emit('find_match', { mode: 'audio' });
          }, 2000);
        }
      });

      // WebRTC signaling
      socket.on('webrtc-offer', async (data: any) => {
        console.log(' Received WebRTC offer from:', data.fromUserId);
        if (webRTCRef.current) {
          try {
            const answer = await webRTCRef.current.handleOffer(data.offer);
            socket.emit('webrtc-answer', { 
              answer, 
              targetUserId: data.fromUserId,  // ✅ Fixed: Using VideoChat pattern
              sessionId: sessionId 
            });
          } catch (error) {
            console.error('Error handling WebRTC offer:', error);
          }
        }
      });

      socket.on('webrtc-answer', async (data: any) => {
        if (webRTCRef.current) {
          await webRTCRef.current.handleAnswer(data.answer);
        }
      });

      socket.on('ice-candidate', async (data: any) => {
        if (webRTCRef.current && data.candidate) {
          await webRTCRef.current.handleIceCandidate(data.candidate);
        }
      });
      
      // Listen for peer mute status
      socket.on('audio-muted', (data: { isMuted: boolean }) => {
        console.log('🔇 Peer mute status changed:', data.isMuted);
        // Could show indicator that peer is muted
      });
    }

    // Copy refs to local variables for cleanup to avoid stale closure warnings
    const remoteAudio = remoteAudioRef.current;
    const localAudio = localAudioRef.current;

    // Cleanup on unmount
    return () => {
      socket?.off('match-found');
      socket?.off('searching');
      socket?.off('session_ended');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('ice-candidate');
      socket?.off('audio-muted');
      
      stopAudioLevelMonitoring();
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Use copied refs for cleanup
      if (remoteAudio?.srcObject) {
        const remoteStream = remoteAudio.srcObject as MediaStream;
        remoteStream.getTracks().forEach(track => track.stop());
        remoteAudio.srcObject = null;
      }
      
      if (localAudio?.srcObject) {
        const localStream = localAudio.srcObject as MediaStream;
        localStream.getTracks().forEach(track => track.stop());
        localAudio.srcObject = null;
      }
      
      if (webRTCRef.current) {
        webRTCRef.current.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, handleRemoteStream, startAudioLevelMonitoring, stopAudioLevelMonitoring]);

  // Enhanced cleanup for multiple device reliability
  const performCompleteAudioCleanup = () => {
    console.log('🧹 Performing complete audio cleanup...');
    
    // Reset states
    setIsMatchConnected(false);
    setSessionId(null);
    setIsMicOn(true); // Reset to default ON state
    
    // Stop audio monitoring
    stopAudioLevelMonitoring();
    
    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped local track:', track.id);
      });
      localStreamRef.current = null;
    }
    
    // Clean up remote audio
    if (remoteAudioRef.current) {
      if (remoteAudioRef.current.srcObject) {
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;
        remoteStream.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped remote track:', track.id);
        });
      }
      remoteAudioRef.current.srcObject = null;
    }
    
    // Clean up WebRTC
    if (webRTCRef.current) {
      webRTCRef.current.cleanup();
    }
    
    // Clear multi-device session tracking
    localStorage.removeItem('omegoo_audio_session');
    console.log('🗑️ Cleared session tracking for multi-device protection');
    
    console.log('✅ Complete audio cleanup finished');
  };

  const startLocalAudio = async () => {
    try {
      setIsProcessingAudio(true);
      setMicPermissionError(null);
      setShowPermissionModal(false);
      console.log('🎤 Initializing fresh audio stream');
      
      // CRITICAL: Stop any existing streams first for multiple device cleanup
      if (localStreamRef.current) {
        console.log('🛑 Stopping existing local audio stream');
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped existing audio track:', track.id);
        });
        localStreamRef.current = null;
      }
      
      // Enhanced audio constraints for voice optimization
      const constraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Opus-optimized settings
          sampleRate: 48000, // Opus native sample rate
          channelCount: 2, // Stereo for better quality
          latency: 0.01, // 10ms latency target
          // Additional constraints for mobile
          ...(navigator.userAgent.match(/Android|iPhone/i) && {
            noiseSuppression: { ideal: true },
            echoCancellation: { ideal: true }
          })
        }
      };
      
      // Get fresh stream via WebRTC service
      const rawStream = await webRTCRef.current!.initializeMedia(constraints);
      if (!rawStream) {
        throw new Error('Failed to initialize media via WebRTC service');
      }
      
      console.log('✅ Raw audio stream created with tracks:', rawStream.getAudioTracks().length);
      
      // Apply voice filter if selected
      let processedStream = rawStream;
      if (selectedFilter !== 'none') {
        try {
          console.log(`🎤 Applying voice filter: ${selectedFilter}`);
          processedStream = await getProcessedStream(rawStream);
          console.log('✅ Voice filter applied successfully');
        } catch (error) {
          console.error('❌ Failed to apply voice filter:', error);
          // Fallback to raw stream if filter fails
          processedStream = rawStream;
        }
      }
      
      if (processedStream && localAudioRef.current) {
        localAudioRef.current.srcObject = processedStream;
        localStreamRef.current = processedStream;
        
        // Start audio level monitoring
        startAudioLevelMonitoring(processedStream);
        
        // Log detailed audio track info for debugging
        const audioTracks = processedStream.getAudioTracks();
        console.log('✅ Enhanced local audio initialized with tracks:', audioTracks.length);
        audioTracks.forEach((track, index) => {
          console.log(`🎤 Local audio track ${index}:`, {
            id: track.id,
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings()
          });
        });
        
        // Initialize UI mic to ON state (tracks are enabled by default)
        const firstTrack = audioTracks[0];
        setIsMicOn(true);
        setMicBlocked(false);
        console.log('🎤 INITIALIZATION: Stream ready, UI set to ON, first track enabled =', firstTrack?.enabled);
        
        // Emit success event to backend
        if (socket && sessionId) {
          socket.emit('audio-metrics', {
            sessionId,
            eventType: 'mic_permission_granted',
            timestamp: Date.now()
          });
        }
        
        setIsProcessingAudio(false);
        return processedStream;
      }
      
      throw new Error('Failed to initialize audio stream');
    } catch (error: any) {
      setIsProcessingAudio(false);
      console.error('❌ Enhanced audio setup failed:', error);
      setMicBlocked(true);
      
      // Comprehensive error handling
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        const errorMsg = 'Microphone access denied. Please allow microphone permission to use voice chat.';
        setMicPermissionError(errorMsg);
        setShowPermissionModal(true);
        
        // Emit error event to backend
        if (socket) {
          socket.emit('audio-metrics', {
            sessionId: sessionId || 'unknown',
            eventType: 'mic_permission_denied',
            timestamp: Date.now(),
            error: error.name
          });
        }
        
        console.error('🚫 Microphone permission denied by user');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        const errorMsg = 'No microphone found. Please connect a microphone device.';
        setMicPermissionError(errorMsg);
        setShowPermissionModal(true);
        console.error('🚫 No microphone device found');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        const errorMsg = 'Microphone is already in use by another application. Please close other apps using the microphone.';
        setMicPermissionError(errorMsg);
        setShowPermissionModal(true);
        console.error('🚫 Microphone already in use');
      } else {
        const errorMsg = `Failed to access microphone: ${error.message}`;
        setMicPermissionError(errorMsg);
        setShowPermissionModal(true);
      }
      
      throw error;
    }
  };

  // VideoChat pattern: Complete session management with force cleanup
  const startNewChat = (forceCleanup = false) => {
    if (!socket) {
      console.error('❌ Socket not available');
      return;
    }
    
    if (!socketConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    // MULTI-DEVICE PROTECTION: Check if user has active session in another tab/device
    const activeSession = localStorage.getItem('omegoo_audio_session');
    if (activeSession && !forceCleanup) {
      const sessionData = JSON.parse(activeSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      
      // If session is less than 5 minutes old, warn user
      if (sessionAge < 5 * 60 * 1000) {
        console.log('⚠️ Active audio session detected in another tab/device');
        const shouldContinue = window.confirm(
          'You seem to have an active voice chat in another tab or device. Continue anyway? This will end your previous session.'
        );
        
        if (!shouldContinue) {
          return;
        }
      }
    }
    
    // Store current session attempt
    localStorage.setItem('omegoo_audio_session', JSON.stringify({
      timestamp: Date.now(),
      userId: socket.id
    }));
    
    // INSTANT DISCONNECT: End current session first if exists
    if (sessionId && isMatchConnected) {
      console.log('🔚 Ending current audio session immediately:', sessionId);
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
      console.log('🧹 Force cleaning audio streams for fresh reconnect');
      
      // Clean local audio
      stopAudioLevelMonitoring();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log('🛑 Stopping local audio track:', track.kind);
          track.stop();
        });
        localStreamRef.current = null;
      }
      if (localAudioRef.current?.srcObject) {
        localAudioRef.current.srcObject = null;
      }
      
      // Clean remote audio
      if (remoteAudioRef.current?.srcObject) {
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;  
        remoteStream.getTracks().forEach(track => {
          console.log('🛑 Stopping remote audio track:', track.kind);
          track.stop();
        });
        remoteAudioRef.current.srcObject = null;
      }
      
      // Force WebRTC cleanup
      if (webRTCRef.current) {
        console.log('🔌 Force disconnecting WebRTC for fresh audio connection');
        webRTCRef.current.forceDisconnect();
      }
      
      console.log('✅ Force cleanup completed for fresh audio reconnect');
      
      // REINITIALIZE WebRTC after cleanup for fresh connection
      setTimeout(() => {
        if (webRTCRef.current) {
          console.log('🔄 Reinitializing WebRTC service after audio cleanup');
          webRTCRef.current = new WebRTCService();
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          console.log('✅ Fresh WebRTC instance created for audio');
        }
      }, 100);
    }
    
    // INSTANT STATE RESET including mic state
    setIsMatchConnected(false);
    setSessionId(null);
    setIsSearching(true);
    setIsMicOn(true);
    console.log('🔄 State reset for new audio connection - Mic UI ON');
    
    // START NEW SEARCH (with delay if force cleanup)
    const searchDelay = forceCleanup ? 200 : 0;
    setTimeout(() => {
      console.log('🔍 Starting search for new audio partner');
      socket.emit('find_match', { mode: 'audio' });
      console.log('✅ New audio partner search started');
    }, searchDelay);
  };

  const nextMatch = () => {
    console.log('🔄 Next Person clicked - using force cleanup for fresh audio reconnect');
    
    // Use startNewChat with force cleanup for same users reconnection
    startNewChat(true);
  };

  const handleReport = () => {
    if (partnerId && sessionId) {
      setShowReportModal(true);
    } else {
      alert('No active session to report');
    }
  };

  const exitChat = () => {
    // Clean up current session
    if (sessionId) {
      socket?.emit('end_session', { sessionId });
    }
    
    // Clean up streams and WebRTC
    stopAudioLevelMonitoring();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localAudioRef.current?.srcObject) {
      localAudioRef.current.srcObject = null;
    }
    if (remoteAudioRef.current?.srcObject) {
      const remoteStream = remoteAudioRef.current.srcObject as MediaStream;
      remoteStream.getTracks().forEach(track => track.stop());
      remoteAudioRef.current.srcObject = null;
    }
    if (webRTCRef.current) {
      webRTCRef.current.forceDisconnect();
    }
    
    // Clear multi-device session tracking on exit
    localStorage.removeItem('omegoo_audio_session');
    setActiveMode(null);
    
    navigate('/');
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
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
    
    // Double tap detection
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      handleDoubleTap();
      lastTapTimeRef.current = 0; // Reset after double tap
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    
    // 🔐 Edge Case 3: If multi-touch started, abort swipe
    if (e.touches.length > 1) {
      console.log('🔍 Multi-touch during move - canceling swipe');
      resetSwipeState();
      return;
    }
    
    // 🔐 Check if swipes are still enabled
    if (!isSwipeEnabled()) {
      resetSwipeState();
      return;
    }
    
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
      e.preventDefault(); // Prevent scrolling during swipe
      setSwipeOffset(diffX);
      
      // Show hints when swipe reaches threshold
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
    // 🔐 Final check before executing swipe action
    if (!isSwipeEnabled()) {
      console.log('🚫 Swipe action blocked by edge case protection');
      resetSwipeState();
      return;
    }
    
    // Trigger actions based on swipe distance
    if (swipeOffset < -150) {
      // Swipe left = Next person
      nextMatch();
    } else if (swipeOffset > 150) {
      // Swipe right = Add friend (placeholder)
      handleAddFriend();
    }
    
    resetSwipeState();
  };

  const handleDoubleTap = () => {
    if (!isMatchConnected || !sessionId) return;
    
    // Show like animation
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1500);
    
    // Send like event via socket
    if (socket) {
      socket.emit('send_like', {
        sessionId,
        timestamp: Date.now()
      });
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
      
      console.log('✅ Favourite request sent!');
    }
  };

  const resetSwipeState = () => {
    setTouchStartX(null);
    setTouchStartY(null);
    setSwipeOffset(0);
    setShowSwipeHint(null);
  };

  const toggleMic = () => {
    console.log('🎤 MIC TOGGLE: Current state =', isMicOn);
    
    // Safety checks for multiple device scenarios
    if (!isMatchConnected || isProcessingAudio) {
      console.log('⚠️ Mic toggle ignored - not ready');
      return;
    }
    
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack && audioTrack.readyState === 'live') {
        // Direct toggle based on UI state for consistency
        const newState = !isMicOn;
        audioTrack.enabled = newState;
        
        // Update WebRTC senders
        if (webRTCRef.current) {
          webRTCRef.current.updateAudioSenders(newState);
        }
        
        // Update UI state
        setIsMicOn(newState);
        
        // Notify peer about mute status
        if (socket && sessionId) {
          socket.emit('audio-muted', {
            sessionId,
            isMuted: !newState,
            timestamp: Date.now()
          });
        }
        
        console.log('✅ Mic toggle:', {
          newState,
          trackEnabled: audioTrack.enabled,
          trackId: audioTrack.id,
          notifiedPeer: true
        });
        
      } else {
        console.error('❌ Audio track not available:', {
          trackExists: !!audioTrack,
          readyState: audioTrack?.readyState
        });
        
        // Attempt recovery for dead tracks
        if (!audioTrack || audioTrack.readyState !== 'live') {
          console.log('🔄 Attempting audio recovery...');
          startLocalAudio().catch(console.error);
        }
      }
    } else {
      console.error('❌ No local stream available for mic toggle');
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      console.log('🔊 SPEAKER TOGGLE: Current state =', isSpeakerOn);
      
      // Simple toggle logic
      const newSpeakerState = !isSpeakerOn;
      
      // Apply mute state (speaker OFF = muted = true)
      remoteAudioRef.current.muted = !newSpeakerState;
      
      // Update UI state
      setIsSpeakerOn(newSpeakerState);
      
      console.log('🔊 SPEAKER TOGGLE COMPLETE:', {
        oldSpeakerState: isSpeakerOn,
        newSpeakerState: newSpeakerState,
        audioElementMuted: remoteAudioRef.current.muted,
        audioVolume: remoteAudioRef.current.volume
      });
      
      // Verify remote audio stream
      if (remoteAudioRef.current.srcObject) {
        const remoteStream = remoteAudioRef.current.srcObject as MediaStream;
        const audioTracks = remoteStream.getAudioTracks();
        console.log('🔊 Remote audio verification: tracks =', audioTracks.length, 'first track enabled =', audioTracks[0]?.enabled);
      } else {
        console.warn('🔊 No remote audio stream found for speaker verification');
      }
    } else {
      console.error('❌ Remote audio element not available for speaker toggle');
    }
  };

  // Connection quality indicator with details
  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getQualityBadgeColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'bg-green-500/20 border-green-400/30 text-green-100';
      case 'good': return 'bg-yellow-500/20 border-yellow-400/30 text-yellow-100';
      case 'poor': return 'bg-red-500/20 border-red-400/30 text-red-100';
      default: return 'bg-gray-500/20 border-gray-400/30 text-gray-100';
    }
  };

  // Loading states
  if (socketConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Connecting to server...</div>
        </div>
      </div>
    );
  }

  if (!socketConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="text-white text-center">
          <div className="text-xl mb-4">Connection Error</div>
          <div className="text-gray-300">Please check your internet connection and refresh.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      {/* Enhanced Header with status moved to side */}
      <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <MicrophoneIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Voice Chat</span>
            <span className="sm:hidden">Voice</span>
          </h1>
          
          {/* Status indicator moved to side */}
          {isSearching && (
            <span className="bg-yellow-500 px-2 py-1 rounded-full text-black text-sm font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Searching</span>
              <span className="sm:hidden">•••</span>
            </span>
          )}
          {isMatchConnected && (
            <span className="bg-green-500 px-2 py-1 rounded-full text-black text-sm font-medium flex items-center gap-1">
              <SignalIcon className={`w-3 h-3 ${getQualityColor()}`} />
              <span className="hidden sm:inline">Connected</span>
              <span className="sm:hidden">ON</span>
            </span>
          )}

          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-xs text-green-100 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {audioOnlineCount} online
          </div>
        </div>
        
        <button
          onClick={exitChat}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Audio Area - Enhanced for mobile with swipe gestures */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSwipeState}
        style={{
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        
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
        
        {/* Idle State */}
        {!isSearching && !isMatchConnected && (
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-6 sm:mb-8">
              <MicrophoneIcon className="w-20 h-20 sm:w-32 sm:h-32 mx-auto opacity-50" />
            </div>
            <h2 className="text-2xl sm:text-3xl mb-4 font-semibold">Ready for Voice Chat</h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              Connect instantly with people worldwide through high-quality voice conversations
            </p>
            <button
              onClick={() => setShowVoiceAvatarPicker(true)}
              disabled={!socketConnected || isProcessingAudio}
              className="w-full sm:w-auto btn-primary disabled:from-gray-600 disabled:to-gray-600 px-8 py-4 rounded-xl text-lg sm:text-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed shadow-lg"
            >
              {isProcessingAudio ? 'Initializing...' : (!socketConnected ? 'Connecting...' : 'Find Someone')}
            </button>
          </div>
        )}

        {/* Searching State - Enhanced */}
        {isSearching && (
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative">
                {/* Animated rings */}
                <div className="absolute inset-0 border-4 border-purple-300 border-opacity-20 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border-4 border-red-400 border-opacity-40 rounded-full animate-ping [animation-delay:200ms]"></div>
                <div className="absolute inset-4 border-4 border-red-500 border-opacity-60 rounded-full animate-ping [animation-delay:400ms]"></div>
                <MicrophoneIcon className="w-8 h-8 sm:w-12 sm:h-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl mb-4">Finding someone to talk to...</h2>
            <p className="text-gray-300 text-sm sm:text-base">Connecting you with another person for a voice conversation</p>
          </div>
        )}

        {/* Connected State - Enhanced with audio visualizer */}
        {isMatchConnected && (
          <div className="text-center max-w-md mx-auto w-full">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#16a34a' }}>
                <MicrophoneIcon className="w-10 h-10 sm:w-16 sm:h-16 text-white z-10" />
                
                {/* Audio level indicator */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-30 transition-all duration-150 ease-in-out"
                  style={{ height: `${Math.min(micLevel, 100)}%` }}
                />
              </div>
              
              {/* Mic level text */}
              {isMicOn && micLevel > 0 && (
                <div className="text-xs sm:text-sm text-gray-300 mt-2">
                  Audio Level: {micLevel}%
                </div>
              )}
            </div>
            
            <h2 className="text-xl sm:text-2xl mb-2 font-semibold">Connected!</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base flex items-center gap-2 justify-center">
              You're now in a voice conversation with a stranger
              {/* Remote peer speaking indicator */}
              {remoteMicLevel > 15 && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <span className="animate-pulse">🎤</span>
                  <span>Speaking</span>
                </span>
              )}
            </p>
            
            {/* Connection Quality Badge */}
            {isMatchConnected && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm mb-4 ${getQualityBadgeColor()}`}>
                <SignalIcon className="w-4 h-4" />
                <span className="font-medium capitalize">{connectionQuality}</span>
                {qualityMetrics.bitrate > 0 && (
                  <span className="text-xs opacity-80">• {qualityMetrics.bitrate} kbps</span>
                )}
              </div>
            )}
            
            {/* Quality Metrics (Debug Info - can be hidden) */}
            {isMatchConnected && process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mb-4 space-y-1">
                <div>Packet Loss: {qualityMetrics.packetLoss.toFixed(1)}%</div>
                <div>Jitter: {qualityMetrics.jitter}ms</div>
                {callStartTime && (
                  <div>Duration: {Math.floor((Date.now() - callStartTime) / 1000)}s</div>
                )}
              </div>
            )}
            
            {/* Compact Audio Controls */}
            <div className="flex gap-4 justify-center mb-6 sm:mb-8">
              <button
                onClick={toggleMic}
                disabled={!isMatchConnected || isProcessingAudio}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isMicOn 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } shadow-md`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? (
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                ) : (
                  <MicrophoneSlashIcon className="w-6 h-6 text-white" />
                )}
              </button>
              
              <button
                onClick={toggleSpeaker}
                disabled={!isMatchConnected}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSpeakerOn 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } shadow-md`}
                title={isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              >
                {isSpeakerOn ? (
                  <SpeakerWaveIcon className="w-6 h-6 text-white" />
                ) : (
                  <SpeakerXMarkIcon className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* Voice Filter Control */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  disabled={!isMatchConnected}
                  className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md relative`}
                  style={{ backgroundColor: selectedFilter !== 'none' ? 'var(--primary-brand)' : '#374151' }}
                  title="Voice Filter"
                >
                  {selectedFilter !== 'none' ? (
                    <span className="text-2xl">{VOICE_FILTER_PRESETS[selectedFilter].emoji}</span>
                  ) : (
                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-white" />
                  )}
                  {performanceMetrics && performanceMetrics.cpuUsage > 15 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-gray-900"></span>
                  )}
                </button>
                
                {/* Filter Menu Dropdown */}
                {showFilterMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-xl shadow-2xl p-4 w-72 z-50 border border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-white">Voice Filter</h3>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Filter Options */}
                    <div className="space-y-2 mb-4">
                      {(Object.keys(VOICE_FILTER_PRESETS) as VoiceFilterType[]).map((filterType) => {
                        const preset = VOICE_FILTER_PRESETS[filterType];
                        return (
                          <button
                            key={filterType}
                            onClick={() => {
                              setFilter(filterType);
                              if (filterType === 'none') {
                                setShowFilterMenu(false);
                              }
                            }}
                            className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                              selectedFilter === filterType
                                ? `bg-gradient-to-r ${preset.color} text-white`
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                          >
                            <span className="text-2xl">{preset.emoji}</span>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-xs opacity-75">{preset.description}</div>
                            </div>
                            {selectedFilter === filterType && (
                              <span className="text-green-400">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Intensity Slider (only if filter active) */}
                    {selectedFilter !== 'none' && (
                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Intensity</span>
                          <span className="text-sm font-medium text-white">{Math.round(intensity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={VOICE_FILTER_PRESETS[selectedFilter].minIntensity}
                          max={VOICE_FILTER_PRESETS[selectedFilter].maxIntensity}
                          step="0.05"
                          value={intensity}
                          onChange={(e) => adjustIntensity(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Subtle</span>
                          <span>Strong</span>
                        </div>
                      </div>
                    )}
                    
                    {/* CPU Warning */}
                    {performanceMetrics && performanceMetrics.cpuUsage > 15 && (
                      <div className="mt-3 p-2 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-400 text-xs">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          <span>High CPU: {Math.round(performanceMetrics.cpuUsage)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Voice Filter Active Badge */}
            {selectedFilter !== 'none' && (
              <div className="mb-4 flex justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${VOICE_FILTER_PRESETS[selectedFilter].color} text-white text-sm font-medium shadow-lg`}>
                  <span className="text-lg">{VOICE_FILTER_PRESETS[selectedFilter].emoji}</span>
                  <span>{VOICE_FILTER_PRESETS[selectedFilter].name} Active</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={nextMatch}
                disabled={isProcessingAudio}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-6 py-3 rounded-xl transition-colors font-medium disabled:cursor-not-allowed"
              >
                Next Person
              </button>
              <button
                onClick={handleReport}
                disabled={!isMatchConnected}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium disabled:cursor-not-allowed"
                title="Report User"
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                Report
              </button>
              <button
                onClick={exitChat}
                className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <PhoneXMarkIcon className="w-5 h-5" />
                End Chat
              </button>
            </div>
          </div>
        )}

        {/* Hidden audio elements */}
        <audio ref={localAudioRef} muted autoPlay playsInline />
        <audio ref={remoteAudioRef} autoPlay playsInline />
      </div>

      {/* Enhanced Microphone Permission Modal */}
      {showPermissionModal && micPermissionError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
            <div className="text-center">
              <MicrophoneSlashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Microphone Issue</h3>
              <p className="text-gray-300 mb-6">
                {micPermissionError}
              </p>
              <div className="bg-gray-700 p-4 rounded-lg text-left mb-6">
                <p className="text-sm text-gray-300 mb-2 font-semibold">How to fix:</p>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li>Click the lock/info icon in your browser's address bar</li>
                  <li>Allow microphone access for this site</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setShowPermissionModal(false);
                    setMicPermissionError(null);
                    try {
                      await startLocalAudio();
                    } catch (error) {
                      console.error('Retry failed:', error);
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setMicPermissionError(null);
                    exitChat();
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Microphone blocked modal */}
      {micBlocked && !showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
            <div className="text-center">
              <MicrophoneSlashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Microphone Access Required</h3>
              <p className="text-gray-300 mb-6">
                Voice chat needs access to your microphone. Please allow microphone access in your browser settings and try again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMicBlocked(false);
                    startNewChat();
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={exitChat}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && user && (
        <ReportModal
          isOpen={showReportModal}
          sessionId={sessionId || ''}
          reportedUserId={partnerId}
          reporterUserId={user.id}
          chatMode="audio"
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Login/Signup Modal - For Friend System */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} className="rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
              <p className="text-gray-300 text-sm">
                You need to be logged in to add friends and access social features
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="text-2xl">👥</div>
                <span>Send friend requests and build your network</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="text-2xl">💬</div>
                <span>Chat with your friends anytime</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="text-2xl">⭐</div>
                <span>Save your favorite connections</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/');
                }}
                className="flex-1 btn-primary py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Login / Sign Up
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Avatar Picker Modal */}
      <VoiceAvatarPicker
        isOpen={showVoiceAvatarPicker}
        onClose={() => setShowVoiceAvatarPicker(false)}
        onConfirm={() => {
          setShowVoiceAvatarPicker(false);
          startNewChat(false);
        }}
      />
    </div>
  );
};

export default AudioChat;