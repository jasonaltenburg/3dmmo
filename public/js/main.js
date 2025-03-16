// main.js
console.log('main.js: Script parsing started');

// Static import at top level
import { GameManager } from './game-manager.js';

try {
    console.log('main.js: GameManager import parsed');

    console.log('main.js: Initializing socket.io connection');
    const socket = io();
    console.log('main.js: Socket.io initialized');

    console.log('main.js: Creating GameManager instance');
    window.game = new GameManager(socket);

    // Hide loading screen once DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        console.log("main.js: DOM content loaded. Ensuring UI is ready...");

        // The UI is created by the GameUI constructor already.
        // We'll just wait 100ms then initialize the player if needed.
        setTimeout(() => {
            console.log("main.js: Checking player initialization now...");
            if (!window.game.player) {
                window.game.initializePlayer();
            } else {
                console.warn("main.js: Player was already initialized, skipping.");
            }
        }, 100);
    });

    console.log('main.js: Setting up beforeunload event listener');
    window.addEventListener('beforeunload', () => {
        console.log('main.js: Cleaning up game on unload');
        window.game.cleanup();
    });

    console.log('main.js: Script execution completed');
} catch (error) {
    console.error('main.js: Script failed with error:', error);
}