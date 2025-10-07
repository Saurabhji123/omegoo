import { io, Socket } from 'socket.io-client';

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessage: ((message: string) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  private onMatchFound: ((userId: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onSearching: ((data: { position: number, totalWaiting: number }) => void) | null = null;
  private isConnected = false;
  private currentMatchUserId: string | null = null;
  private currentSessionId: string | null = null;

  // STUN servers for NAT traversal
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  constructor() {
    this.initializePeerConnection();
    this.initializeSocket();
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Handle data channel messages
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        if (this.onMessage) {
          this.onMessage(event.data);
        }
      };
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange && this.peerConnection) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.currentMatchUserId) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          targetUserId: this.currentMatchUserId,
          sessionId: this.currentSessionId
        });
        console.log('🧊 Sent ICE candidate to peer');
      }
    };

    // Create data channel for text messages
    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true,
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
    };
  }

  // Initialize Socket.IO for signaling
  private initializeSocket() {
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to signaling server');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from signaling server');
      this.cleanup();
    });

    // WebRTC signaling events
    this.socket.on('match-found', async (data: { sessionId: string, matchUserId: string, isInitiator: boolean }) => {
      console.log('👥 Match found:', data);
      this.currentMatchUserId = data.matchUserId;
      this.currentSessionId = data.sessionId;
      this.onMatchFound?.(data.matchUserId);
      this.isConnected = true;
      
      // If we're the initiator, create and send offer
      if (data.isInitiator && this.peerConnection) {
        try {
          const offer = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await this.peerConnection.setLocalDescription(offer);
          this.socket?.emit('webrtc-offer', { 
            offer, 
            targetUserId: this.currentMatchUserId,
            sessionId: this.currentSessionId 
          });
          console.log('📞 Sent offer to peer');
        } catch (error) {
          console.error('❌ Failed to create offer:', error);
        }
      }
    });

    this.socket.on('webrtc-offer', async (data: any) => {
      console.log('📞 Received offer from:', data.fromUserId);
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(data.offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.socket?.emit('webrtc-answer', { 
          answer, 
          targetUserId: data.fromUserId,
          sessionId: this.currentSessionId 
        });
      }
    });

    this.socket.on('webrtc-answer', async (data: any) => {
      console.log('📞 Received answer from:', data.fromUserId);
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(data.answer);
      }
    });

    this.socket.on('ice-candidate', async (data: any) => {
      console.log('🧊 Received ICE candidate from:', data.fromUserId);
      if (this.peerConnection && data.candidate) {
        await this.peerConnection.addIceCandidate(data.candidate);
      }
    });

    this.socket.on('searching', (data: { position: number, totalWaiting: number }) => {
      console.log('🔍 Searching for match:', data);
      this.onSearching?.(data);
    });

    this.socket.on('match-ended', (data: any) => {
      console.log('❌ Match ended:', data.reason);
      this.cleanup();
    });

    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      this.onError?.(error);
    });
  }

  // Initialize local media stream
  async initializeMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.peerConnection) {
        // Add local stream tracks to peer connection
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Create offer (caller)
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  // Create answer (callee)
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  // Set remote answer (caller)
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  // Send text message through data channel
  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    } else {
      console.error('Data channel not open');
    }
  }

  // Toggle video
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

  // Toggle audio
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

  // Switch camera (front/back)
  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const constraints = videoTrack.getConstraints() as any;
        const facingMode = constraints.facingMode === 'user' ? 'environment' : 'user';
        
        videoTrack.stop();
        
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = this.peerConnection?.getSenders().find(s => 
          s.track?.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(newVideoTrack);
          this.localStream.removeTrack(videoTrack);
          this.localStream.addTrack(newVideoTrack);
        }
      }
    }
  }

  // Take screenshot of remote video
  takeScreenshot(videoElement: HTMLVideoElement): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
    return null;
  }

  // Capture frame for moderation
  captureFrame(videoElement: HTMLVideoElement): ImageData | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 224; // Resize for AI moderation
      canvas.height = 224;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, 224, 224);
        return ctx.getImageData(0, 0, 224, 224);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
    return null;
  }

  // Get connection statistics
  async getStats(): Promise<RTCStatsReport | null> {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }

  // Event handlers
  onMessageReceived(callback: (message: string) => void): void {
    this.onMessage = callback;
  }

  onRemoteStreamReceived(callback: (stream: MediaStream) => void): void {
    this.onRemoteStream = callback;
  }

  onConnectionStateChanged(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChange = callback;
  }

  onSearchingForMatch(callback: (data: { position: number, totalWaiting: number }) => void): void {
    this.onSearching = callback;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          callback(event.candidate);
        }
      };
    }
  }

  // Cleanup
  close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  // Getters
  get localMediaStream(): MediaStream | null {
    return this.localStream;
  }

  get remoteMediaStream(): MediaStream | null {
    return this.remoteStream;
  }

  get connectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  get isDataChannelOpen(): boolean {
    return this.dataChannel?.readyState === 'open';
  }

  // Omegle-style methods
  findMatch(): void {
    if (this.socket) {
      this.socket.emit('find-match');
    }
  }

  nextMatch(): void {
    this.close();
    this.currentMatchUserId = null;
    this.currentSessionId = null;
    this.isConnected = false;
    this.findMatch();
  }

  cleanup(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentMatchUserId = null;
    this.currentSessionId = null;
    this.isConnected = false;
    this.close();
  }
}

export default WebRTCService;