const io = require('socket.io-client');
// Connect locally since the server is running on localhost (assuming default port 3000 or whatever is in .env)
const socket = io('http://localhost:3000/ws/notifications', {
  auth: {
    token: 'Bearer fake-token' // This will fail auth, but we should see a connect_error
  }
});

socket.on('connect', () => {
  console.log('Connected!');
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.log('Connection Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 5000);
