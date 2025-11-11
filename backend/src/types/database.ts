// Database types for Omegoo

export interface User {
  id: string;
  deviceId: string;
  email?: string;
  username?: string;
  passwordHash?: string;
  phoneHash?: string;
  tier: 'guest' | 'verified' | 'premium';
  status: 'active' | 'banned' | 'suspended';
  coins: number;
  totalChats?: number;
  dailyChats?: number;
  lastCoinClaim?: Date;
  isVerified: boolean;
  gender?: 'male' | 'female' | 'others';
  otp?: string; // 📧 OTP for email verification
  otpExpiresAt?: Date; // 📧 OTP expiry time
  activeDeviceToken?: string; // Current active session token - only one device at a time
  lastLoginDevice?: string; // Device info for last login
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastPasswordResetAt?: Date;
  preferences: {
    language: string;
    interests: string[];
    ageRange?: [number, number];
    genderPreference: 'any' | 'male' | 'female';
  };
  subscription: {
    type: 'none' | 'starter' | 'standard' | 'premium';
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'system';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  type: 'video' | 'text';
  status: 'waiting' | 'active' | 'ended';
  settings: {
    allowText: boolean;
    allowVideo: boolean;
    allowAudio: boolean;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  endReason?: 'user_left' | 'reported' | 'timeout' | 'technical';
}

export interface WebRTCOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  roomId: string;
  offer: any; // RTCSessionDescription data
  createdAt: Date;
}

export interface WebRTCAnswer {
  id: string;
  offerId: string;
  answer: any; // RTCSessionDescription data
  createdAt: Date;
}

export interface ICECandidate {
  id: string;
  roomId: string;
  userId: string;
  candidate: any; // RTCIceCandidate data
  createdAt: Date;
}