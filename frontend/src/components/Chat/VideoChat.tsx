import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import WebRTCService from '../../services/webrtc';
import { 
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSlashIcon } from '@heroicons/react/24/solid';

interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
}

const VideoChat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected: socketConnected, connecting: socketConnecting } = useSocket();
  const { updateUser } = useAuth();
  const webRTCRef = useRef<WebRTCService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // Track local stream for mic control
  
  // Track latest state values for event handlers (prevent stale closures)
  const isMatchConnectedRef = useRef(false);
  const partnerIdRef = useRef<string>('');
  const currentStateRef = useRef<'disconnected' | 'finding' | 'connected'>('disconnected');
  const sessionIdRef = useRef<string | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false); // Renamed for clarity - this is for match connection
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Track camera facing mode
  const [cameraBlocked, setCameraBlocked] = useState(false);
  // const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>(''); // Track partner user ID
  const [currentState, setCurrentState] = useState<'disconnected' | 'finding' | 'connected'>('disconnected'); // Track chat state
  const [showTextChat, setShowTextChat] = useState(true); // Default show for better UX
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Sync refs with state values to avoid stale closures
  useEffect(() => {
    isMatchConnectedRef.current = isMatchConnected;
    partnerIdRef.current = partnerId;
    currentStateRef.current = currentState;
    sessionIdRef.current = sessionId;
  }, [isMatchConnected, partnerId, currentState, sessionId]);

  // Handle window resize for responsive video aspect ratio
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define reusable remote stream handler
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log('📺 Remote stream received:', {
      video: stream.getVideoTracks().length > 0,
      audio: stream.getAudioTracks().length > 0,
      tracks: stream.getTracks().length,
      id: stream.id
    });
    
    if (remoteVideoRef.current) {
      // Always set the remote stream
      remoteVideoRef.current.srcObject = stream;
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
  }, []);

  useEffect(() => {
    // Initialize WebRTC service without socket (we'll use the context socket)
    webRTCRef.current = new WebRTCService();
    
    // Set up remote video stream handler (works for both initial and reconnections)
    webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);

    webRTCRef.current.onConnectionStateChanged((state: RTCPeerConnectionState) => {
      console.log('🔌 WebRTC Connection State Changed:', state);
      
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log('⚠️ WebRTC connection lost, triggering reconnection...');
        console.log('Current state (from refs):', { 
          isMatchConnected: isMatchConnectedRef.current, 
          sessionId: sessionIdRef.current 
        });
        
        // Only trigger auto-search if we were actually connected (use refs for latest state)
        if (isMatchConnectedRef.current && sessionIdRef.current) {
          setIsMatchConnected(false);
          setCurrentState('finding');
          setIsSearching(true);
          
          // Clear remote video with proper cleanup
          if (remoteVideoRef.current) {
            // Stop all tracks first
            if (remoteVideoRef.current.srcObject) {
              const stream = remoteVideoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
            }
            // CRITICAL: Pause video, clear srcObject, and force reload
            remoteVideoRef.current.pause();
            remoteVideoRef.current.srcObject = null;
            remoteVideoRef.current.load(); // Force video element to reset
          }
          
          // Auto-search for new partner
          addMessage('Connection lost. Finding someone new...', false);
          setTimeout(() => {
            if (socket && socket.connected) {
              console.log('🔍 Auto-searching after WebRTC disconnect...');
              socket.emit('find_match', { mode: 'video' });
            }
          }, 1000);
        }
      } else if (state === 'connected') {
        setIsMatchConnected(true);
        setCurrentState('connected');
      }
    });

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
        
        // Update user coins and chat counts from backend
        if (data.coins !== undefined) {
          updateUser({ 
            coins: data.coins,
            totalChats: data.totalChats || 0,
            dailyChats: data.dailyChats || 0
          });
          console.log(`💰 Updated user: coins=${data.coins}, totalChats=${data.totalChats}, dailyChats=${data.dailyChats}`);
        }
        
        setSessionId(data.sessionId);
        setPartnerId(data.matchUserId); // Set partner ID
        setCurrentState('connected'); // Set state to connected
        setIsSearching(false);
        setMessages([]);
        // Match found - no system message needed
        
        // Configure WebRTC service with match details
        if (webRTCRef.current) {
          // ENSURE FRESH SETUP: Cleanup any previous connection first
          console.log('🔄 Ensuring fresh WebRTC setup for reconnection');
          webRTCRef.current.cleanup();
          
          // REINITIALIZE: Create fresh WebRTC instance for clean setup
          webRTCRef.current = new WebRTCService();
          
          // CRITICAL: Set remote video callback on NEW instance
          webRTCRef.current.onRemoteStreamReceived(handleRemoteStream);
          
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
      
      // Clean up video elements with proper reset
      if (localVideoRef.current) {
        if (localVideoRef.current.srcObject) {
          localVideoRef.current.pause();
          localVideoRef.current.srcObject = null;
          localVideoRef.current.load();
        }
      }
      
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject) {
          const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
          remoteStream.getTracks().forEach(track => track.stop());
          remoteVideoRef.current.pause();
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.load();
        }
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

      socket.on('connect_error', (error) => {
        console.error('🚨 Socket connection error:', error);
        console.error('Connection error: ' + error.message);
      });

      // Debug specific events
      socket.on('match-found', (data) => {
        console.log('🎯 MATCH-FOUND EVENT RECEIVED:', data);
      });

      socket.on('searching', (data) => {
        console.log('🔍 SEARCHING EVENT RECEIVED:', data);
      });

      socket.on('error', (data) => {
        console.log('🚨 ERROR EVENT RECEIVED:', data);
      });

      // Handle multi-device connection replacement
      socket.on('connection_replaced', (data) => {
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
  }, [socket]);

  const startLocalVideo = async () => {
    try {
      const isMobile = windowWidth < 768;
      const constraints = {
        video: {
          width: { ideal: isMobile ? 480 : 640, max: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 640 : 480, max: isMobile ? 720 : 720 },
          facingMode: facingMode, // Use current facing mode state
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('🎥 Requesting user media with constraints:', constraints);
      const stream = await webRTCRef.current?.initializeMedia(constraints);
      
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream; // Store stream reference for mic control
        setCameraBlocked(false);
        console.log('✅ Local video stream set to video element');
        
        // Apply current mic state to audio track (important for fresh stream after Next Person)
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = isMicOn;
          console.log('🎤 Applied mic state to fresh stream:', { isMicOn, trackEnabled: audioTrack.enabled });
        }
        
        // Ensure video plays
        try {
          await localVideoRef.current.play();
        } catch (playError) {
          console.warn('Auto-play prevented, user interaction needed');
        }
      }
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
    setIsMicOn(true); // CRITICAL: Reset mic to ON for next match (AudioChat pattern)
    setIsCameraOn(true); // Reset camera to ON for next match
    console.log('🔄 State reset for new connection - Mic and Camera ON');
    
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
    console.log('🔄 Next Person clicked - using force cleanup for fresh reconnect');
    
    // Use startNewChat with force cleanup for same users reconnection
    startNewChat(true);
  };

  const exitChat = () => {
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
    
    // Navigate to home
    navigate('/');
  };

  const toggleCamera = () => {
    const newState = webRTCRef.current?.toggleVideo();
    setIsCameraOn(newState || false);
  };

  const toggleMic = () => {
    console.log('🎤 MIC TOGGLE: Current state =', isMicOn);
    
    // Check if we have a valid local stream
    if (!localStreamRef.current) {
      console.error('❌ No local stream available for mic toggle');
      return;
    }
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack && audioTrack.readyState === 'live') {
      // Direct toggle based on UI state for consistency
      const newState = !isMicOn;
      audioTrack.enabled = newState;
      
      // Update WebRTC senders to propagate mic state
      if (webRTCRef.current) {
        // Get peer connection and update audio senders
        const pc = (webRTCRef.current as any).peerConnection;
        if (pc) {
          const senders = pc.getSenders();
          senders.forEach((sender: RTCRtpSender) => {
            if (sender.track?.kind === 'audio') {
              sender.track.enabled = newState;
              console.log('🔄 Updated audio sender:', sender.track.id, 'enabled:', newState);
            }
          });
        }
      }
      
      // Update UI state
      setIsMicOn(newState);
      
      console.log('✅ Mic toggle:', {
        newState,
        trackEnabled: audioTrack.enabled,
        trackId: audioTrack.id
      });
      
    } else {
      console.error('❌ Audio track not available:', {
        trackExists: !!audioTrack,
        readyState: audioTrack?.readyState
      });
    }
  };

  const switchCamera = async () => {
    console.log('📷 CAMERA SWITCH: Current facing mode =', facingMode);
    
    try {
      // Toggle facing mode
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);
      
      // Stop current video track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          console.log('🛑 Stopped current video track');
        }
      }
      
      // Get new stream with switched camera
      const isMobile = windowWidth < 768;
      const constraints = {
        video: {
          width: { ideal: isMobile ? 480 : 640, max: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 640 : 480, max: isMobile ? 720 : 720 },
          facingMode: newFacingMode,
          frameRate: { ideal: 15, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('🎥 Requesting new stream with facingMode:', newFacingMode);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        await localVideoRef.current.play();
      }
      
      // Update stream reference
      const oldAudioTrack = localStreamRef.current?.getAudioTracks()[0];
      localStreamRef.current = newStream;
      
      // Apply mic state to audio track
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (newAudioTrack && oldAudioTrack) {
        newAudioTrack.enabled = oldAudioTrack.enabled;
      }
      
      // Update WebRTC peer connection with new video track
      if (webRTCRef.current && isMatchConnected) {
        const pc = (webRTCRef.current as any).peerConnection;
        if (pc) {
          const newVideoTrack = newStream.getVideoTracks()[0];
          const senders = pc.getSenders();
          const videoSender = senders.find((sender: RTCRtpSender) => sender.track?.kind === 'video');
          
          if (videoSender && newVideoTrack) {
            await videoSender.replaceTrack(newVideoTrack);
            console.log('✅ Replaced video track in peer connection');
          }
        }
      }
      
      console.log('✅ Camera switched to:', newFacingMode);
      
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
      // Revert facing mode on error
      setFacingMode(facingMode);
      addMessage('Failed to switch camera. Please try again.', false);
    }
  };

  const sendMessage = () => {
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleReport = () => {
    if (sessionId) {
      socket?.emit('report_user', {
        sessionId,
        reason: 'Inappropriate behavior',
        description: 'Reported from video chat'
      });
    }
    nextMatch();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col lg:flex-row">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Enhanced Header with logo - matching AudioChat theme */}
        <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
          <div className="flex items-center gap-4">
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
            

          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
              socketConnected && isMatchConnected ? 'bg-green-400' : 
              socketConnected && isSearching ? 'bg-yellow-400' : 
              socketConnecting ? 'bg-orange-400' :
              socketConnected ? 'bg-blue-400' : 'bg-red-400'
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
          <div className="w-full h-full relative">
            {isMatchConnected ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover lg:object-contain xl:object-contain"
                />
                
                {/* Omegoo Watermark - Floating with animation */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black bg-opacity-40 backdrop-blur-sm px-3 py-2 rounded-xl border border-white border-opacity-20 animate-pulse">
                  <img 
                    src="/logo512.png" 
                    alt="Omegoo" 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm object-cover opacity-90"
                  />
                  <span className="text-white text-sm sm:text-base font-bold tracking-wider opacity-90 drop-shadow-lg">
                    Omegoo
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 p-4">
                {isSearching ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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

          {/* Local Video - Mobile vertical, PC horizontal */}
          <div className="absolute bottom-20 right-2 lg:bottom-4 lg:right-4 xl:bottom-6 xl:right-6">
            <div className={`bg-gray-800 rounded-lg border-2 border-white border-opacity-30 overflow-hidden shadow-2xl ${
              windowWidth < 768 ? 'w-20 h-28' : 'w-32 h-24 sm:w-36 sm:h-27 md:w-32 md:h-24 lg:w-56 lg:h-40 xl:w-64 xl:h-48'
            }`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  transform: 'scaleX(-1)',
                  width: '100%',
                  height: '100%'
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

              {/* Camera Switch */}
              <button
                onClick={switchCamera}
                className="p-2 lg:p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors touch-manipulation"
                title="Switch Camera"
              >
                <ArrowPathIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions - Mobile Responsive */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-3 lg:px-4 lg:py-4 safe-area-bottom">
          {/* Main Action Buttons - Simplified */}
          <div className="flex justify-center space-x-3 lg:space-x-4 mb-3">
            {!isMatchConnected ? (
              <button
                onClick={() => startNewChat()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 lg:px-8 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
                disabled={isSearching}
              >
                {isSearching ? 'Connecting...' : 'Find Someone'}
              </button>
            ) : (
              <>
                <button
                  onClick={nextMatch}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors shadow-sm text-sm lg:text-base touch-manipulation"
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
          </div>

          {/* Quick Options - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm">
            <button 
              onClick={() => setShowTextChat(!showTextChat)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation flex items-center space-x-1"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>{showTextChat ? 'Hide Chat' : 'Show Chat'}</span>
            </button>
            <button 
              onClick={() => navigate('/chat/text')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium touch-manipulation"
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
                          ? 'bg-primary-600 text-white'
                          : message.content.includes('Connected!') || message.content.includes('ended') || message.content.includes('Error:')
                          ? 'bg-gray-600 text-gray-200 text-center'
                          : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      {!message.content.includes('Connected!') && !message.content.includes('ended') && !message.content.includes('Error:') && (
                        <p className={`text-xs mt-1 ${
                          message.isOwnMessage ? 'text-primary-200' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
                placeholder={socketConnected ? (isMatchConnected ? "Type a message..." : "Find someone to chat") : "Connecting to server..."}
                disabled={!socketConnected || !isMatchConnected}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm touch-manipulation disabled:bg-gray-800 disabled:text-gray-500"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || !socketConnected || !isMatchConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded transition-colors touch-manipulation"
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
    </div>
  );
};

export default VideoChat;