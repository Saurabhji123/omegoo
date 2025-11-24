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

  // Google STUN servers for reliable P2P connection establishment
  // Multiple servers provide redundancy for NAT traversal
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ];

  private statsIntervalId: number | null = null;
  private onStatsUpdate: ((stats: any) => void) | null = null;

  constructor() {
    this.initializePeerConnection();
  }

  // Optimize SDP for Opus codec with low bandwidth
  private optimizeOpusInSDP(sdp: string): string {
    console.log('🎵 Optimizing SDP for Opus codec');
    
    // Prefer opus codec and set to stereo mode with 48kHz
    const lines = sdp.split('\r\n');
    const opusPayloadType = lines.find(line => line.includes('opus/48000'))?.match(/:(\d+) opus/)?.[1];
    
    if (opusPayloadType) {
      // Move Opus to first position in m=audio line
      const audioLineIndex = lines.findIndex(line => line.startsWith('m=audio'));
      if (audioLineIndex !== -1) {
        const audioLine = lines[audioLineIndex];
        const parts = audioLine.split(' ');
        const payloadTypes = parts.slice(3);
        
        // Remove opus from current position and add to front
        const filteredTypes = payloadTypes.filter(pt => pt !== opusPayloadType);
        parts.splice(3, payloadTypes.length, opusPayloadType, ...filteredTypes);
        lines[audioLineIndex] = parts.join(' ');
        
        console.log('✅ Opus codec prioritized in SDP');
      }
      
      // Add Opus-specific parameters for stereo and bandwidth
      const fmtpIndex = lines.findIndex(line => line.includes(`a=fmtp:${opusPayloadType}`));
      if (fmtpIndex !== -1) {
        // Enhance existing fmtp line
        lines[fmtpIndex] = `a=fmtp:${opusPayloadType} minptime=10;stereo=1;sprop-stereo=1;useinbandfec=1;maxaveragebitrate=64000`;
      } else {
        // Add new fmtp line after rtpmap
        const rtpmapIndex = lines.findIndex(line => line.includes(`a=rtpmap:${opusPayloadType} opus/48000`));
        if (rtpmapIndex !== -1) {
          lines.splice(rtpmapIndex + 1, 0, 
            `a=fmtp:${opusPayloadType} minptime=10;stereo=1;sprop-stereo=1;useinbandfec=1;maxaveragebitrate=64000`);
        }
      }
      
      console.log('✅ Opus parameters configured: stereo=1, maxbitrate=64kbps, FEC enabled');
    }
    
    return lines.join('\r\n');
  }

  // Set bitrate limitations on audio senders for low bandwidth
  private async setBitrateLimits() {
    if (!this.peerConnection) return;
    
    const senders = this.peerConnection.getSenders();
    const audioSender = senders.find(sender => sender.track?.kind === 'audio');
    
    if (audioSender) {
      const parameters = audioSender.getParameters();
      
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      
      // Set max bitrate to 64 kbps for 2G/3G compatibility
      parameters.encodings[0].maxBitrate = 64000;
      
      try {
        await audioSender.setParameters(parameters);
        console.log('✅ Audio bitrate limited to 64 kbps for low bandwidth');
      } catch (error) {
        console.warn('⚠️ Failed to set bitrate limits:', error);
      }
    }
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('🎥 Received remote track:', {
        kind: event.track.kind,
        streams: event.streams.length,
        enabled: event.track.enabled
      });
      
      this.remoteStream = event.streams[0];
      
      if (this.remoteStream) {
        console.log('📺 Remote stream details:', {
          video: this.remoteStream.getVideoTracks().length > 0,
          audio: this.remoteStream.getAudioTracks().length > 0,
          tracks: this.remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled }))
        });
      }
      
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Handle data channel messages
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      console.log('📨 Data channel received (receiver):', channel.label);
      
      // Set this as our data channel for the receiver
      this.dataChannel = channel;
      
      channel.onopen = () => {
        console.log('✅ Incoming data channel opened (receiver)');
      };
      
      channel.onclose = () => {
        console.log('❌ Incoming data channel closed (receiver)');
      };
      
      channel.onmessage = (event) => {
        console.log('📩 Received message via data channel (receiver):', event.data);
        if (this.onMessage) {
          this.onMessage(event.data);
        }
      };
      
      channel.onclose = () => {
        console.log('📨 Incoming data channel closed');
      };
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        console.log('🔌 Connection state changed:', state);
        
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      }
    };

    // Monitor ICE connection state for debugging
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        const iceState = this.peerConnection.iceConnectionState;
        console.log('🧊 ICE connection state:', iceState);
        
        switch (iceState) {
          case 'checking':
            console.log('🔍 ICE agents are checking connectivity...');
            break;
          case 'connected':
            console.log('✅ ICE connection established successfully!');
            break;
          case 'completed':
            console.log('🎉 ICE gathering and connectivity checks completed!');
            break;
          case 'failed':
            console.error('❌ ICE connection failed - P2P connection could not be established');
            break;
          case 'disconnected':
            console.warn('⚠️ ICE connection temporarily disconnected');
            break;
          case 'closed':
            console.log('🔒 ICE connection closed');
            break;
        }
      }
    };

    // Monitor ICE gathering state
    this.peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection) {
        const gatheringState = this.peerConnection.iceGatheringState;
        console.log('📡 ICE gathering state:', gatheringState);
        
        switch (gatheringState) {
          case 'gathering':
            console.log('🔄 Gathering ICE candidates via STUN servers...');
            break;
          case 'complete':
            console.log('✅ ICE candidate gathering completed');
            break;
        }
      }
    };

    // Handle ICE candidates with detailed logging
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate;
        
        // Log candidate type for debugging STUN server usage
        let candidateType = 'unknown';
        if (candidate.candidate) {
          if (candidate.candidate.includes('typ host')) candidateType = 'host (local)';
          else if (candidate.candidate.includes('typ srflx')) candidateType = 'srflx (STUN)';
          else if (candidate.candidate.includes('typ relay')) candidateType = 'relay (TURN)';
          else if (candidate.candidate.includes('typ prflx')) candidateType = 'prflx (peer reflexive)';
        }
        
        console.log('🧊 Generated ICE candidate:', {
          type: candidateType,
          protocol: candidate.protocol,
          address: candidate.address,
          port: candidate.port,
          priority: candidate.priority
        });
        
        if (this.onIceCandidateGenerated) {
          this.onIceCandidateGenerated(candidate);
        }
      } else {
        console.log('🏁 ICE candidate gathering finished (null candidate)');
      }
    };

    // Data channel will be created when needed (caller creates, receiver gets via ondatachannel)
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
      console.log('🎥 Local media stream initialized:', {
        video: this.localStream.getVideoTracks().length > 0,
        audio: this.localStream.getAudioTracks().length > 0,
        tracks: this.localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled }))
      });
      
      // NOTE: Don't add tracks here, add them when creating offer/answer
      // This prevents duplicate tracks
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Replace local stream with processed stream (for AR filters)
  // This ensures remote peer sees the filtered video
  async replaceLocalStream(processedStream: MediaStream): Promise<void> {
    console.log('🎭 Replacing local stream with processed stream for remote transmission');
    
    if (!this.peerConnection) {
      console.warn('⚠️ No peer connection, just updating local stream reference');
      this.localStream = processedStream;
      return;
    }

    const senders = this.peerConnection.getSenders();
    const processedVideoTrack = processedStream.getVideoTracks()[0];
    const processedAudioTrack = processedStream.getAudioTracks()[0];

    // Replace video track in all video senders
    const videoSenders = senders.filter(s => s.track?.kind === 'video');
    for (const sender of videoSenders) {
      try {
        await sender.replaceTrack(processedVideoTrack);
        console.log('✅ Replaced video track with processed version (remote will see filters)');
      } catch (error) {
        console.error('❌ Failed to replace video track:', error);
      }
    }

    // Replace audio track in all audio senders
    const audioSenders = senders.filter(s => s.track?.kind === 'audio');
    for (const sender of audioSenders) {
      try {
        await sender.replaceTrack(processedAudioTrack);
        console.log('✅ Replaced audio track with processed version');
      } catch (error) {
        console.error('❌ Failed to replace audio track:', error);
      }
    }

    // Update local stream reference
    this.localStream = processedStream;
    console.log('🎬 Local stream updated, remote peer now receives processed stream');
  }

  // Create offer (caller)
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // Create data channel for text messages (caller creates it)
    if (!this.dataChannel) {
      this.dataChannel = this.peerConnection.createDataChannel('messages', {
        ordered: true,
      });

      this.dataChannel.onopen = () => {
        console.log('✅ Data channel opened (caller)');
      };

      this.dataChannel.onclose = () => {
        console.log('❌ Data channel closed (caller)');
      };

      this.dataChannel.onmessage = (event) => {
        console.log('📩 Received message via data channel (caller):', event.data);
        if (this.onMessage) {
          this.onMessage(event.data);
        }
      };
    }

    // Add local stream tracks BEFORE creating offer
    if (this.localStream) {
      console.log('📡 Adding local tracks to peer connection (caller)');
      const existingSenders = this.peerConnection.getSenders();
      
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          // Check if this track is already added
          const trackAlreadyAdded = existingSenders.some(sender => sender.track === track);
          
          if (!trackAlreadyAdded) {
            this.peerConnection.addTrack(track, this.localStream!);
            console.log(`📡 Added ${track.kind} track to peer connection (caller)`);
          } else {
            console.log(`⚠️ ${track.kind} track already added, skipping`);
          }
        }
      });
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    // Optimize SDP for Opus codec
    if (offer.sdp) {
      offer.sdp = this.optimizeOpusInSDP(offer.sdp);
    }

    await this.peerConnection.setLocalDescription(offer);
    
    // Set bitrate limits after local description is set
    await this.setBitrateLimits();
    
    console.log('📞 Created and set local description (offer) with Opus optimization');
    return offer;
  }

  // Create answer (callee) 
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    console.log('📞 Set remote description (offer)');
    
    // Add local stream tracks BEFORE creating answer
    if (this.localStream) {
      console.log('📡 Adding local tracks to peer connection (answerer)');
      const existingSenders = this.peerConnection.getSenders();
      
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          // Check if this track is already added
          const trackAlreadyAdded = existingSenders.some(sender => sender.track === track);
          
          if (!trackAlreadyAdded) {
            this.peerConnection.addTrack(track, this.localStream!);
            console.log(`📡 Added ${track.kind} track to peer connection (answerer)`);
          } else {
            console.log(`⚠️ ${track.kind} track already added, skipping`);
          }
        }
      });
    }
    
    const answer = await this.peerConnection.createAnswer();
    
    // Optimize SDP for Opus codec
    if (answer.sdp) {
      answer.sdp = this.optimizeOpusInSDP(answer.sdp);
    }
    
    await this.peerConnection.setLocalDescription(answer);
    
    // Set bitrate limits after local description is set
    await this.setBitrateLimits();
    
    console.log('📞 Created and set local description (answer) with Opus optimization');
    
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

    // Use the createAnswer method which handles track addition
    return await this.createAnswer(offer);
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
      console.log('📤 Message sent via data channel:', message);
    } else {
      console.error('❌ Data channel not open, state:', this.dataChannel?.readyState);
      throw new Error('Data channel not available');
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

  // Get fresh audio track for unmuting scenarios
  private async getFreshAudioTrack(): Promise<MediaStreamTrack | null> {
    try {
      const freshStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      const freshAudioTrack = freshStream.getAudioTracks()[0];
      if (freshAudioTrack) {
        console.log('🆕 Fresh audio track obtained:', {
          id: freshAudioTrack.id,
          enabled: freshAudioTrack.enabled,
          readyState: freshAudioTrack.readyState
        });
        return freshAudioTrack;
      }
    } catch (error) {
      console.error('❌ Failed to get fresh audio track:', error);
    }
    return null;
  }

  // Toggle audio with enhanced WebRTC track replacement for bidirectional sync
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const wasEnabled = audioTrack.enabled;
        const newState = !wasEnabled;
        
        // First update the local track state
        audioTrack.enabled = newState;
        
        console.log('🎤 Local audio track toggled:', audioTrack.enabled ? 'ENABLED' : 'DISABLED');
        
        // Critical: Update WebRTC senders for proper remote transmission
        if (this.peerConnection) {
          const senders = this.peerConnection.getSenders();
          const audioSenders = senders.filter(sender => sender.track && sender.track.kind === 'audio');
          
          console.log('🔄 Found audio senders to update:', audioSenders.length);
          
          audioSenders.forEach(async (sender, index) => {
            try {
              if (newState) {
                // UNMUTING: Replace with enabled track to resume transmission
                await sender.replaceTrack(audioTrack);
                console.log(`🔊 Audio sender ${index} resumed with enabled track`);
              } else {
                // MUTING: Replace with null to stop transmission completely
                await sender.replaceTrack(null);
                console.log(`� Audio sender ${index} muted by replacing with null`);
              }
              
              // Double-check sender track state
              console.log(`🎤 Sender ${index} final state:`, {
                hasTrack: sender.track !== null,
                trackEnabled: sender.track?.enabled || false,
                trackKind: sender.track?.kind || 'none'
              });
              
            } catch (error) {
              console.error(`❌ Failed to update audio sender ${index}:`, error);
              
              // Enhanced fallback: Force track state update
              if (sender.track) {
                sender.track.enabled = newState;
                console.log(`🔄 Fallback: Sender ${index} track enabled set to:`, newState);
              }
            }
          });
        }
        
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Simple and reliable mic toggle - RESET VERSION
  toggleMic(): boolean {
    console.log('🎤 SIMPLE MIC TOGGLE - Starting...');
    
    if (!this.localStream) {
      console.error('❌ No local stream available');
      return false;
    }
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.error('❌ No audio track found');
      return false;
    }
    
    // Simple toggle: just flip the enabled state
    const newState = !audioTrack.enabled;
    audioTrack.enabled = newState;
    
    console.log('🎤 Audio track toggled:', {
      newState: newState,
      trackId: audioTrack.id,
      readyState: audioTrack.readyState
    });
    
    // Update WebRTC senders if connection exists
    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      
      senders.forEach((sender, index) => {
        if (sender.track && sender.track.kind === 'audio') {
          // Simple approach: just update the track enabled state
          sender.track.enabled = newState;
          console.log(`� Sender ${index} track enabled set to:`, newState);
        }
      });
    }
    
    console.log('✅ SIMPLE MIC TOGGLE - Completed:', newState);
    return newState;
  }

  // PURE UI STATE MIC CONTROL - No Audio Manipulation
  private uiMicState: boolean = true; // true = ON, false = OFF

  toggleMicUI(): boolean {
    console.log('UI MIC: Current state =', this.uiMicState);
    
    // Pure UI toggle
    this.uiMicState = !this.uiMicState;
    
    console.log('UI MIC: New state =', this.uiMicState);
    
    return this.uiMicState;
  }

  getMicUIState(): boolean {
    return this.uiMicState;
  }

  resetMicUIToOn(): void {
    this.uiMicState = true;
    console.log('UI MIC: Reset to ON');
  }

  // Update WebRTC senders for voice transmission
  updateAudioSenders(enabled: boolean): void {
    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      senders.forEach((sender, index) => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = enabled;
          console.log(`🔄 WebRTC sender ${index} updated for voice transmission:`, enabled);
        }
      });
    }
  }

  // Get local stream for debugging
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get senders count for debugging
  getSendersCount(): number {
    if (this.peerConnection) {
      return this.peerConnection.getSenders().length;
    }
    return 0;
  }

  // Replace video track (for filters/effects)
  async replaceVideoTrack(newVideoTrack: MediaStreamTrack): Promise<void> {
    if (!this.peerConnection) {
      console.warn('⚠️ Cannot replace video track: no peer connection');
      return;
    }

    const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
    if (sender && sender.track) {
      try {
        await sender.replaceTrack(newVideoTrack);
        console.log('✅ Video track replaced successfully');
        
        // Update local stream
        if (this.localStream) {
          const oldTrack = this.localStream.getVideoTracks()[0];
          if (oldTrack) {
            this.localStream.removeTrack(oldTrack);
          }
          this.localStream.addTrack(newVideoTrack);
        }
      } catch (error) {
        console.error('❌ Failed to replace video track:', error);
        throw error;
      }
    } else {
      console.warn('⚠️ No video sender found to replace track');
    }
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

    // Ensure local stream is added before creating offer
    if (this.localStream) {
      console.log('🎥 Adding local stream tracks to peer connection');
      
      // Check if tracks are already added to avoid duplicates
      const existingSenders = this.peerConnection.getSenders();
      
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          // Check if this track is already added
          const trackAlreadyAdded = existingSenders.some(sender => sender.track === track);
          
          if (!trackAlreadyAdded) {
            this.peerConnection.addTrack(track, this.localStream!);
            console.log(`📡 Added ${track.kind} track to peer connection`);
          } else {
            console.log(`⚠️ ${track.kind} track already added, skipping`);
          }
        }
      });
    } else {
      console.warn('⚠️ No local stream available when creating offer');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    console.log('📞 Created and set local description (offer)');
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
    this.stopStatsMonitoring();
    this.close();
    this.currentMatchUserId = null;
    this.currentSessionId = null;
  }

  // Start monitoring WebRTC stats for quality metrics
  startStatsMonitoring(intervalMs: number = 2000): void {
    if (this.statsIntervalId) {
      console.log('⚠️ Stats monitoring already running');
      return;
    }
    
    console.log('📊 Starting WebRTC stats monitoring');
    
    this.statsIntervalId = window.setInterval(async () => {
      if (!this.peerConnection) return;
      
      try {
        const stats = await this.peerConnection.getStats();
        const metrics: any = {
          timestamp: Date.now(),
          packetLoss: 0,
          jitter: 0,
          bitrate: 0,
          roundTripTime: 0
        };
        
        stats.forEach((report: any) => {
          // Inbound RTP (receiving audio/video)
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            metrics.packetsLost = report.packetsLost || 0;
            metrics.packetsReceived = report.packetsReceived || 0;
            metrics.jitter = report.jitter || 0;
            metrics.bytesReceived = report.bytesReceived || 0;
            
            // Calculate packet loss percentage
            if (metrics.packetsReceived > 0) {
              metrics.packetLoss = (metrics.packetsLost / (metrics.packetsLost + metrics.packetsReceived)) * 100;
            }
          }
          
          // Outbound RTP (sending audio/video)
          if (report.type === 'outbound-rtp' && report.kind === 'audio') {
            metrics.bytesSent = report.bytesSent || 0;
            metrics.packetsSent = report.packetsSent || 0;
          }
          
          // Candidate pair for RTT
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            metrics.roundTripTime = report.currentRoundTripTime || 0;
          }
        });
        
        // Calculate bitrate (bytes per second to kbps)
        if (metrics.bytesReceived) {
          metrics.bitrate = Math.round((metrics.bytesReceived * 8) / 1000); // kbps
        }
        
        // Emit stats to callback
        if (this.onStatsUpdate) {
          this.onStatsUpdate(metrics);
        }
        
      } catch (error) {
        console.warn('⚠️ Failed to collect WebRTC stats:', error);
      }
    }, intervalMs);
  }
  
  stopStatsMonitoring(): void {
    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
      console.log('🛑 Stopped WebRTC stats monitoring');
    }
  }
  
  onStatsUpdated(callback: (stats: any) => void): void {
    this.onStatsUpdate = callback;
  }

  cleanup(): void {
    console.log('🧹 WebRTC cleanup started');
    
    // Stop stats monitoring
    this.stopStatsMonitoring();
    
    // Clear session info first
    this.currentMatchUserId = null;
    this.currentSessionId = null;
    
    // Close peer connection and clean up streams
    this.close();
    
    // Clear callbacks
    this.onMessage = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onIceCandidateGenerated = null;
    this.onStatsUpdate = null;
    
    console.log('✅ WebRTC cleanup completed');
  }

  // Get current match user ID
  getMatchUserId(): string | null {
    return this.currentMatchUserId;
  }

  // Enhanced session management for multi-device scenarios
  forceDisconnect(): void {
    console.log('🔄 Force disconnecting WebRTC session');
    
    if (this.peerConnection && this.isDataChannelOpen) {
      try {
        this.dataChannel?.send(JSON.stringify({ type: 'session_end' }));
      } catch (error) {
        console.warn('Could not send session end message:', error);
      }
    }
    
    this.cleanup();
  }
}

export default WebRTCService;