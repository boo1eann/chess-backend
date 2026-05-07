import { io } from 'socket.io-client';

const TOKEN = process.argv[2];
const URL = process.argv[3] ?? 'http://localhost:3000';

if (!TOKEN) {
  console.error('Usage: node scripts/test-socket.mjs <accessToken> [url]');
  process.exit(1);
}

const socket = io(URL, {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✓ connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('✗ connect_error:', err.message);
  console.error('  data:', err.data);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('disconnected:', reason);
});

// Закроем через 5 секунд для теста
setTimeout(() => {
  socket.disconnect();
  process.exit(0);
}, 5000);
