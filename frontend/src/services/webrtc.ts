import { io, Socket } from 'socket.io-client';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessage: ((message: string) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  private onIceCandidateGenerated: ((candidate: RTCIceCandidate) => void) | null = null;
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
      if (event.candidate && this.onIceCandidateGenerated) {
        this.onIceCandidateGenerated(event.candidate);
        console.log('🧊 Generated ICE candidate for external signaling');
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

  // Set external socket for signaling (no longer creates its own)
  setSocket(socket: any, sessionId: string, matchUserId: string) {
    this.currentSessionId = sessionId;
    this.currentMatchUserId = matchUserId;
    console.log('� WebRTC service linked to external socket');
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

  // Handle incoming WebRTC offer
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  // Handle incoming WebRTC answer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  // Handle incoming ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
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

  // Set callback for ICE candidate generation (for external signaling)
  setIceCandidateCallback(callback: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateGenerated = callback;
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

  // Create offer for initiator
  async createWebRTCOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
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

  // Session management
  nextMatch(): void {
    this.close();
    this.currentMatchUserId = null;
    this.currentSessionId = null;
  }

  cleanup(): void {
    this.currentMatchUserId = null;
    this.currentSessionId = null;
    this.close();
  }
}

export default WebRTCService;