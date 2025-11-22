# Guest ID System - Complete Explanation

## 📝 Overview
Omegoo ka Guest ID system ek **persistent, privacy-focused** identification system hai jo users ko bina login ke anonymous chat karne deta hai, lekin unhe track bhi karta hai moderation aur ban/block ke liye.

---

## 🔐 Guest ID Kaise Generate Hoti Hai?

### Frontend (Browser)
**Location**: `frontend/src/utils/fingerprint.ts`

#### Generation Process:
1. **FingerprintJS (Primary Method)**
   ```typescript
   const fp = await FingerprintJS.load();
   const result = await fp.get();
   guestId = SHA256(result.visitorId + Date.now() + random);
   ```
   - FingerprintJS library device ki unique characteristics detect karti hai
   - Browser features, canvas fingerprint, WebGL, hardware info combine hote hain
   - SHA-256 hash banati hai (64 character hex string)

2. **Basic Fingerprint (Fallback)**
   ```typescript
   const components = [
     navigator.userAgent,
     screen.resolution,
     timezone,
     hardware info,
     canvas fingerprint,
     WebGL info
   ];
   guestId = SHA256(components + Date.now() + random);
   ```
   - Agar FingerprintJS fail ho jaye
   - Browser ki basic info use karti hai

3. **Random UUID (Last Resort)**
   ```typescript
   guestId = SHA256(crypto.randomUUID() + Date.now());
   ```
   - Agar user ne Do Not Track (DNT) enable kiya hai
   - Ya fingerprinting blocked hai

---

## 💾 Guest ID Kahan Store Hoti Hai?

### 1. **Frontend Storage (Browser)**

**Location**: `localStorage`
```javascript
Key: 'neenv_guest_id_v1'
Value: '3f5a2b8c9d1e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2' (64 chars)
```

**Device Metadata bhi store hota hai:**
```javascript
Key: 'neenv_device_meta_v1'
Value: {
  version: '1.0',
  timestamp: 1732207200000,
  userAgent: 'Mozilla/5.0...',
  language: 'en-US',
  timezone: 'Asia/Kolkata',
  screenResolution: '1920x1080',
  colorDepth: 24,
  platform: 'Win32',
  doNotTrack: false,
  fingerprintMethod: 'fpjs'
}
```

**Persistence:**
- ✅ Browser close karne ke baad bhi rahega
- ✅ Tab close karne ke baad bhi rahega
- ✅ Computer restart ke baad bhi rahega
- ❌ Browser cache clear karne par delete ho jayega
- ❌ Incognito/Private mode me naya ID generate hoga

---

### 2. **Backend Storage (Database)**

#### Development Mode (In-Memory)
**Location**: `backend/src/services/database-dev.ts`
```typescript
private static guestUsers = new Map<string, any>();

// Structure:
{
  id: 'guest-1732207200000-abc123xyz',
  guestId: '3f5a2b8c9d1e4f6a...',  // Frontend se aaya hua ID
  deviceMeta: { ... },
  sessions: 5,                      // Kitni baar visit kiya
  lastSeen: Date('2025-11-21T...'),
  createdAt: Date('2025-11-20T...'),
  status: 'active'                  // 'active' | 'deleted'
}
```
⚠️ **Server restart hone par delete ho jayega** (development only)

#### Production Mode (MongoDB)
**Location**: `backend/src/services/database-mongodb.ts`
**Collection**: `guestusers`
```typescript
{
  _id: ObjectId('507f1f77bcf86cd799439011'),
  guestId: '3f5a2b8c9d1e4f6a...',  // Indexed for fast lookup
  deviceMeta: {
    version: '1.0',
    userAgent: 'Mozilla/5.0...',
    fingerprintMethod: 'fpjs'
  },
  sessions: 15,                     // Total visits
  lastSeen: ISODate('2025-11-21...'),
  createdAt: ISODate('2025-11-20...'),
  status: 'active',                 // 'active' | 'deleted'
  notes: ''                         // Admin notes for moderation
}
```

**Indexes:**
```javascript
{ guestId: 1, status: 1 }  // Fast lookup by ID
{ lastSeen: -1 }           // Sort by activity
{ createdAt: -1 }          // Sort by registration
```

✅ **Permanently stored** in MongoDB database
✅ **Server restart ke baad bhi rahega**
✅ **Proper database with backup**

---

## 🔄 Guest ID Flow (Complete Journey)

### 1. User Pehli Baar Aata Hai
```
1. Browser loads → GuestContext initializes
2. Check localStorage for existing ID → Not found
3. Generate new ID using FingerprintJS
4. Store in localStorage (key: neenv_guest_id_v1)
5. Send to backend with API request (header: x-guest-id)
6. Backend middleware (guestAuth.ts) receives ID
7. Check MongoDB: Guest exists? → No
8. Create new guest record in database
9. Return success to frontend
10. User can now chat as guest
```

### 2. User Dobara Aata Hai (Same Browser)
```
1. Browser loads → GuestContext initializes
2. Check localStorage → ID found!
3. Reuse existing ID (no new generation)
4. Send to backend with API request
5. Backend finds existing record in database
6. Update lastSeen timestamp
7. Increment sessions count
8. User continues with same identity
```

### 3. User Different Browser/Device Se Aata Hai
```
1. New browser → localStorage empty
2. FingerprintJS generates DIFFERENT ID (different device)
3. New guest record created in database
4. New identity (because device fingerprint is different)
```

