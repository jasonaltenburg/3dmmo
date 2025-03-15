import * as THREE from '/lib/three/build/three.module.js';

export class GameUI {
  constructor() {
    this.createUI();
    this.createChatSystem();
    this.createMinimap();
    this.createStatusEffects();
    
    // Keep track of UI state
    this.currentRegion = null;
    this.playerStats = {
      level: 1,
      health: 100,
      maxHealth: 100,
      experience: 0,
      experienceToNextLevel: 100
    };
  }
  
  createUI() {
    // Main UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'game-ui';
    this.uiContainer.style.position = 'absolute';
    this.uiContainer.style.width = '100%';
    this.uiContainer.style.height = '100%';
    this.uiContainer.style.pointerEvents = 'none'; // Allow clicking through UI
    document.body.appendChild(this.uiContainer);
    
    // Region info display
    this.regionInfo = document.createElement('div');
    this.regionInfo.id = 'region-info';
    this.regionInfo.style.position = 'absolute';
    this.regionInfo.style.top = '10px';
    this.regionInfo.style.right = '10px';
    this.regionInfo.style.padding = '10px';
    this.regionInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.regionInfo.style.color = 'white';
    this.regionInfo.style.borderRadius = '5px';
    this.regionInfo.style.fontFamily = 'Arial, sans-serif';
    this.regionInfo.style.fontSize = '16px';
    this.regionInfo.style.transition = 'opacity 0.5s';
    this.regionInfo.style.opacity = '0';
    this.uiContainer.appendChild(this.regionInfo);
    
    // Player stats display
    this.statsContainer = document.createElement('div');
    this.statsContainer.id = 'player-stats';
    this.statsContainer.style.position = 'absolute';
    this.statsContainer.style.bottom = '10px';
    this.statsContainer.style.left = '10px';
    this.statsContainer.style.padding = '10px';
    this.statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.statsContainer.style.color = 'white';
    this.statsContainer.style.borderRadius = '5px';
    this.statsContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Health bar
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.style.marginBottom = '5px';
    
    const healthLabel = document.createElement('div');
    healthLabel.textContent = 'Health:';
    healthLabel.style.marginBottom = '2px';
    this.healthBarContainer.appendChild(healthLabel);
    
    const healthBarBg = document.createElement('div');
    healthBarBg.style.width = '200px';
    healthBarBg.style.height = '15px';
    healthBarBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    healthBarBg.style.borderRadius = '3px';
    
    this.healthBar = document.createElement('div');
    this.healthBar.style.width = '100%';
    this.healthBar.style.height = '100%';
    this.healthBar.style.backgroundColor = '#00cc00';
    this.healthBar.style.borderRadius = '3px';
    this.healthBar.style.transition = 'width 0.3s, background-color 0.3s';
    
    this.healthText = document.createElement('div');
    this.healthText.style.position = 'absolute';
    this.healthText.style.width = '200px';
    this.healthText.style.textAlign = 'center';
    this.healthText.style.fontSize = '12px';
    this.healthText.style.lineHeight = '15px';
    this.healthText.textContent = '100 / 100';
    
    healthBarBg.appendChild(this.healthBar);
    healthBarBg.appendChild(this.healthText);
    this.healthBarContainer.appendChild(healthBarBg);
    this.statsContainer.appendChild(this.healthBarContainer);
    
    // Experience bar
    this.expBarContainer = document.createElement('div');
    
    const expLabel = document.createElement('div');
    expLabel.textContent = 'Experience:';
    expLabel.style.marginBottom = '2px';
    this.expBarContainer.appendChild(expLabel);
    
    const expBarBg = document.createElement('div');
    expBarBg.style.width = '200px';
    expBarBg.style.height = '10px';
    expBarBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    expBarBg.style.borderRadius = '3px';
    
    this.expBar = document.createElement('div');
    this.expBar.style.width = '0%';
    this.expBar.style.height = '100%';
    this.expBar.style.backgroundColor = '#9933ff';
    this.expBar.style.borderRadius = '3px';
    this.expBar.style.transition = 'width 0.3s';
    
    this.expText = document.createElement('div');
    this.expText.style.position = 'absolute';
    this.expText.style.width = '200px';
    this.expText.style.textAlign = 'center';
    this.expText.style.fontSize = '9px';
    this.expText.style.lineHeight = '10px';
    this.expText.style.color = 'white';
    this.expText.textContent = 'Level 1 - 0 / 100 XP';
    
    expBarBg.appendChild(this.expBar);
    expBarBg.appendChild(this.expText);
    this.expBarContainer.appendChild(expBarBg);
    this.statsContainer.appendChild(this.expBarContainer);
    
    this.uiContainer.appendChild(this.statsContainer);
    
    // Combat log
    this.combatLog = document.createElement('div');
    this.combatLog.id = 'combat-log';
    this.combatLog.style.position = 'absolute';
    this.combatLog.style.bottom = '10px';
    this.combatLog.style.right = '10px';
    this.combatLog.style.width = '300px';
    this.combatLog.style.maxHeight = '150px';
    this.combatLog.style.overflowY = 'auto';
    this.combatLog.style.padding = '10px';
    this.combatLog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.combatLog.style.color = 'white';
    this.combatLog.style.borderRadius = '5px';
    this.combatLog.style.fontFamily = 'Arial, sans-serif';
    this.combatLog.style.fontSize = '14px';
    this.uiContainer.appendChild(this.combatLog);
    
    // Level up notification
    this.levelUpNotif = document.createElement('div');
    this.levelUpNotif.id = 'level-up';
    this.levelUpNotif.style.position = 'absolute';
    this.levelUpNotif.style.top = '50%';
    this.levelUpNotif.style.left = '50%';
    this.levelUpNotif.style.transform = 'translate(-50%, -50%)';
    this.levelUpNotif.style.padding = '20px';
    this.levelUpNotif.style.backgroundColor = 'rgba(153, 51, 255, 0.8)';
    this.levelUpNotif.style.color = 'white';
    this.levelUpNotif.style.borderRadius = '10px';
    this.levelUpNotif.style.fontFamily = 'Arial, sans-serif';
    this.levelUpNotif.style.fontSize = '24px';
    this.levelUpNotif.style.textAlign = 'center';
    this.levelUpNotif.style.display = 'none';
    this.uiContainer.appendChild(this.levelUpNotif);
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
    
    // Store active effects
    this.activeEffects = {};
  }
  
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
    
