# Omegoo PWA - API Documentation

## Authentication Endpoints

### POST /api/auth/register
Register a new user with age verification.

**Request Body:**
```json
{
  "age": 25,
  "deviceFingerprint": "unique-device-id",
  "termsAccepted": true,
  "privacyAccepted": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "tier": 0
  }
}
```

### POST /api/auth/login
Login with existing user credentials.

**Request Body:**
```json
{
  "deviceFingerprint": "unique-device-id"
}
```

### POST /api/auth/verify-otp
Verify OTP for tier progression.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

### POST /api/auth/forgot-password
Send a password reset link to the user's registered email. The response is always success to avoid user enumeration.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a password reset link shortly."
}
```

### POST /api/auth/validate-reset-token
Validate a password reset token before showing the reset form. Returns a 400 error if the token is invalid or expired.

**Request Body:**
```json
{
  "token": "reset-token"
}
```

### POST /api/auth/reset-password
Set a new password using a valid reset token. All existing sessions are revoked when the password changes.

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "newSecurePassword"
}
```

### POST /api/auth/refresh
Refresh JWT token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

## User Endpoints

### GET /api/user/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tier": 1,
    "coins": 100,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/user/tier
Update user tier (requires verification).

### GET /api/user/stats
Get user statistics.

## Chat Endpoints

### POST /api/chat/find-match
Find a random chat partner.

**Request Body:**
```json
{
  "preferences": {
    "chatType": "text|audio|video",
    "minTier": 0,
    "interests": ["music", "movies"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "partnerId": "uuid",
    "chatType": "text"
  }
}
```

### POST /api/chat/end-session
End current chat session.

### GET /api/chat/history
Get chat session history (limited data for privacy).

## Moderation Endpoints

### POST /api/moderation/report
Report inappropriate content or behavior.

**Request Body:**
```json
{
  "sessionId": "uuid",
  "reportType": "inappropriate_content|harassment|spam|other",
  "description": "Detailed description",
  "evidence": {
    "screenshots": ["base64-image"],
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/moderation/user-reports
Get user's submitted reports.

## Payment Endpoints

### POST /api/payment/create-order
Create payment order for coins.

**Request Body:**
```json
{
  "amount": 100,
  "coinPackage": "basic|premium|mega",
  "paymentMethod": "razorpay|stripe"
}
```

### POST /api/payment/verify
Verify payment completion.

### GET /api/payment/history
Get payment history.

## Admin Endpoints

### GET /api/admin/dashboard
Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <admin-token>`

### GET /api/admin/users
Get users list with filters.

### POST /api/admin/ban-user
Ban a user with reason.

### GET /api/admin/reports
Get all user reports.

### PUT /api/admin/reports/:id
Update report status.

### GET /api/admin/analytics/acquisition/map
Fetch aggregated signup distribution by country and region. Accepts the same window and filter query parameters as other analytics endpoints (`days`, `start`, `end`, `gender`, `platform`, `signupSource`, `campaign`).

**Response:**
```json
{
  "success": true,
  "map": {
    "window": {
      "start": "2024-09-01",
      "end": "2024-09-14",
      "days": 14
    },
    "totalSignups": 4820,
    "unknown": 97,
    "countries": [
      {
        "countryCode": "US",
        "name": "United States",
        "signups": 1820,
        "share": 37.7,
        "regions": [
          {
            "regionCode": "CA",
            "subdivisionCode": "US-CA",
            "name": "California",
            "signups": 460,
            "share": 25.3
          }
        ]
      }
    ]
  }
}
```

### GET /api/admin/analytics/acquisition/sources
Fetch top referral sources (source, medium, campaign) for the selected window. Supports the same filter query parameters. Includes previous-window comparisons when available.

**Response:**
```json
{
  "success": true,
  "sources": {
    "window": {
      "start": "2024-09-01",
      "end": "2024-09-14",
      "days": 14
    },
    "totalSignups": 4820,
    "uniqueSources": 38,
    "unknown": 420,
    "sources": [
      {
        "source": "google",
        "medium": "cpc",
        "campaign": "back_to_school",
        "signups": 640,
        "share": 13.3,
        "previousSignups": 510,
        "trendDelta": 25.5
      }
    ]
  }
}
```

