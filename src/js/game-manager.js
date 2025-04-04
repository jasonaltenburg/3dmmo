import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Keep these imports as they are local to your project
import { World } from './world/world.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { GameUI } from './ui/game-ui.js';

export class GameManager {
  constructor(socket) {
    this.socket = socket;
    this.debugEnabled = false;
    this.debugLog = (...args) => {
      if (this.debugEnabled) {
        console.log(...args);
      }
    };
    this.scene = new THREE.Scene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.setupControls();
    
    // Create game world
    this.world = new World(this.scene);
    
    // Set up UI
    this.ui = new GameUI();
    
    // Make game manager accessible to UI
    // (needed for mobile controls to access player info)
    window.gameManager = this;
    
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
      Space: false,
      KeyJ: false,
      KeyQ: false,
      KeyE: false,
      KeyZ: false
    };
    
    // God mode settings
    this.godMode = false;
    
    // Game state
    this.gameActive = true;
    this.chatActive = false;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start update loop
    this.animate();
  }
  
  setupRenderer() {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    document.body.appendChild(this.renderer.domElement);
    
    // Create effect composer for post-processing
    this.composer = new EffectComposer(this.renderer);
    
    // Add render pass (main scene rendering)
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Add bloom pass for glow effects
    const bloomParams = {
      strength: 0.8,    // Bloom intensity
      radius: 0.5,      // Bloom radius
      threshold: 0.2    // Minimum brightness to apply bloom
    };
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomParams.strength,
      bloomParams.radius,
      bloomParams.threshold
    );
    this.composer.addPass(bloomPass);
    
    // Add output pass (final rendering)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
    
    // Store bloom parameters for possible adjustment later
    this.bloomPass = bloomPass;
    this.bloomParams = bloomParams;
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    
    // Initialize camera mode (first-person or third-person)
    this.cameraMode = 'third-person';
    this.thirdPersonDistance = 7;
    this.thirdPersonHeight = 3;
    this.cameraCollision = true;
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
    this.controls.minDistance = 2;
    this.controls.maxDistance = 15;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 0.5;
    
    // Configure for third-person by default
    if (this.cameraMode === 'third-person') {
      this.controls.enableZoom = true;  // Allow zooming in third-person
      this.controls.minDistance = 3;    // Minimum zoom distance
      this.controls.maxDistance = 10;   // Maximum zoom distance
    } else {
      // First-person configuration
      this.controls.enableZoom = false; // Disable zooming in first-person
    }
    
    // Set initial position
    this.controls.target.set(0, 1, 0);
    this.controls.update();
  }
  
  setupEventListeners() {
    // Keyboard events
    this.keydownHandler = (e) => {
      this.debugLog('Key pressed:', e.code);
      if (this.keys.hasOwnProperty(e.code) && !this.chatActive) {
        this.keys[e.code] = true;
        this.debugLog('Key state updated:', e.code, this.keys[e.code]);
      }
      
      // Attack on space
      if (e.code === 'Space' && !this.chatActive) {
        this.playerAttack();
      }
      
      // Toggle camera mode with C key
      if (e.code === 'KeyC' && !this.chatActive) {
        this.toggleCameraMode();
        this.debugLog('Camera mode toggled to:', this.cameraMode);
      }
      
      // Open inventory with I key
      if (e.code === 'KeyI' && !this.chatActive) {
        this.ui.toggleInventory(this.player.inventory, this.player.gold);
      }
      
      // Open shop with B key when in town or tavern
      if (e.code === 'KeyB' && !this.chatActive && this.activeRegion && 
          (this.activeRegion.name === 'Town' || this.activeRegion.name === 'Tavern')) {
        this.debugLog('Opening shop in region:', this.activeRegion.name);
        this.ui.toggleShop(this.player.gold);
      }
      
      // Jump with J key
      if (e.code === 'KeyJ' && !this.chatActive) {
        this.playerJump();
      }
    };
    
    this.keyupHandler = (e) => {
      if (this.keys.hasOwnProperty(e.code)) {
        this.keys[e.code] = false;
      }
    };
    
    // Window resize
    this.resizeHandler = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Also resize composer
      if (this.composer) {
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    // Add event listeners
    this.debugLog('Setting up keyboard event listeners');
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    window.addEventListener('resize', this.resizeHandler);
    
    // Test direct event handling
    document.addEventListener('keydown', (e) => {
      this.debugLog('Document keydown event:', e.code);
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
    
    // UI events
    document.addEventListener('buy-item', (e) => {
      const item = e.detail.item;
      if (this.player.spendGold(item.price)) {
        this.player.addItem(item.item);
        this.ui.updatePlayerStats(this.player); // Update gold display
        this.ui.addCombatMessage(`Purchased ${item.item.name} for ${item.price} gold.`);
      } else {
        this.ui.addCombatMessage('Not enough gold to purchase this item!', 'error');
      }
    });
    
    document.addEventListener('use-item', (e) => {
      const itemId = e.detail.itemId;
      const item = this.player.inventory.consumables.find(item => item.id === itemId);
      const result = this.player.useConsumable(itemId);
      
      if (result) {
        this.ui.updatePlayerStats(this.player);
        this.ui.updateInventory(this.player.inventory);
        
        // Add buff icon for consumable if it has a buff effect
        if (item && item.effects && item.effects.buff) {
          const buff = item.effects.buff;
          const icon = this.getBuffIcon(buff.id);
          const name = this.getBuffDescription(buff);
          
          this.ui.addStatusEffect(buff.id, icon, buff.duration, name);
          this.ui.addCombatMessage(`Used ${item.name}! ${name}`);
        } else if (item && item.effects && item.effects.health) {
          this.ui.addCombatMessage(`Used ${item.name}! Restored ${item.effects.health} health.`);
        }
      }
    });
    
    document.addEventListener('equip-item', (e) => {
      // Equipment system would be implemented here
      // For now just add a message
      this.ui.addCombatMessage(`Equipped ${e.detail.itemName}.`);
    });
    
    document.addEventListener('sell-item', (e) => {
      const itemId = e.detail.itemId;
      const type = e.detail.type;
      const price = e.detail.price;
      
      // Remove item from inventory
      this.player.removeItem(itemId, type);
      
      // Add gold
      this.player.addGold(price);
      
      // Update UI
      this.ui.updatePlayerStats(this.player);
      this.ui.updateInventory(this.player.inventory);
      this.ui.addCombatMessage(`Sold item for ${price} gold.`);
    });
    
    document.addEventListener('drink-beer', () => {
      // Apply beer buff
      const buffId = 'beer_buff';
      const duration = 60000; // 60 seconds
      const stats = {
        attackDamage: 5,
        defense: 3
      };
      
      // Check if player has enough gold
      if (this.player.gold >= 5) {
        // Spend gold first
        this.debugLog('Spending 5 gold for beer');
        const success = this.player.spendGold(5);
        this.debugLog('Gold spent successfully:', success, 'Remaining gold:', this.player.gold);
        
        if (success) {
          // Apply buff
          const buffInfo = this.player.addBuff(buffId, duration, stats);
          
          // Update UI
          this.ui.updatePlayerStats(this.player);
          this.ui.addStatusEffect(buffId, '🍺', duration, 'Beer: +5 Attack, +3 Defense');
          this.ui.addCombatMessage('You feel stronger after drinking the beer! (+5 Attack, +3 Defense for 60 seconds)');
        } else {
          this.ui.addCombatMessage('Not enough gold to buy beer!', 'error');
        }
      } else {
        this.ui.addCombatMessage('Not enough gold to buy beer!', 'error');
      }
    });
    
    // Helper methods for buff display
    this.getBuffIcon = (buffId) => {
      const buffIcons = {
        'beer_buff': '🍺',
        'strength_buff': '💪',
        'defense_buff': '🛡️',
        'health_buff': '❤️',
        'speed_buff': '⚡',
        'vampire_buff': '🧛',
        'fire_buff': '🔥'
      };
      
      return buffIcons[buffId] || '✨'; // Default icon if not found
    };
    
    this.getBuffDescription = (buff) => {
      let description = '';
      
      if (buff.stats) {
        const stats = [];
        if (buff.stats.attackDamage) stats.push(`+${buff.stats.attackDamage} Attack`);
        if (buff.stats.defense) stats.push(`+${buff.stats.defense} Defense`);
        if (buff.stats.maxHealth) stats.push(`+${buff.stats.maxHealth} Max Health`);
        
        description = stats.join(', ') + ` for ${buff.duration/1000}s`;
      }
      
      return description;
    };

    // Toggle debug mode with Ctrl+Shift+` (Backquote)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'Backquote') {
        this.debugEnabled = !this.debugEnabled;
        this.debugLog(`Debug mode ${this.debugEnabled ? 'enabled' : 'disabled'}`);
      }
    });
    
    // God mode activation with Ctrl+Shift+M
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') {
        this.promptGodModePassword();
      }
    });
    
    // God mode laser attack with Z
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyZ' && this.godMode && !this.chatActive) {
        this.fireLasers();
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
    if (this.player) {
        console.warn("GameManager: Player is already initialized. Skipping duplicate initialization.");
        return;
    }

    this.debugLog("GameManager: Initializing player...");
    this.player = new Player(this.scene, this.socket, this.socket.id);

    if (!this.player) {
        console.error("GameManager: Failed to initialize player!");
        return;
    }

    this.debugLog("GameManager: Player initialized successfully.", this.player);

    // Place player at default spawn position
    this.player.model.position.set(0, 0, 0);

    // Ensure camera follows player
    this.controls.target.copy(this.player.model.position);
    this.controls.target.y = this.player.model.position.y + 1;
    this.controls.update();

    // Wait for UI to be ready before updating stats
    setTimeout(() => {
        this.debugLog("GameManager: Updating UI with player stats...");
        this.ui.updatePlayerStats(this.player);
    }, 100);

    // Ensure active region is set
    setTimeout(() => this.checkRegion(), 200);
}


  
  handleCurrentPlayers(players) {
    this.debugLog('Received players:', players);
    Object.keys(players).forEach((id) => {
        if (id === this.socket.id) {
            // Ensure we don't create the player twice
            if (!this.player) {
                this.player = new Player(this.scene, this.socket, this.socket.id);
                this.player.model.position.set(players[id].x, players[id].y, players[id].z);
                this.player.model.rotation.y = players[id].rotationY;
            }
        } else {
            this.addOtherPlayer(players[id]);
        }
    });
}



  
  addOtherPlayer(playerData) {
    if (this.otherPlayers[playerData.id]) {
      console.warn(`Player ${playerData.id} already exists, skipping duplicate creation.`);
      return;
  }
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
    if (!this.world || typeof this.world.getRegionAtPosition !== "function") {
      console.error("GameManager: World is not initialized or getRegionAtPosition() is missing.");
      return;
    }
  
    const playerPos = this.player?.model?.position;
    if (!playerPos) {
      console.warn("GameManager: Player position not available.");
      return;
    }
  
    const region = this.world.getRegionAtPosition(playerPos);
    if (region) {
      // If region changed
      if (!this.activeRegion || this.activeRegion.name !== region.name) {
        // If old region was combat, clear enemies
        if (this.activeRegion && this.activeRegion.type === 'combat') {
          this.clearEnemies();
        }
  
        this.activeRegion = region;
        this.debugLog("GameManager: Player is in region:", region.name);
        this.ui.showRegionInfo(region);
  
        // If new region is combat, spawn enemies
        if (region.type === 'combat') {
          this.spawnEnemies(region);
        }
      }
    } else {
      console.warn("GameManager: Player is in an unknown area.");
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
  
  promptGodModePassword() {
    // Create a modal dialog for password
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    const box = document.createElement('div');
    box.style.width = '300px';
    box.style.backgroundColor = '#222';
    box.style.padding = '20px';
    box.style.borderRadius = '5px';
    box.style.textAlign = 'center';
    box.style.color = 'white';
    
    const title = document.createElement('h3');
    title.textContent = 'Enter the Magic Word';
    title.style.margin = '0 0 20px 0';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Magic word...';
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.marginBottom = '15px';
    input.style.backgroundColor = '#333';
    input.style.border = '1px solid #444';
    input.style.color = 'white';
    input.style.borderRadius = '3px';
    
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.style.padding = '8px 15px';
    submitBtn.style.backgroundColor = '#4CAF50';
    submitBtn.style.border = 'none';
    submitBtn.style.borderRadius = '3px';
    submitBtn.style.color = 'white';
    submitBtn.style.marginRight = '10px';
    submitBtn.style.cursor = 'pointer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 15px';
    cancelBtn.style.backgroundColor = '#f44336';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '3px';
    cancelBtn.style.color = 'white';
    cancelBtn.style.cursor = 'pointer';
    
    box.appendChild(title);
    box.appendChild(input);
    box.appendChild(submitBtn);
    box.appendChild(cancelBtn);
    modal.appendChild(box);
    
    document.body.appendChild(modal);
    
    // Focus the input
    setTimeout(() => input.focus(), 0);
    
    // Submit handler
    const handleSubmit = () => {
      const password = input.value.trim().toLowerCase();
      if (password === 'xyzzy') {
        this.enableGodMode();
      } else {
        this.ui.addCombatMessage('Incorrect magic word!', 'error');
      }
      document.body.removeChild(modal);
    };
    
    // Event listeners
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
    
    // Allow enter key to submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }
  
  enableGodMode() {
    this.godMode = true;
    
    // Give player cool visual effects for god mode
    const godlightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const godlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,        // Add emissive color for the glow effect
      emissiveIntensity: 0.8,    // Strong emissive intensity
      transparent: true,
      opacity: 0.7
    });
    
    this.godModeLight = new THREE.Mesh(godlightGeometry, godlightMaterial);
    this.godModeLight.position.y = 2;
    // Set this object to use bloom
    this.godModeLight.layers.enable(1);
    this.player.model.add(this.godModeLight);
    
    // Create a point light to make player glow
    const light = new THREE.PointLight(0xffff00, 1, 3);
    light.position.set(0, 1, 0);
    this.player.model.add(light);
    this.godModePointLight = light;
    
    // Make health infinite
    this.player.health = this.player.maxHealth;
    this.player.updateHealthBar();
    
    // Show message
    this.ui.addCombatMessage('GOD MODE ACTIVATED!', 'system');
    this.ui.addCombatMessage('Press Q/E to fly up/down', 'system');
    this.ui.addCombatMessage('Press Z to fire eye lasers', 'system');
  }
  
  fireLasers() {
    if (!this.godMode || !this.player) return;
    
    this.debugLog('Firing lasers!');
    
    // Create laser beams from player's eyes
    const createLaser = () => {
      const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 100, 8);
      const laserMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,             // Add emissive for glow
        emissiveIntensity: 1.0,         // Full intensity for strong glow
        transparent: true,
        opacity: 0.8
      });
      
      const laser = new THREE.Mesh(laserGeometry, laserMaterial);
      laser.rotation.x = Math.PI / 2; // Rotate to point forward
      
      // Position at player's eye level
      laser.position.y = 1.75;
      
      // Enable bloom for this object
      laser.layers.enable(1);
      
      return laser;
    };
    
    // Create left and right eye lasers
    const leftLaser = createLaser();
    leftLaser.position.x = -0.2;
    this.player.model.add(leftLaser);
    
    const rightLaser = createLaser();
    rightLaser.position.x = 0.2;
    this.player.model.add(rightLaser);
    
    // Add glow effect to player's eyes
    this.player.model.traverse((object) => {
      if (object === this.player.model.children[1]) { // Head is second child in the model
        const eyeGlow = new THREE.PointLight(0xff0000, 1, 2);
        eyeGlow.position.set(0, 0, 0.2);
        object.add(eyeGlow);
        
        // Remove after effect ends
        setTimeout(() => object.remove(eyeGlow), 1000);
      }
    });
    
    // Find all enemies in range and damage them
    const laserRange = 50; // Very long range
    const laserDamage = 9999; // Massive damage
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Check if enemy is in front of player (simplified, just use distance)
      const distance = this.player.model.position.distanceTo(enemy.model.position);
      if (distance <= laserRange) {
        // Apply damage to enemy
        const result = enemy.takeDamage(laserDamage);
        
        // Show damage number
        this.ui.showDamageNumber(
          enemy.model.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
          laserDamage,
          'damage',
          this.camera
        );
        
        // Add combat message
        this.ui.addCombatMessage(`Your eye lasers hit the ${enemy.type} for ${laserDamage} damage!`);
        
        if (result.dead) {
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
          this.ui.addCombatMessage(`You obliterated the ${enemy.type} and gained ${xpGained} XP.`);
          
          // Process drops
          if (result.drops) {
            // Add gold
            if (result.drops.gold > 0) {
              const goldAmount = result.drops.gold;
              this.player.addGold(goldAmount);
              
              // Show gold gain
              this.ui.showDamageNumber(
                enemy.model.position.clone().add(new THREE.Vector3(0, 2.3, 0)),
                goldAmount,
                'gold',
                this.camera
              );
              
              this.ui.addCombatMessage(`Found ${goldAmount} gold.`);
              this.ui.updatePlayerStats(this.player);
            }
            
            // Add items to inventory
            if (result.drops.items && result.drops.items.length > 0) {
              result.drops.items.forEach(item => {
                this.player.addItem(item);
                
                // Add item message with rarity color
                let rarityColor = 'white';
                if (item.rarity === 'rare') rarityColor = '#4444ff';
                if (item.rarity === 'epic') rarityColor = '#aa44ff';
                
                this.ui.addCombatMessage(`Found <span style="color:${rarityColor}">${item.name}</span>!`);
              });
              
              this.ui.updateInventory(this.player.inventory);
            }
          }
          
          // Remove enemy
          enemy.cleanup();
          this.enemies.splice(i, 1);
        }
      }
    }
    
    // Remove lasers after a short time
    setTimeout(() => {
      this.player.model.remove(leftLaser);
      this.player.model.remove(rightLaser);
    }, 1000);
  }
  
  playerJump() {
    if (!this.player) return;
    
    const result = this.player.jump();
    if (result) {
      this.debugLog('Player jumped');
      // Optionally add a UI message
      this.ui.addCombatMessage('You jumped!');
    }
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
          const result = enemy.takeDamage(attackData.damage);
          
          // Show damage number
          this.ui.showDamageNumber(
            enemy.model.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
            attackData.damage,
            'damage',
            this.camera
          );
          
          // Add combat message
          this.ui.addCombatMessage(`You hit the ${enemy.type} for ${attackData.damage} damage.`);
          
          if (result.dead) {
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
            
            // Process drops
            if (result.drops) {
              // Add gold
              if (result.drops.gold > 0) {
                const goldAmount = result.drops.gold;
                this.debugLog('Adding gold to player:', goldAmount);
                this.player.addGold(goldAmount);
                this.debugLog('Player gold after adding:', this.player.gold);
                
                // Show gold gain
                this.ui.showDamageNumber(
                  enemy.model.position.clone().add(new THREE.Vector3(0, 2.3, 0)),
                  goldAmount,
                  'gold',
                  this.camera
                );
                
                this.ui.addCombatMessage(`Found ${goldAmount} gold.`);
                
                // Update UI with new gold amount
                this.ui.updatePlayerStats(this.player);
              }
              
              // Add items to inventory
              if (result.drops.items && result.drops.items.length > 0) {
                result.drops.items.forEach(item => {
                  this.player.addItem(item);
                  
                  // Add item message with rarity color
                  let rarityColor = 'white';
                  if (item.rarity === 'rare') rarityColor = '#4444ff';
                  if (item.rarity === 'epic') rarityColor = '#aa44ff';
                  
                  this.ui.addCombatMessage(`Found <span style="color:${rarityColor}">${item.name}</span>!`);
                });
                
                // Update inventory UI if open
                this.ui.updateInventory(this.player.inventory);
              }
            }
            
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
        this.ui.addChatMessage('', 'Available commands: /help, /region, /stats, /players, /godmode', 'system');
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
        this.ui.addChatMessage('', `God Mode: ${this.godMode ? 'ENABLED' : 'disabled'}`, 'system');
        break;
      
      case '/players':
        const playerCount = Object.keys(this.otherPlayers).length + 1; // +1 for self
        this.ui.addChatMessage('', `Players online: ${playerCount}`, 'system');
        this.ui.addChatMessage('', `You: ${this.socket.id}`, 'system');
        
        for (const id in this.otherPlayers) {
          this.ui.addChatMessage('', `- ${id}`, 'system');
        }
        break;
      
      case '/godmode':
        if (this.godMode) {
          this.ui.addChatMessage('', 'God Mode is already enabled!', 'system');
        } else {
          this.ui.addChatMessage('', 'Nice try! But you need to know the magical password...', 'system');
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
        const isDead = this.player.takeDamage(result.damage, this.godMode);
        
        // Show damage number (0 damage if in god mode)
        const displayedDamage = this.godMode ? 0 : result.damage;
        this.ui.showDamageNumber(
          this.player.model.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
          displayedDamage,
          'damage',
          this.camera
        );
        
        // Add combat message
        if (this.godMode) {
          this.ui.addCombatMessage(`The ${enemy.type} tried to hit you but your godly powers protected you!`);
        } else {
          this.ui.addCombatMessage(`The ${enemy.type} hit you for ${result.damage} damage.`);
        }
        
        // Update UI
        this.ui.updatePlayerStats(this.player);
        
        if (isDead) {
          // Player died (shouldn't happen in god mode)
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
    // Don't die in god mode
    if (this.godMode) {
      this.player.health = this.player.maxHealth;
      this.player.updateHealthBar();
      this.ui.updatePlayerStats(this.player);
      this.ui.addCombatMessage('Your godly powers protect you from death!', 'system');
      return;
    }
    
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
    this.debugLog('animate() running');
    if (!this.gameActive) return;
    
    requestAnimationFrame(() => this.animate());
    
    // Update controls for smooth camera movement
    this.controls.update();
    
    // Update player position based on keyboard input or mobile controls
    if (this.player && !this.chatActive) {
      // Calculate movement direction vector
      const direction = new THREE.Vector3();
      const rotation = this.controls.getAzimuthalAngle();
      
      // Check for mobile controls first
      const mobileDirection = this.ui.getMobileControlDirection();
      
      if (mobileDirection) {
        // Mobile joystick controls
        direction.z = -mobileDirection.z * this.player.speed; // Forward/backward
        direction.x = mobileDirection.x * this.player.speed;  // Left/right
        
        // Apply rotation - mobile controls are relative to camera view
        const rotatedDirection = new THREE.Vector3();
        rotatedDirection.z = Math.cos(rotation) * direction.z - Math.sin(rotation) * direction.x;
        rotatedDirection.x = Math.sin(rotation) * direction.z + Math.cos(rotation) * direction.x;
        
        direction.copy(rotatedDirection);
      } else {
        // Keyboard controls
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
      }
      
      // God mode vertical movement (flying)
      if (this.godMode) {
        if (this.keys.KeyQ) {
          direction.y += this.player.speed;
        }
        if (this.keys.KeyE) {
          direction.y -= this.player.speed;
        }
      }
      
      if (direction.length() > 0) {
        this.player.model.position.add(direction);
        this.player.model.rotation.y = rotation;
        
        // Keep player on ground if not in god mode
        if (!this.godMode && !this.player.isJumping) {
          this.player.model.position.y = this.player.groundLevel;
        }
        
        // Update camera based on camera mode
        this.updateCamera();
        
        // Send updated position to server
        this.socket.emit('playerMovement', {
          x: this.player.model.position.x,
          y: this.player.model.position.y,
          z: this.player.model.position.z,
          rotationY: this.player.model.rotation.y
        });
        
        // Check if we entered a new region
        this.checkRegion();
      } else {
        // Even if not moving, update camera (for camera follow)
        this.updateCamera();
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
    
    // Render scene using the effect composer for post-processing
    if (this.composer) {
      this.composer.render();
    } else {
      // Fallback to regular rendering if composer isn't available
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  updateCamera() {
    if (!this.player) return;
    
    if (this.cameraMode === 'third-person') {
      // In third-person, the camera follows the player from behind
      
      // Calculate ideal camera position based on player's rotation
      const idealOffset = new THREE.Vector3();
      const rotation = this.player.model.rotation.y;
      
      // Position camera behind player
      idealOffset.x = Math.sin(rotation) * this.thirdPersonDistance;
      idealOffset.y = this.thirdPersonHeight;
      idealOffset.z = Math.cos(rotation) * this.thirdPersonDistance;
      
      // Apply the offset to get desired camera position
      const idealPosition = new THREE.Vector3();
      idealPosition.copy(this.player.model.position).add(idealOffset);
      
      // Handle camera collision with environment (if enabled)
      if (this.cameraCollision) {
        // Set up raycaster from player to ideal camera position
        const raycaster = new THREE.Raycaster();
        raycaster.set(this.player.model.position, idealOffset.clone().normalize());
        
        // Check for collisions with scene objects (except player)
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        // Filter out player model from results
        const validIntersects = intersects.filter(intersect => {
          let obj = intersect.object;
          let isPlayerPart = false;
          
          // Check if object is part of player model
          while (obj.parent) {
            if (obj === this.player.model) {
              isPlayerPart = true;
              break;
            }
            obj = obj.parent;
          }
          
          return !isPlayerPart;
        });
        
        // If collision detected, adjust camera distance
        if (validIntersects.length > 0 && validIntersects[0].distance < this.thirdPersonDistance) {
          // Place camera at collision point minus a small offset
          const collisionDistance = validIntersects[0].distance * 0.9; // 90% of distance to collision
          const adjustedOffset = idealOffset.clone().normalize().multiplyScalar(collisionDistance);
          idealPosition.copy(this.player.model.position).add(adjustedOffset);
        }
      }
      
      // Smoothly interpolate current camera position to ideal position
      this.camera.position.lerp(idealPosition, 0.1);
      
      // Set controls target to player's head height
      this.controls.target.copy(this.player.model.position);
      this.controls.target.y = this.player.model.position.y + 1.5;
    } else {
      // First-person mode - camera is at player's eye level
      const headPosition = this.player.model.position.clone();
      headPosition.y += 1.7; // Eye level
      
      this.camera.position.copy(headPosition);
      
      // Set look target in front of player
      const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.model.quaternion);
      this.controls.target.copy(headPosition).add(lookDirection);
    }
    
    // Update orbit controls
    this.controls.update();
  }
  
  toggleCameraMode() {
    if (this.cameraMode === 'third-person') {
      this.cameraMode = 'first-person';
      this.controls.enableZoom = false;
      this.ui.addCombatMessage('Switched to first-person camera mode');
    } else {
      this.cameraMode = 'third-person';
      this.controls.enableZoom = true;
      this.controls.minDistance = 3;
      this.controls.maxDistance = 10;
      this.ui.addCombatMessage('Switched to third-person camera mode');
    }
  }
  
  cleanup() {
    this.gameActive = false;
    
    // Remove god mode effects if active
    if (this.godMode && this.player) {
      if (this.godModeLight) {
        this.player.model.remove(this.godModeLight);
      }
      if (this.godModePointLight) {
        this.player.model.remove(this.godModePointLight);
      }
    }
    
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
