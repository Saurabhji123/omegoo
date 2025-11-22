# Load Testing Guide - Ultra-Fast Text Chat

## Overview

This guide provides procedures for load testing the ultra-fast text chat system to validate performance under production-scale load.

**Performance Targets:**
- **10,000 concurrent connections**: System must handle 10k active users
- **<1s pairing time**: 95th percentile must be under 1 second
- **<200ms typing indicators**: End-to-end latency for typing events
- **<100ms message delivery**: From send to receive
- **<2GB memory**: Total backend memory usage
- **<50% CPU**: On 2-core instance

---

## Test Environment

### Minimum Server Specs
- **CPU**: 2 cores (4 recommended for headroom)
- **RAM**: 4GB (2GB for app + 2GB OS/buffers)
- **Network**: 1Gbps uplink
- **Platform**: Render.com, AWS, DigitalOcean, or equivalent

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
FRONTEND_URL=https://omegoo.chat

# MongoDB for production load test
USE_MONGODB=true
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/omegoo

# Redis for queue management (optional but recommended)
REDIS_URL=redis://localhost:6379
```

### Monitoring Setup
Before load testing, ensure monitoring is active:
```bash
# Install monitoring tools
npm install --save clinic autocannon

# PM2 for process monitoring
npm install -g pm2
pm2 start backend/src/index.ts --name omegoo-backend
pm2 monit  # Real-time monitoring
```

---

## Load Testing Tools

### 1. Socket.IO Client (Recommended)

**Installation:**
```bash
npm install --save-dev socket.io-client
```

**Test Script (test-load.js):**
```javascript
const io = require('socket.io-client');

const BACKEND_URL = 'https://omegoo-backend.onrender.com';
const CONCURRENT_USERS = 10000;
const RAMP_UP_TIME = 60000; // 1 minute

let connectedUsers = 0;
let matchedUsers = 0;
let pairingTimes = [];

class TestUser {
  constructor(id) {
    this.id = id;
    this.socket = null;
    this.queueJoinTime = null;
    this.matched = false;
  }

  connect() {
    return new Promise((resolve) => {
      this.socket = io(BACKEND_URL, {
        auth: { token: this.generateTestToken() },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        connectedUsers++;
        if (connectedUsers % 100 === 0) {
          console.log(`Connected: ${connectedUsers}/${CONCURRENT_USERS}`);
        }
        resolve();
      });

      this.socket.on('text_match_found', (data) => {
        const pairingTime = Date.now() - this.queueJoinTime;
        pairingTimes.push(pairingTime);
        matchedUsers++;
        this.matched = true;

        if (matchedUsers % 100 === 0) {
          console.log(`Matched: ${matchedUsers}, Avg pairing: ${this.getAveragePairingTime()}ms`);
        }

        // Simulate chat activity
        this.simulateChat();
      });

      this.socket.on('disconnect', () => {
        connectedUsers--;
      });
    });
  }

  joinQueue() {
    this.queueJoinTime = Date.now();
    this.socket.emit('join_text_queue');
  }

  simulateChat() {
    // Send 5 messages over 30 seconds
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (this.matched) {
          this.socket.emit('send_text_message', {
            content: `Test message ${i + 1} from user ${this.id}`
          });
        }
      }, i * 6000);
    }

    // Leave after 30 seconds
    setTimeout(() => {
      this.socket.emit('leave_text_room');
      this.socket.disconnect();
    }, 30000);
  }

  generateTestToken() {
    // Generate valid JWT for testing
    // In production, use proper auth flow
    return 'test-token-' + this.id;
  }

  getAveragePairingTime() {
    if (pairingTimes.length === 0) return 0;
    return Math.round(pairingTimes.reduce((a, b) => a + b, 0) / pairingTimes.length);
  }
}

