// Test script to simulate multiple users for Omegoo
const io = require('socket.io-client');

console.log('🧪 Starting multi-user test...');

// Create first user
const user1 = io('http://localhost:3001', {
  auth: { token: 'guest' },
  transports: ['websocket', 'polling']
});

// Create second user
const user2 = io('http://localhost:3001', {
  auth: { token: 'guest' },
  transports: ['websocket', 'polling']
});

let user1Connected = false;
let user2Connected = false;

user1.on('connect', () => {
  console.log('✅ User 1 connected:', user1.id);
  user1Connected = true;
  checkAndStartTest();
});

user2.on('connect', () => {
  console.log('✅ User 2 connected:', user2.id);
  user2Connected = true;
  checkAndStartTest();
});

function checkAndStartTest() {
  if (user1Connected && user2Connected) {
    console.log('🚀 Both users connected, starting matching test...');
    
    // User 1 starts looking for video chat
    console.log('👤 User 1: Looking for video chat match...');
    user1.emit('find_match', { mode: 'video' });
    
    // Wait a bit then User 2 also looks for video chat
    setTimeout(() => {
      console.log('👤 User 2: Looking for video chat match...');
      user2.emit('find_match', { mode: 'video' });
    }, 1000);
  }
}

// Handle match found events
user1.on('match-found', (data) => {
  console.log('🎉 User 1 matched:', data);
  
  // Send a test message
  setTimeout(() => {
    user1.emit('chat_message', {
      sessionId: data.sessionId,
      content: 'Hello from User 1!',
      type: 'text'
    });
    console.log('💬 User 1 sent message');
  }, 500);
});

user2.on('match-found', (data) => {
  console.log('🎉 User 2 matched:', data);
  
  // Send a test message back
  setTimeout(() => {
    user2.emit('chat_message', {
      sessionId: data.sessionId,
      content: 'Hello from User 2!',
      type: 'text'
    });
    console.log('💬 User 2 sent message');
  }, 1000);
});

// Handle chat messages
user1.on('chat_message', (data) => {
  console.log('📨 User 1 received message:', data.content);
});

user2.on('chat_message', (data) => {
  console.log('📨 User 2 received message:', data.content);
});

// Handle searching status
user1.on('searching', (data) => {
  console.log('🔍 User 1 searching:', data);
});

user2.on('searching', (data) => {
  console.log('🔍 User 2 searching:', data);
});

// Handle errors
user1.on('error', (error) => {
  console.log('❌ User 1 error:', error);
});

user2.on('error', (error) => {
  console.log('❌ User 2 error:', error);
});

// Handle disconnections
user1.on('disconnect', () => {
  console.log('❌ User 1 disconnected');
});

user2.on('disconnect', () => {
  console.log('❌ User 2 disconnected');
});

// Cleanup after 30 seconds
setTimeout(() => {
  console.log('🏁 Test completed, cleaning up...');
  user1.disconnect();
  user2.disconnect();
  process.exit(0);
}, 30000);