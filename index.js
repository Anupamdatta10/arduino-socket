const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const WebSocket = require('ws')
const cors = require('cors')

// Express app setup
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// HTTP + Socket.IO server
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// 💬 Socket.IO: Handle web browser / React / HTML page connections
io.on('connection', socket => {
  console.log('Socket.IO client connected')

  socket.on('buttonPress', data => {
    console.log(`Button ${data} pressed`)
    io.emit('controllerEvent', data) // Broadcast to all
  })

  socket.on('disconnect', () => {
    console.log('Socket.IO client disconnected')
  })
})

// 🌐 Raw WebSocket: Handle ESP32 connections
const wsServer = new WebSocket.Server({ server }) // Share the same HTTP server

wsServer.on('connection', socket => {
  console.log('ESP32 WebSocket connected')

  socket.on('message', message => {
    console.log('Received from ESP32:', message.toString())

    // Relay to Socket.IO clients
    io.emit('controllerEvent', `ESP32: ${message}`)
  })

  socket.send('Hello from Node.js server')
})

// 📮 REST endpoint for Postman or HTTP clients
app.post('/api/send-event', (req, res) => {
  const { eventData } = req.body

  if (!eventData) {
    return res.status(400).json({ error: 'Missing eventData in body' })
  }

  console.log('Received from HTTP client:', eventData)

  // Relay to Socket.IO clients
  io.emit('controllerEvent', `HTTP: ${eventData}`)
  res.send({ status: 'Event emitted', event: eventData })
})

// Start the server
const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
