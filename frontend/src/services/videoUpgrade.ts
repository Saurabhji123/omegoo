// Video Upgrade Service - Extends WebRTC for live escalation
import WebRTCService from './webrtc';

export class VideoUpgradeService {
  /**
   * Upgrade existing text/audio chat to video without page reload
   * Uses addTrack() to inject camera stream into existing peer connection
   */
  static async upgradeToVideo(
    webrtc: WebRTCService,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): Promise<RTCSessionDescriptionInit> {
    console.log('📹 Starting video upgrade from text chat...');

    // Access private peerConnection via type assertion
    const pc = (webrtc as any).peerConnection as RTCPeerConnection;
    
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    try {
      // Get video stream (camera + audio)
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Video stream acquired:', {
        video: videoStream.getVideoTracks().length > 0,
        audio: videoStream.getAudioTracks().length > 0
      });

      // Add video tracks to existing peer connection using addTrack()
      const existingSenders = pc.getSenders();
      
      videoStream.getTracks().forEach(track => {
        // Check if track kind already exists
        const existingSender = existingSenders.find(s => s.track?.kind === track.kind);
        
        if (existingSender && existingSender.track) {
          // Replace existing track (e.g., upgrade audio quality)
          existingSender.replaceTrack(track).then(() => {
            console.log(`🔄 Replaced ${track.kind} track for video upgrade`);
          });
        } else {
          // Add new track
          pc.addTrack(track, videoStream);
          console.log(`📡 Added ${track.kind} track for video upgrade`);
        }
      });

      // Update local stream reference in webrtc service
      const oldStream = (webrtc as any).localStream as MediaStream | null;
      if (oldStream) {
        // Stop old tracks
        oldStream.getTracks().forEach(track => track.stop());
      }
      (webrtc as any).localStream = videoStream;

      // Set ICE candidate callback
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
          console.log('🧊 ICE candidate generated for video upgrade');
        }
      };

      // Create new offer with video
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      console.log('📹 Video upgrade offer created successfully');
      return offer;

    } catch (error: any) {
      console.error('❌ Video upgrade failed:', error);
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application.');
      } else {
        throw new Error(`Video upgrade failed: ${error.message}`);
      }
    }
  }

  /**
   * Handle incoming video upgrade answer
   */
  static async handleUpgradeAnswer(
    webrtc: WebRTCService,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const pc = (webrtc as any).peerConnection as RTCPeerConnection;
    
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    await pc.setRemoteDescription(answer);
    console.log('✅ Video upgrade answer processed');
  }

  /**
   * Handle incoming video upgrade offer (for the receiving side)
   */
  static async handleUpgradeOffer(
    webrtc: WebRTCService,
    offer: RTCSessionDescriptionInit,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): Promise<RTCSessionDescriptionInit> {
    console.log('📹 Processing incoming video upgrade offer...');

    const pc = (webrtc as any).peerConnection as RTCPeerConnection;
    
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    try {
      // Get video stream
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Video stream acquired for answer');

      // Set remote description first
      await pc.setRemoteDescription(offer);

      // Add local video tracks
      const existingSenders = pc.getSenders();
      
      videoStream.getTracks().forEach(track => {
        const existingSender = existingSenders.find(s => s.track?.kind === track.kind);
        
        if (existingSender && existingSender.track) {
          existingSender.replaceTrack(track);
          console.log(`🔄 Replaced ${track.kind} track for video answer`);
        } else {
          pc.addTrack(track, videoStream);
          console.log(`📡 Added ${track.kind} track for video answer`);
        }
      });

      // Update local stream
      const oldStream = (webrtc as any).localStream as MediaStream | null;
      if (oldStream) {
        oldStream.getTracks().forEach(track => track.stop());
      }
      (webrtc as any).localStream = videoStream;

      // Set ICE candidate callback
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('📹 Video upgrade answer created successfully');
      return answer;

    } catch (error: any) {
      console.error('❌ Video upgrade answer failed:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera permission denied');
      }
      throw error;
    }
  }

  /**
   * Handle ICE candidate for video upgrade
   */
  static async handleUpgradeIceCandidate(
    webrtc: WebRTCService,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = (webrtc as any).peerConnection as RTCPeerConnection;
    
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    await pc.addIceCandidate(candidate);
    console.log('🧊 Added ICE candidate for video upgrade');
  }
}

export default VideoUpgradeService;
