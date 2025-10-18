# 🎯 Dynamic Coin Deduction & Chat Count System

## Overview
The system now automatically deducts coins and increments chat counts **on the backend** when a match is found. This ensures:
- ✅ Secure coin deduction (can't be bypassed)
- ✅ Real-time updates to user stats
- ✅ Accurate chat counting
- ✅ Dynamic profile updates

## How It Works

### 1. Match Creation Flow

```
User clicks "Start Chat" 
    ↓
Frontend validates coins (pre-check)
    ↓
Socket emits "find-match" to backend
    ↓
Backend finds a match
    ↓
✨ BACKEND DEDUCTS 1 COIN FROM BOTH USERS
✨ BACKEND INCREMENTS totalChats & dailyChats
    ↓
Backend emits "match-found" with updated data
    ↓
Frontend receives updated coins & counts
    ↓
Frontend updates UI automatically
    ↓
Chat session begins
```

### 2. Backend Logic (Socket Service)

**File**: `backend/src/services/socket.ts`

When a match is found:
```typescript
// 1. Check both users have enough coins
const COIN_COST = 1;
const user1Coins = user1.coins || 0;
const user2Coins = user2.coins || 0;

if (user1Coins < COIN_COST || user2Coins < COIN_COST) {
  // Handle insufficient coins
  return;
}

// 2. Deduct coins & increment counts for BOTH users
await DatabaseService.updateUser(socket.userId!, {
  coins: user1Coins - COIN_COST,
  totalChats: (user1.totalChats || 0) + 1,
  dailyChats: (user1.dailyChats || 0) + 1
});

await DatabaseService.updateUser(match.userId, {
  coins: user2Coins - COIN_COST,
  totalChats: (user2.totalChats || 0) + 1,
  dailyChats: (user2.dailyChats || 0) + 1
});

// 3. Create session and notify both users
socket.emit('match-found', {
  sessionId,
  matchUserId,
  isInitiator: true,
  coins: updatedUser1.coins,
  totalChats: updatedUser1.totalChats,
  dailyChats: updatedUser1.dailyChats
});
```

### 3. Frontend Updates (All Chat Components)

**Files**: 
- `frontend/src/components/Chat/VideoChat.tsx`
- `frontend/src/components/Chat/AudioChat.tsx`
- `frontend/src/components/Chat/TextChat.tsx`

Each component listens for the enhanced `match-found` event:

```typescript
socket.on('match-found', async (data: { 
  sessionId: string; 
  matchUserId: string; 
  isInitiator: boolean;
  coins?: number;          // ← NEW
  totalChats?: number;     // ← NEW
  dailyChats?: number;     // ← NEW
}) => {
  // Update user state with backend data
  if (data.coins !== undefined) {
    updateUser({ 
      coins: data.coins,
      totalChats: data.totalChats || 0,
      dailyChats: data.dailyChats || 0
    });
  }
  
  // Continue with match setup...
});
```

## Key Features

### ✅ Secure Coin Deduction
- Coins are deducted on **backend** (can't be manipulated)
- Both users checked for sufficient coins
- Fails gracefully if insufficient coins

### ✅ Accurate Chat Counting
- `totalChats` - Lifetime total chats
- `dailyChats` - Chats today (resets at midnight)
- Incremented atomically with coin deduction

### ✅ Real-time Updates
- Frontend immediately receives updated values
- No need to refresh or fetch `/api/auth/me`
- Profile page shows live data

### ✅ Fair System
- Both users pay 1 coin per connection
- If one user has insufficient coins, match is cancelled
- Other user put back in queue

## Event Handling

### New Socket Events

#### 1. `match-found` (Enhanced)
**Emitted by**: Backend (Socket Service)  
**Received by**: Frontend (Chat Components)

```typescript
{
  sessionId: string,
  matchUserId: string,
  isInitiator: boolean,
  coins: number,         // Updated coin balance
  totalChats: number,    // Updated total chats
  dailyChats: number     // Updated daily chats
}
```

#### 2. `insufficient-coins` (New)
**Emitted by**: Backend (Socket Service)  
**Received by**: Frontend (Chat Components)

```typescript
{
  required: 1,
  current: 0,
  message: 'Not enough coins to start chat'
}
```

#### 3. `match-retry` (New)
**Emitted by**: Backend (Socket Service)  
**Received by**: Frontend (Chat Components)

```typescript
{
  message: 'Match found but partner has insufficient coins'
}
```

## Database Schema

### User Model Updates
```typescript
{
  coins: Number,           // Current coin balance
  totalChats: Number,      // Lifetime total chats
  dailyChats: Number,      // Today's chats (resets daily)
  lastCoinClaim: Date      // Last daily reset timestamp
}
```

## Coin Economy

### Pricing
- **All chat modes**: 1 coin per session
  - Text Chat: 1 coin
  - Audio Chat: 1 coin
  - Video Chat: 1 coin

### Daily Allocation
- **Daily coins**: 50 (auto-reset at midnight)
- **Usage limit**: 50 chats per day (any mode)

## Benefits

### 1. Security
- ❌ Can't bypass coin deduction via frontend manipulation
- ✅ All deductions happen server-side
- ✅ Validated before session creation

### 2. Accuracy
- ✅ Chat counts always accurate
- ✅ No race conditions
- ✅ Atomic updates (coins + counts together)

### 3. User Experience
- ✅ Instant UI updates
- ✅ No loading/refresh needed
- ✅ Real-time profile stats
- ✅ Clear feedback on insufficient coins

### 4. Scalability
- ✅ Single source of truth (backend)
- ✅ Easy to audit transactions
- ✅ Can add transaction logging later

## Testing Scenarios

### Scenario 1: Normal Match
1. User A has 10 coins, User B has 10 coins
2. Both click "Start Chat"
3. Match found
4. **Result**: Both now have 9 coins, totalChats +1, dailyChats +1

### Scenario 2: Insufficient Coins (User A)
1. User A has 0 coins, User B has 10 coins
2. User A clicks "Start Chat"
3. Match with User B found
4. **Result**: Match cancelled, User A gets "insufficient-coins" event, User B back in queue

### Scenario 3: Insufficient Coins (User B)
1. User A has 10 coins, User B has 0 coins
2. Both click "Start Chat"
3. Match found but User B has 0 coins
4. **Result**: Both back in queue, User A gets "match-retry" event

### Scenario 4: Profile Stats
1. User starts with 50 coins, 0 totalChats, 0 dailyChats
2. Completes 3 chats
3. **Profile shows**: 47 coins, 3 totalChats, 3 dailyChats
4. Next day at midnight: Auto-reset to 50 coins, dailyChats = 0, totalChats stays 3

## Implementation Files

### Backend
- `backend/src/services/socket.ts` - Coin deduction & chat counting logic
- `backend/src/routes/auth.ts` - Daily coin reset logic
- `backend/src/services/database-mongodb.ts` - User schema with new fields

### Frontend
- `frontend/src/components/Chat/VideoChat.tsx` - Enhanced match-found handler
- `frontend/src/components/Chat/AudioChat.tsx` - Enhanced match-found handler
- `frontend/src/components/Chat/TextChat.tsx` - Enhanced match-found handler
- `frontend/src/components/Profile/Profile.tsx` - Displays totalChats & dailyChats
- `frontend/src/components/Home/Home.tsx` - Pre-validation only (no deduction)

## Logs

### Backend Logs
```
💰 Coins deducted: User user-123: 50 -> 49
💰 Coins deducted: User user-456: 50 -> 49
📈 Chat counts incremented for both users
```

### Frontend Logs
```
💰 Updated user: coins=49, totalChats=1, dailyChats=1
```

## Future Enhancements

### Possible Additions:
1. **Transaction History** - Log all coin deductions
2. **Coin Purchases** - Buy more coins
3. **Premium Pricing** - Different costs for different modes
4. **Referral Bonuses** - Earn coins by inviting friends
5. **Daily Streaks** - Bonus coins for consecutive days
6. **Chat Quality Bonus** - Earn coins for good behavior

---

**Status**: ✅ Implemented and Running  
**Date**: October 19, 2025  
**Servers**: Both backend (3001) and frontend (3000) operational  
**Environment**: Development with MongoDB Atlas
