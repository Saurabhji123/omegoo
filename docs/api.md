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