const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Allow access to node_modules for client-side imports
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Store connected players
const players = {};

// Chat message history (limited size)
const chatHistory = [];
const MAX_CHAT_HISTORY = 50;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Initialize player
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 4 - 2, // Spawn near town center
    y: 0,
    z: Math.random() * 4 - 2,
    rotationY: 0,
    model: 'default'
  };
  
  // Send the current players to the new player
  socket.emit('currentPlayers', players);
  
  // Send recent chat history
  chatHistory.forEach(msg => {
    socket.emit('chat', msg);
  });
  
  // Broadcast the new player to all other players
  socket.broadcast.emit('newPlayer', players[socket.id]);
  
  // Send system message about new player
  io.emit('systemMessage', `${socket.id} has joined the game.`);
  
  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    if (!players[socket.id]) return;
    
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].z = movementData.z;
    players[socket.id].rotationY = movementData.rotationY;
    
    // Broadcast player's movement to all other players
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
  
  // Handle chat messages
  socket.on('chat', (data) => {
    // Create the chat message with sender ID
    const chatMessage = {
      id: socket.id,
      message: data.message
    };
    
    // Store in history
    chatHistory.push(chatMessage);
    if (chatHistory.length > MAX_CHAT_HISTORY) {
      chatHistory.shift(); // Remove oldest message
    }
    
    // Broadcast to all players
    io.emit('chat', chatMessage);
  });
  
  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit('playerDisconnected', socket.id);
      io.emit('systemMessage', `${socket.id} has left the game.`);
    }
  });
});

// Game status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    players: Object.keys(players).length,
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = server;