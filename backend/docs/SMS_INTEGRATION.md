# SMS Integration - Phone Verification

## Overview
The phone verification system uses Twilio to send OTP codes to Indian mobile numbers (+91).

## Setup

### 1. Install Twilio SDK
```bash
cd backend
npm install twilio
```

### 2. Configure Environment Variables
Add these to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### 3. Get Twilio Credentials

1. **Sign up for Twilio**: https://www.twilio.com/try-twilio
2. **Get your Account SID & Auth Token** from the Twilio Console Dashboard
3. **Purchase a phone number** that supports SMS (must be India-enabled for +91 numbers)

### 4. Testing

**Development Mode (No SMS sent):**
- OTP is logged to console
- OTP is included in API response
- No Twilio account needed

```bash
NODE_ENV=development npm run dev
```

**Production Mode (SMS sent via Twilio):**
```bash
NODE_ENV=production npm start
```

## API Usage

### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

**Response (Development):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

**Response (Production):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### Verify OTP
```http
POST /api/auth/verify-phone
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

## Features

✅ **Auto-detection**: SMS only sent if Twilio credentials are configured
✅ **Graceful fallback**: System works in dev mode without Twilio
✅ **Rate limiting**: Built-in Redis-based rate limiting
✅ **Indian numbers**: Validates 10-digit Indian mobile format (6-9 starting)
✅ **Expiry**: OTP valid for 5 minutes
✅ **Attempt tracking**: Max 3 attempts per OTP

## Error Handling

The system handles SMS failures gracefully:
- SMS sending errors are logged but don't block the API
- OTP is still stored in Redis for verification
- In development, OTP is always logged to console

## Security

- OTP stored in Redis with TTL (5 minutes)
- Phone numbers validated with regex
- JWT token required for OTP verification
- Rate limiting prevents abuse
- OTP only returned in development mode

## Costs

**Twilio SMS Pricing (India):**
- ~$0.0355 per SMS to Indian mobile numbers
- Free trial includes $15 credit (~422 SMS)
- Pay-as-you-go after trial

**Alternative: MSG91**
If you prefer MSG91 (Indian provider):
1. Replace Twilio SDK with MSG91 REST API
2. Update environment variables
3. Modify the SMS sending code in `auth.ts:1142`

## Troubleshooting

**SMS not sending?**
1. Check Twilio credentials are correct
2. Verify phone number is India-enabled
3. Check Twilio account balance
4. Review console logs for error messages

**OTP not received?**
1. Verify phone number format (10 digits, starts with 6-9)
2. Check if number is valid/active
3. Try with different phone number
4. Check Twilio delivery logs in dashboard

## Monitoring

View SMS delivery status in Twilio Console:
- Navigate to Monitor → Logs → Messaging
- Filter by date/phone number
- Check delivery status and errors