## WebSocket Events

### Client to Server Events

#### join-queue
Join matching queue for chat.
```json
{
  "preferences": {
    "chatType": "text",
    "minTier": 0
  }
}
```

#### leave-queue
Leave matching queue.

#### send-message
Send message in chat session.
```json
{
  "sessionId": "uuid",
  "message": "Hello!",
  "type": "text|image|audio"
}
```

#### end-session
End current chat session.

#### webrtc-offer
WebRTC offer for video/audio chat.
```json
{
  "sessionId": "uuid",
  "offer": "webrtc-offer-sdp"
}
```

#### webrtc-answer
WebRTC answer for video/audio chat.

#### webrtc-ice-candidate
WebRTC ICE candidate exchange.

### Server to Client Events

#### match-found
Notify when match is found.
```json
{
  "sessionId": "uuid",
  "partnerId": "uuid",
  "chatType": "text"
}
```

#### message-received
Receive message from partner.
```json
{
  "sessionId": "uuid",
  "message": "Hello!",
  "type": "text",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### session-ended
Notify when session ends.
```json
{
  "sessionId": "uuid",
  "reason": "user_left|timeout|violation"
}
```

#### moderation-alert
Alert for content moderation.
```json
{
  "type": "warning|violation",
  "message": "Content policy violation detected"
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 1001 | INVALID_AGE | User is under 18 years old |
| 1002 | DEVICE_BANNED | Device is banned from platform |
| 1003 | RATE_LIMIT_EXCEEDED | Too many requests |
| 2001 | INVALID_TOKEN | JWT token is invalid or expired |
| 2002 | INSUFFICIENT_TIER | User tier too low for action |
| 3001 | NO_MATCH_FOUND | No matching partner available |
| 3002 | SESSION_NOT_FOUND | Chat session doesn't exist |
| 4001 | PAYMENT_FAILED | Payment processing failed |
| 5001 | CONTENT_VIOLATION | Content violates community guidelines |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/* | 5 requests | 1 minute |
| /api/chat/find-match | 10 requests | 1 minute |
| /api/moderation/report | 3 requests | 5 minutes |
| /api/payment/* | 5 requests | 1 minute |
| WebSocket messages | 60 messages | 1 minute |

## Content Security Policy

All API responses include appropriate security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## CORS Policy

Allowed origins:
- `https://omegoo.app`
- `http://localhost:3000` (development only)

## Data Retention

- Chat messages: Not stored permanently
- Session metadata: 90 days
- Evidence for reports: 90 days
- User accounts: Until deletion requested
- Audit logs: 1 year

---

## Ultra-Fast Text Chat System

### Overview

The text chat system provides instant random pairing with the following guarantees:
- **<1s pairing time**: FIFO queue with 100-300ms matching delay
- **<200ms typing indicators**: Real-time with debouncing
- **Rate limiting**: 10 messages per 10 seconds
- **Reconnection window**: 30 seconds grace period
- **Message buffering**: Last 30 messages for moderation

### Socket Events

#### Client → Server Events

##### `join_text_queue`
Join the text chat queue for instant pairing.

**Payload:** None

**Response Events:**
- `text_queue_joined` - Queue position and estimated wait time
- `text_match_found` - Match found with roomId and partnerId

**Example:**
```javascript
socket.emit('join_text_queue');

socket.on('text_queue_joined', (data) => {
  console.log(`Position: ${data.position}, Wait: ${data.estimatedWaitTime}s`);
});

socket.on('text_match_found', (data) => {
  console.log(`Matched! Room: ${data.roomId}, Partner: ${data.partnerId}`);
});
```

##### `leave_text_queue`
Leave the waiting queue before a match is found.

**Payload:** None

**Response Event:** `text_queue_left`

##### `send_text_message`
Send a message in the active text chat room.

**Payload:**
```json
{
  "content": "Hello! How are you?"
}
```

**Validation:**
- Content: Required, non-empty string
- Max length: 1000 characters
- Rate limit: 10 messages per 10 seconds

**Response Events:**
- `text_message_received` - Message delivered to both users
- `rate_limit_exceeded` - Too many messages sent
- `text_chat_error` - Invalid message or no active room

**Message Object:**
```json
{
  "messageId": "msg_1234567890_abc123",
  "roomId": "text_room_uuid",
  "senderId": "user_id",
  "content": "Hello! How are you?",
  "timestamp": 1700000000000,
  "delivered": true
}
```

##### `text_typing_start`
Notify partner that user started typing.

**Payload:** Empty object `{}`

**Partner receives:** `text_partner_typing`

**Best Practices:**
- Emit on first keystroke
- Debounce with 1-second timeout
- Auto-clear after 3 seconds server-side

##### `text_typing_stop`
Notify partner that user stopped typing.

**Payload:** Empty object `{}`

**Partner receives:** `text_partner_stopped_typing`

**Example:**
```javascript
let typingTimeout;

input.addEventListener('input', () => {
  socket.emit('text_typing_start', {});
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('text_typing_stop', {});
  }, 1000);
});
```

##### `leave_text_room`
Leave the active text chat room.

**Payload:** None

**Response Events:**
- `text_room_ended` with reason: 'user_left'
- Partner receives `text_room_ended` with reason: 'partner_left'

##### `report_text_chat`
Report inappropriate behavior with message context.

**Payload:**
```json
{
  "reportedUserId": "partner_user_id",
  "violationType": "harassment",
  "description": "User was being abusive and threatening"
}
```

**Violation Types:**
- `harassment` - Bullying, threats, abusive language
- `spam` - Advertising, repetitive messages
- `inappropriate` - Sexual content, hate speech
- `other` - Other violations

**Response Events:**
- `text_room_ended` with reason: 'reported'
- `report_submitted` - Confirmation of report

**Saved Data:**
- Last 30 messages with timestamps
- Reporter and reported user IDs
- Violation type and description
- Room metadata

##### `attempt_text_reconnect`
Attempt to reconnect to a text chat room after disconnect.

**Payload:** None

**Reconnection Window:** 30 seconds

**Response Events:**
- `text_reconnected` - Success with room state and messages
- `text_reconnect_failed` - Session expired or room ended

**Reconnection Success:**
```json
{
  "roomId": "text_room_uuid",
  "partnerId": "partner_user_id",
  "messages": [
    // Array of previous messages
  ]
}
```

#### Server → Client Events

##### `text_queue_joined`
Confirmation of joining the queue.

**Payload:**
```json
{
  "position": 5,
  "estimatedWaitTime": 10
}
```

##### `text_match_found`
A match has been found.

**Payload:**
```json
{
  "roomId": "text_room_uuid",
  "partnerId": "partner_user_id"
}
```

##### `text_message_received`
New message in the room.

**Payload:**
```json
{
  "messageId": "msg_1234567890_abc123",
  "roomId": "text_room_uuid",
  "senderId": "user_id",
  "content": "Hello!",
  "timestamp": 1700000000000,
  "delivered": true
}
```

##### `text_partner_typing`
Partner started typing.

**Payload:**
```json
{
  "roomId": "text_room_uuid",
  "userId": "partner_user_id",
  "isTyping": true,
  "timestamp": 1700000000000
}
```

##### `text_partner_stopped_typing`
Partner stopped typing.

**Payload:**
```json
{
  "roomId": "text_room_uuid",
  "userId": "partner_user_id",
  "isTyping": false,
  "timestamp": 1700000000000
}
```

##### `text_room_ended`
Chat room has ended.

**Payload:**
```json
{
  "reason": "partner_left"
}
```

**Reasons:**
- `user_left` - Current user left
- `partner_left` - Partner left the chat
- `partner_disconnected` - Partner lost connection
- `timeout` - Room inactive for 30+ minutes
- `reported` - One user reported the other

##### `rate_limit_exceeded`
User exceeded message rate limit.

**Payload:**
```json
{
  "message": "Rate limit exceeded",
  "remaining": 0
}
```

##### `text_chat_error`
Error occurred in text chat.

**Payload:**
```json
{
  "message": "Error description"
}
```

**Common Errors:**
- "Authentication required"
- "Invalid message content"
- "Message too long (max 1000 characters)"
- "No active text chat room"

##### `text_reconnected`
Successfully reconnected to room.

**Payload:**
```json
{
  "roomId": "text_room_uuid",
  "partnerId": "partner_user_id",
  "messages": []
}
```

##### `text_partner_reconnected`
Partner reconnected to the room.

**Payload:**
```json
{
  "partnerId": "partner_user_id"
}
```

##### `text_reconnect_failed`
Reconnection attempt failed.

**Payload:**
```json
{
  "reason": "Session expired or room no longer exists"
}
```

### Rate Limiting

**Message Rate Limit:**
- **Limit**: 10 messages per 10 seconds
- **Scope**: Per user
- **Tracking**: In-memory with sliding window
- **Violations**: Tracked and logged
- **Response**: `rate_limit_exceeded` event

**Implementation:**
```javascript
// Client-side rate limit tracking
let messageTimestamps = [];

function canSendMessage() {
  const now = Date.now();
  messageTimestamps = messageTimestamps.filter(ts => now - ts < 10000);
  
  if (messageTimestamps.length >= 10) {
    return false;
  }
  
  messageTimestamps.push(now);
  return true;
}
```

### Message Format

**Structure:**
- `messageId`: Unique identifier (e.g., "msg_1234567890_abc123")
- `roomId`: Text chat room identifier
- `senderId`: User who sent the message
- `content`: Message text (1-1000 characters)
- `timestamp`: Unix timestamp in milliseconds
- `delivered`: Boolean delivery status

**Content Validation:**
- Trimmed whitespace
- HTML/script tags removed
- Max length: 1000 characters
- Empty messages rejected

### Moderation Flow

**Report Process:**
1. User clicks report button
2. Selects violation type and provides description
3. System captures:
   - Last 30 messages with timestamps
   - Reporter and reported user IDs
   - Room ID and session metadata
4. Report saved to MongoDB with pending status
5. Room immediately ended
6. Both users notified

**Message Buffering:**
- Circular buffer maintains last 30 messages
- Messages stored in memory during active session
- Saved to database only when reported
- Automatic cleanup after room ends

**Admin Review:**
- Reports appear in admin dashboard
- Full message history available
- Can ban users or dismiss reports
- Audit trail maintained

### Analytics & Metrics

**Tracked Metrics:**
- **Queue Stats**: Current size, peak size
- **Pairing Times**: Median, P50, P95, P99
- **Success Rate**: % of pairings under 1 second
- **Active Rooms**: Current count, total created
- **Session Duration**: Average, total
- **Message Count**: Per session, per user
- **Requeue Rate**: Total requeues, rate per hour
- **Disconnect Reasons**: Categorized breakdown

**Access Analytics:**
```javascript
// Server-side only
const stats = TextChatQueueService.getDetailedAnalytics();

console.log({
  queue: stats.queue.currentSize,
  activeRooms: stats.rooms.active,
  medianPairing: stats.pairing.medianTime,
  underOneSecond: stats.pairing.underOneSecond + '%'
});
```

### Performance Targets

**Pairing:**
- Target: <1 second from queue join to match
- P50: ~500ms
- P95: <1000ms
- Algorithm: FIFO with 150ms matching delay

**Typing Indicators:**
- Latency: <200ms from keystroke to partner display
- Debounce: 1 second client-side
- Auto-clear: 3 seconds server-side

**Message Delivery:**
- Latency: <100ms from send to receive
- Reliability: 99.9% delivery rate
- Ordering: Guaranteed in-order delivery per room

**Scalability:**
- Target: 10,000 concurrent connections
- Memory: <2GB for 10k users
- CPU: <50% on 2-core instance
- Room cleanup: Every 5 minutes

### Mobile Optimization

**Viewport Handling:**
```javascript
// Prevent keyboard from covering input
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const viewport = window.visualViewport;
    chatContainer.style.height = `${viewport.height}px`;
    scrollToBottom();
  });
}
```

**Touch Optimization:**
- Large touch targets (min 44x44px)
- Swipe gestures for common actions
- Optimized keyboard handling
- Auto-scroll on message send

### Error Handling

**Client Errors:**
- Network disconnections: Auto-reconnect with 30s window
- Invalid input: Immediate validation feedback
- Rate limits: Clear countdown display
- Server errors: User-friendly messages

**Server Errors:**
- Graceful degradation
- Automatic cleanup of orphaned rooms
- Memory leak prevention
- Database fallback mechanisms

### Security Considerations

**Input Sanitization:**
- XSS prevention: HTML/script tags stripped
- SQL injection: Parameterized queries only
- Content filtering: Basic profanity detection

**Privacy:**
- No permanent message storage (except reports)
- Anonymous user IDs
- No IP address logging in messages
- GDPR-compliant data deletion

**Rate Limiting:**
- Message rate: 10 per 10 seconds
- Connection rate: Standard socket limits
- Report spam: Tracked per user

---

## Low-Bandwidth Voice Chat System

### Overview

The voice chat system provides high-quality, low-bandwidth voice calling using WebRTC with Opus codec optimization:
- **Permission-friendly**: No mic access until user clicks "Start"
- **Low bandwidth**: 32-64 kbps target for 2G/3G compatibility
- **High quality**: Opus codec at 48kHz with echo cancellation
- **Real-time feedback**: Dynamic waveform visualization
- **Reconnection**: 30-second grace period for network issues

### Architecture

**Technology Stack:**
- **WebRTC**: Peer-to-peer audio streaming
- **Opus Codec**: 48kHz, mono, 32-64kbps bitrate
- **Socket.IO**: Signaling server for SDP/ICE exchange
- **Web Audio API**: Real-time audio analysis for waveforms
- **STUN/TURN**: NAT traversal (STUN included, TURN optional)

**Audio Processing:**
- Echo cancellation: Enabled
- Noise suppression: Enabled
- Auto gain control: Enabled
- Sample rate: 48kHz (Opus optimal)
- Channel count: 1 (mono for bandwidth)

### Socket Events

#### Client → Server Events

##### `join_voice_queue`
Join the voice chat queue for instant pairing.

**Payload:**
```json
{
  "maxBitrate": 64  // Optional: max bitrate in kbps
}
```

**Response Events:**
- `voice_queue_joined` - Queue position and wait time
- `voice_match_found` - Match found with roomId and partnerId

**Example:**
```javascript
socket.emit('join_voice_queue', { maxBitrate: 64 });

socket.on('voice_queue_joined', (data) => {
  console.log(`Position: ${data.position}, Wait: ${data.estimatedWaitTime}s`);
});

socket.on('voice_match_found', (data) => {
  console.log(`Matched! Room: ${data.roomId}, Partner: ${data.partnerId}`);
  // Initialize WebRTC connection
});
```

##### `leave_voice_queue`
Leave the waiting queue before a match is found.

**Payload:** None

**Response Event:** `voice_queue_left`

##### `voice_webrtc_signal`
Exchange WebRTC signaling data (SDP offers/answers and ICE candidates).

**Payload:**
```json
{
  "type": "offer" | "answer" | "ice-candidate",
  "roomId": "voice_room_uuid",
  "targetId": "partner_user_id",
  "payload": {
    "sdp": {  // For offer/answer
      "type": "offer" | "answer",
      "sdp": "v=0\r\no=- ..."
    },
    "candidate": {  // For ICE candidates
      "candidate": "candidate:...",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }
}
```

**Signal Types:**

1. **Offer** - Sent by initiator:
```javascript
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

socket.emit('voice_webrtc_signal', {
  type: 'offer',
  roomId,
  targetId: partnerId,
  payload: { sdp: offer }
});
```

2. **Answer** - Sent by receiver:
```javascript
await peerConnection.setRemoteDescription(offer);
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

socket.emit('voice_webrtc_signal', {
  type: 'answer',
  roomId,
  targetId: partnerId,
  payload: { sdp: answer }
});
```

3. **ICE Candidate** - Sent by both peers:
```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('voice_webrtc_signal', {
      type: 'ice-candidate',
      roomId,
      targetId: partnerId,
      payload: { candidate: event.candidate }
    });
  }
};
```

##### `voice_muted`
Notify partner of mute status change.

**Payload:**
```json
{
  "isMuted": true
}
```

**Partner receives:** `voice_partner_muted`

##### `leave_voice_room`
Leave the active voice call.

**Payload:** None

**Response Events:**
- `voice_room_ended` with reason: 'user_left'
- Partner receives `voice_room_ended` with reason: 'partner_left'

##### `report_voice_chat`
Report inappropriate behavior with call metadata.

**Payload:**
```json
{
  "reportedUserId": "partner_user_id",
  "violationType": "harassment",
  "description": "User was being abusive"
}
```

**Violation Types:**
- `harassment` - Threats, abusive language
- `spam` - Advertising, spam
- `inappropriate` - Sexual content, hate speech
- `other` - Other violations

**Response Events:**
- `voice_room_ended` with reason: 'reported'
- `report_submitted` - Confirmation

**Saved Data:**
- Call duration and quality metrics
- Reporter and reported user IDs
- Violation details
- Session metadata (packet loss, jitter, bitrate)

##### `voice_metrics`
Send audio quality metrics to server for monitoring.

**Payload:**
```json
{
  "packetLoss": 1.2,
  "jitter": 15.5,
  "currentBitrate": 48,
  "averageBitrate": 52,
  "iceConnectionState": "connected",
  "callDuration": 120
}
```

**Frequency:** Every 2 seconds during active call

##### `attempt_voice_reconnect`
Attempt to reconnect to voice call after disconnect.

**Payload:** None

**Reconnection Window:** 30 seconds

**Response Events:**
- `voice_reconnected` - Success with room state
- `voice_reconnect_failed` - Session expired

#### Server → Client Events

##### `voice_queue_joined`
Confirmation of joining the queue.

**Payload:**
```json
{
  "position": 3,
  "estimatedWaitTime": 15
}
```

##### `voice_match_found`
A match has been found.

**Payload:**
```json
{
  "roomId": "voice_room_uuid",
  "partnerId": "partner_user_id"
}
```

##### `voice_webrtc_signal`
Relayed WebRTC signaling from partner.

**Payload:**
```json
{
  "type": "offer" | "answer" | "ice-candidate",
  "roomId": "voice_room_uuid",
  "senderId": "partner_user_id",
  "payload": {
    "sdp": { ... } // or "candidate": { ... }
  }
}
```

##### `voice_partner_muted`
Partner changed mute status.

**Payload:**
```json
{
  "partnerId": "partner_user_id",
  "isMuted": true
}
```

##### `voice_room_ended`
Voice call has ended.

**Payload:**
```json
{
  "reason": "partner_left",
  "session": {
    "duration": 180,
    "metrics": { ... }
  }
}
```

**Reasons:**
- `user_left` - Current user left
- `partner_left` - Partner left the call
- `partner_disconnected` - Partner lost connection
- `connection_failed` - WebRTC connection failed
- `reported` - One user reported the other
- `timeout` - Call inactive for 30+ minutes

##### `voice_reconnected`
Successfully reconnected to call.

**Payload:**
```json
{
  "roomId": "voice_room_uuid",
  "partnerId": "partner_user_id",
  "metrics": {
    "callDuration": 45,
    "reconnectAttempts": 1
  }
}
```

##### `voice_partner_reconnected`
Partner reconnected to the call.

**Payload:**
```json
{
  "partnerId": "partner_user_id"
}
```

##### `voice_reconnect_failed`
Reconnection attempt failed.

**Payload:**
```json
{
  "reason": "Session expired or room no longer exists"
}
```

##### `voice_chat_error`
Error occurred in voice chat.

**Payload:**
```json
{
  "message": "Error description"
}
```

**Common Errors:**
- "Authentication required"
- "Room not found"
- "Invalid target user"
- "No active voice room"

### WebRTC Setup

#### Client-Side Implementation

**1. Request Microphone Permission:**
```javascript
// Only after user clicks "Start Voice Chat"
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1
  },
  video: false
});
```

**2. Initialize Peer Connection:**
```javascript
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

const peerConnection = new RTCPeerConnection(config);

// Add local audio track
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});
```

**3. Handle ICE Candidates:**
```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('voice_webrtc_signal', {
      type: 'ice-candidate',
      roomId,
      targetId: partnerId,
      payload: { candidate: event.candidate }
    });
  }
};
```

**4. Handle Remote Track:**
```javascript
peerConnection.ontrack = (event) => {
  const remoteAudio = new Audio();
  remoteAudio.srcObject = event.streams[0];
  remoteAudio.play();
};
```

**5. SDP Modification for Opus:**
```javascript
function modifySdpForOpus(sdp) {
  // Prioritize Opus codec
  sdp = sdp.replace(
    /(m=audio \d+ [\w/]+ )(\d+.+)/,
    (match, prefix, codecs) => {
      const opusPayloadType = sdp.match(/a=rtpmap:(\d+) opus\/48000/)[1];
      const codecList = codecs.split(' ').filter(c => c !== opusPayloadType);
      return `${prefix}${opusPayloadType} ${codecList.join(' ')}`;
    }
  );

  // Set bitrate limit (32-64 kbps)
  sdp = sdp.replace(
    /(a=rtpmap:\d+ opus\/48000.*\r\n)/,
    '$1a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=64000\r\n'
  );

  return sdp;
}
```

### Audio Visualization

**Using Web Audio API for Waveform:**

```javascript
const audioContext = new AudioContext();
const analyzer = audioContext.createAnalyser();
analyzer.fftSize = 2048;

const source = audioContext.createMediaStreamSource(stream);
source.connect(analyzer);

const waveformData = new Uint8Array(analyzer.frequencyBinCount);

function drawWaveform() {
  analyzer.getByteTimeDomainData(waveformData);
  
  // Calculate volume
  let sum = 0;
  for (let i = 0; i < waveformData.length; i++) {
    const value = waveformData[i] - 128;
    sum += Math.abs(value);
  }
  const volume = (sum / waveformData.length) / 128 * 100;
  
  // Detect speaking (threshold: 30%)
  const isSpeaking = volume > 30;
  
  // Draw waveform on canvas
  // ... canvas drawing code
  
  requestAnimationFrame(drawWaveform);
}

drawWaveform();
```

### Permission Handling

**Permission Error Types:**

| Error Name | User-Friendly Message | Solution |
|------------|----------------------|----------|
| NotAllowedError | Microphone access denied | Allow permission in browser settings |
| NotFoundError | No microphone found | Connect a microphone |
| NotReadableError | Microphone in use | Close other apps using microphone |
| OverconstrainedError | Microphone not supported | Use different microphone |

**Permission UX Flow:**
1. User clicks "Start Voice Chat"
2. Request mic permission via `getUserMedia()`
3. If denied, show friendly modal with:
   - Clear explanation why mic needed
   - Step-by-step instructions to allow
   - Retry button
4. If granted, join voice queue

**Best Practices:**
- Never request permission on page load
- Show permission dialog only after explicit user action
- Provide clear, visual feedback when permission required
- Offer alternative (text chat) if permission denied

### Quality Metrics

**Tracked Metrics:**
- **Call Connect Time**: Milliseconds from match to audio streaming
- **Packet Loss**: Percentage of lost audio packets (0-100%)
- **Jitter**: Variation in packet arrival time (milliseconds)
- **Bitrate**: Current and average audio bitrate (kbps)
- **Call Duration**: Total call time (seconds)
- **ICE Connection State**: WebRTC connection status
- **Reconnect Attempts**: Number of reconnection tries

**Target Quality:**
- Connect time: <3 seconds
- Packet loss: <5%
- Jitter: <30ms
- Bitrate: 32-64 kbps
- Reconnect success rate: >90%

### Performance Optimization

**Opus Codec Settings:**
```javascript
// SDP modification for optimal Opus settings
a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=64000

// Parameters explained:
// - minptime=10: Minimum packet time (10ms for low latency)
// - useinbandfec=1: Forward error correction (packet loss resilience)
// - maxaveragebitrate=64000: Max bitrate 64kbps (good quality, low bandwidth)
```

**Bandwidth Adaptation:**
- Start at 64kbps for best quality
- Auto-adjust based on network conditions
- Opus degrades gracefully on poor networks
- Minimum viable bitrate: 16kbps

**Network Resilience:**
- STUN servers for NAT traversal
- ICE candidate gathering for best path
- Automatic reconnection on disconnect
- 30-second grace period for recovery

### Reconnection Logic

**Reconnection Flow:**
1. Detect connection loss (ICE state: `disconnected` or `failed`)
2. Emit `attempt_voice_reconnect` to server
3. Server checks if within 30-second window
4. If valid, restore room state and notify partner
5. Re-establish WebRTC connection
6. Resume call

**Reconnection Window:**
- Duration: 30 seconds from disconnect
- Tracked server-side per user
- Auto-cleanup after window expires

**Implementation:**
```javascript
peerConnection.oniceconnectionstatechange = () => {
  const state = peerConnection.iceConnectionState;
  
  if (state === 'disconnected' || state === 'failed') {
    console.log('Connection lost, attempting reconnect...');
    socket.emit('attempt_voice_reconnect');
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (peerConnection.iceConnectionState !== 'connected') {
        console.log('Reconnection failed');
        endCall();
      }
    }, 30000);
  }
};
```

### Mobile Optimization

**iOS Safari Considerations:**
- `getUserMedia()` requires HTTPS
- Audio playback needs user gesture
- `AudioContext` auto-suspends (call `resume()` on user action)

**Android Chrome:**
- Background audio may pause
- Request persistent notification for ongoing calls
- Handle audio focus changes

**Cross-Platform:**
```javascript
// Resume audio context on user interaction (iOS)
audioContext.resume().then(() => {
  console.log('Audio context resumed');
});

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Optionally pause audio analyzer
  } else {
    audioContext.resume();
  }
});
```

### Security & Privacy

**Data Privacy:**
- Peer-to-peer audio (not routed through server)
- No audio recording or storage
- Session metadata stored for reports only
- GDPR-compliant data handling

**Security Measures:**
- Authentication required for all events
- Rate limiting on queue joins
- Report spam detection
- Ban system for violators

### Troubleshooting

**No Audio Received:**
- Check ICE connection state
- Verify STUN servers accessible
- Confirm audio track added to peer connection
- Check browser audio permissions

**Poor Audio Quality:**
- Monitor packet loss (should be <5%)
- Check jitter (should be <30ms)
- Verify bitrate (target 32-64kbps)
- Test network bandwidth

**Connection Failures:**
- ICE gathering timeout: Add TURN servers
- Firewall blocking UDP: Use TURN with TCP
- NAT traversal issues: Check STUN configuration

**Permission Denied:**
- User blocked in browser settings
- Microphone in use by another app
- Unsupported browser (use Chrome/Edge/Safari)

### Example: Complete Voice Chat Flow

```javascript
// 1. User clicks "Start Voice Chat"
document.getElementById('startBtn').onclick = async () => {
  try {
    // 2. Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      }
    });
    
    // 3. Join voice queue
    socket.emit('join_voice_queue', { maxBitrate: 64 });
    
    // 4. Wait for match
    socket.on('voice_match_found', async ({ roomId, partnerId }) => {
      // 5. Initialize peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // 6. Add local stream
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      // 7. Handle ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('voice_webrtc_signal', {
            type: 'ice-candidate',
            roomId,
            targetId: partnerId,
            payload: { candidate: e.candidate }
          });
        }
      };
      
      // 8. Handle remote audio
      pc.ontrack = (e) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.play();
      };
      
      // 9. Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('voice_webrtc_signal', {
        type: 'offer',
        roomId,
        targetId: partnerId,
        payload: { sdp: offer }
      });
      
      // 10. Handle answer and ICE candidates from partner
      socket.on('voice_webrtc_signal', async (data) => {
        if (data.type === 'answer') {
          await pc.setRemoteDescription(data.payload.sdp);
        } else if (data.type === 'ice-candidate') {
          await pc.addIceCandidate(data.payload.candidate);
        }
      });
    });
    
  } catch (error) {
    console.error('Microphone error:', error);
    showPermissionModal(error);
  }
};
```

### Production Deployment

**TURN Server Setup (Optional but Recommended):**
```javascript
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
};
```

**Monitoring & Alerts:**
- Track average call connect time
- Monitor packet loss and jitter
- Alert on high failure rates
- Log permission denial rates

**Scaling Considerations:**
- Signaling server handles ~10k concurrent calls
- Peer-to-peer audio doesn't load server
- TURN servers needed for ~5-10% of users
- Consider SFU for group calls (future feature)