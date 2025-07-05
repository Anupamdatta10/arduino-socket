const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MJPEG buffer for storing latest frame
let latestFrame = null;

// Handle image uploads from ESP32
app.post('/upload', (req, res) => {
  let data = Buffer.alloc(0);
  req.on('data', chunk => {
    data = Buffer.concat([data, chunk]);
  });
  req.on('end', () => {
    latestFrame = data;
    res.sendStatus(200);
  });
});

// MJPEG stream endpoint for browser
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });

  const interval = setInterval(() => {
    if (latestFrame) {
      res.write(`--frame\r\n`);
      res.write(`Content-Type: image/jpeg\r\n`);
      res.write(`Content-Length: ${latestFrame.length}\r\n\r\n`);
      res.write(latestFrame);
      res.write('\r\n');
    }
  }, 100); // ~10fps

  req.on('close', () => clearInterval(interval));
});

// WebSocket for control
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('✅ WebSocket client connected');

  ws.on('message', message => {
    console.log('📨 Control received:', message.toString());

    // Broadcast to all connected clients (including ESP32)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`${message}`);
      }
    });
  });

  ws.send('👋 Hello from Node server');
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
