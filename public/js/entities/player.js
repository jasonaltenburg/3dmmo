// import * as THREE from '/lib/three/build/three.module.js';

export class Player {
  constructor(scene, socket, id) {
    this.scene = scene;
    this.socket = socket;
    this.id = id;
    
    // Player stats
    this.level = 1;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.attackDamage = 10;
    this.defense = 5;
    this.experience = 0;
    this.experienceToNextLevel = 100;
    this.gold = 0;
    
    // Inventory
    this.inventory = {
      equipment: [],
      consumables: []
    };
    
    // Active buffs
    this.buffs = {};
    
    // Create player model
    this.model = this.createModel();
    scene.add(this.model);
    
    // Movement properties
    this.speed = 0.1;
    this.attackCooldown = 0;
    this.maxAttackCooldown = 30; // frames (at 60fps = 0.5 seconds)
    
    // Combat state
    this.inCombat = false;
    this.lastDamageTime = 0;
    this.combatCooldown = 5000; // 5 seconds out of combat to exit combat state
  }
  
  createModel() {
    const group = new THREE.Group();
    
    // Player body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      roughness: 0.7,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Player head
    const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffddbb,
      roughness: 0.7,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.75;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.4, 0.95, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    group.add(leftArm);
    this.leftArm = leftArm;
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.4, 0.95, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    group.add(rightArm);
    this.rightArm = rightArm;
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    group.add(leftLeg);
    this.leftLeg = leftLeg;
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    group.add(rightLeg);
    this.rightLeg = rightLeg;
    
    // Sword (only visible during attack)
    const swordGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const swordMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.3,
      metalness: 0.8
    });
    const sword = new THREE.Mesh(swordGeometry, swordMaterial);
    sword.position.set(0, 0.4, 0);
    
    // Sword handle
    const handleGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.15);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.2
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.45;
    sword.add(handle);
    
    // Add sword to right arm
    rightArm.add(sword);
    this.sword = sword;
    
    // Initially hide sword
    this.sword.visible = false;
    
    // Health bar
    const healthBarContainer = document.createElement('div');
    healthBarContainer.className = 'health-bar-container';
    healthBarContainer.style.position = 'absolute';
    healthBarContainer.style.width = '50px';
    healthBarContainer.style.height = '8px';
    healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    healthBarContainer.style.borderRadius = '4px';
    healthBarContainer.style.overflow = 'hidden';
    
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    healthBar.style.width = '100%';
    healthBar.style.height = '100%';
    healthBar.style.backgroundColor = '#00cc00';
    
    healthBarContainer.appendChild(healthBar);
    document.body.appendChild(healthBarContainer);
    
    this.healthBarContainer = healthBarContainer;
    this.healthBar = healthBar;
    
    return group;
  }
  
  update(keys, direction, rotation, camera) {
    // Calculate movement direction
    if (direction.length() > 0) {
      // Moving - animate legs and arms
      const time = Date.now() * 0.005;
      
      this.leftLeg.rotation.x = Math.sin(time * 2) * 0.5;
      this.rightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.5;
      this.leftArm.rotation.x = Math.sin(time * 2 + Math.PI) * 0.3;
      this.rightArm.rotation.x = Math.sin(time * 2) * 0.3;
      
      // Face movement direction
      this.model.rotation.y = rotation;
    } else {
      // Idle - reset limbs
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
      
      // Attack animation
      if (this.sword.visible) {
        const progress = 1 - (this.attackCooldown / this.maxAttackCooldown);
        this.rightArm.rotation.x = -Math.PI / 2 + progress * Math.PI / 2;
        
        // Hide sword when attack finishes
        if (this.attackCooldown === 0) {
          this.sword.visible = false;
        }
      }
    }
    
    // Update combat state
    if (this.inCombat && Date.now() - this.lastDamageTime > this.combatCooldown) {
      this.inCombat = false;
      
      // Regain health when out of combat (1% per second)
      const healthRegainInterval = setInterval(() => {
        if (this.health < this.maxHealth && !this.inCombat) {
          this.health = Math.min(this.health + 1, this.maxHealth);
          this.updateHealthBar();
        } else if (this.health >= this.maxHealth || this.inCombat) {
          clearInterval(healthRegainInterval);
        }
      }, 1000);
    }
    
    // Update health bar position to follow player
    const screenPosition = this.getScreenPosition(camera);
    if (screenPosition) {
      this.healthBarContainer.style.display = 'block';
      this.healthBarContainer.style.left = (screenPosition.x - 25) + 'px';
      this.healthBarContainer.style.top = (screenPosition.y - 40) + 'px';
    } else {
      this.healthBarContainer.style.display = 'none';
    }
  }
  
  getScreenPosition(camera) {
    // Convert 3D position to screen position
    const vector = new THREE.Vector3();
    
    // Get the position of the player's head for better positioning
    vector.set(
      this.model.position.x,
      this.model.position.y + 2, // Offset above player
      this.model.position.z
    );
    
    vector.project(camera);
    
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    
    // Convert to screen coordinates
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    };
  }
  
  attack() {
    if (this.attackCooldown <= 0) {
      // Start attack
      this.attackCooldown = this.maxAttackCooldown;
      this.sword.visible = true;
      
      return {
        type: 'attack',
        position: this.model.position.clone(),
        direction: new THREE.Vector3(0, 0, -1).applyQuaternion(this.model.quaternion),
        damage: this.attackDamage,
        range: 2 // Attack range in units
      };
    }
    return null;
  }
  
  takeDamage(amount) {
    // Apply defense reduction (percentage-based)
    const damageReduction = this.defense / 100;
    const actualDamage = Math.max(1, Math.floor(amount * (1 - damageReduction)));
    
    this.health = Math.max(0, this.health - actualDamage);
    this.inCombat = true;
    this.lastDamageTime = Date.now();
    
    // Update health bar
    this.updateHealthBar();
    
    // Flash the player red
    const originalMaterials = [];
    this.model.traverse((object) => {
      if (object.isMesh && object.material) {
        originalMaterials.push({
          mesh: object,
          material: object.material.clone()
        });
        
        // Set to red material
        object.material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.5
        });
      }
    });
    
    // Reset materials after a short delay
    setTimeout(() => {
      originalMaterials.forEach(item => {
        item.mesh.material = item.material;
      });
    }, 100);
    
    return this.health <= 0;
  }
  
  updateHealthBar() {
    const healthPercent = (this.health / this.maxHealth) * 100;
    this.healthBar.style.width = healthPercent + '%';
    
    // Change color based on health
    if (healthPercent > 60) {
      this.healthBar.style.backgroundColor = '#00cc00'; // Green
    } else if (healthPercent > 30) {
      this.healthBar.style.backgroundColor = '#ffcc00'; // Yellow
    } else {
      this.healthBar.style.backgroundColor = '#cc0000'; // Red
    }
  }
  
  gainExperience(amount) {
    this.experience += amount;
    
    // Check for level up
    if (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
    
    return {
      currentXp: this.experience,
      xpToNextLevel: this.experienceToNextLevel,
      percent: (this.experience / this.experienceToNextLevel) * 100
    };
  }
  
  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    // Improve stats
    this.maxHealth += 20;
    this.health = this.maxHealth;
    this.attackDamage += 5;
    this.defense += 2;
    
    // Update health bar
    this.updateHealthBar();
    
    return {
      level: this.level,
      maxHealth: this.maxHealth,
      attackDamage: this.attackDamage,
      defense: this.defense
    };
  }
  
  // Gold and inventory methods
  addGold(amount) {
    this.gold += amount;
    return this.gold;
  }
  
  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }
  
  addItem(item) {
    if (item.type === 'equipment') {
      this.inventory.equipment.push(item);
    } else if (item.type === 'consumable') {
      this.inventory.consumables.push(item);
    }
  }
  
  removeItem(itemId, type) {
    if (type === 'equipment') {
      this.inventory.equipment = this.inventory.equipment.filter(item => item.id !== itemId);
    } else if (type === 'consumable') {
      this.inventory.consumables = this.inventory.consumables.filter(item => item.id !== itemId);
    }
  }
  
  useConsumable(itemId) {
    const itemIndex = this.inventory.consumables.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;
    
    const item = this.inventory.consumables[itemIndex];
    
    // Apply consumable effects
    if (item.effects) {
      if (item.effects.health) {
        this.health = Math.min(this.maxHealth, this.health + item.effects.health);
        this.updateHealthBar();
      }
      
      if (item.effects.buff) {
        this.addBuff(item.effects.buff.id, item.effects.buff.duration, item.effects.buff.stats);
      }
    }
    
    // Remove consumable after use (if it's not reusable)
    if (!item.reusable) {
      this.inventory.consumables.splice(itemIndex, 1);
    }
    
    return true;
  }
  
  // Buff system
  addBuff(buffId, duration, stats) {
    // Apply buff stats
    if (stats.attackDamage) {
      this.attackDamage += stats.attackDamage;
    }
    if (stats.defense) {
      this.defense += stats.defense;
    }
    if (stats.maxHealth) {
      const healthPercent = this.health / this.maxHealth;
      this.maxHealth += stats.maxHealth;
      this.health = Math.round(this.maxHealth * healthPercent);
      this.updateHealthBar();
    }
    
    // Store buff with expiration time
    this.buffs[buffId] = {
      id: buffId,
      stats: stats,
      expiresAt: Date.now() + duration
    };
    
    // Set timeout to remove buff
    setTimeout(() => this.removeBuff(buffId), duration);
    
    // Return buff info for UI
    return {
      id: buffId,
      duration: duration,
      stats: stats
    };
  }
  
  removeBuff(buffId) {
    if (!this.buffs[buffId]) return;
    
    // Remove buff stats
    const stats = this.buffs[buffId].stats;
    if (stats.attackDamage) {
      this.attackDamage -= stats.attackDamage;
    }
    if (stats.defense) {
      this.defense -= stats.defense;
    }
    if (stats.maxHealth) {
      const healthPercent = this.health / this.maxHealth;
      this.maxHealth -= stats.maxHealth;
      this.health = Math.round(this.maxHealth * healthPercent);
      this.updateHealthBar();
    }
    
    // Remove buff from active buffs
    delete this.buffs[buffId];
  }
  
  cleanup() {
    if (this.model) {
      this.scene.remove(this.model);
    }
    
    if (this.healthBarContainer && this.healthBarContainer.parentNode) {
      this.healthBarContainer.parentNode.removeChild(this.healthBarContainer);
    }
    
    // Clear all buff timeouts
    for (const buffId in this.buffs) {
      this.removeBuff(buffId);
    }
  }
}