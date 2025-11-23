// Video Upgrade Types - Live Escalation Bridge

export interface VideoUpgradeRequest {
  type: 'request_video';
  from: string;
  to: string;
  chatId: string;
  sessionId: string;
  timestamp: number;
}

export interface VideoUpgradeResponse {
  type: 'video_response';
  from: string;
  to: string;
  chatId: string;
  sessionId: string;
  accept: boolean;
  reason?: 'declined' | 'reported' | 'permission_denied';
  timestamp: number;
}

export interface VideoUpgradeOffer {
  type: 'upgrade_offer';
  from: string;
  to: string;
  sessionId: string;
  sdp: string;
  timestamp: number;
}

export interface VideoUpgradeAnswer {
  type: 'upgrade_answer';
  from: string;
  to: string;
  sessionId: string;
  sdp: string;
  timestamp: number;
}

export interface VideoUpgradeIceCandidate {
  type: 'upgrade_ice_candidate';
  from: string;
  to: string;
  sessionId: string;
  candidate: any; // RTCIceCandidateInit - using any for backend compatibility
  timestamp: number;
}

export interface VideoUpgradeMetrics {
  sessionId: string;
  requestSentAt: number;
  requestReceivedAt?: number;
  responseAt?: number;
  videoStartedAt?: number;
  accepted: boolean;
  failureReason?: string;
  conversionTime?: number; // Time from request to video start
}

export interface VideoUpgradeState {
  status: 'idle' | 'requesting' | 'incoming' | 'accepted' | 'declined' | 'connecting' | 'connected' | 'failed';
  initiator: boolean;
  remoteUserId?: string;
  sessionId?: string;
  requestTimestamp?: number;
  error?: string;
}

export type VideoUpgradeMessage = 
  | VideoUpgradeRequest 
  | VideoUpgradeResponse 
  | VideoUpgradeOffer 
  | VideoUpgradeAnswer 
  | VideoUpgradeIceCandidate;
