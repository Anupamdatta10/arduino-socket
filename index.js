// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Serve static files (like HTML buttons if needed)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create a WebSocket server on the same HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('✅ WebSocket client connected');

  ws.on('message', message => {
    console.log('📨 Received from client:', message.toString());

    // Broadcast to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Broadcast: ${message}`);
      }
    });
  });

  ws.send('👋 Hello from Node server');
});

// Optional REST API to emit messages
app.post('/api/send', (req, res) => {
  const { msg } = req.body;
  if (!msg) return res.status(400).json({ error: 'Missing message' });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`From API: ${msg}`);
    }
  });

  res.json({ status: 'sent', msg });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
