// Video Upgrade Types - Live Escalation Bridge (Frontend)

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
  candidate: RTCIceCandidateInit;
  timestamp: number;
}

export interface VideoUpgradeState {
  status: 'idle' | 'requesting' | 'incoming' | 'accepted' | 'declined' | 'connecting' | 'connected' | 'failed';
  initiator: boolean;
  remoteUserId?: string;
  sessionId?: string;
  requestTimestamp?: number;
  error?: string;
  showTooltip?: boolean; // For first-time privacy warning
}

export type VideoUpgradeMessage = 
  | VideoUpgradeRequest 
  | VideoUpgradeResponse 
  | VideoUpgradeOffer 
  | VideoUpgradeAnswer 
  | VideoUpgradeIceCandidate;
