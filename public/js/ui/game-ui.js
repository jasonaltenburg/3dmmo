// import * as THREE from '/lib/three/build/three.module.js';

export class GameUI {
  constructor() {
    this.createUI();
    this.createChatSystem();
    this.createMinimap();
    this.createStatusEffects();
    this.createInventoryPanel();
    this.createShopPanel();
    
    // Keep track of UI state
    this.currentRegion = null;
    this.playerStats = {
      level: 1,
      health: 100,
      maxHealth: 100,
      experience: 0,
      experienceToNextLevel: 100,
      gold: 0
    };
    
    // Store active effects
    this.activeEffects = {};
  }

  createUI() {
    console.log("Creating UI dynamically...");

    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'game-ui';
    this.uiContainer.style.position = 'absolute';
    this.uiContainer.style.top = 0;
    this.uiContainer.style.left = 0;
    this.uiContainer.style.width = '100%';
    this.uiContainer.style.height = '100%';
    this.uiContainer.style.zIndex = '9999';
    this.uiContainer.style.pointerEvents = 'none';
    document.body.appendChild(this.uiContainer);

    // Instead of silently failing, log a warning if there's no #loading element
    const loadingScreen = document.getElementById("loading");
    if (!loadingScreen) {
      console.warn("No #loading element found. Can't hide loading screen.");
    } else {
      loadingScreen.style.display = "none";
    }

    // Region Info
    this.regionInfo = document.createElement('div');
    this.regionInfo.id = 'region-info';
    this.regionInfo.style = "position: absolute; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 5px; font-size: 16px; transition: opacity 0.5s; opacity: 0;";
    this.uiContainer.appendChild(this.regionInfo);

    // Player Stats
    this.statsContainer = document.createElement('div');
    this.statsContainer.id = 'player-stats';
    this.statsContainer.style = "position: absolute; bottom: 10px; left: 10px; padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 5px;";

    // Health Bar
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.innerHTML = `
        <div>Health:</div>
        <div class="bar-container">
            <div id="health-bar" class="bar health"></div>
        </div>
    `;
    this.statsContainer.appendChild(this.healthBarContainer);

    // Assign `this.healthBar` properly
    this.healthBar = this.healthBarContainer.querySelector('#health-bar');

    // Experience Bar
    this.expBarContainer = document.createElement('div');
    this.expBarContainer.innerHTML = `
        <div>XP:</div>
        <div class="bar-container">
            <div id="xp-bar" class="bar xp"></div>
        </div>
    `;
    this.statsContainer.appendChild(this.expBarContainer);

    // Assign `this.expBar` properly
    this.expBar = this.expBarContainer.querySelector('#xp-bar');

    // Gold Display
    this.goldDisplay = document.createElement('div');
    this.goldDisplay.innerHTML = `Gold: <span id="gold-display" style="color: gold; font-weight: bold;">0</span>`;
    this.statsContainer.appendChild(this.goldDisplay);

    this.uiContainer.appendChild(this.statsContainer);

    // Combat Log
    this.combatLog = document.createElement('div');
    this.combatLog.id = 'combat-log';
    this.combatLog.style = "position: absolute; bottom: 10px; right: 10px; width: 300px; max-height: 150px; overflow-y: auto; padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 5px; font-size: 14px;";
    this.uiContainer.appendChild(this.combatLog);

    // Inventory Panel
    this.inventoryPanel = document.createElement('div');
    this.inventoryPanel.id = 'inventory-panel';
    this.inventoryPanel.style = "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 600px; height: 400px; background: rgba(0,0,0,0.85); color: white; padding: 20px; border-radius: 5px; display: none;";
    this.inventoryPanel.innerHTML = "<h2>Inventory</h2>";
    this.uiContainer.appendChild(this.inventoryPanel);

    // Shop Panel
    this.shopPanel = document.createElement('div');
    this.shopPanel.id = 'shop-panel';
    this.shopPanel.style = "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 600px; height: 400px; background: rgba(0,0,0,0.85); color: white; padding: 20px; border-radius: 5px; display: none;";
    this.shopPanel.innerHTML = "<h2>Shop</h2>";
    this.uiContainer.appendChild(this.shopPanel);

    console.log("UI Created!");
  }

  
  createChatSystem() {
    // Chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'chat-container';
    this.chatContainer.style.position = 'absolute';
    this.chatContainer.style.bottom = '10px';
    this.chatContainer.style.left = '50%';
    this.chatContainer.style.transform = 'translateX(-50%)';
    this.chatContainer.style.width = '500px';
    this.chatContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.chatContainer.style.borderRadius = '5px';
    
    // Chat messages
    this.chatMessages = document.createElement('div');
    this.chatMessages.style.height = '150px';
    this.chatMessages.style.overflowY = 'auto';
    this.chatMessages.style.padding = '10px';
    this.chatMessages.style.color = 'white';
    this.chatMessages.style.fontFamily = 'Arial, sans-serif';
    this.chatMessages.style.fontSize = '14px';
    this.chatContainer.appendChild(this.chatMessages);
    
    // Chat input
    this.chatInputContainer = document.createElement('div');
    this.chatInputContainer.style.display = 'flex';
    this.chatInputContainer.style.padding = '5px';
    
    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = 'Press T to chat...';
    this.chatInput.style.flex = '1';
    this.chatInput.style.padding = '5px';
    this.chatInput.style.border = 'none';
    this.chatInput.style.borderRadius = '3px';
    this.chatInput.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    this.chatInput.style.color = 'white';
    this.chatInput.style.display = 'none';
    this.chatInput.style.pointerEvents = 'auto';
    this.chatInputContainer.appendChild(this.chatInput);
    
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.marginLeft = '5px';
    sendButton.style.padding = '5px 10px';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '3px';
    sendButton.style.backgroundColor = '#4d79ff';
    sendButton.style.color = 'white';
    sendButton.style.cursor = 'pointer';
    sendButton.style.display = 'none';
    sendButton.style.pointerEvents = 'auto';
    this.chatInputContainer.appendChild(sendButton);
    
    this.chatContainer.appendChild(this.chatInputContainer);
    this.uiContainer.appendChild(this.chatContainer);
    
    // Toggle chat with T key
    window.addEventListener('keydown', (e) => {
      if (e.key === 't' && this.chatInput.style.display === 'none') {
        e.preventDefault();
        this.openChat();
      } else if (e.key === 'Escape' && this.chatInput.style.display === 'block') {
        this.closeChat();
      } else if (e.key === 'Enter' && this.chatInput.style.display === 'block') {
        this.sendChatMessage();
      }
    });
    
    // Send button click
    sendButton.addEventListener('click', () => {
      this.sendChatMessage();
    });
    
    this.sendButton = sendButton;
    
    // Initially hide the chat container
    this.chatContainer.style.display = 'none';
  }
  
