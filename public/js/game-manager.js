import * as THREE from '/lib/three/build/three.module.js';
import { OrbitControls } from '/lib/three/examples/jsm/controls/OrbitControls.js';
import { World } from './world/world.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { GameUI } from './ui/game-ui.js';

export class GameManager {
  constructor(socket) {
    this.socket = socket;
    this.scene = new THREE.Scene();
    this.setupRenderer();
    this.setupCamera();
    this.setupLighting();
    this.setupControls();
    
    // Create game world
    this.world = new World(this.scene);
    
    // Set up UI
    this.ui = new GameUI();
    
    // Initialize player
    this.player = null;
    this.otherPlayers = {};
    
    // Enemy management
    this.enemies = [];
    this.activeRegion = null;
    
    // Input handling
    this.keys = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      Space: false
    };
    
    // Game state
    this.gameActive = true;
    this.chatActive = false;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start update loop
    this.animate();
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
  }
  
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Improve shadow quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(directionalLight);
    
    // Add a hemisphere light for better ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x334400, 0.6);
    this.scene.add(hemisphereLight);
  }
  
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    this.controls.minDistance = 5;
    this.controls.maxDistance = 15;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 0.5;
    
    // Set initial position
    this.controls.target.set(0, 1, 0);
    this.controls.update();
  }
  
  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.code) && !this.chatActive) {
        this.keys[e.code] = true;
      }
      
      // Attack on space
      if (e.code === 'Space' && !this.chatActive) {
        this.playerAttack();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = false;
      }
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Chat events
    document.addEventListener('chat-opened', () => {
      this.chatActive = true;
    });
    
    document.addEventListener('chat-closed', () => {
      this.chatActive = false;
    });
    
    document.addEventListener('chat-message', (e) => {
      const message = e.detail.message;
      
      // Process chat commands or send to server
      if (message.startsWith('/')) {
        this.processChatCommand(message);
      } else {
        this.socket.emit('chat', { message });
      }
    });
    
    // Socket events
    this.socket.on('connect', () => {
      this.initializePlayer();
    });
    
    this.socket.on('currentPlayers', (players) => {
      this.handleCurrentPlayers(players);
    });
    
    this.socket.on('newPlayer', (playerData) => {
      this.addOtherPlayer(playerData);
      this.ui.addChatMessage('', `${playerData.id} has joined the game`, 'system');
    });
    
    this.socket.on('playerMoved', (playerData) => {
      this.updateOtherPlayer(playerData);
    });
    
    this.socket.on('playerDisconnected', (playerId) => {
      this.removeOtherPlayer(playerId);
      this.ui.addChatMessage('', `${playerId} has left the game`, 'system');
    });
    
    this.socket.on('chat', (data) => {
      this.ui.addChatMessage(data.id, data.message);
    });
    
    this.socket.on('systemMessage', (message) => {
      this.ui.addChatMessage('', message, 'system');
    });
  }
  
  initializePlayer() {
    // Create player entity
    this.player = new Player(this.scene, this.socket, this.socket.id);
    
    // Initial position at town center
    this.player.model.position.set(0, 0, 0);
    
    // Set camera to follow player
    this.controls.target.copy(this.player.model.position);
    this.controls.target.y = this.player.model.position.y + 1;
    this.controls.update();
    
    // Initialize UI
    this.ui.updatePlayerStats(this.player);
    
    // Welcome message
    this.ui.addChatMessage('', 'Welcome to 3D MMO! Press T to chat and Space to attack.', 'system');
    
    // Set initial region
    this.checkRegion();
  }
  
  handleCurrentPlayers(players) {
    Object.keys(players).forEach((id) => {
      if (id === this.socket.id) {
        // Update our player position
        if (this.player) {
          this.player.model.position.x = players[id].x;
          this.player.model.position.y = players[id].y;
          this.player.model.position.z = players[id].z;
          this.player.model.rotation.y = players[id].rotationY;
        }
      } else {
        this.addOtherPlayer(players[id]);
      }
    });
  }
  
  addOtherPlayer(playerData) {
    // Create a simple representation of other players
    const geometry = new THREE.BoxGeometry(0.6, 1.7, 0.6);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const otherPlayer = new THREE.Group();
    
    // Body
    const body = new THREE.Mesh(geometry, material);
    body.position.y = 0.85;
    body.castShadow = true;
    body.receiveShadow = true;
    otherPlayer.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffddbb,
      roughness: 0.7,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.75;
    head.castShadow = true;
    otherPlayer.add(head);
    
    // Nametag
    const nameTag = document.createElement('div');
    nameTag.className = 'player-name';
    nameTag.textContent = playerData.id;
    nameTag.style.position = 'absolute';
    nameTag.style.width = '100px';
    nameTag.style.textAlign = 'center';
    nameTag.style.color = 'white';
    nameTag.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    nameTag.style.padding = '2px 5px';
    nameTag.style.borderRadius = '3px';
    nameTag.style.fontSize = '12px';
    nameTag.style.fontFamily = 'Arial, sans-serif';
    nameTag.style.pointerEvents = 'none';
    document.body.appendChild(nameTag);
    
    // Position the player
    otherPlayer.position.set(playerData.x, playerData.y, playerData.z);
    otherPlayer.rotation.y = playerData.rotationY;
    
    // Add to scene
    this.scene.add(otherPlayer);
    
    // Store reference
    this.otherPlayers[playerData.id] = {
      model: otherPlayer,
      position: otherPlayer.position.clone(),
      nameTag: nameTag
    };
  }
  
  updateOtherPlayer(playerData) {
    if (this.otherPlayers[playerData.id]) {
      const otherPlayer = this.otherPlayers[playerData.id];
      
      // Update position
      otherPlayer.model.position.x = playerData.x;
      otherPlayer.model.position.y = playerData.y;
      otherPlayer.model.position.z = playerData.z;
      otherPlayer.position.copy(otherPlayer.model.position);
      
      // Update rotation
      otherPlayer.model.rotation.y = playerData.rotationY;
    }
  }
  
  removeOtherPlayer(playerId) {
    if (this.otherPlayers[playerId]) {
      // Remove from scene
      this.scene.remove(this.otherPlayers[playerId].model);
      
      // Remove nametag
      document.body.removeChild(this.otherPlayers[playerId].nameTag);
      
      // Remove from collection
      delete this.otherPlayers[playerId];
    }
  }
  
  updateNameTags() {
    // Update other players' nametags
    for (const id in this.otherPlayers) {
      const otherPlayer = this.otherPlayers[id];
      const screenPos = this.worldToScreen(
        otherPlayer.model.position.clone().add(new THREE.Vector3(0, 2.2, 0))
      );
      
      otherPlayer.nameTag.style.left = (screenPos.x - 50) + 'px';
      otherPlayer.nameTag.style.top = screenPos.y + 'px';
    }
  }
  
  worldToScreen(position) {
    const vector = position.clone();
    vector.project(this.camera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }
  
  checkRegion() {
    if (!this.player) return;
    
    // Get the region at the player's position
    const region = this.world.getRegionAtPosition(this.player.model.position);
    
    // Update UI with region info
    this.ui.showRegionInfo(region);
    
    // Check if we entered a new region
    if (region !== this.activeRegion) {
      // Clear existing enemies when leaving a region
      this.clearEnemies();
      
      // Set new active region
      this.activeRegion = region;
      
      // Spawn enemies if entering a combat region
      if (region && region.type === 'combat') {
        this.spawnEnemies(region);
      }
    }
  }
  
  spawnEnemies(region) {
    const enemyCount = Math.min(5, region.maxEnemies);
    
    for (let i = 0; i < enemyCount; i++) {
      // Calculate random position within region
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (region.radius * 0.8);
      const x = region.position.x + Math.cos(angle) * distance;
      const z = region.position.z + Math.sin(angle) * distance;
      
      // Create enemy
      const position = new THREE.Vector3(x, 0, z);
      const enemy = new Enemy(this.scene, region.enemyType, region.enemyLevel, position);
      this.enemies.push(enemy);
    }
  }
  
  clearEnemies() {
    for (const enemy of this.enemies) {
      enemy.cleanup();
    }
    this.enemies = [];
  }
  
  playerAttack() {
    if (!this.player) return;
    
    const attackData = this.player.attack();
    if (!attackData) return;
    
    // Check for enemy hits
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Check if enemy is in attack range
      const distance = this.player.model.position.distanceTo(enemy.model.position);
      if (distance <= attackData.range) {
        // Check if enemy is in front of player
        const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.model.quaternion);
        const directionToEnemy = new THREE.Vector3()
          .subVectors(enemy.model.position, this.player.model.position)
          .normalize();
        
        const dot = playerForward.dot(directionToEnemy);
        if (dot > 0.5) { // Enemy is in front of player (within ~60 degree cone)
          // Apply damage to enemy
          const isDead = enemy.takeDamage(attackData.damage);
          
          // Show damage number
          this.ui.showDamageNumber(
            enemy.model.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
            attackData.damage,
            'damage',
            this.camera
          );
          
          // Add combat message
          this.ui.addCombatMessage(`You hit the ${enemy.type} for ${attackData.damage} damage.`);
          
          if (isDead) {
            // Calculate XP based on enemy level
            const xpGained = enemy.level * 10;
            
            // Give player XP
            const xpData = this.player.gainExperience(xpGained);
            
            // Show XP gain
            this.ui.showDamageNumber(
              enemy.model.position.clone().add(new THREE.Vector3(0, 2, 0)),
              xpGained,
              'xp',
              this.camera
            );
            
            // Add combat message
            this.ui.addCombatMessage(`You defeated the ${enemy.type} and gained ${xpGained} XP.`);
            
            // Check for level up
            if (xpData.currentXp === 0) {
              // Player leveled up (XP was reset to 0 after leveling)
              const levelUpData = {
                level: this.player.level,
                maxHealth: this.player.maxHealth,
                attackDamage: this.player.attackDamage,
                defense: this.player.defense
              };
              
              // Show level up notification
              this.ui.showLevelUp(this.player.level, levelUpData);
            }
            
            // Update UI
            this.ui.updatePlayerStats(this.player);
            
            // Remove enemy
            enemy.cleanup();
            this.enemies.splice(i, 1);
            
            // Respawn enemy after delay if still in the same region
            setTimeout(() => {
              if (this.activeRegion && this.activeRegion.enemyType === enemy.type) {
                this.spawnEnemies(this.activeRegion);
              }
            }, 5000);
          }
        }
      }
    }
  }
  
  processChatCommand(message) {
    const command = message.split(' ')[0].toLowerCase();
    
    switch (command) {
      case '/help':
        this.ui.addChatMessage('', 'Available commands: /help, /region, /stats, /players', 'system');
        break;
      
      case '/region':
        if (this.activeRegion) {
          this.ui.addChatMessage('', `You are in ${this.activeRegion.name}. Type: ${this.activeRegion.type}`, 'system');
          
          if (this.activeRegion.type === 'combat') {
            this.ui.addChatMessage('', `Enemy: ${this.activeRegion.enemyType} (Level ${this.activeRegion.enemyLevel})`, 'system');
          }
        } else {
          this.ui.addChatMessage('', 'You are not in any region.', 'system');
        }
        break;
      
      case '/stats':
        this.ui.addChatMessage('', `Level: ${this.player.level}`, 'system');
        this.ui.addChatMessage('', `Health: ${this.player.health}/${this.player.maxHealth}`, 'system');
        this.ui.addChatMessage('', `Attack: ${this.player.attackDamage}`, 'system');
        this.ui.addChatMessage('', `Defense: ${this.player.defense}`, 'system');
        this.ui.addChatMessage('', `XP: ${this.player.experience}/${this.player.experienceToNextLevel}`, 'system');
        break;
      
      case '/players':
        const playerCount = Object.keys(this.otherPlayers).length + 1; // +1 for self
        this.ui.addChatMessage('', `Players online: ${playerCount}`, 'system');
        this.ui.addChatMessage('', `You: ${this.socket.id}`, 'system');
        
        for (const id in this.otherPlayers) {
          this.ui.addChatMessage('', `- ${id}`, 'system');
        }
        break;
      
      default:
        this.ui.addChatMessage('', `Unknown command: ${command}. Type /help for available commands.`, 'system');
    }
  }
  
  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (!enemy) continue;
      
      const result = enemy.update(this.player.model);
      
      // Check for attack
      if (result && result.type === 'attack') {
        // Enemy hit the player
        const isDead = this.player.takeDamage(result.damage);
        
        // Show damage number
        this.ui.showDamageNumber(
          this.player.model.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
          result.damage,
          'damage',
          this.camera
        );
        
        // Add combat message
        this.ui.addCombatMessage(`The ${enemy.type} hit you for ${result.damage} damage.`);
        
        // Update UI
        this.ui.updatePlayerStats(this.player);
        
        if (isDead) {
          // Player died
          this.handlePlayerDeath();
        }
      }
      
      // Check if enemy is dead
      if (result === false) {
        enemy.cleanup();
        this.enemies.splice(i, 1);
      }
    }
  }
  
  handlePlayerDeath() {
    // Respawn player at town center
    this.player.model.position.set(0, 0, 0);
    
    // Restore partial health
    this.player.health = Math.floor(this.player.maxHealth * 0.5);
    this.player.updateHealthBar();
    
    // Update stats in UI
    this.ui.updatePlayerStats(this.player);
    
    // System message
    this.ui.addChatMessage('', 'You have died and respawned in town with 50% health.', 'system');
    
    // Set camera to follow player
    this.controls.target.copy(this.player.model.position);
    this.controls.target.y = this.player.model.position.y + 1;
    this.controls.update();
  }
  
  animate() {
    if (!this.gameActive) return;
    
    requestAnimationFrame(() => this.animate());
    
    // Update controls for smooth camera movement
    this.controls.update();
    
    // Update player position based on keyboard input
    if (this.player && !this.chatActive) {
      // Calculate movement direction vector
      const direction = new THREE.Vector3();
      const rotation = this.controls.getAzimuthalAngle();
      
      if (this.keys.KeyW) {
        direction.z -= Math.cos(rotation) * this.player.speed;
        direction.x -= Math.sin(rotation) * this.player.speed;
      }
      if (this.keys.KeyS) {
        direction.z += Math.cos(rotation) * this.player.speed;
        direction.x += Math.sin(rotation) * this.player.speed;
      }
      if (this.keys.KeyA) {
        direction.z += Math.sin(rotation) * this.player.speed;
        direction.x -= Math.cos(rotation) * this.player.speed;
      }
      if (this.keys.KeyD) {
        direction.z -= Math.sin(rotation) * this.player.speed;
        direction.x += Math.cos(rotation) * this.player.speed;
      }
      
      if (direction.length() > 0) {
        this.player.model.position.add(direction);
        this.player.model.rotation.y = rotation;
        
        // Update camera target
        this.controls.target.copy(this.player.model.position);
        this.controls.target.y = this.player.model.position.y + 1;
        
        // Send updated position to server
        this.socket.emit('playerMovement', {
          x: this.player.model.position.x,
          y: this.player.model.position.y,
          z: this.player.model.position.z,
          rotationY: this.player.model.rotation.y
        });
        
        // Check if we entered a new region
        this.checkRegion();
      }
      
      // Update player animations and status
      this.player.update(this.keys, direction, rotation, this.camera);
    }
    
    // Update enemies
    this.updateEnemies();
    
    // Update nametags
    this.updateNameTags();
    
    // Update UI
    if (this.player) {
      this.ui.updateMinimap(this.player, this.otherPlayers, this.world.regions);
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  cleanup() {
    this.gameActive = false;
    
    // Remove event listeners
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    window.removeEventListener('resize', this.resizeHandler);
    
    // Clean up player
    if (this.player) {
      this.player.cleanup();
    }
    
    // Clean up other players
    for (const id in this.otherPlayers) {
      this.removeOtherPlayer(id);
    }
    
    // Clean up enemies
    this.clearEnemies();
    
    // Clean up UI
    this.ui.cleanup();
    
    // Disconnect socket
    this.socket.disconnect();
    
    // Remove renderer from DOM
    document.body.removeChild(this.renderer.domElement);
  }
}