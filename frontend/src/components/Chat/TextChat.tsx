import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { 
  PaperAirplaneIcon,
  // ArrowPathIcon, // Reserved for reconnect button
  ExclamationTriangleIcon, // For report button
  XMarkIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftRightIcon,
  SignalIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import ReportModal from './ReportModal';
import VideoUpgradeModal from './VideoUpgradeModal';
import VideoUpgradeService from '../../services/videoUpgrade';
import WebRTCService from '../../services/webrtc';
import { guestAPI } from '../../services/api';

const enableDebugLogs = process.env.REACT_APP_TEXTCHAT_DEBUG === 'true';
const debugLog = (...args: any[]) => {
  if (enableDebugLogs) {
    console.log(...args);
  }
};
const debugWarn = (...args: any[]) => {
  if (enableDebugLogs) {
    console.warn(...args);
  }
};

interface Message {
  id: string;
  content: string;
  isOwnMessage: boolean;
  timestamp: Date;
  replyTo?: {
    id: string;
    content: string;
    isOwnMessage: boolean;
  };
  // Translation metadata
  translatedContent?: string;
  sourceLang?: string;
  showingOriginal?: boolean;
}

const TextChat: React.FC = () => {
  const navigate = useNavigate();
  const { 
    socket, 
    connected: socketConnected, 
    connecting: socketConnecting, 
    modeUserCounts, 
    setActiveMode,
    videoUpgradeState,
    sendVideoRequest,
    acceptVideoRequest,
    declineVideoRequest,
    sendVideoUpgradeSignaling,
    resetVideoUpgradeState
  } = useSocket();
  const { user } = useAuth();
  const { preferredLanguage, autoTranslateEnabled, translateMessage } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // State refs to avoid stale closures in event handlers
  const isMatchConnectedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const partnerIdRef = useRef<string>('');
  
  // Finding timeout mechanism to prevent stuck state
  const findingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const findingRetryCountRef = useRef<number>(0);
  const MAX_FINDING_RETRIES = 3;
  const FINDING_TIMEOUT_MS = 30000; // 30 seconds
  
  // Core states - following AudioChat pattern
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchConnected, setIsMatchConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>(''); // Track partner user ID
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Text chat specific states
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  // Translation states
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());
  
  // Topic Dice states
  const [showTopicDiceModal, setShowTopicDiceModal] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  
  // Reply feature states
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Video upgrade states
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  // Auto-typing indicator states (for retention boost)
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<number>(Date.now());
  
  // Connection quality state (reserved for future implementation)
  // const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const textOnlineCount = modeUserCounts.text * 3; // 3x multiplier for retention psychology

  useEffect(() => {
    setActiveMode('text');
    return () => {
      setActiveMode(null);
    };
  }, [setActiveMode]);

  // Sync refs with state values to avoid stale closures
  useEffect(() => {
    isMatchConnectedRef.current = isMatchConnected;
    sessionIdRef.current = sessionId;
    partnerIdRef.current = partnerId;
  }, [isMatchConnected, sessionId, partnerId]);

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
      debugLog('💭 4 seconds of inactivity - showing auto-typing indicator');
      setIsAutoTyping(true);
      
      // Auto-typing will turn off after 2.5 seconds
      autoTypingTimerRef.current = setTimeout(() => {
        debugLog('⏰ Auto-typing indicator duration ended');
        setIsAutoTyping(false);
        
        // Restart the cycle if still no message
        if (isMatchConnected && Date.now() - lastMessageTimeRef.current > 6500) {
          startInactivityTimer();
        }
      }, 2500);
    }, 4000);
  }, [isMatchConnected]);
  
  const cancelAutoTyping = useCallback(() => {
    debugLog('🚫 Canceling auto-typing (real activity detected)');
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

  // Start auto-typing timer when match connects
  useEffect(() => {
    if (isMatchConnected) {
      debugLog('✅ Match connected - starting auto-typing timer system');
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

  // Mobile viewport handling - prevent keyboard from covering input
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const chatContainer = document.querySelector('.text-chat-main') as HTMLElement;
        if (chatContainer) {
          chatContainer.style.height = `${viewport.height}px`;
        }
        // Scroll to bottom when keyboard opens
        setTimeout(scrollToBottom, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Auto-translate incoming messages if enabled
  const handleAutoTranslate = useCallback(async (message: Message) => {
    if (!autoTranslateEnabled || message.isOwnMessage) {
      return;
    }

    setTranslatingMessages(prev => new Set(prev).add(message.id));

    try {
      const translated = await translateMessage(message.id, message.content, preferredLanguage);
      
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, translatedContent: translated, sourceLang: 'auto', showingOriginal: false }
          : msg
      ));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setTranslatingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  }, [autoTranslateEnabled, preferredLanguage, translateMessage]);

  // Toggle between original and translated
  const toggleTranslation = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showingOriginal: !msg.showingOriginal }
        : msg
    ));
  }, []);

  // Add message helper function
  const addMessage = useCallback((content: string, isOwnMessage: boolean, replyTo?: Message['replyTo']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isOwnMessage,
      timestamp: new Date(),
      ...(replyTo && { replyTo })
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-translate if enabled and it's a partner message
    if (autoTranslateEnabled && !isOwnMessage) {
      handleAutoTranslate(newMessage);
    }
  }, [autoTranslateEnabled, handleAutoTranslate]);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      content,
      isOwnMessage: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // Finding timeout helpers to prevent stuck state (defined after addSystemMessage)
  const startFindingTimeout = useCallback(() => {
    console.log('⏰ [TextChat] Starting finding timeout (30s)');
    
    // Clear any existing timeout
    if (findingTimeoutRef.current) {
      clearTimeout(findingTimeoutRef.current);
    }
    
    findingTimeoutRef.current = setTimeout(() => {
      console.warn('⏰ [TextChat] Finding timeout reached! Attempting retry...');
      findingRetryCountRef.current += 1;
      
      if (findingRetryCountRef.current >= MAX_FINDING_RETRIES) {
        console.error('❌ [TextChat] Max finding retries reached. Resetting.');
        setIsSearching(false);
        findingRetryCountRef.current = 0;
        addSystemMessage('Unable to find a match. Please try again.');
        return;
      }
      
      // Retry finding match
      if (socket && socketConnected) {
        console.log(`🔄 [TextChat] Retry ${findingRetryCountRef.current}/${MAX_FINDING_RETRIES}: Re-emitting join_text_queue`);
        addSystemMessage(`Retrying... (${findingRetryCountRef.current}/${MAX_FINDING_RETRIES})`);
        socket.emit('join_text_queue');
        startFindingTimeout(); // Restart timeout for retry
      } else {
        console.error('❌ [TextChat] Socket not connected for retry');
        setIsSearching(false);
        findingRetryCountRef.current = 0;
      }
    }, FINDING_TIMEOUT_MS);
  }, [socket, socketConnected, addSystemMessage]);

  const clearFindingTimeout = useCallback(() => {
    if (findingTimeoutRef.current) {
      console.log('✅ [TextChat] Clearing finding timeout');
      clearTimeout(findingTimeoutRef.current);
      findingTimeoutRef.current = null;
    }
    findingRetryCountRef.current = 0; // Reset retry count on successful match
  }, []);

  // Main socket event listeners - ultra-fast text chat events
  useEffect(() => {
    if (!socket) return;

    // Text queue joined
    socket.on('text_queue_joined', (data: { position: number; estimatedWaitTime: number }) => {
      debugLog('💬 Joined text queue:', data);
      setIsSearching(true);
      
      // Start finding timeout to prevent stuck state
      startFindingTimeout();
    });

    // Text match found - ultra-fast pairing
    socket.on('text_match_found', async (data: { 
      roomId: string; 
      partnerId: string;
    }) => {
      try {
        debugLog('✅ Text match found:', data);
        
        setSessionId(data.roomId);
        setPartnerId(data.partnerId);
        setIsSearching(false);
        setMessages([]);
        setIsMatchConnected(true);
        
        // Clear finding timeout since match was found
        clearFindingTimeout();
        
        addSystemMessage('Connected! Say hello to your new friend.');
      } catch (error) {
        console.error('❌ Error handling text_match_found event:', error);
        addSystemMessage('Connection established but some data may be outdated.');
      }
    });

    // Text message received
    socket.on('text_message_received', (data: { 
      messageId: string;
      senderId: string; 
      content: string; 
      timestamp: number;
      roomId: string;
    }) => {
      try {
        debugLog('📝 Text message received:', data);
        
        if (data.roomId === sessionId) {
          if (!data.content || typeof data.content !== 'string') {
            console.error('Invalid message content received:', data);
            return;
          }
          
          // Determine if own message
          const isOwn = data.senderId === user?.id || data.senderId === user?.deviceId;
          
          addMessage(data.content, isOwn);
          
          // Clear partner typing if they sent message
          if (!isOwn) {
            setPartnerTyping(false);
            // 🔄 Reset auto-typing timer (partner sent a message)
            resetMessageTimer();
          }
        }
      } catch (error) {
        console.error('❌ Error handling text_message_received event:', error);
      }
    });

    // Partner typing indicators
    socket.on('text_partner_typing', () => {
      debugLog('⌨️ Partner started typing');
      setPartnerTyping(true);
      // 🚫 Cancel auto-typing when real typing detected
      cancelAutoTyping();
    });

    socket.on('text_partner_stopped_typing', () => {
      debugLog('⌨️ Partner stopped typing');
      setPartnerTyping(false);
      // 🔄 Restart timer after they stop typing
      if (isMatchConnected) {
        startInactivityTimer();
      }
    });

    // Room ended
    socket.on('text_room_ended', (data: { reason?: string; upgradeSessionId?: string }) => {
      try {
        debugLog('❌ Text room ended:', data);
        
        // If room ended due to video upgrade, don't show error message
        if (data.reason === 'video_upgrade') {
          console.log('✅ Text room ended due to video upgrade - this is expected');
          setIsMatchConnected(false);
          setSessionId(null);
          setPartnerTyping(false);
          return; // Don't show system message for successful upgrade
        }
        
        // Reset state
        setIsMatchConnected(false);
        setSessionId(null);
        setPartnerTyping(false);
        
        const reasonMessages: Record<string, string> = {
          user_left: 'You left the chat',
          partner_left: 'Partner left the chat',
          partner_disconnected: 'Partner disconnected',
          timeout: 'Chat timed out due to inactivity'
        };
        
        addSystemMessage(reasonMessages[data.reason || ''] || 'Chat ended');
        
        // Auto-rejoin if partner left or disconnected (not if user left)
        if (socket && socketConnected && (data.reason === 'partner_left' || data.reason === 'partner_disconnected')) {
          console.log('🔄 [TextChat] Auto-rejoining queue after partner left...');
          setTimeout(() => {
            if (socket && socketConnected && !isMatchConnectedRef.current) {
              addSystemMessage('Finding you a new match...');
              socket.emit('join_text_queue');
              setIsSearching(true);
              startFindingTimeout();
            }
          }, 500); // Small delay to ensure state is clean
        }
      } catch (error) {
        console.error('❌ Error handling text_room_ended event:', error);
        setIsMatchConnected(false);
        setSessionId(null);
      }
    });

    // Rate limit exceeded
    socket.on('rate_limit_exceeded', (data: { message: string; remaining: number }) => {
      debugWarn('⚠️ Rate limit exceeded:', data);
      addSystemMessage('⚠️ Slow down! Too many messages.');
    });

    // Text chat error
    socket.on('text_chat_error', (data: { message: string }) => {
      console.error('❌ Text chat error:', data);
      addSystemMessage(`Error: ${data.message}`);
    });

    // Video upgrade response handler - Redirect to VideoChat on accept
    socket.on('video_response', (data: { accept: boolean; sessionId: string; from: string; reason?: string }) => {
      console.log('📹 Video upgrade response received:', data);
      
      if (data.accept) {
        console.log('✅ Video upgrade accepted! Redirecting to VideoChat...');
        // Log analytics
        console.log('📊 Analytics: video_upgrade_accepted', { sessionId: data.sessionId, from: data.from });
        addSystemMessage('Video upgrade accepted! Connecting...');
        
        // Cleanup text chat before navigating
        console.log('🧹 Cleaning up text chat before video upgrade...');
        
        // Leave text room
        if (sessionId && socket) {
          socket.emit('leave_text_room', { roomId: sessionId });
        }
        
        // Reset local state
        setIsMatchConnected(false);
        setPartnerTyping(false);
        setMessageInput('');
        
        // Clear timers
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        if (autoTypingTimerRef.current) {
          clearTimeout(autoTypingTimerRef.current);
        }
        clearFindingTimeout();
        
        console.log('✅ Text chat cleanup completed');
        
        // Navigate to VideoChat with upgrade session
        setTimeout(() => {
          navigate('/chat/video', { 
            state: { 
              upgradeSessionId: data.sessionId,
              fromTextChat: true,
              partnerId: data.from
            } 
          });
        }, 500); // Small delay for user to see message
      } else {
        console.log('❌ Video upgrade declined:', data.reason);
        // Log analytics
        console.log('📊 Analytics: video_upgrade_declined', { sessionId: data.sessionId, reason: data.reason });
        const declineMessage = data.reason === 'reported' 
          ? 'Partner declined and reported the video request'
          : 'Partner declined the video request';
        addSystemMessage(declineMessage);
        resetVideoUpgradeState();
      }
    });

    // Handle match retry (if partner has insufficient coins or other issues)
    socket.on('match-retry', (data: { message: string }) => {
      console.log('🔄 [TextChat] Match retry:', data.message);
      addSystemMessage(data.message || 'Searching for another partner...');
      setIsSearching(true);
      
      // Restart finding timeout for retry
      startFindingTimeout();
    });

    // Handle insufficient coins error
    socket.on('insufficient-coins', (data: { required: number; current: number; message: string }) => {
      console.warn('💰 [TextChat] Insufficient coins:', data);
      setIsSearching(false);
      clearFindingTimeout();
      
      const errorMsg = `Not enough coins to start chat. Need ${data.required} but have ${data.current}. Daily refill at 12 AM.`;
      addSystemMessage(errorMsg);
      alert(errorMsg);
    });

    // Cleanup on unmount
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Clear finding timeout
      clearFindingTimeout();
      
      socket?.off('text_queue_joined');
      socket?.off('text_match_found');
      socket?.off('text_message_received');
      socket?.off('text_partner_typing');
      socket?.off('text_partner_stopped_typing');
      socket?.off('text_room_ended');
      socket?.off('rate_limit_exceeded');
      socket?.off('text_chat_error');
      socket?.off('video_response');
      socket?.off('match-retry');
      socket?.off('insufficient-coins');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId, addMessage, addSystemMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (partnerTyping) {
      scrollToBottom();
    }
  }, [partnerTyping]);

  // Multi-device protection on component mount (like AudioChat)
  useEffect(() => {
    const activeSession = localStorage.getItem('omegoo_text_session');
    if (activeSession) {
      const sessionData = JSON.parse(activeSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      
      // Clear old sessions (older than 10 minutes)
      if (sessionAge > 10 * 60 * 1000) {
        localStorage.removeItem('omegoo_text_session');
  debugLog('🗑️ Cleared expired text session tracking');
      } else {
  debugWarn('⚠️ Detected recent text session from another tab/device');
      }
    }
  }, []);

  // Video upgrade - WebRTC signaling handlers
  useEffect(() => {
    if (!socket) return;

    // Handle incoming video upgrade offer
    const handleUpgradeOffer = async (data: { from: string; sessionId: string; sdp: string; timestamp: number }) => {
      try {
        debugLog('📹 Received video upgrade offer:', data);
        
        if (!webrtcServiceRef.current) {
          debugWarn('⚠️ No WebRTC service available for video upgrade');
          return;
        }

        // Handle the offer and get answer
        const onIceCandidate = (candidate: RTCIceCandidate) => {
          sendVideoUpgradeSignaling('upgrade_ice_candidate', {
            to: data.from,
            sessionId: data.sessionId,
            candidate,
            timestamp: Date.now()
          });
        };

        const answer = await VideoUpgradeService.handleUpgradeOffer(
          webrtcServiceRef.current,
          { type: 'offer', sdp: data.sdp },
          onIceCandidate
        );

        // Get local stream and set it to state
        const webrtc = webrtcServiceRef.current as any;
        const pc = webrtc.peerConnection;
        if (pc) {
          const senders = pc.getSenders();
          const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            const stream = new MediaStream([videoSender.track]);
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }

        // Send answer back
        sendVideoUpgradeSignaling('upgrade_answer', {
          to: data.from,
          sessionId: data.sessionId,
          sdp: answer.sdp,
          timestamp: Date.now()
        });

        debugLog('✅ Sent video upgrade answer');
      } catch (error) {
        console.error('❌ Error handling video upgrade offer:', error);
        addSystemMessage('Failed to accept video upgrade');
      }
    };

    // Handle incoming video upgrade answer
    const handleUpgradeAnswer = async (data: { from: string; sessionId: string; sdp: string; timestamp: number }) => {
      try {
        debugLog('📹 Received video upgrade answer:', data);
        
        if (!webrtcServiceRef.current) {
          debugWarn('⚠️ No WebRTC service available for video upgrade');
          return;
        }

        await VideoUpgradeService.handleUpgradeAnswer(
          webrtcServiceRef.current,
          { type: 'answer', sdp: data.sdp }
        );

        setIsVideoMode(true);
        debugLog('✅ Video upgrade completed successfully');
      } catch (error) {
        console.error('❌ Error handling video upgrade answer:', error);
        addSystemMessage('Failed to complete video upgrade');
      }
    };

    // Handle incoming ICE candidates
    const handleUpgradeIceCandidate = async (data: { from: string; sessionId: string; candidate: RTCIceCandidateInit; timestamp: number }) => {
      try {
        debugLog('📹 Received video upgrade ICE candidate:', data);
        
        if (!webrtcServiceRef.current) {
          debugWarn('⚠️ No WebRTC service available for video upgrade');
          return;
        }

        await VideoUpgradeService.handleUpgradeIceCandidate(
          webrtcServiceRef.current,
          data.candidate
        );
      } catch (error) {
        console.error('❌ Error handling video upgrade ICE candidate:', error);
      }
    };

    socket.on('upgrade_offer', handleUpgradeOffer);
    socket.on('upgrade_answer', handleUpgradeAnswer);
    socket.on('upgrade_ice_candidate', handleUpgradeIceCandidate);

    return () => {
      socket.off('upgrade_offer', handleUpgradeOffer);
      socket.off('upgrade_answer', handleUpgradeAnswer);
      socket.off('upgrade_ice_candidate', handleUpgradeIceCandidate);
    };
  }, [socket, sendVideoUpgradeSignaling, addSystemMessage]);

  // Video upgrade - Initiate upgrade when accepted (as initiator)
  useEffect(() => {
    const initiateVideoUpgrade = async () => {
      try {
        if (
          videoUpgradeState.status !== 'accepted' ||
          !videoUpgradeState.initiator ||
          !videoUpgradeState.sessionId ||
          !videoUpgradeState.remoteUserId
        ) {
          return;
        }

        debugLog('📹 Initiating video upgrade as initiator...');

        // Create WebRTC service if not exists
        if (!webrtcServiceRef.current) {
          debugLog('📹 Creating new WebRTC service for video upgrade');
          webrtcServiceRef.current = new WebRTCService();
        }

        // ICE candidate callback
        const onIceCandidate = (candidate: RTCIceCandidate) => {
          sendVideoUpgradeSignaling('upgrade_ice_candidate', {
            to: videoUpgradeState.remoteUserId!,
            sessionId: videoUpgradeState.sessionId!,
            candidate,
            timestamp: Date.now()
          });
        };

        // Start video upgrade
        const offer = await VideoUpgradeService.upgradeToVideo(
          webrtcServiceRef.current,
          onIceCandidate
        );

        // Get local stream and set it to state
        const webrtc = webrtcServiceRef.current as any;
        const pc = webrtc.peerConnection;
        if (pc) {
          const senders = pc.getSenders();
          const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            const stream = new MediaStream([videoSender.track]);
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }

        // Send offer to partner
        sendVideoUpgradeSignaling('upgrade_offer', {
          to: videoUpgradeState.remoteUserId,
          sessionId: videoUpgradeState.sessionId,
          sdp: offer.sdp,
          timestamp: Date.now()
        });

        setIsVideoMode(true);
        debugLog('✅ Video upgrade initiated successfully');
      } catch (error: any) {
        console.error('❌ Error initiating video upgrade:', error);
        
        let errorMessage = 'Failed to start video';
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is in use by another application.';
        }
        
        addSystemMessage(errorMessage);
      }
    };

    initiateVideoUpgrade();
  }, [videoUpgradeState, sendVideoUpgradeSignaling, addSystemMessage]);

  // Video upgrade - Handle remote stream
  useEffect(() => {
    if (!webrtcServiceRef.current) return;

    const handleRemoteStream = (stream: MediaStream) => {
      debugLog('📹 Received remote video stream');
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Listen for track events
    const webrtc = webrtcServiceRef.current as any;
    const pc = webrtc.peerConnection;
    
    if (pc) {
      pc.ontrack = (event: RTCTrackEvent) => {
        debugLog('📹 Received track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          handleRemoteStream(event.streams[0]);
        }
      };
    }

    return () => {
      if (pc) {
        pc.ontrack = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  // Enhanced session management - following AudioChat pattern
  // Reserved for future use in connection recovery scenarios
  // const performCompleteCleanup = () => {
  //   console.log('🧹 Performing complete text chat cleanup...');
  //   
  //   // Reset states
  //   setIsMatchConnected(false);
  //   setSessionId(null);
  //   setMessages([]);
  //   setPartnerTyping(false);
  //   setIsTyping(false);
  //   
  //   // Clear multi-device session tracking
  //   localStorage.removeItem('omegoo_text_session');
  //   console.log('🗑️ Cleared text session tracking for multi-device protection');
  //   
  //   console.log('✅ Complete text chat cleanup finished');
  // };

  // Start new chat - following AudioChat pattern
  const startNewChat = (forceCleanup = false) => {
    try {
      if (!socket) {
        console.error('❌ Socket not available');
        addSystemMessage('Connection error. Please refresh the page.');
        return;
      }
      
      if (!socketConnected) {
        console.error('❌ Socket not connected');
        addSystemMessage('Not connected to server. Please check your internet.');
        return;
      }

      // MULTI-DEVICE PROTECTION: Check if user has active session in another tab/device
      const activeSession = localStorage.getItem('omegoo_text_session');
      if (activeSession && !forceCleanup) {
        try {
          const sessionData = JSON.parse(activeSession);
          const sessionAge = Date.now() - sessionData.timestamp;
          
          // If session is less than 5 minutes old, warn user
          if (sessionAge < 5 * 60 * 1000) {
            debugWarn('⚠️ Active text session detected in another tab/device');
            const shouldContinue = window.confirm(
              'You seem to have an active text chat in another tab or device. Continue anyway? This will end your previous session.'
            );
            
            if (!shouldContinue) {
              return;
            }
          }
        } catch (parseError) {
          console.error('Error parsing session data:', parseError);
          // Continue anyway if parsing fails
        }
      }
      
      // Store current session attempt
      try {
        localStorage.setItem('omegoo_text_session', JSON.stringify({
          timestamp: Date.now(),
          userId: socket.id
        }));
      } catch (storageError) {
  debugWarn('Failed to store session in localStorage:', storageError);
        // Continue anyway
      }

      // INSTANT DISCONNECT: End current session first if exists
      if (sessionId && isMatchConnected) {
  debugLog('🔚 Ending current text session immediately:', sessionId);
        socket.emit('leave_text_room');
      }
      
      // INSTANT STATE RESET
      setIsMatchConnected(false);
      setSessionId(null);
      setIsSearching(true);
      setMessages([]);
      setPartnerTyping(false);
      setReplyingTo(null); // Clear reply state
  debugLog('🔄 State reset for new text chat connection');
      
      // START NEW SEARCH
      setTimeout(() => {
        if (socket && socketConnected) {
          debugLog('🔍 Starting search for new text chat partner');
          debugLog('Socket ID:', socket.id, 'User ID:', user?.id);
          socket.emit('join_text_queue');
          debugLog('✅ join_text_queue event emitted successfully');
          
          // Start finding timeout to prevent stuck state
          startFindingTimeout();
        } else {
          console.error('❌ Cannot start search - socket not available or not connected');
          addSystemMessage('Connection error. Please refresh the page.');
          setIsSearching(false);
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error in startNewChat:', error);
      addSystemMessage('Failed to start new chat. Please try again.');
      setIsSearching(false);
    }
  };

  const nextMatch = () => {
  debugLog('🔄 Next Person clicked - starting fresh text chat');
    startNewChat(true);
  };

  const handleReport = () => {
    try {
      if (!partnerId || !sessionId) {
  debugWarn('Cannot report: missing partner or session', {
          hasPartnerId: !!partnerId,
          hasSessionId: !!sessionId
        });
        alert('No active session to report');
        return;
      }
      setShowReportModal(true);
    } catch (error) {
      console.error('❌ Error opening report modal:', error);
      alert('Failed to open report. Please try again.');
    }
  };

  const exitChat = () => {
    try {
      // Clean up current session
      if (sessionId && socket) {
        socket.emit('leave_text_room');
      }
      
      // Clear multi-device session tracking on exit
      try {
        localStorage.removeItem('omegoo_text_session');
      } catch (storageError) {
  debugWarn('Failed to clear session from localStorage:', storageError);
      }
      setActiveMode(null);
      
      navigate('/');
    } catch (error) {
      console.error('❌ Error exiting chat:', error);
      // Navigate anyway
      navigate('/');
    }
  };

  const adjustInputHeight = useCallback(() => {
    if (!inputRef.current) {
      return;
    }
    const element = inputRef.current;
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 140) + 'px';
  }, []);

  // Get random topic dice prompt
  const getTopicPrompt = useCallback(async (category?: 'fun' | 'safe' | 'deep' | 'flirty') => {
    setLoadingPrompt(true);
    setShowTopicDiceModal(false);
    
    try {
      console.log('🎲 Fetching topic dice prompt...', { category, language: preferredLanguage });
      const response = await guestAPI.getTopicDice(category, preferredLanguage);
      console.log('🎲 Topic dice response:', response);
      
      if (response && response.success && response.data && response.data.prompt) {
        // Insert prompt into message input with typing animation effect
        const prompt = response.data.prompt;
        console.log('✅ Topic dice prompt received:', prompt);
        setMessageInput(prompt);
        
        // Focus input and adjust height
        if (inputRef.current) {
          inputRef.current.focus();
          requestAnimationFrame(() => adjustInputHeight());
        }
      } else {
        console.error('❌ Invalid topic dice response:', response);
        addSystemMessage('Failed to get conversation starter. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Error getting topic prompt:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      addSystemMessage('Failed to get conversation starter. Please try again.');
    } finally {
      setLoadingPrompt(false);
    }
  }, [preferredLanguage, addSystemMessage, adjustInputHeight]);

  const sendMessage = () => {
    try {
      if (!messageInput.trim() || !isMatchConnected || !sessionId) {
        console.warn('Cannot send message: missing requirements', {
          hasInput: !!messageInput.trim(),
          isConnected: isMatchConnected,
          hasSession: !!sessionId
        });
        return;
      }
      
      if (!socket) {
        console.error('❌ Socket not available for sending message');
        return;
      }
      
      const content = messageInput.trim();
      
      // Prepare reply data if replying to a message
      const replyData = replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        isOwnMessage: replyingTo.isOwnMessage
      } : undefined;
      
      console.log('📤 SENDING MESSAGE:', {
        content,
        hasReply: !!replyData,
        replyData,
        replyingTo
      });
      
      addMessage(content, true, replyData);
      
      // Send message to backend - matching AudioChat pattern
      socket.emit('send_text_message', {
        content
      });
      
      console.log('✅ Message sent');
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
  setMessageInput('');
      setIsTyping(false);
      setReplyingTo(null); // Clear reply state

  // Reset height after clearing input
  requestAnimationFrame(() => adjustInputHeight());
      
      // Stop typing indicator
      socket.emit('text_typing_stop', {});
      console.log('📤 SENT typing_stop after message sent');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Show user-friendly error
      addSystemMessage('Failed to send message. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const value = e.target.value;
      setMessageInput(value);
      adjustInputHeight();
      
      console.log('⌨️ Input changed:', { value, currentlyTyping: isTyping, hasSession: !!sessionId });
      
      if (!socket || !sessionId) {
        console.warn('⚠️ No socket or session for typing indicator');
        return;
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Start typing indicator when user starts typing
      if (value.length > 0) {
        if (!isTyping) {
          setIsTyping(true);
          socket.emit('text_typing_start', {});
          console.log('📤 SENT typing_start to backend');
        }
        
        // Auto-stop typing after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          socket.emit('text_typing_stop', {});
          console.log('📤 SENT typing_stop to backend (timeout)');
        }, 2000);
      } else {
        // Stop typing indicator when input is cleared
        if (isTyping) {
          setIsTyping(false);
          socket.emit('text_typing_stop', {});
          console.log('📤 SENT typing_stop to backend (cleared input)');
        }
      }
    } catch (error) {
      console.error('❌ Error handling input change:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Connection quality helper (reserved for future implementation)
  // const getConnectionQualityColor = () => {
  //   switch (connectionQuality) {
  //     case 'excellent': return 'text-green-400';
  //     case 'good': return 'text-yellow-400';
  //     case 'poor': return 'text-red-400';
  //     default: return 'text-gray-400';
  //   }
  // };

  return (
    <>
      <style>
        {`
          .textchat-input {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .textchat-input::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      {/* Enhanced Header with AudioChat styling */}
      <div className="bg-black bg-opacity-20 p-4 flex justify-between items-center border-b border-white border-opacity-20">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Text Chat</span>
            <span className="sm:hidden">Chat</span>
          </h1>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <SignalIcon className="w-4 h-4 text-gray-400" />
            <div className={`w-2 h-2 rounded-full ${
              isMatchConnected ? 'bg-green-400' : 
              isSearching ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-xs text-gray-300 hidden sm:block">
              {isMatchConnected ? 'Connected' : isSearching ? 'Searching...' : 'Disconnected'}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs animate-pulse" style={{ backgroundColor: 'rgba(255, 71, 87, 0.15)', border: '1px solid rgba(255, 71, 87, 0.3)', color: 'white' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {textOnlineCount} online
          </div>
        </div>
        
        <button
          onClick={exitChat}
          className="text-gray-300 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content - Following AudioChat Layout */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        
        {/* Searching State */}
        {isSearching && !isMatchConnected && (
          <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl flex flex-col bg-black bg-opacity-20 rounded-t-lg sm:rounded-t-xl backdrop-blur-sm border border-white border-opacity-20 mx-2 sm:mx-4" 
               style={{ height: 'calc(100vh - 140px)', minHeight: '500px', maxHeight: '800px' }}>

            {/* Search Content */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <div className="text-center max-w-xs sm:max-w-md">
                <div className="mb-6 sm:mb-8">
                  <div className="relative mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20">
                    <div className="animate-spin rounded-full h-full w-full border-3 sm:border-4 border-t-transparent" style={{ borderColor: 'var(--primary-brand)' }}></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-full w-full border-2 opacity-20" style={{ borderColor: 'var(--primary-brand)' }}></div>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">Finding someone for you...</h3>
                  <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 px-2">
                    Please wait while we connect you with another person
                  </p>
                </div>
                
                <div className="bg-black bg-opacity-30 rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-white border-opacity-10">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 text-yellow-400 mb-2 sm:mb-3">
                    <div className="animate-bounce w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
                    <div className="animate-bounce w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                    <div className="animate-bounce w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">Looking for text chat partner...</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface - When Connected */}
        {isMatchConnected && (
          <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl flex flex-col bg-black bg-opacity-20 rounded-t-lg sm:rounded-t-xl backdrop-blur-sm border border-white border-opacity-20 mx-2 sm:mx-4" 
               style={{ height: 'calc(100vh - 140px)', minHeight: '500px', maxHeight: '800px' }}>
            
            {/* Chat Header - FIXED at top */}
            <div className="p-3 sm:p-4 border-b border-white border-opacity-20 flex-shrink-0">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Chat</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      !socketConnected 
                        ? 'bg-red-500 animate-pulse'
                        : isSearching 
                        ? 'bg-yellow-500 animate-pulse' 
                        : isMatchConnected 
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-500'
                    }`}></div>
                    <span className={`text-xs sm:text-sm font-medium transition-colors ${
                      !socketConnected 
                        ? 'text-red-400'
                        : isSearching 
                        ? 'text-yellow-400' 
                        : isMatchConnected 
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}>
                      {!socketConnected 
                        ? 'Disconnected'
                        : isSearching 
                        ? 'Searching...' 
                        : isMatchConnected 
                        ? 'Connected'
                        : 'Ready'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {isMatchConnected && (
                <div className="flex gap-2 sm:gap-3 mb-2">
                  <button
                    onClick={nextMatch}
                    disabled={!isMatchConnected}
                    className="flex-1 btn-primary text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">🔄 Next Person</span>
                    <span className="sm:hidden">🔄 Next</span>
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!isMatchConnected}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-500 disabled:to-gray-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 font-medium disabled:cursor-not-allowed text-xs sm:text-sm shadow-lg hover:shadow-yellow-500/25"
                    title="Report User"
                  >
                    <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Report</span>
                    <span className="sm:hidden">⚠️</span>
                  </button>
                  <button
                    onClick={exitChat}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-medium text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1 sm:gap-2"
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                  >
                    <PhoneXMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">End Chat</span>
                    <span className="sm:hidden">End</span>
                  </button>
                </div>
              )}
              
              <p className="text-gray-300 text-xs sm:text-sm opacity-80 px-1">
                {isMatchConnected ? "You're chatting with a stranger" : "Ready to start chatting"}
              </p>
            </div>

            {/* Messages Area - Scrollable Middle Section */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent pb-10 sm:pb-12">
              {/* Empty State */}
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400 px-4">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 opacity-40" />
                    <p className="text-base sm:text-lg font-medium mb-2">Start your conversation!</p>
                    <p className="text-xs sm:text-sm opacity-70">Send a message to begin chatting</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => {
                const isSwiping = swipingMessageId === message.id;
                const isHovered = hoveredMessageId === message.id;
                const transform = isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)';
                const transition = isSwiping ? 'none' : 'transform 0.3s ease-out';
                const isSystemMessage = message.content.includes('Connected!') || message.content.includes('left the chat');
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 sm:mb-2 px-1 sm:px-0 group`}
                    onMouseEnter={() => !isSystemMessage && setHoveredMessageId(message.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div className="relative flex items-center gap-2">
                      {/* Desktop Reply Button - Shows on Hover */}
                      {/* Own messages: left side | Partner messages: right side */}
                      {!isSystemMessage && isHovered && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔄 Reply button clicked for message:', message);
                            setReplyingTo(message);
                          }}
                          className={`absolute ${message.isOwnMessage ? '-left-10' : '-right-10'} top-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-500 bg-opacity-80 hover:bg-opacity-100 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 z-10`}
                          title="Reply to this message"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}
                      
                      <div
                        className={`${!isSystemMessage ? (message.isOwnMessage ? 'ml-5 sm:ml-12' : 'mr-5 sm:mr-12') : ''} px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm ${!isSystemMessage ? 'cursor-pointer hover:shadow-lg' : ''} ${
                          message.isOwnMessage
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-md'
                            : isSystemMessage
                            ? 'bg-yellow-600 bg-opacity-20 text-yellow-200 border border-yellow-600 border-opacity-30 text-center w-full rounded-xl cursor-default'
                            : 'bg-white bg-opacity-10 text-white rounded-bl-md backdrop-blur-sm'
                        } ${isHovered && !isSystemMessage ? 'ring-2 ring-purple-400 ring-opacity-50 scale-[1.02] transition-all duration-200' : 'transition-all duration-200'}`}
                        style={{
                          transform,
                          transition,
                          ...(isSystemMessage
                            ? {}
                            : {
                                maxWidth: 'min(320px, 85%)',
                                width: 'fit-content',
                                minWidth: '0',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'normal',
                                overflowWrap: 'break-word'
                              })
                        }}
                        onClick={(e) => {
                          // Desktop click to reply (double-click or single click on desktop)
                          if (!isSystemMessage) {
                            console.log('💬 Message clicked for reply:', message);
                            console.log('📱 Screen width:', window.innerWidth);
                            setReplyingTo(message);
                          }
                        }}
                        onTouchStart={(e) => {
                          try {
                            // Mobile swipe to reply
                            if (!isSystemMessage) {
                              if (e.touches && e.touches[0]) {
                                setSwipeStartX(e.touches[0].clientX);
                                setSwipingMessageId(message.id);
                              }
                            }
                          } catch (error) {
                            console.error('Touch start error:', error);
                          }
                        }}
                        onTouchMove={(e) => {
                          try {
                            if (swipeStartX !== null && swipingMessageId === message.id) {
                              if (e.touches && e.touches[0]) {
                                const currentX = e.touches[0].clientX;
                                const diff = currentX - swipeStartX;
                                // Only allow right swipe (positive offset)
                                if (diff > 0) {
                                  setSwipeOffset(Math.min(diff, 100)); // Cap at 100px
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Touch move error:', error);
                            // Reset swipe state on error
                            setSwipeStartX(null);
                            setSwipingMessageId(null);
                            setSwipeOffset(0);
                          }
                        }}
                        onTouchEnd={() => {
                          try {
                            if (swipeOffset > 60) { // Threshold: 60px
                              setReplyingTo(message);
                            }
                          } catch (error) {
                            console.error('Touch end error:', error);
                          } finally {
                            // Always reset swipe state with smooth animation
                            setSwipeStartX(null);
                            setSwipingMessageId(null);
                            setSwipeOffset(0);
                          }
                        }}
                      >
                        {/* Reply context - Shows which message this is replying to */}
                        {message.replyTo && (
                          <div className="mb-2 pb-2 border-l-4 border-purple-400 pl-2 bg-black bg-opacity-30 rounded p-2 cursor-pointer hover:bg-opacity-40 transition-all">
                            <p className="text-xs font-semibold opacity-90 mb-1">
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              {message.replyTo.isOwnMessage ? 'You' : 'Stranger'}
                            </p>
                            <p className="text-xs opacity-80 line-clamp-2">
                              {message.replyTo.content.length > 100 
                                ? message.replyTo.content.substring(0, 100) + '...' 
                                : message.replyTo.content}
                            </p>
                          </div>
                        )}
                        
                        {/* Translation badge - Shows when message is translated */}
                        {message.translatedContent && !message.showingOriginal && (
                          <div className="mb-2 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500 bg-opacity-30 rounded-full text-xs text-purple-200">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              Translated
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTranslation(message.id);
                              }}
                              className="text-xs text-purple-300 hover:text-purple-100 underline"
                            >
                              View Original
                            </button>
                          </div>
                        )}
                        
                        {/* Show original badge when viewing original of translated message */}
                        {message.translatedContent && message.showingOriginal && (
                          <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500 bg-opacity-30 rounded-full text-xs text-gray-200">
                              Original Message
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTranslation(message.id);
                              }}
                              className="text-xs text-purple-300 hover:text-purple-100 underline"
                            >
                              View Translation
                            </button>
                          </div>
                        )}
                        
                        {/* Message content - shows translated or original based on state */}
                        <p className="text-xs sm:text-sm leading-5 whitespace-pre-wrap">
                          {translatingMessages.has(message.id) ? (
                            <span className="inline-flex items-center gap-2 text-purple-300">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Translating...
                            </span>
                          ) : message.translatedContent && !message.showingOriginal ? (
                            message.translatedContent
                          ) : (
                            message.content
                          )}
                        </p>
                        <div className={`text-xs mt-1 sm:mt-2 flex items-center gap-1 ${
                          message.isOwnMessage ? 'text-purple-200' : 'text-gray-300'
                        }`}>
                          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Auto-typing indicator - Shows after 4s of inactivity to boost retention */}
              {isAutoTyping && isMatchConnected && !partnerTyping && (
                <div className="flex justify-start mb-10 sm:mb-12 animate-fade-in">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center space-x-1.5">
                      <style>{`
                        @keyframes typing-dot {
                          0%, 60%, 100% { transform: translateY(0); }
                          30% { transform: translateY(-8px); }
                        }
                        .typing-dot-1 { animation: typing-dot 1.4s infinite ease-in-out; animation-delay: 0s; }
                        .typing-dot-2 { animation: typing-dot 1.4s infinite ease-in-out; animation-delay: 0.2s; }
                        .typing-dot-3 { animation: typing-dot 1.4s infinite ease-in-out; animation-delay: 0.4s; }
                      `}</style>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-1"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-2"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-3"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Real typing indicator - WhatsApp style with continuous blinking */}
              {partnerTyping && (
                <div className="flex justify-start mb-10 sm:mb-12 animate-fade-in">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center space-x-1.5">
                      <style>{`
                        @keyframes typing-dot {
                          0%, 60%, 100% { transform: translateY(0); }
                          30% { transform: translateY(-8px); }
                        }
                        .typing-dot-1 { animation: typing-dot 1.4s infinite ease-in-out; animation-delay: 0s; }
                        .typing-dot-2 { animation: typing-dot 1.4s infinite ease-in-out; animation-delay: 0.2s; }
                        .typing-dot-3 { animation: typing-dot 1.4s infinite ease-in-out; animation-delay: 0.4s; }
                      `}</style>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-1"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-2"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-3"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - FIXED at bottom (WhatsApp Style) */}
            <div className="p-2 sm:p-3 lg:p-4 border-t border-white border-opacity-20 bg-black bg-opacity-30 flex-shrink-0">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-purple-600 bg-opacity-20 border-l-4 border-purple-500 rounded-lg flex items-start justify-between animate-fade-in">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-purple-300 mb-1">
                      Replying to {replyingTo.isOwnMessage ? 'yourself' : 'stranger'}
                    </p>
                    <p className="text-sm text-gray-200 truncate">
                      {replyingTo.content.length > 60 
                        ? replyingTo.content.substring(0, 60) + '...' 
                        : replyingTo.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-3 p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={(el) => {
                      inputRef.current = el;
                      if (el) {
                        adjustInputHeight();
                      }
                    }}
                    rows={1}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      // Scroll input into view on mobile when keyboard opens
                      setTimeout(() => {
                        inputRef.current?.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'center' 
                        });
                      }, 300); // Wait for keyboard animation
                    }}
                    placeholder="Type a message..."
                    disabled={!isMatchConnected}
                    className="textchat-input w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 backdrop-blur-sm resize-none transition-all duration-200 overflow-y-auto max-h-[140px] min-h-[44px]"
                    style={{ scrollbarWidth: 'none', overflowX: 'hidden' }}
                  />
                </div>
                
                {/* Topic Dice Button */}
                <button
                  onClick={() => getTopicPrompt()}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowTopicDiceModal(true);
                  }}
                  disabled={!isMatchConnected || loadingPrompt}
                  title="Get conversation starter (right-click for categories)"
                  className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 shadow-lg flex-shrink-0 flex items-center justify-center ${
                    isMatchConnected && !loadingPrompt
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white hover:shadow-yellow-500/25 transform hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loadingPrompt ? (
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span className="text-lg sm:text-xl">🎲</span>
                  )}
                </button>
                
                {/* Camera Button - Video Upgrade */}
                <button
                  onClick={async () => {
                    if (!isMatchConnected || !sessionId || !partnerId) {
                      console.warn('⚠️ Cannot send video request:', {
                        isConnected: isMatchConnected,
                        hasSession: !!sessionId,
                        hasPartner: !!partnerId
                      });
                      addSystemMessage('Not connected to a chat partner');
                      return;
                    }
                    
                    try {
                      console.log('📹 Initiating video upgrade...', { sessionId, partnerId });
                      
                      // Initialize WebRTC service if not already initialized
                      if (!webrtcServiceRef.current) {
                        console.log('📹 Initializing WebRTC for video upgrade...');
                        webrtcServiceRef.current = new WebRTCService();
                        console.log('✅ WebRTC service initialized for video upgrade');
                      }
                      
                      sendVideoRequest(partnerId, sessionId);
                      addSystemMessage('Video upgrade request sent...');
                    } catch (error: any) {
                      console.error('❌ Failed to initialize WebRTC:', error);
                      console.error('Error details:', error?.message, error?.stack);
                      addSystemMessage('Failed to start video upgrade. Please try again.');
                    }
                  }}
                  disabled={!isMatchConnected}
                  title="Request video chat"
                  className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 shadow-lg flex-shrink-0 flex items-center justify-center ${
                    isMatchConnected
                      ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white hover:shadow-green-500/25 transform hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || !isMatchConnected}
                  className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 shadow-lg flex-shrink-0 flex items-center justify-center ${
                    messageInput.trim() && isMatchConnected
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hover:shadow-purple-500/25 transform hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initial State - Not searching, not connected */}
        {!isSearching && !isMatchConnected && (
          <div className="text-center max-w-xs sm:max-w-md lg:max-w-lg mx-4 sm:mx-0">
            <div className="mb-6 sm:mb-8">
              <div className="relative mb-6 sm:mb-8">
                <ChatBubbleLeftRightIcon className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-purple-400" />
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Text Chat
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
                Connect with strangers from around the world and have interesting conversations!
              </p>
            </div>
            
            <button
              onClick={() => startNewChat(false)}
              disabled={socketConnecting || !socketConnected}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-purple-500/25 disabled:shadow-none"
            >
              {socketConnecting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Start Text Chat</span>
                </div>
              )}
            </button>
            
            {!socketConnected && (
              <p className="text-red-400 text-xs sm:text-sm mt-3 sm:mt-4 px-2">
                Connection lost. Please refresh the page.
              </p>
            )}
          </div>
        )}
        
      </div>

      {/* Report Modal */}
      {showReportModal && user && (
        <ReportModal
          isOpen={showReportModal}
          sessionId={sessionId || ''}
          reportedUserId={partnerId}
          reporterUserId={user.id}
          chatMode="text"
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Topic Dice Category Modal */}
      {showTopicDiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎲</span>
                Conversation Starters
              </h3>
              <button
                onClick={() => setShowTopicDiceModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-300 text-sm mb-6">
              Choose a category or get a random conversation starter:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => getTopicPrompt('fun')}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <span>Fun & Playful</span>
                </span>
                <span className="text-xs opacity-75">Light-hearted topics</span>
              </button>
              
              <button
                onClick={() => getTopicPrompt('safe')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">😊</span>
                  <span>Safe & Friendly</span>
                </span>
                <span className="text-xs opacity-75">Casual conversation</span>
              </button>
              
              <button
                onClick={() => getTopicPrompt('deep')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🤔</span>
                  <span>Deep & Thoughtful</span>
                </span>
                <span className="text-xs opacity-75">Meaningful topics</span>
              </button>
              
              <button
                onClick={() => getTopicPrompt('flirty')}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">😉</span>
                  <span>Flirty & Romantic</span>
                </span>
                <span className="text-xs opacity-75">Playful vibes</span>
              </button>
              
              <button
                onClick={() => getTopicPrompt()}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg mt-4"
              >
                ✨ Surprise Me (Random)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Upgrade Modal */}
      <VideoUpgradeModal
        state={videoUpgradeState}
        onAccept={async () => {
          try {
            console.log('✅ Accepting video upgrade request');
            acceptVideoRequest();
          } catch (error) {
            console.error('❌ Video upgrade accept failed:', error);
            addSystemMessage('Failed to accept video request');
            resetVideoUpgradeState();
          }
        }}
        onDecline={() => {
          console.log('❌ Declining video upgrade request');
          declineVideoRequest('declined');
          resetVideoUpgradeState();
        }}
        onDeclineAndReport={() => {
          console.log('🚨 Declining and reporting video upgrade request');
          declineVideoRequest('reported');
          resetVideoUpgradeState();
        }}
        onClose={() => {
          console.log('🔄 Closing video upgrade modal and resetting state');
          resetVideoUpgradeState();
        }}
      />

      {/* Video Overlay - Shows when video mode is active */}
      {isVideoMode && (localStream || remoteStream) && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
          {/* Video Header */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold text-lg">Video Chat Active</h3>
              </div>
              <button
                onClick={() => {
                  // Minimize video, return to text-only
                  setIsVideoMode(false);
                  // Stop video tracks
                  if (localStream) {
                    localStream.getVideoTracks().forEach(track => track.stop());
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Minimize Video
              </button>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-7xl mx-auto w-full">
            {/* Remote Video (Partner) */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm font-medium">Stranger</span>
              </div>
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white text-sm">Waiting for partner's video...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video (You) */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute bottom-4 left-4 bg-purple-600 bg-opacity-80 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm font-medium">You</span>
              </div>
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white text-sm">Starting your camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Chat Section - Minimized at bottom */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 max-h-64 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <h4 className="text-white text-sm font-semibold mb-2 opacity-70">Text Messages</h4>
              <div className="space-y-2">
                {messages.slice(-5).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm max-w-xs ${
                        msg.isOwnMessage
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TextChat;