  openChat() {
    this.chatContainer.style.display = 'block';
    this.chatInput.style.display = 'block';
    this.sendButton.style.display = 'block';
    this.chatInput.focus();
    
    // Signal the game to disable controls
    document.dispatchEvent(new CustomEvent('chat-opened'));
  }
  
  closeChat() {
    this.chatInput.style.display = 'none';
    this.sendButton.style.display = 'none';
    this.chatInput.value = '';
    
    // Signal the game to re-enable controls
    document.dispatchEvent(new CustomEvent('chat-closed'));
    
    // Hide chat after some delay
    setTimeout(() => {
      if (this.chatInput.style.display === 'none') {
        this.chatContainer.style.display = 'none';
      }
    }, 5000);
  }
  
  sendChatMessage() {
    const message = this.chatInput.value.trim();
    if (message) {
      // Dispatch an event with the message
      document.dispatchEvent(new CustomEvent('chat-message', {
        detail: { message }
      }));
      
      this.chatInput.value = '';
    }
    
    this.closeChat();
  }
  
  addChatMessage(username, message, type = 'normal') {
    this.chatContainer.style.display = 'block';
    
    const msgElement = document.createElement('div');
    msgElement.style.marginBottom = '5px';
    
    // Different styling based on message type
    switch (type) {
      case 'system':
        msgElement.style.color = '#ffcc00';
        msgElement.textContent = message;
        break;
      case 'combat':
        msgElement.style.color = '#ff6666';
        msgElement.textContent = message;
        break;
      case 'whisper':
        msgElement.style.color = '#cc99ff';
        msgElement.innerHTML = `<strong>${username} whispers:</strong> ${message}`;
        break;
      default:
        msgElement.innerHTML = `<strong>${username}:</strong> ${message}`;
    }
    
    this.chatMessages.appendChild(msgElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Hide chat after some delay if not active
    if (this.chatInput.style.display === 'none') {
      setTimeout(() => {
        if (this.chatInput.style.display === 'none') {
          this.chatContainer.style.display = 'none';
        }
      }, 5000);
    }
  }
  
  createMinimap() {
    // Minimap container
    this.minimapContainer = document.createElement('div');
    this.minimapContainer.id = 'minimap';
    this.minimapContainer.style.position = 'absolute';
    this.minimapContainer.style.top = '10px';
    this.minimapContainer.style.left = '10px';
    this.minimapContainer.style.width = '150px';
    this.minimapContainer.style.height = '150px';
    this.minimapContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.minimapContainer.style.borderRadius = '5px';
    this.minimapContainer.style.padding = '5px';
    this.uiContainer.appendChild(this.minimapContainer);
    
    // Minimap canvas
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 150;
    this.minimapCanvas.height = 150;
    this.minimapContainer.appendChild(this.minimapCanvas);
    
    this.minimapContext = this.minimapCanvas.getContext('2d');
  }
  
  updateMinimap(player, otherPlayers, regions) {
    const ctx = this.minimapContext;
    ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
    
    // Draw regions
    for (const region of regions) {
      // Different colors for different regions
      switch (region.name) {
        case 'Town':
          ctx.fillStyle = '#999';
          break;
        case 'Cemetery':
          ctx.fillStyle = '#666';
          break;
        case 'Cave':
          ctx.fillStyle = '#874b12';
          break;
        case 'Field':
          ctx.fillStyle = '#9b8c4a';
          break;
        case 'Castle':
          ctx.fillStyle = '#444';
          break;
        case 'Tavern':
          ctx.fillStyle = '#8b4513';
          break;
        default:
          ctx.fillStyle = '#333';
      }
      
      // Convert world coordinates to minimap coordinates
      const mapX = (region.position.x + 60) / 120 * this.minimapCanvas.width;
      const mapY = (region.position.z + 60) / 120 * this.minimapCanvas.height;
      const mapRadius = (region.radius / 120) * this.minimapCanvas.width;
      
      ctx.beginPath();
      ctx.arc(mapX, mapY, mapRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add region name
      ctx.fillStyle = '#fff';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(region.name, mapX, mapY);
    }
    
    // Draw other players
    for (const id in otherPlayers) {
      const otherPlayer = otherPlayers[id];
      
      // Convert world coordinates to minimap coordinates
      const mapX = (otherPlayer.position.x + 60) / 120 * this.minimapCanvas.width;
      const mapY = (otherPlayer.position.z + 60) / 120 * this.minimapCanvas.height;
      
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw player (always in center)
    const playerMapX = (player.model.position.x + 60) / 120 * this.minimapCanvas.width;
    const playerMapY = (player.model.position.z + 60) / 120 * this.minimapCanvas.height;
    
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(playerMapX, playerMapY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player direction
    const dirX = Math.sin(player.model.rotation.y) * 7;
    const dirY = Math.cos(player.model.rotation.y) * 7;
    
    ctx.strokeStyle = '#00f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMapX, playerMapY);
    ctx.lineTo(playerMapX + dirX, playerMapY - dirY);
    ctx.stroke();
  }
  
  createStatusEffects() {
    // Status effects container
    this.statusContainer = document.createElement('div');
    this.statusContainer.id = 'status-effects';
    this.statusContainer.style.position = 'absolute';
    this.statusContainer.style.top = '170px';
    this.statusContainer.style.left = '10px';
    this.statusContainer.style.display = 'flex';
    this.statusContainer.style.flexDirection = 'column';
    this.statusContainer.style.gap = '5px';
    this.uiContainer.appendChild(this.statusContainer);
  }
  
  createInventoryPanel() {
    // Create inventory panel
    const inventoryPanel = document.createElement('div');
    inventoryPanel.id = 'inventory-panel';
    inventoryPanel.style.position = 'absolute';
    inventoryPanel.style.left = '50%';
    inventoryPanel.style.top = '50%';
    inventoryPanel.style.transform = 'translate(-50%, -50%)';
    inventoryPanel.style.width = '600px';
    inventoryPanel.style.height = '400px';
    inventoryPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    inventoryPanel.style.color = 'white';
    inventoryPanel.style.padding = '20px';
    inventoryPanel.style.borderRadius = '5px';
    inventoryPanel.style.fontFamily = 'Arial, sans-serif';
    inventoryPanel.style.fontSize = '14px';
    inventoryPanel.style.display = 'none';
    inventoryPanel.style.zIndex = '1000';
    inventoryPanel.style.pointerEvents = 'auto';
    
    // Inventory title
    const title = document.createElement('h2');
    title.textContent = 'Inventory';
    inventoryPanel.appendChild(title);
    
    // Tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'inventory-tabs';
    tabsContainer.style.display = 'flex';
    tabsContainer.style.marginBottom = '15px';
    tabsContainer.style.borderBottom = '1px solid #555';
    
    // Equipment tab
    const equipmentTab = document.createElement('div');
    equipmentTab.className = 'inventory-tab active';
    equipmentTab.dataset.tab = 'equipment';
    equipmentTab.textContent = 'Equipment';
    equipmentTab.style.padding = '8px 15px';
    equipmentTab.style.marginRight = '5px';
    equipmentTab.style.cursor = 'pointer';
    equipmentTab.style.borderTopLeftRadius = '5px';
    equipmentTab.style.borderTopRightRadius = '5px';
    equipmentTab.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    equipmentTab.style.border = '1px solid #555';
    equipmentTab.style.borderBottom = 'none';
    tabsContainer.appendChild(equipmentTab);
    
    // Consumables tab
    const consumablesTab = document.createElement('div');
    consumablesTab.className = 'inventory-tab';
    consumablesTab.dataset.tab = 'consumables';
    consumablesTab.textContent = 'Consumables';
    consumablesTab.style.padding = '8px 15px';
    consumablesTab.style.marginRight = '5px';
    consumablesTab.style.cursor = 'pointer';
    consumablesTab.style.borderTopLeftRadius = '5px';
    consumablesTab.style.borderTopRightRadius = '5px';
    tabsContainer.appendChild(consumablesTab);
    
    inventoryPanel.appendChild(tabsContainer);
    
    // Equipment content
    const equipmentContent = document.createElement('div');
    equipmentContent.id = 'equipment-tab';
    equipmentContent.className = 'inventory-content active';
    equipmentContent.style.display = 'block';
    equipmentContent.style.height = '320px';
    equipmentContent.style.overflowY = 'auto';
    inventoryPanel.appendChild(equipmentContent);
    
    // Consumables content
    const consumablesContent = document.createElement('div');
    consumablesContent.id = 'consumables-tab';
    consumablesContent.className = 'inventory-content';
    consumablesContent.style.display = 'none';
    consumablesContent.style.height = '320px';
    consumablesContent.style.overflowY = 'auto';
    inventoryPanel.appendChild(consumablesContent);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.id = 'close-inventory';
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.backgroundColor = '#555';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    inventoryPanel.appendChild(closeButton);
    
    // Add to UI
    this.uiContainer.appendChild(inventoryPanel);
    
    // Add event listeners for tabs
    equipmentTab.addEventListener('click', () => {
      this.switchInventoryTab('equipment');
    });
    
    consumablesTab.addEventListener('click', () => {
      this.switchInventoryTab('consumables');
    });
    
    // Add event listener for close button
    closeButton.addEventListener('click', () => {
      inventoryPanel.style.display = 'none';
    });
  }
  
  switchInventoryTab(tabName) {
    // Get all tabs and content
    const tabs = document.querySelectorAll('.inventory-tab');
    const contents = document.querySelectorAll('.inventory-content');
    
    // Remove active class from all tabs and hide all content
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.style.display = 'none');
    
    // Add active class to selected tab and show corresponding content
    document.querySelector(`.inventory-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).style.display = 'block';
  }
  
  createShopPanel() {
    // Create shop panel
    const shopPanel = document.createElement('div');
    shopPanel.id = 'shop-panel';
    shopPanel.style.position = 'absolute';
    shopPanel.style.left = '50%';
    shopPanel.style.top = '50%';
    shopPanel.style.transform = 'translate(-50%, -50%)';
    shopPanel.style.width = '600px';
    shopPanel.style.height = '400px';
    shopPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    shopPanel.style.color = 'white';
    shopPanel.style.padding = '20px';
    shopPanel.style.borderRadius = '5px';
    shopPanel.style.fontFamily = 'Arial, sans-serif';
    shopPanel.style.fontSize = '14px';
    shopPanel.style.display = 'none';
    shopPanel.style.zIndex = '1000';
    shopPanel.style.pointerEvents = 'auto';
    
    // Shop title
    const title = document.createElement('h2');
    title.id = 'shop-title';
    title.textContent = 'Town Shop';
    shopPanel.appendChild(title);
    
    // Tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'shop-tabs';
    tabsContainer.style.display = 'flex';
    tabsContainer.style.marginBottom = '15px';
    tabsContainer.style.borderBottom = '1px solid #555';
    
    // Weapons tab
    const weaponsTab = document.createElement('div');
    weaponsTab.className = 'shop-tab active';
    weaponsTab.dataset.tab = 'weapons';
    weaponsTab.textContent = 'Weapons';
    weaponsTab.style.padding = '8px 15px';
    weaponsTab.style.marginRight = '5px';
    weaponsTab.style.cursor = 'pointer';
    weaponsTab.style.borderTopLeftRadius = '5px';
    weaponsTab.style.borderTopRightRadius = '5px';
    weaponsTab.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    weaponsTab.style.border = '1px solid #555';
    weaponsTab.style.borderBottom = 'none';
    tabsContainer.appendChild(weaponsTab);
    
    // Armor tab
    const armorTab = document.createElement('div');
    armorTab.className = 'shop-tab';
    armorTab.dataset.tab = 'armor';
    armorTab.textContent = 'Armor';
    armorTab.style.padding = '8px 15px';
    armorTab.style.marginRight = '5px';
    armorTab.style.cursor = 'pointer';
    armorTab.style.borderTopLeftRadius = '5px';
    armorTab.style.borderTopRightRadius = '5px';
    tabsContainer.appendChild(armorTab);
    
    // Consumables tab
    const consumablesTab = document.createElement('div');
    consumablesTab.className = 'shop-tab';
    consumablesTab.dataset.tab = 'consumables';
    consumablesTab.textContent = 'Consumables';
    consumablesTab.style.padding = '8px 15px';
    consumablesTab.style.marginRight = '5px';
    consumablesTab.style.cursor = 'pointer';
    consumablesTab.style.borderTopLeftRadius = '5px';
    consumablesTab.style.borderTopRightRadius = '5px';
    tabsContainer.appendChild(consumablesTab);
    
    shopPanel.appendChild(tabsContainer);
    
    // Weapons content
    const weaponsContent = document.createElement('div');
    weaponsContent.id = 'weapons-tab';
    weaponsContent.className = 'shop-content active';
    weaponsContent.style.display = 'block';
    weaponsContent.style.height = '320px';
    weaponsContent.style.overflowY = 'auto';
    shopPanel.appendChild(weaponsContent);
    
    // Armor content
    const armorContent = document.createElement('div');
    armorContent.id = 'armor-tab';
    armorContent.className = 'shop-content';
    armorContent.style.display = 'none';
    armorContent.style.height = '320px';
    armorContent.style.overflowY = 'auto';
    shopPanel.appendChild(armorContent);
    
    // Consumables content
    const consumablesContent = document.createElement('div');
    consumablesContent.id = 'consumables-tab';
    consumablesContent.className = 'shop-content';
    consumablesContent.style.display = 'none';
    consumablesContent.style.height = '320px';
    consumablesContent.style.overflowY = 'auto';
    shopPanel.appendChild(consumablesContent);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.id = 'close-shop';
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.backgroundColor = '#555';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    shopPanel.appendChild(closeButton);
    
    // Add to UI
    this.uiContainer.appendChild(shopPanel);
    
    // Add event listeners for tabs
    weaponsTab.addEventListener('click', () => {
      this.switchShopTab('weapons');
    });
    
    armorTab.addEventListener('click', () => {
      this.switchShopTab('armor');
    });
    
    consumablesTab.addEventListener('click', () => {
      this.switchShopTab('consumables');
    });
    
    // Add event listener for close button
    closeButton.addEventListener('click', () => {
      shopPanel.style.display = 'none';
    });
  }
  
  switchShopTab(tabName) {
    // Get all tabs and content
    const tabs = document.querySelectorAll('.shop-tab');
    const contents = document.querySelectorAll('.shop-content');
    
    // Remove active class from all tabs and hide all content
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.style.display = 'none');
    
    // Add active class to selected tab and show corresponding content
    document.querySelector(`.shop-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).style.display = 'block';
  }
  
  // Method to update player stats in UI
  updatePlayerStats(player, retries = 10) {
    const missingElements = [];
    
    if (!this.healthBar) missingElements.push("healthBar");
    if (!this.expBar) missingElements.push("expBar");
    if (!this.goldDisplay) missingElements.push("goldDisplay");

    if (missingElements.length > 0) {
        if (retries <= 0) {
            console.error(`GameUI: UI elements STILL not ready after 10 retries. Stopping. Missing: ${missingElements.join(", ")}`);
            return;
        }

        console.warn(`GameUI: UI elements not yet initialized. Retrying in 50ms... (${retries} retries left). Missing: ${missingElements.join(", ")}`);

        setTimeout(() => this.updatePlayerStats(player, retries - 1), 50);
        return;
    }

    console.log("GameUI: Updating player stats...");

    // Update health display
    const healthPercent = (player.health / player.maxHealth) * 100;
    this.healthBar.style.width = healthPercent + '%';
    this.healthBar.textContent = `${player.health} / ${player.maxHealth}`;

    if (healthPercent > 60) {
        this.healthBar.style.backgroundColor = '#00cc00';
    } else if (healthPercent > 30) {
        this.healthBar.style.backgroundColor = '#ffcc00';
    } else {
        this.healthBar.style.backgroundColor = '#cc0000';
    }

    // Update XP display
    const xpPercent = (player.experience / player.experienceToNextLevel) * 100;
    this.expBar.style.width = xpPercent + '%';
    this.expBar.textContent = `Level ${player.level} - ${player.experience} / ${player.experienceToNextLevel} XP`;

    // Update gold display
    this.goldDisplay.textContent = player.gold;
}
  
  // Method to toggle shop visibility
  toggleShop(gold) {
    const shopPanel = document.getElementById('shop-panel');
    
    if (shopPanel.style.display === 'block') {
      shopPanel.style.display = 'none';
    } else {
      // Update shop contents before showing
      this.updateShop(gold);
      
      // Show shop
      shopPanel.style.display = 'block';
    }
  }
  
  // Method to update shop contents
  updateShop(gold) {
    // Update shop title based on current region
    if (this.currentRegion && this.currentRegion.name === 'Tavern') {
      document.getElementById('shop-title').textContent = 'Magic Tavern';
    } else {
      document.getElementById('shop-title').textContent = 'Town Shop';
    }
    
    // Generate shop inventory
    const shopItems = this.generateShopItems();
    
    // Update weapon tab
    const weaponsTab = document.getElementById('weapons-tab');
    weaponsTab.innerHTML = '';
    
    shopItems.weapons.forEach(item => {
      this.addShopItem(weaponsTab, item, gold);
    });
    
    // Update armor tab
    const armorTab = document.getElementById('armor-tab');
    armorTab.innerHTML = '';
    
    shopItems.armor.forEach(item => {
      this.addShopItem(armorTab, item, gold);
    });
    
    // Update consumables tab
    const consumablesTab = document.getElementById('consumables-tab');
    consumablesTab.innerHTML = '';
    
    shopItems.consumables.forEach(item => {
      this.addShopItem(consumablesTab, item, gold);
    });
    
    // Add special tavern item for beer
    const beerItem = {
      price: 5,
      item: {
        id: 'beer',
        name: 'Frothy Beer',
        type: 'consumable',
        rarity: 'common',
        description: 'A refreshing beer that temporarily increases your attack and defense.',
        effects: {
          buff: {
            id: 'beer_buff',
            duration: 60000,
            stats: { attackDamage: 5, defense: 3 }
          }
        }
      }
    };
    
    this.addShopItem(consumablesTab, beerItem, gold, true);
  }
  
  // Method to add an item to the shop
  addShopItem(container, item, playerGold, isBeer = false) {
    const itemElement = document.createElement('div');
    itemElement.className = `shop-item item-${item.item.rarity}`;
    
    let statsText = '';
    if (item.item.stats) {
      statsText = Object.entries(item.item.stats)
        .map(([stat, value]) => `${this.formatStatName(stat)}: +${value}`)
        .join(', ');
    } else if (item.item.effects) {
      if (item.item.effects.health) {
        statsText += `Restores ${item.item.effects.health} health. `;
      }
      if (item.item.effects.buff) {
        const buff = item.item.effects.buff;
        statsText += 'Grants buff: ';
        if (buff.stats.attackDamage) statsText += `+${buff.stats.attackDamage} Attack, `;
        if (buff.stats.defense) statsText += `+${buff.stats.defense} Defense, `;
        if (buff.stats.maxHealth) statsText += `+${buff.stats.maxHealth} Max Health, `;
        statsText = statsText.replace(/, $/, '') + ` for ${buff.duration/1000}s.`;
      }
    }
    
    itemElement.innerHTML = `
      <div class="item-name">${item.item.name}</div>
      <div class="item-stats">${statsText}</div>
      <div class="item-action">
        <span class="shop-item-price">${item.price} gold</span>
        <button class="buy-btn" ${playerGold < item.price ? 'disabled' : ''}>${isBeer ? 'Drink' : 'Buy'}</button>
      </div>
    `;
    
    container.appendChild(itemElement);
    
    // Add event listener
    const buyBtn = itemElement.querySelector('.buy-btn');
    buyBtn.addEventListener('click', () => {
      if (isBeer) {
        document.dispatchEvent(new CustomEvent('drink-beer'));
      } else {
        document.dispatchEvent(new CustomEvent('buy-item', {
          detail: {
            item: item
          }
        }));
      }
    });
  }
  
  // Method to generate shop items
  generateShopItems() {
    // Generate a selection of items for the shop
    return {
      weapons: [
        {
          price: 50,
          item: {
            id: 'shop_sword_1',
            name: 'Iron Sword',
            type: 'equipment',
            equipType: 'weapon',
            rarity: 'common',
            level: 1,
            stats: { attackDamage: 15 },
            description: 'A basic iron sword.'
          }
        },
        {
          price: 120,
          item: {
            id: 'shop_sword_2',
            name: 'Steel Sword',
            type: 'equipment',
            equipType: 'weapon',
            rarity: 'common',
            level: 2,
            stats: { attackDamage: 22 },
            description: 'A sturdy steel sword.'
          }
        },
        {
          price: 300,
          item: {
            id: 'shop_sword_3',
            name: 'Knight\'s Blade',
            type: 'equipment',
            equipType: 'weapon',
            rarity: 'rare',
            level: 3,
            stats: { attackDamage: 35 },
            description: 'A finely crafted knight\'s blade.'
          }
        }
      ],
      armor: [
        {
          price: 40,
          item: {
            id: 'shop_armor_1',
            name: 'Leather Armor',
            type: 'equipment',
            equipType: 'armor',
            rarity: 'common',
            level: 1,
            stats: { defense: 10 },
            description: 'Basic leather armor.'
          }
        },
        {
          price: 100,
          item: {
            id: 'shop_armor_2',
            name: 'Chain Mail',
            type: 'equipment',
            equipType: 'armor',
            rarity: 'common',
            level: 2,
            stats: { defense: 18 },
            description: 'Protective chain mail armor.'
          }
        },
        {
          price: 250,
          item: {
            id: 'shop_armor_3',
            name: 'Knight\'s Plate',
            type: 'equipment',
            equipType: 'armor',
            rarity: 'rare',
            level: 3,
            stats: { defense: 30 },
            description: 'Heavy plate armor worn by knights.'
          }
        }
      ],
      consumables: [
        {
          price: 10,
          item: {
            id: 'shop_potion_1',
            name: 'Health Potion',
            type: 'consumable',
            rarity: 'common',
            effects: { health: 50 },
            description: 'Restores 50 health.'
          }
        },
        {
          price: 25,
          item: {
            id: 'shop_potion_2',
            name: 'Greater Health Potion',
            type: 'consumable',
            rarity: 'common',
            effects: { health: 100 },
            description: 'Restores 100 health.'
          }
        },
        {
          price: 30,
          item: {
            id: 'shop_potion_3',
            name: 'Strength Elixir',
            type: 'consumable',
            rarity: 'rare',
            effects: {
              buff: {
                id: 'strength_buff',
                duration: 120000, // 2 minutes
                stats: { attackDamage: 10 }
              }
            },
            description: 'Increases attack damage by 10 for 2 minutes.'
          }
        }
      ]
    };
  }
  
  // Method to add a status effect
  addStatusEffect(effectId, icon, duration, name) {
    // If already active, just reset duration
    if (this.activeEffects[effectId]) {
      clearTimeout(this.activeEffects[effectId].timeout);
      this.activeEffects[effectId].endTime = Date.now() + duration;
      this.activeEffects[effectId].element.querySelector('.duration').textContent = Math.ceil(duration / 1000) + 's';
      
      // Set new timeout
      this.activeEffects[effectId].timeout = setTimeout(() => {
        this.removeStatusEffect(effectId);
      }, duration);
      
      return;
    }
    
    // Create new effect
    const effectElement = document.createElement('div');
    effectElement.className = 'status-effect';
    effectElement.style.width = '40px';
    effectElement.style.height = '40px';
    effectElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    effectElement.style.borderRadius = '5px';
    effectElement.style.display = 'flex';
    effectElement.style.flexDirection = 'column';
    effectElement.style.alignItems = 'center';
    effectElement.style.justifyContent = 'center';
    effectElement.style.color = 'white';
    effectElement.style.fontSize = '10px';
    effectElement.style.position = 'relative';
    effectElement.title = name;
    
    // Icon or symbol
    const iconElement = document.createElement('div');
    iconElement.className = 'icon';
    iconElement.style.fontSize = '20px';
    iconElement.textContent = icon;
    effectElement.appendChild(iconElement);
    
    // Duration text
    const durationElement = document.createElement('div');
    durationElement.className = 'duration';
    durationElement.textContent = Math.ceil(duration / 1000) + 's';
    effectElement.appendChild(durationElement);
    
    this.statusContainer.appendChild(effectElement);
    
    // Store effect info
    const endTime = Date.now() + duration;
    const timeout = setTimeout(() => {
      this.removeStatusEffect(effectId);
    }, duration);
    
    this.activeEffects[effectId] = {
      element: effectElement,
      endTime,
      timeout
    };
  }
  
  // Method to remove a status effect
  removeStatusEffect(effectId) {
    if (this.activeEffects[effectId]) {
      this.statusContainer.removeChild(this.activeEffects[effectId].element);
      clearTimeout(this.activeEffects[effectId].timeout);
      delete this.activeEffects[effectId];
    }
  }
  
  // Method to show region info
  showRegionInfo(region) {
    if (region !== this.currentRegion) {
      this.currentRegion = region;
      
      if (region) {
        // Update region info display
        let infoText = `<h3>${region.name}</h3>`;
        
        if (region.type === 'safe') {
          infoText += '<p>Safe Zone</p>';
        } else if (region.type === 'combat') {
          infoText += `<p>Enemy Level: ${region.enemyLevel}</p>`;
          infoText += `<p>Enemy Type: ${this.capitalizeFirstLetter(region.enemyType)}</p>`;
        }
        
        this.regionInfo.innerHTML = infoText;
        this.regionInfo.style.opacity = '1';
        
        // Add system chat message
        this.addChatMessage('', `Entering ${region.name}`, 'system');
      } else {
        // Hide the region info when not in any region
        this.regionInfo.style.opacity = '0';
      }
    }
  }
  
  // Helper method to capitalize first letter
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  // Method to add a combat message
  addCombatMessage(message) {
    const msgElement = document.createElement('div');
    msgElement.innerHTML = message;
    msgElement.style.marginBottom = '3px';
    
    // Add to combat log
    this.combatLog.appendChild(msgElement);
    this.combatLog.scrollTop = this.combatLog.scrollHeight;
    
    // Also add to chat with combat type
    this.addChatMessage('', message, 'combat');
  }
  
  // Method to show level up notification
  showLevelUp(level, stats) {
    this.levelUpNotif.innerHTML = `
      <h2>Level Up!</h2>
      <p>You are now level ${level}</p>
      <div>Health: ${stats.maxHealth}</div>
      <div>Attack: ${stats.attackDamage}</div>
      <div>Defense: ${stats.defense}</div>
    `;
    
    this.levelUpNotif.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      this.levelUpNotif.style.display = 'none';
    }, 3000);
    
    // Add system message
    this.addChatMessage('', `You have reached level ${level}!`, 'system');
  }
  
  // Method to show damage numbers
  showDamageNumber(position, amount, type = 'damage', camera) {
    // Create damage number element
    const damageNumber = document.createElement('div');
    damageNumber.style.position = 'absolute';
    damageNumber.style.fontFamily = 'Arial, sans-serif';
    damageNumber.style.fontWeight = 'bold';
    damageNumber.style.fontSize = '16px';
    damageNumber.style.textShadow = '2px 2px 0 #000';
    damageNumber.style.pointerEvents = 'none';
    
    // Set text based on type
    if (type === 'damage') {
      damageNumber.textContent = `-${amount}`;
      damageNumber.style.color = '#ff6666';
    } else if (type === 'heal') {
      damageNumber.textContent = `+${amount}`;
      damageNumber.style.color = '#66ff66';
    } else if (type === 'xp') {
      damageNumber.textContent = `+${amount} XP`;
      damageNumber.style.color = '#9933ff';
    } else if (type === 'gold') {
      damageNumber.textContent = `+${amount} gold`;
      damageNumber.style.color = '#ffcc00';
    }
    
    // Convert 3D position to screen position
    const screenPos = this.worldToScreen(position, camera);
    damageNumber.style.left = screenPos.x + 'px';
    damageNumber.style.top = screenPos.y + 'px';
    
    // Add to UI
    this.uiContainer.appendChild(damageNumber);
    
    // Animate and remove
    setTimeout(() => {
      damageNumber.style.transition = 'all 1s ease-out';
      damageNumber.style.opacity = '0';
      damageNumber.style.transform = 'translateY(-30px)';
      
      setTimeout(() => {
        if (damageNumber.parentNode) {
          damageNumber.parentNode.removeChild(damageNumber);
        }
      }, 1000);
    }, 10);
  }
  
  // Method to convert world position to screen position
  worldToScreen(position, camera) {
    const vector = new THREE.Vector3();
    vector.copy(position);
    
    vector.project(camera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }
  
  // Method to toggle inventory visibility
  toggleInventory(inventory, gold) {
    const inventoryPanel = document.getElementById('inventory-panel');
    
    if (inventoryPanel.style.display === 'block') {
      inventoryPanel.style.display = 'none';
    } else {
      // Update inventory contents before showing
      this.updateInventory(inventory);
      
      // Update gold display
      const goldDisplay = document.getElementById('gold-display');
      if (goldDisplay) {
        goldDisplay.textContent = gold;
      }
      
      // Show inventory
      inventoryPanel.style.display = 'block';
    }
  }
  
  // Method to update inventory contents
  updateInventory(inventory) {
    // Update equipment tab
    const equipmentTab = document.getElementById('equipment-tab');
    equipmentTab.innerHTML = '';
    
    if (inventory.equipment.length === 0) {
      equipmentTab.innerHTML = '<div class="empty-message">No equipment items in inventory</div>';
    } else {
      inventory.equipment.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item item-${item.rarity}`;
        
        const statsText = Object.entries(item.stats)
          .map(([stat, value]) => `${this.formatStatName(stat)}: +${value}`)
          .join(', ');
        
        itemElement.innerHTML = `
          <div class="item-name">${item.name} (Level ${item.level})</div>
          <div class="item-stats">${statsText}</div>
          <div class="item-action">
            <button class="equip-btn" data-item-id="${item.id}" data-item-name="${item.name}">Equip</button>
            <button class="sell-btn" data-item-id="${item.id}" data-type="equipment" data-price="${this.calculateSellPrice(item)}">Sell (${this.calculateSellPrice(item)}g)</button>
          </div>
        `;
        
        equipmentTab.appendChild(itemElement);
        
        // Add event listeners
        const equipBtn = itemElement.querySelector('.equip-btn');
        equipBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('equip-item', {
            detail: {
              itemId: item.id,
              itemName: item.name
            }
          }));
        });
        
        const sellBtn = itemElement.querySelector('.sell-btn');
        sellBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('sell-item', {
            detail: {
              itemId: item.id,
              type: 'equipment',
              price: this.calculateSellPrice(item)
            }
          }));
        });
      });
    }
    
    // Update consumables tab
    const consumablesTab = document.getElementById('consumables-tab');
    consumablesTab.innerHTML = '';
    
    if (inventory.consumables.length === 0) {
      consumablesTab.innerHTML = '<div class="empty-message">No consumable items in inventory</div>';
    } else {
      inventory.consumables.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item item-${item.rarity}`;
        
        let effectsText = '';
        if (item.effects) {
          if (item.effects.health) {
            effectsText += `Restores ${item.effects.health} health. `;
          }
          if (item.effects.buff) {
            const buff = item.effects.buff;
            effectsText += 'Grants buff: ';
            if (buff.stats.attackDamage) effectsText += `+${buff.stats.attackDamage} Attack, `;
            if (buff.stats.defense) effectsText += `+${buff.stats.defense} Defense, `;
            if (buff.stats.maxHealth) effectsText += `+${buff.stats.maxHealth} Max Health, `;
            effectsText = effectsText.replace(/, $/, '') + ` for ${buff.duration/1000}s.`;
          }
        }
        
        itemElement.innerHTML = `
          <div class="item-name">${item.name}</div>
          <div class="item-stats">${effectsText}</div>
          <div class="item-action">
            <button class="use-btn" data-item-id="${item.id}">Use</button>
            <button class="sell-btn" data-item-id="${item.id}" data-type="consumable" data-price="${this.calculateSellPrice(item)}">Sell (${this.calculateSellPrice(item)}g)</button>
          </div>
        `;
        
        consumablesTab.appendChild(itemElement);
        
        // Add event listeners
        const useBtn = itemElement.querySelector('.use-btn');
        useBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('use-item', {
            detail: {
              itemId: item.id
            }
          }));
        });
        
        const sellBtn = itemElement.querySelector('.sell-btn');
        sellBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('sell-item', {
            detail: {
              itemId: item.id,
              type: 'consumable',
              price: this.calculateSellPrice(item)
            }
          }));
        });
      });
    }
  }
  
  // Method to calculate sell price
  calculateSellPrice(item) {
    let basePrice = 0;
    
    if (item.type === 'equipment') {
      // Equipment price based on level and rarity
      basePrice = item.level * 10;
      
      if (item.rarity === 'rare') basePrice *= 2;
      if (item.rarity === 'epic') basePrice *= 4;
    } else {
      // Consumable price based on effects
      if (item.effects) {
        if (item.effects.health) {
          basePrice = Math.floor(item.effects.health / 10);
        }
        
        if (item.effects.buff) {
          const buff = item.effects.buff;
          const statSum = (buff.stats.attackDamage || 0) + 
                         (buff.stats.defense || 0) + 
                         (buff.stats.maxHealth || 0) / 5;
          
          basePrice += Math.floor(statSum * buff.duration / 20000);
        }
      }
    }
    
    // Sell price is 40% of base price
    return Math.max(1, Math.floor(basePrice * 0.4));
  }
  
  // Method to format stat name
  formatStatName(stat) {
    switch (stat) {
      case 'attackDamage':
        return 'Attack';
      case 'defense':
        return 'Defense';
      case 'maxHealth':
        return 'Max Health';
      default:
        return stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  }
  
  // Cleanup method
  cleanup() {
    // Remove UI elements
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
    
    // Clear all buff timeouts
    for (const buffId in this.activeEffects) {
      this.removeStatusEffect(buffId);
    }
  }
}
