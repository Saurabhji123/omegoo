# Video Chat Testing Guide

## Overview
This guide helps test the new adaptive video chat implementation with:
- ✅ **NO TURN/STUN** servers (direct P2P only)
- ✅ Pre-connect camera preview
- ✅ Adaptive resolution (720p→480p→360p)
- ✅ Audio-only fallback with retry
- ✅ Network quality monitoring

---

## Pre-Testing Setup

### 1. Start Both Services
```powershell
# Terminal 1: Backend
cd C:\Users\Lenovo\Omegoo
npm run dev

# Terminal 2: Frontend (new tab)
cd C:\Users\Lenovo\Omegoo\frontend
npm start
```

### 2. Open Two Browser Windows
- **Window 1**: Chrome (primary test browser)
- **Window 2**: Chrome Incognito (simulate different user)
- URL: http://localhost:3000

---

## Test Scenarios

### ✅ Scenario 1: Camera Preview Modal
**Expected Behavior:**
1. Navigate to `/video-chat`
2. PreviewModal should appear **before** matching
3. Camera preview shows live video feed
4. Video is mirrored by default

**Test Actions:**
- [ ] Verify camera permissions prompt appears
- [ ] Check if video preview displays correctly
- [ ] Toggle mirror view (should flip horizontally)
- [ ] Test resolution selector (360p/480p/720p buttons)
- [ ] Adjust brightness slider (0-100)
- [ ] Click "Start Video Call" → preview should close, matching starts
- [ ] Click "Cancel" → should return to home

**Screenshot Locations:**
- Preview modal with camera feed
- Resolution selector active
- Console logs showing device enumeration

---

### ✅ Scenario 2: Direct Connection (Same Network)
**Setup:** Both users on same LAN/WiFi

**Expected Behavior:**
1. After preview, "Finding someone..." overlay appears
2. Match found → "Connecting..." status badge (yellow)
3. WebRTC negotiates with **host candidates only**
4. Connection success → "Connected" badge (green)
5. Both users see each other's video

**Test Actions:**
- [ ] Window 1: Start video call
- [ ] Window 2: Start video call
- [ ] Verify match occurs within 5 seconds
- [ ] Check browser console for ICE candidates (should see `typ:host` only)
- [ ] Confirm both videos display (remote full screen, local PIP bottom-right)
- [ ] Verify network quality bars show (green = excellent)
- [ ] Check resolution label (should default to 720p desktop, 480p mobile)

**Console Verification:**
```javascript
// Should see logs like:
[VideoChat] Match found: {sessionId, partnerId, isInitiator}
[WebRTC] ICE candidate: typ: host (NO relay/srflx)
[VideoChat] Connection state: connected
[NetworkMonitor] Quality: excellent (RTT: <50ms)
```

**Success Criteria:**
- ✅ Connection establishes within 10 seconds
- ✅ Video quality is smooth (no freezing)
- ✅ Local video is mirrored in PIP
- ✅ No TURN/STUN servers used (check ICE candidates)

---

### ✅ Scenario 3: Adaptive Quality Under Network Stress
**Setup:** Chrome DevTools Network Throttling

**Test Actions:**
1. Window 1: Open DevTools (F12) → Network tab
2. Select throttling: **Fast 3G** or **Slow 3G**
3. Start video call and wait for match
4. Observe resolution changes in status indicator

**Expected Behavior:**
- Initial resolution: 720p (desktop) or 480p (mobile)
- After 3-5 seconds of poor quality → stepdown to 480p
- If still poor → stepdown to 360p
- Status indicator updates: "720p" → "480p" → "360p"
- Network quality bars turn yellow/orange
- "Poor Network Connection" red banner appears if critical

**Verification Steps:**
- [ ] Watch resolution label change dynamically
- [ ] Verify video remains smooth (prioritize smoothness over quality)
- [ ] Check console logs for resolution changes:
  ```
  [ResolutionManager] Stepping down: 720p → 480p (reason: poor network)
  [AdaptiveBitrate] Applied bitrate: 500kbps for 480p
  ```
- [ ] Remove throttling → should step back up to 720p after 5-10 seconds

---

### ✅ Scenario 4: Audio-Only Fallback
**Setup:** Block video track after connection

