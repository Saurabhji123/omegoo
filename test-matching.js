const io = require('socket.io-client');

console.log('🚀 Starting Multi-User Matching Test...\n');

// Create two users
const user1 = io('http://localhost:3001', {
  auth: { token: 'guest' },
  transports: ['websocket', 'polling']
});

const user2 = io('http://localhost:3001', {
  auth: { token: 'guest' },
  transports: ['websocket', 'polling']
});

// User 1 events
user1.on('connect', () => {
  console.log('👤 User 1 connected!');
  setTimeout(() => {
    console.log('👤 User 1 searching for text chat...');
    user1.emit('find_match', { mode: 'text' });
  }, 1000);
});

user1.on('match-found', (data) => {
  console.log('✅ User 1 found match:', data);
  setTimeout(() => {
    console.log('💬 User 1 sending message: "Hello from User 1!"');
    user1.emit('chat_message', {
      sessionId: data.sessionId,
      content: 'Hello from User 1!',
      type: 'text'
    });
  }, 1000);
});

user1.on('chat_message', (data) => {
  console.log('📨 User 1 received message:', data.content);
});

user1.on('searching', (data) => {
  console.log('🔍 User 1 searching...', data);
});

user1.on('error', (error) => {
  console.log('❌ User 1 error:', error);
});

// User 2 events
user2.on('connect', () => {
  console.log('👤 User 2 connected!');
  setTimeout(() => {
    console.log('👤 User 2 searching for text chat...');
    user2.emit('find_match', { mode: 'text' });
  }, 2000);
});

user2.on('match-found', (data) => {
  console.log('✅ User 2 found match:', data);
  setTimeout(() => {
    console.log('💬 User 2 sending message: "Hello from User 2!"');
    user2.emit('chat_message', {
      sessionId: data.sessionId,
      content: 'Hello from User 2!',
      type: 'text'
    });
  }, 2000);
});

user2.on('chat_message', (data) => {
  console.log('📨 User 2 received message:', data.content);
});

user2.on('searching', (data) => {
  console.log('🔍 User 2 searching...', data);
});

user2.on('error', (error) => {
  console.log('❌ User 2 error:', error);
});

// Cleanup after 15 seconds
setTimeout(() => {
  console.log('\n🏁 Test completed! Disconnecting users...');
  user1.disconnect();
  user2.disconnect();
  process.exit(0);
}, 15000);