async function runLoadTest() {
  console.log(`Starting load test: ${CONCURRENT_USERS} users over ${RAMP_UP_TIME}ms`);
  
  const users = [];
  const delay = RAMP_UP_TIME / CONCURRENT_USERS;

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const user = new TestUser(i);
    users.push(user);

    await user.connect();
    user.joinQueue();

    // Ramp up gradually
    if (i < CONCURRENT_USERS - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Wait for all matches to complete
  await new Promise(resolve => setTimeout(resolve, 60000));

  // Calculate statistics
  const stats = calculateStats(pairingTimes);
  console.log('\n===== LOAD TEST RESULTS =====');
  console.log(`Total users: ${CONCURRENT_USERS}`);
  console.log(`Connected: ${connectedUsers}`);
  console.log(`Matched: ${matchedUsers} (${(matchedUsers / CONCURRENT_USERS * 100).toFixed(1)}%)`);
  console.log(`\nPairing Times:`);
  console.log(`  Median: ${stats.median}ms`);
  console.log(`  P50: ${stats.p50}ms`);
  console.log(`  P95: ${stats.p95}ms`);
  console.log(`  P99: ${stats.p99}ms`);
  console.log(`  Under 1s: ${stats.underOneSecond}%`);
  console.log(`  Min: ${stats.min}ms`);
  console.log(`  Max: ${stats.max}ms`);
  console.log('=============================\n');

  // Cleanup
  users.forEach(user => user.socket && user.socket.disconnect());
}

function calculateStats(times) {
  if (times.length === 0) return {};
  
  const sorted = times.slice().sort((a, b) => a - b);
  const len = sorted.length;

  return {
    median: sorted[Math.floor(len / 2)],
    p50: sorted[Math.floor(len * 0.50)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
    min: sorted[0],
    max: sorted[len - 1],
    underOneSecond: (sorted.filter(t => t < 1000).length / len * 100).toFixed(1)
  };
}

runLoadTest().catch(console.error);
```

**Run the test:**
```bash
node test-load.js
```

### 2. Autocannon (HTTP Endpoints)

For testing REST API endpoints:

```bash
# Install
npm install -g autocannon

# Test authentication endpoint
autocannon -c 100 -d 30 -m POST \
  -H "Content-Type: application/json" \
  -b '{"email":"test@example.com","otp":"123456"}' \
  https://omegoo-backend.onrender.com/api/auth/verify-otp

# Test match-finding endpoint
autocannon -c 100 -d 30 -m POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://omegoo-backend.onrender.com/api/chat/find-match
```

### 3. Artillery (Advanced Scenarios)

**Installation:**
```bash
npm install -g artillery
```

**Test configuration (artillery-config.yml):**
```yaml
config:
  target: "https://omegoo-backend.onrender.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 100
      name: "Ramp to sustained load"
    - duration: 300
      arrivalRate: 200
      name: "Peak load"
  socketio:
    transports: ["websocket"]

scenarios:
  - name: "Text chat flow"
    engine: "socketio"
    flow:
      - emit:
          channel: "join_text_queue"
      - think: 2
      - emit:
          channel: "send_text_message"
          data:
            content: "Hello from Artillery!"
      - think: 5
      - emit:
          channel: "leave_text_room"
```

**Run Artillery test:**
```bash
artillery run artillery-config.yml
```

---

## Test Scenarios

### Scenario 1: Baseline Performance (100 users)
**Goal:** Establish baseline metrics with light load

```bash
# 100 concurrent users, gradual ramp-up
node test-load.js --users=100 --ramp=10000
```

**Expected Results:**
- Pairing time P95: <500ms
- Memory: <500MB
- CPU: <20%

### Scenario 2: Target Load (1,000 users)
**Goal:** Test production-ready performance

```bash
node test-load.js --users=1000 --ramp=30000
```

**Expected Results:**
- Pairing time P95: <800ms
- Memory: <1GB
- CPU: <40%
- Match success rate: >99%

### Scenario 3: Peak Load (10,000 users)
**Goal:** Validate maximum capacity

```bash
node test-load.js --users=10000 --ramp=60000
```

**Expected Results:**
- Pairing time P95: <1000ms
- Memory: <2GB
- CPU: <50%
- Match success rate: >95%

### Scenario 4: Stress Test (15,000 users)
**Goal:** Find breaking point

```bash
node test-load.js --users=15000 --ramp=60000
```

**Expected Results:**
- System should degrade gracefully
- No crashes or memory leaks
- Error messages clear and actionable

### Scenario 5: Reconnection Storm
**Goal:** Test reconnection window under load

```javascript
// Modify test script to disconnect 50% of users randomly
// and attempt reconnection within 30s window
for (let i = 0; i < users.length; i++) {
  if (Math.random() < 0.5) {
    setTimeout(() => {
      users[i].socket.disconnect();
      setTimeout(() => {
        users[i].connect();
        users[i].socket.emit('attempt_text_reconnect');
      }, Math.random() * 25000); // Random delay 0-25s
    }, Math.random() * 10000);
  }
}
```

**Expected Results:**
- Reconnection success rate: >90%
- No duplicate matches
- Message history restored correctly

---

## Metrics to Monitor

### Application Metrics
```javascript
// Add to backend/src/index.ts for monitoring
setInterval(() => {
  const stats = TextChatQueueService.getDetailedAnalytics();
  console.log({
    timestamp: new Date().toISOString(),
    queue: {
      size: stats.queue.currentSize,
      peak: stats.queue.peakSize
    },
    rooms: {
      active: stats.rooms.active,
      total: stats.rooms.totalCreated
    },
    pairing: {
      median: stats.pairing.medianTime,
      p95: stats.pairing.p95,
      underOneSecond: stats.pairing.underOneSecond
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
}, 5000); // Log every 5 seconds during load test
```

### System Metrics (via PM2)
```bash
# CPU and memory monitoring
pm2 monit

# Detailed logs
pm2 logs omegoo-backend

# Process info
pm2 info omegoo-backend
```

### Key Performance Indicators (KPIs)

**Pairing Performance:**
- ✅ PASS: P95 pairing time <1000ms
- ⚠️ WARNING: P95 between 1000-1500ms
- ❌ FAIL: P95 >1500ms

**Message Latency:**
- ✅ PASS: Average <100ms
- ⚠️ WARNING: Average 100-200ms
- ❌ FAIL: Average >200ms

**Typing Indicators:**
- ✅ PASS: Latency <200ms
- ⚠️ WARNING: Latency 200-300ms
- ❌ FAIL: Latency >300ms

**Resource Usage:**
- ✅ PASS: Memory <2GB, CPU <50%
- ⚠️ WARNING: Memory 2-3GB, CPU 50-70%
- ❌ FAIL: Memory >3GB or CPU >70%

**Match Success Rate:**
- ✅ PASS: >95% successful matches
- ⚠️ WARNING: 90-95% successful
- ❌ FAIL: <90% successful

---

## Troubleshooting

### Issue: High pairing times (>2s)

**Possible causes:**
- Queue matching delay too long
- Database queries blocking event loop
- Network latency between services

**Solutions:**
```javascript
// Reduce matching delay in textChatQueue.ts
const MATCH_ATTEMPT_INTERVAL = 100; // Down from 150ms

// Add database connection pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 10
});

// Use Redis for queue instead of in-memory
```

### Issue: Memory leaks

**Detection:**
```bash
# Monitor memory over time
node --max-old-space-size=4096 backend/src/index.ts

# Generate heap snapshot
kill -USR2 $(pgrep -f "node.*index.ts")
```

**Common causes:**
- Room cleanup not running
- Message buffers not cleared
- Socket listeners not removed

**Solutions:**
```javascript
// Ensure cleanup runs regularly
setInterval(() => {
  TextChatRoomService.cleanupInactiveRooms();
}, 300000); // Every 5 minutes

// Clear listeners on disconnect
socket.on('disconnect', () => {
  socket.removeAllListeners();
  TextChatQueueService.handleDisconnect(userId);
});
```

### Issue: Socket disconnections

**Causes:**
- Load balancer timeout
- Network instability
- Server overload

**Solutions:**
```javascript
// Increase ping/pong timeout
const io = new Server(server, {
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000  // 25 seconds
});

// Enable sticky sessions on load balancer
// (Required for Socket.IO with multiple instances)
```

### Issue: Queue starvation

**Symptom:** Users wait indefinitely without matching

**Causes:**
- Odd number of users
- Users leaving queue mid-match
- Race conditions in pairing logic

**Solutions:**
```javascript
// Add timeout to queue waiting
const QUEUE_TIMEOUT = 60000; // 60 seconds

setTimeout(() => {
  if (!user.matched) {
    socket.emit('text_match_failed', {
      reason: 'No suitable match found'
    });
    TextChatQueueService.removeFromQueue(userId);
  }
}, QUEUE_TIMEOUT);
```

---

## Optimization Strategies

### 1. Database Query Optimization

```javascript
// Add indexes for frequent queries
await ReportedChatTranscriptModel.collection.createIndex({ reportedAt: -1 });
await UserModel.collection.createIndex({ activeDeviceToken: 1 });

// Use lean queries for read-only operations
const users = await UserModel.find({}).lean();
```

### 2. Redis Queue Implementation

```javascript
// Replace in-memory queue with Redis for horizontal scaling
class RedisTextChatQueue {
  async joinQueue(userId) {
    await redis.rpush('text_chat_queue', userId);
    return redis.llen('text_chat_queue');
  }

  async tryMatch() {
    const [user1, user2] = await redis.multi()
      .lpop('text_chat_queue')
      .lpop('text_chat_queue')
      .exec();
    
    if (user1 && user2) {
      return this.createMatch(user1, user2);
    }
  }
}
```

### 3. Horizontal Scaling with Sticky Sessions

**Render configuration:**
```yaml
# render.yaml
services:
  - type: web
    name: omegoo-backend
    env: node
    plan: standard
    numInstances: 3  # Scale to 3 instances
    envVars:
      - key: REDIS_URL
        sync: false
    healthCheckPath: /health
```

**Sticky sessions required for Socket.IO:**
- Use Redis adapter for multi-instance sync
- Enable sticky sessions on load balancer

```javascript
const redisAdapter = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(redisAdapter(pubClient, subClient));
```

---

## Success Criteria

Load test is considered **PASSED** if:

✅ All 10,000 users connect successfully  
✅ P95 pairing time <1000ms  
✅ Average message latency <100ms  
✅ Typing indicator latency <200ms  
✅ Match success rate >95%  
✅ Memory usage <2GB  
✅ CPU usage <50% (on 2-core)  
✅ No crashes or uncaught errors  
✅ Reconnection success rate >90%  
✅ No memory leaks over 30-minute test  

Load test is considered **FAILED** if:

❌ Server crashes or becomes unresponsive  
❌ P95 pairing time >1500ms  
❌ Memory usage >3GB  
❌ Match success rate <90%  
❌ Message delivery fails silently  
❌ Reconnection window not respected  

---

## Next Steps After Load Testing

1. **Analyze Results:**
   - Review all metrics logs
   - Identify bottlenecks
   - Document performance characteristics

2. **Optimize if Needed:**
   - Implement Redis queue if memory issues
   - Add database indexes for slow queries
   - Reduce matching delay if under target

3. **Prepare for Production:**
   - Update deployment.md with findings
   - Set up monitoring alerts
   - Configure auto-scaling rules
   - Create incident response runbook

4. **Production Rollout:**
   - Deploy to staging first
   - Run smoke tests
   - Enable monitoring
   - Gradual rollout to production

---

## Additional Resources

- [Socket.IO Performance Tuning](https://socket.io/docs/v4/performance-tuning/)
- [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Artillery Load Testing Guide](https://www.artillery.io/docs/guides/overview/welcome)