**Test Actions:**
1. Connect two users successfully
2. In Window 1 DevTools console, run:
   ```javascript
   // Simulate video failure
   const localVideo = document.querySelector('video');
   const stream = localVideo.srcObject;
   stream.getVideoTracks()[0].stop();
   ```
3. Wait 5 seconds

**Expected Behavior:**
- After 5s with 0 framesReceived → automatic fallback
- Status indicator changes to **"Audio-Only"** (orange badge)
- Orange banner appears: "Video unavailable. You're in audio-only mode."
- **"Retry Video"** button appears in banner
- Audio continues uninterrupted (no black screen)

**Test Actions:**
- [ ] Verify audio-only badge appears
- [ ] Confirm audio still works (speak in Window 1, hear in Window 2)
- [ ] Click "Retry Video" button
- [ ] Check if video recovers (should request camera again)
- [ ] If retry fails, banner should remain

**Console Verification:**
```javascript
[EnhancedWebRTC] No video frames detected after 5s, falling back to audio
[VideoCallLogger] Video fallback: reason=no_frames_received
[EnhancedWebRTC] Retry video attempt...
```

---

### ✅ Scenario 5: Next Match & Reconnection
**Test Actions:**
1. Connect two users
2. Window 1: Click **"Next Match"** button
3. Observe behavior

**Expected Behavior:**
- Current connection closes cleanly
- WebRTC peer connection terminated
- "Finding someone..." overlay reappears
- New match found → repeat connection flow
- Local video stream persists (no need to re-request camera)

**Verification:**
- [ ] Previous partner's video disappears immediately
- [ ] New match found within 5 seconds
- [ ] New connection establishes successfully
- [ ] Camera preview not shown again (stream reused)

---

### ✅ Scenario 6: Mobile Camera Controls
**Setup:** Test on mobile device or Chrome DevTools mobile emulation

**Test Actions:**
1. Open http://localhost:3000/video-chat on mobile
2. Preview modal should show camera flip button (front ↔ back)
3. Default resolution: 480p

**Expected Behavior:**
- **Mobile Detection**: User agent + screen width ≤ 768px
- **Default Resolution**: 480p (not 720p)
- **Camera Flip Button**: Visible on mobile only
- **Facing Mode**: Default to 'user' (front camera)

**Test Actions:**
- [ ] Verify 480p is pre-selected in preview
- [ ] Tap camera flip button → should switch to environment (back) camera
- [ ] Start call → verify 480p maintained throughout
- [ ] Check adaptive quality downgrades to 360p if needed (24fps on mobile)

**Console Verification:**
```javascript
[CameraPreview] Mobile device detected
[CameraPreview] Default resolution: 480p
[ResolutionManager] Mobile optimized tier: 480p
```

---

### ✅ Scenario 7: Cross-Browser Testing

#### Chrome Desktop ✅
- [ ] Camera preview works
- [ ] Direct connection succeeds
- [ ] Adaptive quality functional
- [ ] Audio-only fallback works

#### Firefox Desktop 🔧
- [ ] getUserMedia permissions
- [ ] WebRTC without TURN/STUN
- [ ] Video rendering correct
- [ ] ICE gathering (host candidates only)

#### Safari Desktop 🍎
- [ ] Camera permissions prompt
- [ ] getUserMedia constraints support
- [ ] Video element autoplay
- [ ] Resolution adaptation

#### Chrome Android 📱
- [ ] Camera permissions
- [ ] Front/back camera flip
- [ ] 480p default resolution
- [ ] Touch controls responsive

#### Safari iOS 🍎📱
- [ ] Camera permissions strict
- [ ] getUserMedia on HTTPS only (use ngrok for remote testing)
- [ ] facingMode switching
- [ ] Video element inline playback

---

## Diagnostic Tools

### 1. Export Diagnostic Logs
Open browser console and run:
```javascript
// Access VideoCallLogger from EnhancedWebRTC instance
const logs = window.videoCallLogger?.exportDiagnostics();
console.log(logs);

// Or export JSON
const jsonLogs = window.videoCallLogger?.exportLogs();
console.log(JSON.stringify(jsonLogs, null, 2));
```

### 2. Check ICE Candidates
Verify NO TURN/STUN servers used:
```javascript
// Should see only typ:host (NOT srflx or relay)
// In console, filter logs for "ICE candidate"
// Example good candidate:
// candidate:1 1 UDP 2122194687 192.168.1.100 54321 typ host
```

