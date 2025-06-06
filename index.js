const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Allow CORS for all
app.use(cors());
app.use(express.json());

// Serve static HTML from /public (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO server setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('Socket.IO client connected');

  socket.on('buttonPress', (data) => {
    console.log(`Button pressed: ${data}`);
    io.emit('controllerEvent', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Optional REST endpoint
app.post('/api/send-event', (req, res) => {
  const { eventData } = req.body;

  if (!eventData) return res.status(400).json({ error: 'Missing eventData' });

  io.emit('controllerEvent', `HTTP: ${eventData}`);
  res.json({ status: 'sent', event: eventData });
});

// Use Render-assigned PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
