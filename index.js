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

let latestFrame = null;  // Holds most recent binary frame from ESP32

// MJPEG stream endpoint
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
    } else {
      // Optionally, send blank frame or text fallback
      res.write(`--frame\r\n`);
      res.write(`Content-Type: text/plain\r\n\r\n`);
      res.write('No video available\r\n\r\n');
    }
  }, 100); // ~10 FPS

  req.on('close', () => clearInterval(interval));
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('✅ WebSocket client connected');

  ws.on('message', message => {
    if (Buffer.isBuffer(message)) {
      // Binary frame from ESP32-CAM
      latestFrame = message;
      // Optionally log size: console.log(`🖼️ Frame received: ${message.length} bytes`);
    } else {
      const msg = message.toString();
      console.log('📨 Control received:', msg);

      // Broadcast command to all clients (e.g., ESP32)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  });

  ws.send('👋 Hello from Node server');
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