    // Start update interval if not already running
    if (!this.effectUpdateInterval) {
      this.effectUpdateInterval = setInterval(() => {
        this.updateStatusEffects();
      }, 1000);
    }
  }
  
  removeStatusEffect(effectId) {
    if (this.activeEffects[effectId]) {
      this.statusContainer.removeChild(this.activeEffects[effectId].element);
      clearTimeout(this.activeEffects[effectId].timeout);
      delete this.activeEffects[effectId];
      
      // Stop interval if no effects are active
      if (Object.keys(this.activeEffects).length === 0) {
        clearInterval(this.effectUpdateInterval);
        this.effectUpdateInterval = null;
      }
    }
  }
  
  updateStatusEffects() {
    const now = Date.now();
    
    for (const effectId in this.activeEffects) {
      const effect = this.activeEffects[effectId];
      const remaining = Math.max(0, Math.ceil((effect.endTime - now) / 1000));
      effect.element.querySelector('.duration').textContent = remaining + 's';
    }
  }
  
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
  
  updatePlayerStats(player) {
    // Update health display
    const healthPercent = (player.health / player.maxHealth) * 100;
    this.healthBar.style.width = healthPercent + '%';
    this.healthText.textContent = `${player.health} / ${player.maxHealth}`;
    
    // Change health bar color based on health
    if (healthPercent > 60) {
      this.healthBar.style.backgroundColor = '#00cc00'; // Green
    } else if (healthPercent > 30) {
      this.healthBar.style.backgroundColor = '#ffcc00'; // Yellow
    } else {
      this.healthBar.style.backgroundColor = '#cc0000'; // Red
    }
    
    // Update XP display
    const xpPercent = (player.experience / player.experienceToNextLevel) * 100;
    this.expBar.style.width = xpPercent + '%';
    this.expText.textContent = `Level ${player.level} - ${player.experience} / ${player.experienceToNextLevel} XP`;
    
    // Store player stats
    this.playerStats = {
      level: player.level,
      health: player.health,
      maxHealth: player.maxHealth,
      experience: player.experience,
      experienceToNextLevel: player.experienceToNextLevel
    };
  }
  
  addCombatMessage(message) {
    const msgElement = document.createElement('div');
    msgElement.textContent = message;
    msgElement.style.marginBottom = '3px';
    
    // Add to combat log
    this.combatLog.appendChild(msgElement);
    this.combatLog.scrollTop = this.combatLog.scrollHeight;
    
    // Also add to chat with combat type
    this.addChatMessage('', message, 'combat');
  }
  
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
  
  worldToScreen(position, camera) {
    const vector = new THREE.Vector3();
    vector.copy(position);
    
    vector.project(camera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }
  
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  cleanup() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
    
    // Clear any intervals
    if (this.effectUpdateInterval) {
      clearInterval(this.effectUpdateInterval);
    }
    
    // Clear any timeouts in active effects
    for (const effectId in this.activeEffects) {
      clearTimeout(this.activeEffects[effectId].timeout);
    }
  }
}