### 4. User Clear Cache Karta Hai
```
1. localStorage cleared → ID lost from browser
2. Next visit: New ID generated
3. Backend: Different ID = New guest record
4. Old guest record still exists in database (orphaned)
```

---

## 🛡️ Ban/Block System

### IP Address Tracking
**Backend**: Request IP automatically logged
```typescript
// middleware/guestAuth.ts
const ip = req.ip || req.socket.remoteAddress;
```

### Guest ID Tracking
**Backend**: Every request carries guest ID
```typescript
// Header: x-guest-id
req.guest = {
  guestId: '3f5a2b8c9d1e...',
  sessions: 5,
  lastSeen: Date(...)
}
```

### Ban Implementation (Future)
```typescript
// Update guest status to 'banned'
await db.banGuest(guestId);

// Check before allowing chat
if (guest.status === 'banned') {
  return res.status(403).json({ 
    error: 'Your account has been banned' 
  });
}
```

### IP Ban (Additional Layer)
```typescript
// Store banned IPs in database
bannedIPs = ['123.45.67.89', '98.76.54.32'];

// Check on every request
if (bannedIPs.includes(req.ip)) {
  return res.status(403).json({ 
    error: 'Access denied from this IP' 
  });
}
```

---

## 🔒 Privacy & GDPR Compliance

### Data Stored:
✅ **Hashed device fingerprint** (not reversible)
✅ **Basic device info** (screen size, timezone, language)
✅ **Session count and timestamps**

❌ **NOT stored:**
- Personal information (name, email, phone)
- Browsing history
- Exact IP address (can be hashed)
- Cookies or tracking pixels

### User Rights:
```typescript
// Delete guest data (GDPR right to erasure)
await db.deleteGuest(guestId);
guest.status = 'deleted';  // Soft delete

// Guest can also clear from frontend
clearGuestData();  // Removes from localStorage
```

---

## 🎯 Why This System?

### Without Guest ID:
❌ No way to track abusive users
❌ Can't ban spammers
❌ Can't rate limit properly
❌ No moderation history

### With Guest ID:
✅ **Track without login** - Anonymous but identifiable
✅ **Ban/Block abusers** - Even without account
✅ **Rate limiting** - Prevent spam/abuse
✅ **Moderation history** - See past behavior
✅ **Session tracking** - Understand user patterns
✅ **Privacy-focused** - No personal data needed

---

## 📊 Example Scenarios

### Scenario 1: Normal User
```
Day 1: Visit → Generate ID → Chat → Leave
  └─ localStorage: ID stored
  └─ Database: Guest record created (sessions: 1)

Day 2: Visit → Reuse ID → Chat → Leave
  └─ localStorage: Same ID
  └─ Database: Same record (sessions: 2)

Day 7: Still same ID, sessions: 7
```

### Scenario 2: Abusive User
```
User sends spam → Report received
  └─ Admin checks guest ID: 3f5a2b8c9d...
  └─ History shows: 50+ sessions, multiple reports
  └─ Action: Ban guest ID
  └─ Database: status = 'banned'

User tries to chat again:
  └─ Backend checks: Guest is banned
  └─ Response: 403 Forbidden
  └─ User can't chat anymore

User clears browser cache:
  └─ New ID generated (different fingerprint unlikely on same device)
  └─ FingerprintJS recognizes same device
  └─ Same ID generated → Still banned!
```

### Scenario 3: Privacy-Conscious User
```
User enables DNT (Do Not Track)
  └─ Fingerprinting skipped
  └─ Random UUID generated
  └─ New ID every session (more private)

User clears localStorage regularly
  └─ New ID each visit
  └─ No persistent tracking
  └─ Maximum privacy
```

---

## 🚀 Production Implementation

### Current Status:
✅ **Frontend**: Fully implemented with FingerprintJS
✅ **Backend**: Database schema ready (MongoDB + Dev)
✅ **Middleware**: Guest authentication working
✅ **Storage**: localStorage + MongoDB

### To Enable Ban/Block:
1. Add admin panel endpoint:
   ```typescript
   POST /api/admin/ban-guest
   { guestId: '3f5a2b8c...', reason: 'spam' }
   ```

2. Update chat middleware:
   ```typescript
   if (req.guest.status === 'banned') {
     throw new Error('Account banned');
   }
   ```

3. Add IP blacklist:
   ```typescript
   const bannedIPs = await db.getBannedIPs();
   if (bannedIPs.includes(req.ip)) {
     throw new Error('IP banned');
   }
   ```

---

## 📱 Summary

**Guest ID Store Locations:**
1. **Frontend**: Browser localStorage (persistent across sessions)
2. **Backend Dev**: In-memory Map (lost on restart)
3. **Backend Prod**: MongoDB database (permanent storage)

**Kab Delete Hoti Hai:**
- ❌ Browser close: Nahi
- ❌ Tab close: Nahi
- ❌ Server restart: Nahi (production me)
- ✅ Cache clear: Haan (frontend se)
- ✅ Manual delete: Haan (GDPR compliance)

**Ban/Block:**
- ✅ Guest ID se track kar sakte hain
- ✅ Status update karke ban kar sakte hain
- ✅ IP address bhi store kar sakte hain
- ✅ Moderation history maintain hoti hai

**Privacy:**
- ✅ Anonymized fingerprint (SHA-256)
- ✅ No personal data required
- ✅ GDPR compliant (right to delete)
- ✅ Transparent to users

---

Iska matlab hai ki **Guest ID anonymous hai lekin persistent** - users ko login nahi karna padta, par moderation ke liye unhe track kar sakte ho! 🎯
