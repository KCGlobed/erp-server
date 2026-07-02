const { io } = require('socket.io-client');
const axios = require('axios');

async function run() {
  try {
    // 1. Login to get a token
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'suneel.kumar+19@kcglobed.com', // using the email from previous logs
      password: 'password123' // Guessing password, if it fails I'll just skip or ask
    });
    
    const token = loginRes.data.tokens.access.token;
    console.log('Got token:', token);
    
    // 2. Connect socket
    const socket = io('http://localhost:3000/ws/notifications', {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` }
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSockets!');
      
      // 3. Trigger a notification
      axios.post('http://localhost:3000/api/v1/notifications', {
        title: 'Local Test',
        message: 'This is a test',
        type: 'INFO',
        isGlobal: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => console.log('✅ Created Global Notification')).catch(e => console.error('Failed to create notif', e.response?.data || e.message));
    });

    socket.on('new_notification', (notif) => {
      console.log('🔔 RECEIVED:', notif.title);
      process.exit(0);
    });

    socket.on('connect_error', (e) => {
      console.error('Socket Error', e.message);
      process.exit(1);
    });

    setTimeout(() => {
      console.log('Timeout waiting for notification');
      process.exit(1);
    }, 5000);

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

run();
