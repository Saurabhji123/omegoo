/**
 * Enhanced WebRTC Service
 * Includes adaptive quality, network monitoring, audio-only fallback
 * NO TURN/STUN - Direct P2P only
 */

import { NetworkMonitor, NetworkQuality } from './networkMonitor';
import { ResolutionManager, ResolutionTier } from './resolutionManager';
import { getAdaptiveBitrateController, BitrateAdjustment } from './adaptiveBitrate';
import { videoCallLogger } from '../utils/videoCallLogger';

export type CallMode = 'video' | 'audio-only';
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface EnhancedWebRTCCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onMessage?: (message: string) => void;
  onModeChange?: (mode: CallMode) => void;
  onResolutionChange?: (tier: ResolutionTier) => void;
  onNetworkQualityChange?: (quality: NetworkQuality) => void;
}

export class EnhancedWebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private callbacks: EnhancedWebRTCCallbacks = {};
  
  // Adaptive quality components
  private networkMonitor: NetworkMonitor;
  private resolutionManager: ResolutionManager;
  private bitrateController: ReturnType<typeof getAdaptiveBitrateController>;
  
  // State tracking
  private callMode: CallMode = 'video';
  private connectionStatus: ConnectionStatus = 'disconnected';
  private videoFailureDetected: boolean = false;
  private frameCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private callStartTime: number = 0;

  constructor() {
    this.networkMonitor = new NetworkMonitor();
    this.resolutionManager = new ResolutionManager();
    this.bitrateController = getAdaptiveBitrateController(this.networkMonitor, this.resolutionManager);
    
    this.initializePeerConnection();
  }

  /**
   * Initialize peer connection WITHOUT TURN/STUN
   */
  private initializePeerConnection(): void {
    // NO iceServers - Direct P2P only
    this.peerConnection = new RTCPeerConnection({
      iceServers: [], // Empty array = host candidates only
      iceCandidatePoolSize: 5,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    videoCallLogger.logCallStart(this.callMode === 'audio-only' ? 'audio' : 'video');

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      if (state) {
        videoCallLogger.logICEState(state);
        this.handleICEStateChange(state);
      }
    };

    // Handle ICE gathering state
    this.peerConnection.onicegatheringstatechange = () => {
      const state = this.peerConnection?.iceGatheringState;
      if (state) {
        videoCallLogger.logICEGathering(state);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoCallLogger.logICECandidate(event.candidate, true);
        this.callbacks.onIceCandidate?.(event.candidate);
      } else {
        videoCallLogger.logICECandidate(null, true);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state) {
        videoCallLogger.logPeerConnectionState(state);
        this.handleConnectionStateChange(state);
        this.callbacks.onConnectionStateChange?.(state);
      }
    };

    // Handle signaling state
    this.peerConnection.onsignalingstatechange = () => {
      const state = this.peerConnection?.signalingState;
      if (state) {
        videoCallLogger.logSignalingState(state);
      }
    };

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      videoCallLogger.logTrackAdded(event.track.kind, false);
      
      this.remoteStream = event.streams[0];
      this.callbacks.onRemoteStream?.(this.remoteStream);

      // Start video frame detection after receiving video track
      if (event.track.kind === 'video' && this.callMode === 'video') {
        this.startVideoFrameDetection();
      }
    };

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    console.log('[EnhancedWebRTC] Peer connection initialized (NO TURN/STUN)');
  }

  /**
   * Setup data channel for text messages
   */
  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log('[EnhancedWebRTC] Data channel opened');
    };

    channel.onclose = () => {
      console.log('[EnhancedWebRTC] Data channel closed');
    };

    channel.onmessage = (event) => {
      this.callbacks.onMessage?.(event.data);
    };

    channel.onerror = (error) => {
      console.error('[EnhancedWebRTC] Data channel error:', error);
    };
  }

  /**
   * Handle ICE connection state changes
   */
  private handleICEStateChange(state: RTCIceConnectionState): void {
    switch (state) {
      case 'checking':
        this.connectionStatus = 'connecting';
        break;
      case 'connected':
      case 'completed':
        this.connectionStatus = 'connected';
        // Start monitoring after connection established
        if (this.peerConnection) {
          this.networkMonitor.startMonitoring(this.peerConnection, 2000);
          this.bitrateController.start(this.peerConnection);
        }
        break;
      case 'disconnected':
        this.connectionStatus = 'reconnecting';
        break;
      case 'failed':
      case 'closed':
        this.connectionStatus = 'disconnected';
        this.handleConnectionFailure();
        break;
    }
  }

  /**
   * Handle peer connection state changes
   */
  private handleConnectionStateChange(state: RTCPeerConnectionState): void {
    if (state === 'failed' && this.callMode === 'video') {
      // Connection failed, try audio-only fallback
      this.fallbackToAudioOnly('connection_failed');
    }
  }

  /**
   * Start video frame detection to ensure video is flowing
   */
  private startVideoFrameDetection(): void {
    // Clear existing timer
    if (this.frameCheckTimer) {
      clearTimeout(this.frameCheckTimer);
    }

    // Check after 5 seconds if frames are being received
    this.frameCheckTimer = setTimeout(async () => {
      const stats = this.networkMonitor.getLatestStats();
      
      if (stats && stats.framesReceived === 0) {
        console.warn('[EnhancedWebRTC] No video frames detected after 5s');
        this.fallbackToAudioOnly('no_frames_received');
      }
    }, 5000);
  }

  /**
   * Fallback to audio-only mode
   */
  private async fallbackToAudioOnly(reason: string): Promise<void> {
    if (this.callMode === 'audio-only' || this.videoFailureDetected) {
      return; // Already in audio-only or fallback in progress
    }

    this.videoFailureDetected = true;
    this.callMode = 'audio-only';

    videoCallLogger.logVideoFallback(reason);

    // Stop video track
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        this.localStream.removeTrack(videoTrack);
        videoCallLogger.logTrackRemoved('video', true);
      }
    }

    // Remove video sender from peer connection
    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      
      if (videoSender) {
        this.peerConnection.removeTrack(videoSender);
      }
    }

    // Notify UI
    this.callbacks.onModeChange?.(this.callMode);

    console.log(`[EnhancedWebRTC] Fell back to audio-only mode (${reason})`);
  }

  /**
   * Retry video after audio-only fallback
   */
  async retryVideo(): Promise<boolean> {
    if (this.callMode !== 'audio-only') {
      return true; // Already in video mode
    }

    try {
      videoCallLogger.logError('Video', 'Attempting video retry', new Error('User requested retry'));

      // Request video track
      const constraints = this.resolutionManager.getMediaConstraints();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: constraints,
        audio: false
      });

      const videoTrack = newStream.getVideoTracks()[0];
      
      if (!videoTrack) {
        throw new Error('Failed to get video track');
      }

      // Add video track to local stream
      if (this.localStream) {
        this.localStream.addTrack(videoTrack);
        videoCallLogger.logTrackAdded('video', true);
      }

      // Add video sender to peer connection
      if (this.peerConnection) {
        this.peerConnection.addTrack(videoTrack, this.localStream!);
        
        // Apply bitrate for current tier
        await this.bitrateController.manualAdjust(
          this.resolutionManager.getCurrentTier(),
          'video_retry'
        );
      }

      // Reset state
      this.videoFailureDetected = false;
      this.callMode = 'video';
      
      // Restart frame detection
      this.startVideoFrameDetection();

      // Notify UI
      this.callbacks.onModeChange?.(this.callMode);

      console.log('[EnhancedWebRTC] Video retry successful');
      return true;

    } catch (error) {
      console.error('[EnhancedWebRTC] Video retry failed:', error);
      videoCallLogger.logError('Video', 'Video retry failed', error as Error);
      return false;
    }
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(): void {
    this.networkMonitor.stopMonitoring();
    this.bitrateController.stop();
    
    if (this.frameCheckTimer) {
      clearTimeout(this.frameCheckTimer);
      this.frameCheckTimer = null;
    }
  }

  /**
   * Initialize local media with preview stream
   */
  async initializeMediaFromPreview(previewStream: MediaStream): Promise<void> {
    this.localStream = previewStream;
    this.callStartTime = Date.now();

    // Add tracks to peer connection
    if (this.peerConnection) {
      previewStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
          videoCallLogger.logTrackAdded(track.kind, true);
        }
      });
    }

    console.log('[EnhancedWebRTC] Media initialized from preview stream');
  }

  /**
   * Create offer (caller)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // Create data channel
    if (!this.dataChannel) {
      const channel = this.peerConnection.createDataChannel('messages', {
        ordered: true
      });
      this.setupDataChannel(channel);
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: this.callMode === 'video'
    });

    await this.peerConnection.setLocalDescription(offer);

    console.log('[EnhancedWebRTC] Created offer');
    return offer;
  }

  /**
   * Create answer (callee)
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    videoCallLogger.logICECandidate(null, false);

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    console.log('[EnhancedWebRTC] Created answer');
    return answer;
  }

  /**
   * Set remote answer
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
    console.log('[EnhancedWebRTC] Set remote answer');
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(candidate);
      videoCallLogger.logICECandidate(candidate, false);
    } catch (error) {
      console.error('[EnhancedWebRTC] Failed to add ICE candidate:', error);
    }
  }

  /**
   * Send text message
   */
  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    } else {
      throw new Error('Data channel not open');
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle audio
   */
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: EnhancedWebRTCCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };

    // Setup network quality callback
    this.networkMonitor.onQualityChange((quality, stats) => {
      this.callbacks.onNetworkQualityChange?.(quality);
      
      // Log quality changes
      if (quality === 'poor' || quality === 'critical') {
        videoCallLogger.logNetworkDegradation(quality, stats);
      } else if (quality === 'excellent' || quality === 'good') {
        videoCallLogger.logNetworkImprovement(quality, stats);
      }
    });

    // Setup bitrate adjustment callback
    this.bitrateController.onBitrateChange((adjustment: BitrateAdjustment) => {
      this.callbacks.onResolutionChange?.(adjustment.newTier);
      videoCallLogger.logResolutionChange(adjustment.previousTier, adjustment.newTier, adjustment.reason);
    });
  }

  /**
   * Get current call mode
   */
  getCallMode(): CallMode {
    return this.callMode;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current resolution tier
   */
  getCurrentResolution(): ResolutionTier {
    return this.resolutionManager.getCurrentTier();
  }

  /**
   * Get current network quality
   */
  getNetworkQuality(): NetworkQuality {
    return this.networkMonitor.getCurrentQuality();
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get connection state
   */
  get connectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  /**
   * Check if data channel is open
   */
  get isDataChannelOpen(): boolean {
    return this.dataChannel?.readyState === 'open';
  }

  /**
   * Export diagnostic logs
   */
  exportDiagnostics(): string {
    return videoCallLogger.exportDiagnostics();
  }

  /**
   * Cleanup and close connection
   */
  close(): void {
    // Log call end
    if (this.callStartTime > 0) {
      const duration = Date.now() - this.callStartTime;
      videoCallLogger.logCallEnd(duration, 'user_ended');
    }

    // Stop monitoring
    this.networkMonitor.stopMonitoring();
    this.bitrateController.stop();

    // Clear frame check timer
    if (this.frameCheckTimer) {
      clearTimeout(this.frameCheckTimer);
      this.frameCheckTimer = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        videoCallLogger.logTrackRemoved(track.kind, true);
      });
      this.localStream = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.connectionStatus = 'disconnected';
    this.videoFailureDetected = false;
    this.callStartTime = 0;

    console.log('[EnhancedWebRTC] Connection closed');
  }

  /**
   * Reset for next match
   */
  nextMatch(): void {
    this.close();
    this.initializePeerConnection();
    this.resolutionManager.reset();
    this.networkMonitor.reset();
    this.bitrateController.reset();
    videoCallLogger.startNewSession();
    
    console.log('[EnhancedWebRTC] Ready for next match');
  }
}

export default EnhancedWebRTCService;
