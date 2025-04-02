# 3D MMO RPG with Three.js

An immersive multiplayer online RPG game built with Three.js, Socket.io, and Express.

## Features

### World
- 3D world with 5 unique regions:
  - **Town** - Central safe zone
  - **Cemetery** (North) - Battle skeletons
  - **Cave** (East) - Face bats
  - **Field** (South) - Fight snakes
  - **Castle** (West) - Challenge vampires
  - **Tavern** (NorthEast) - Visit the local Tavern

### Combat System
- Real-time combat with different monster types
- Level-based progression system with XP
- Health and damage system
- Visual attack animations and damage numbers
- Death and respawn mechanics

### Multiplayer
- Real-time player movement and interaction
- Chat system with custom commands
- Player status and position updates
- Multiple concurrent players support

### User Interface
- Health and experience bars
- Minimap showing regions and players
- Combat log tracking battles
- Chat interface with system messages
- Status effect display system
- Region information display

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

## Running the game

1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Open multiple browser windows to see the multiplayer functionality in action

## Controls

- **W, A, S, D**: Move character
- **Mouse**: Look around
- **Space**: Attack
- **T**: Open chat
- **Esc**: Close chat

## Chat Commands

- **/help**: Display available commands
- **/region**: Show information about current region
- **/stats**: Display character stats
- **/players**: List online players

## Testing

Run the tests with:
```
npm test
```

## Technical Architecture

### Server-side
- Express.js server for game backend
- Socket.io for real-time communication
- Player state management
- Chat message history

### Client-side
- Three.js for 3D rendering
- Modular code structure:
  - World module for environment
  - Entity system for players and enemies
  - UI system for game interface
  - Game Manager for coordinating all systems

## Technologies Used

- [Three.js](https://threejs.org/) - 3D Graphics Library
- [Socket.io](https://socket.io/) - Real-time communication
- [Express](https://expressjs.com/) - Web server framework
- [Mocha](https://mochajs.org/) & [Chai](https://www.chaijs.com/) - Testing

## Future Enhancements

- Enhanced character models and animations
- Player equipment and inventory system
- Quest system
- More monster types and regions
- Boss encounters
- World persistence (database)
- User authentication and character saves
