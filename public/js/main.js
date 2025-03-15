import { GameManager } from './game-manager.js';

// Initialize socket.io connection
const socket = io();

// Create and start game
const game = new GameManager(socket);

// Handle page unload
window.addEventListener('beforeunload', () => {
  game.cleanup();
});