### 3. Monitor Network Quality
```javascript
// EnhancedWebRTC exposes current quality
const webrtc = window.webrtcServiceInstance; // if exposed
const quality = webrtc?.getCurrentNetworkQuality();
// Should return: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
```

---

## Acceptance Criteria Validation

### ✅ Criterion 1: >98% Connection Success
**Test:** Connect 50 times on same network
**Target:** ≥ 49 successful connections
**Method:**
1. Automate match requests (script or manual count)
2. Track success/failure ratio
3. Same network should achieve 100% (host candidates work)
4. Different networks may fail without TURN/STUN (expected)

### ✅ Criterion 2: Zero Black Screens
**Test:** Force video failure 10 times
**Target:** Audio continues in all cases
**Method:**
1. Stop video tracks after connection
2. Verify audio-only fallback activates
3. Confirm no "black screen hang"
4. Retry video button functional

### ✅ Criterion 3: Adaptive Quality Works
**Test:** Throttle network during call
**Target:** Resolution steps down within 5 seconds
**Method:**
1. Chrome DevTools → Fast 3G throttle
2. Observe resolution label change (720p → 480p → 360p)
3. Remove throttle → should step back up
4. Video should remain smooth (no freezing)

### ✅ Criterion 4: Smooth Video Prioritized
**Test:** Compare frame drops under stress
**Target:** Fewer dropped frames than static high resolution
**Method:**
1. Use Chrome's WebRTC internals (chrome://webrtc-internals)
2. Compare "framesDropped" with/without adaptive control
3. Adaptive should show fewer drops (lower resolution but smoother)

---

## Troubleshooting

### Issue: Camera Permission Denied
**Solution:**
- Chrome: Settings → Privacy → Camera → Allow
- Firefox: about:preferences#privacy → Permissions → Camera
- Clear site data and refresh

### Issue: No ICE Candidates Generated
**Solution:**
- Check firewall blocking UDP
- Verify browser supports getUserMedia
- Test on localhost first (permissions easier)

### Issue: Connection Stuck at "Connecting..."
**Solution:**
- Check backend Socket.io running (port 5000)
- Verify WebSocket connection in DevTools Network tab
- Look for CORS errors in console

### Issue: Video Freezes/Black Screen
**Solution:**
- Should auto-fallback to audio after 5s
- If not, check `startVideoFrameDetection()` timeout
- Verify `framesReceived` stat being tracked

### Issue: Resolution Not Adapting
**Solution:**
- Check NetworkMonitor is polling stats
- Verify getStats() returns valid data
- Ensure AdaptiveBitrateController is initialized
- Look for debounce logs (3s delay expected)

---

## Success Metrics Summary

| Criterion | Target | How to Verify |
|-----------|--------|---------------|
| Connection Success Rate | >98% | Count successful matches |
| Zero Black Screens | 100% | Force video failure, audio continues |
| Preview Shows First | 100% | Navigate to /video-chat |
| Adaptive Quality Works | Yes | Network throttle → resolution changes |
| Audio Fallback Activates | <5s | Stop video track → fallback within 5s |
| Retry Video Works | >80% | Click retry → camera re-requested |
| Mobile 480p Default | 100% | Mobile devices start at 480p |
| NO TURN/STUN Used | 100% | ICE candidates typ:host only |

---

## Next Steps After Testing

1. **Document Browser Compatibility:**
   - Create matrix: Chrome ✅, Firefox ✅, Safari ⚠️, etc.

2. **Performance Benchmarks:**
   - Measure average connection time
   - Track resolution change response time
   - Monitor CPU/memory usage

3. **Known Limitations:**
   - Users behind symmetric NAT will fail (no TURN)
   - Corporate firewalls may block UDP
   - Audio-only fallback is best effort

4. **Future Enhancements:**
   - Add TURN servers for production (failover)
   - Implement quality auto-adjust on mobile data
   - Add "Switch Camera" button on desktop (if multiple cameras)

---

**Testing Completed:** ___/___/2025  
**Tester:** _________________  
**Environment:** Local Development / Staging / Production  
**Overall Result:** ✅ Pass / ⚠️ Partial / ❌ Fail
