import * as THREE from 'three';

export class Enemy {
  constructor(scene, type, level, position) {
    this.scene = scene;
    this.type = type;
    this.level = level;
    this.health = this.getMaxHealth();
    this.damage = this.getDamage();
    this.model = this.createModel();
    this.model.position.copy(position);
    
    this.state = 'idle';
    this.targetPosition = null;
    this.speed = 0.05;
    this.detectionRadius = 15;
    this.attackRadius = 2;
    this.attackCooldown = 0;
    this.maxAttackCooldown = 60; // frames (at 60fps = 1 second)
    
    // Add to scene
    this.scene.add(this.model);
  }
  
  createModel() {
    // Base model creation based on enemy type
    let geometry, material, model;
    
    switch(this.type) {
      case 'skeleton':
        return this.createSkeletonModel();
      case 'bat':
        return this.createBatModel();
      case 'snake':
        return this.createSnakeModel();
      case 'vampire':
        return this.createVampireModel();
      default:
        // Default enemy model (fallback)
        geometry = new THREE.BoxGeometry(1, 2, 1);
        material = new THREE.MeshStandardMaterial({ color: 0x880000 });
        model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        model.receiveShadow = true;
        return model;
    }
  }
  
  createSkeletonModel() {
    // Create a skeleton model
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.9,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);
    
    // Skull
    const skullGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const skull = new THREE.Mesh(skullGeometry, bodyMaterial);
    skull.position.y = 2.1;
    skull.castShadow = true;
    group.add(skull);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.45, 1.3, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.45, 1.3, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.2, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.2, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Store references for animation
    this.armLeft = leftArm;
    this.armRight = rightArm;
    this.legLeft = leftLeg;
    this.legRight = rightLeg;
    
    return group;
  }
  
  createBatModel() {
    // Create a bat model
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    group.add(body);
    
    // Wings
    const wingGeometry = new THREE.PlaneGeometry(1.5, 0.8);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.8, 2, 0);
    leftWing.rotation.z = Math.PI / 6;
    leftWing.castShadow = true;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.8, 2, 0);
    rightWing.rotation.z = -Math.PI / 6;
    rightWing.castShadow = true;
    group.add(rightWing);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 2, 0.4);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 2, 0.4);
    group.add(rightEye);
    
    // Store references for animation
    this.leftWing = leftWing;
    this.rightWing = rightWing;
    
    return group;
  }
  
  createSnakeModel() {
    // Create a snake model
    const group = new THREE.Group();
    
    // Snake body segments
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x008800,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const segments = 6;
    this.bodySegments = [];
    
    for (let i = 0; i < segments; i++) {
      const size = 0.3 - (i * 0.02);
      const segmentGeometry = new THREE.SphereGeometry(size, 8, 8);
      const segment = new THREE.Mesh(segmentGeometry, bodyMaterial);
      
      // Position segments in a curved line
      const angle = (i / (segments - 1)) * Math.PI * 0.5;
      segment.position.x = Math.sin(angle) * i * 0.3;
      segment.position.z = Math.cos(angle) * i * 0.3;
      segment.position.y = 0.3;
      
      segment.castShadow = true;
      group.add(segment);
      this.bodySegments.push(segment);
    }
    
    // Snake head
    const headGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x006600,
      roughness: 0.7,
      metalness: 0.3
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.x = Math.PI / 2;
    head.position.copy(this.bodySegments[0].position);
    head.position.z += 0.4;
    head.castShadow = true;
    group.add(head);
    this.head = head;
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.15, 0.2);
    head.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.15, 0.2);
    head.add(rightEye);
    
    return group;
  }
  
  createVampireModel() {
    // Create a vampire model
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.7,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);
    
    // Cape
    const capeGeometry = new THREE.PlaneGeometry(1.4, 1.8);
    const capeMaterial = new THREE.MeshStandardMaterial({
      color: 0x880000,
      roughness: 0.7,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const cape = new THREE.Mesh(capeGeometry, capeMaterial);
    cape.position.set(0, 1.4, -0.3);
    cape.castShadow = true;
    group.add(cape);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0d0d0,
      roughness: 0.7,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    group.add(head);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 2.5, 0.35);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 2.5, 0.35);
    group.add(rightEye);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1.2, 0.25);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.55, 1.5, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.55, 1.5, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.35, 1, 0.35);
    
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.25, 0.5, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.25, 0.5, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    
    // Store references for animation
    this.cape = cape;
    this.armLeft = leftArm;
    this.armRight = rightArm;
    
    return group;
  }
  
  getMaxHealth() {
    // Base health scaling by level
    const baseHealth = 20;
    return baseHealth + (this.level * 10);
  }
  
  getDamage() {
    // Base damage scaling by level
    const baseDamage = 5;
    return baseDamage + (this.level * 2);
  }
  
  update(player) {
    if (this.health <= 0) {
      return false; // Enemy is dead
    }
    
    // Check for player in detection range
    const distanceToPlayer = this.model.position.distanceTo(player.position);
    
    if (distanceToPlayer < this.detectionRadius) {
      // Player detected, move toward player
      this.state = 'chase';
      this.targetPosition = player.position.clone();
      
      if (distanceToPlayer < this.attackRadius) {
        // Player within attack range
        this.state = 'attack';
        
        // Only attack when cooldown is 0
        if (this.attackCooldown <= 0) {
          // Reset attack cooldown
          this.attackCooldown = this.maxAttackCooldown;
          return { type: 'attack', damage: this.damage };
        }
      }
    } else {
      // No player detection, idle or wander
      this.state = 'idle';
      
      // Random chance to start wandering
      if (Math.random() < 0.01 && !this.targetPosition) {
        this.state = 'wander';
        
        // Set a random target position within 10 units
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 10;
        this.targetPosition = new THREE.Vector3(
          this.model.position.x + Math.cos(angle) * distance,
          this.model.position.y,
          this.model.position.z + Math.sin(angle) * distance
        );
      }
    }
    
    // Update movement based on state
    if ((this.state === 'chase' || this.state === 'wander') && this.targetPosition) {
      const direction = new THREE.Vector3()
        .subVectors(this.targetPosition, this.model.position)
        .normalize();
      
      // Only move on xz plane
      direction.y = 0;
      
      // If we're close to target and wandering, clear target
      if (this.state === 'wander' && 
          this.model.position.distanceTo(this.targetPosition) < 1) {
        this.targetPosition = null;
      } else {
        // Move toward target
        this.model.position.add(direction.multiplyScalar(this.speed));
        
        // Face movement direction
        this.model.lookAt(
          this.model.position.x + direction.x,
          this.model.position.y,
          this.model.position.z + direction.z
        );
      }
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Update animations based on enemy type
    this.animate();
    
    // Enemy is still active
    return true;
  }
  
  animate() {
    // Different animations based on enemy type
    switch(this.type) {
      case 'skeleton':
        this.animateSkeleton();
        break;
      case 'bat':
        this.animateBat();
        break;
      case 'snake':
        this.animateSnake();
        break;
      case 'vampire':
        this.animateVampire();
        break;
    }
  }
  
  animateSkeleton() {
    if (!this.armLeft || !this.armRight || !this.legLeft || !this.legRight) return;
    
    const time = Date.now() * 0.005;
    
    if (this.state === 'idle') {
      // Subtle idle animation
      this.armLeft.rotation.x = Math.sin(time * 0.5) * 0.1;
      this.armRight.rotation.x = Math.sin(time * 0.5 + 0.5) * 0.1;
    } else if (this.state === 'chase' || this.state === 'wander') {
      // Walking animation
      this.armLeft.rotation.x = Math.sin(time * 2) * 0.5;
      this.armRight.rotation.x = Math.sin(time * 2 + Math.PI) * 0.5;
      this.legLeft.rotation.x = Math.sin(time * 2 + Math.PI) * 0.5;
      this.legRight.rotation.x = Math.sin(time * 2) * 0.5;
    } else if (this.state === 'attack') {
      // Attack animation
      const attackAnim = (this.attackCooldown / this.maxAttackCooldown);
      this.armLeft.rotation.x = -Math.PI / 2 + attackAnim * Math.PI / 2;
      this.armRight.rotation.x = -Math.PI / 2 + attackAnim * Math.PI / 2;
    }
  }
  
  animateBat() {
    if (!this.leftWing || !this.rightWing) return;
    
    const time = Date.now() * 0.005;
    
    // Wing flapping animation
    let wingFlap = Math.sin(time * 6) * 0.5;
    
    if (this.state === 'idle') {
      wingFlap *= 0.3; // Less flapping when idle
    }
    
    this.leftWing.rotation.z = Math.PI / 6 + wingFlap;
    this.rightWing.rotation.z = -Math.PI / 6 - wingFlap;
    
    // Hovering animation
    this.model.position.y = 2 + Math.sin(time) * 0.1;
  }
  
  animateSnake() {
    if (!this.bodySegments || this.bodySegments.length === 0) return;
    
    const time = Date.now() * 0.005;
    
    // Slithering animation
    for (let i = 0; i < this.bodySegments.length; i++) {
      const segment = this.bodySegments[i];
      const offset = i * 0.2;
      
      segment.position.x = Math.sin(time * 2 + offset) * 0.2;
    }
    
    // Orient head to follow the first body segment
    if (this.head && this.bodySegments.length > 0) {
      this.head.position.copy(this.bodySegments[0].position);
      this.head.position.z += 0.4;
      
      // If chasing or attacking, raise the head
      if (this.state === 'chase' || this.state === 'attack') {
        this.head.position.y += 0.2 + Math.sin(time * 3) * 0.1;
      }
    }
  }
  
  animateVampire() {
    if (!this.cape || !this.armLeft || !this.armRight) return;
    
    const time = Date.now() * 0.005;
    
    // Cape billowing
    this.cape.rotation.x = Math.sin(time) * 0.1;
    
    if (this.state === 'idle') {
      // Subtle idle animation
      this.armLeft.rotation.x = Math.sin(time * 0.5) * 0.1;
      this.armRight.rotation.x = Math.sin(time * 0.5 + 0.5) * 0.1;
    } else if (this.state === 'chase' || this.state === 'wander') {
      // Walking animation
      this.armLeft.rotation.x = Math.sin(time * 2) * 0.2;
      this.armRight.rotation.x = Math.sin(time * 2 + Math.PI) * 0.2;
    } else if (this.state === 'attack') {
      // Attack animation
      this.armLeft.rotation.x = -Math.PI / 4;
      this.armRight.rotation.x = -Math.PI / 4;
      this.armLeft.rotation.z = Math.sin(time * 8) * 0.2 - 0.3;
      this.armRight.rotation.z = Math.sin(time * 8) * 0.2 + 0.3;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Flash the enemy red when taking damage
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
    
    // Return if enemy is dead and potential drops if killed
    const isDead = this.health <= 0;
    if (isDead) {
      return {
        dead: true,
        drops: this.generateDrops()
      };
    }
    
    return { dead: false };
  }
  
  generateDrops() {
    const drops = { gold: 0, items: [] };
    
    // Gold drops based on enemy level
    const baseGold = this.level * 5;
    const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25 random multiplier
    drops.gold = Math.floor(baseGold * randomFactor);
    
    // Item drops based on enemy type and level
    const dropChance = Math.random();
    
    // Common item: 15% chance
    // Rare item: 5% chance
    // Epic item: 1% chance
    
    if (dropChance < 0.01 * this.level) {
      // Epic drop (higher chance with higher level enemies)
      drops.items.push(this.createItemDrop('epic'));
    } else if (dropChance < 0.05 * this.level) {
      // Rare drop
      drops.items.push(this.createItemDrop('rare'));
    } else if (dropChance < 0.15 * this.level) {
      // Common drop
      drops.items.push(this.createItemDrop('common'));
    }
    
    // Additional chance for consumable
    if (Math.random() < 0.1) {
      drops.items.push(this.createConsumableDrop());
    }
    
    return drops;
  }
  
  createItemDrop(rarity) {
    // Generate a random item based on enemy type and rarity
    const itemTypes = ['weapon', 'armor', 'accessory'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    // Base stats multiplier based on rarity
    let statMultiplier = 1.0;
    if (rarity === 'rare') statMultiplier = 1.5;
    if (rarity === 'epic') statMultiplier = 2.5;
    
    // Create item based on enemy type
    let itemName, stats;
    
    switch(this.type) {
      case 'skeleton':
        if (itemType === 'weapon') {
          itemName = `${rarity === 'epic' ? 'Ancient ' : ''}Bone Sword`;
          stats = { attackDamage: Math.floor(5 * this.level * statMultiplier) };
        } else if (itemType === 'armor') {
          itemName = `${rarity === 'epic' ? 'Ancient ' : ''}Bone Armor`;
          stats = { defense: Math.floor(3 * this.level * statMultiplier) };
        } else {
          itemName = `${rarity === 'epic' ? 'Ancient ' : ''}Skull Amulet`;
          stats = { 
            attackDamage: Math.floor(2 * this.level * statMultiplier),
            defense: Math.floor(2 * this.level * statMultiplier)
          };
        }
        break;
        
      case 'bat':
        if (itemType === 'weapon') {
          itemName = `${rarity === 'epic' ? 'Sonic ' : ''}Wing Blade`;
          stats = { attackDamage: Math.floor(4 * this.level * statMultiplier) };
        } else if (itemType === 'armor') {
          itemName = `${rarity === 'epic' ? 'Sonic ' : ''}Leather Vest`;
          stats = { defense: Math.floor(2 * this.level * statMultiplier) };
        } else {
          itemName = `${rarity === 'epic' ? 'Sonic ' : ''}Echo Pendant`;
          stats = { 
            attackDamage: Math.floor(1 * this.level * statMultiplier),
            defense: Math.floor(3 * this.level * statMultiplier)
          };
        }
        break;
        
      case 'snake':
        if (itemType === 'weapon') {
          itemName = `${rarity === 'epic' ? 'Venomous ' : ''}Fang Dagger`;
          stats = { attackDamage: Math.floor(6 * this.level * statMultiplier) };
        } else if (itemType === 'armor') {
          itemName = `${rarity === 'epic' ? 'Venomous ' : ''}Scale Armor`;
          stats = { defense: Math.floor(4 * this.level * statMultiplier) };
        } else {
          itemName = `${rarity === 'epic' ? 'Venomous ' : ''}Serpent Ring`;
          stats = { 
            attackDamage: Math.floor(3 * this.level * statMultiplier),
            defense: Math.floor(2 * this.level * statMultiplier)
          };
        }
        break;
        
      case 'vampire':
        if (itemType === 'weapon') {
          itemName = `${rarity === 'epic' ? 'Bloodthirsty ' : ''}Crimson Blade`;
          stats = { attackDamage: Math.floor(8 * this.level * statMultiplier) };
        } else if (itemType === 'armor') {
          itemName = `${rarity === 'epic' ? 'Bloodthirsty ' : ''}Noble Garments`;
          stats = { defense: Math.floor(5 * this.level * statMultiplier) };
        } else {
          itemName = `${rarity === 'epic' ? 'Bloodthirsty ' : ''}Ruby Amulet`;
          stats = { 
            attackDamage: Math.floor(4 * this.level * statMultiplier),
            defense: Math.floor(3 * this.level * statMultiplier)
          };
        }
        break;
        
      default:
        itemName = `${rarity === 'epic' ? 'Mysterious ' : ''}Item`;
        stats = { 
          attackDamage: Math.floor(3 * this.level * statMultiplier),
          defense: Math.floor(3 * this.level * statMultiplier)
        };
    }
    
    return {
      id: 'item_' + Math.floor(Math.random() * 1000000),
      name: itemName,
      type: 'equipment',
      equipType: itemType,
      rarity: rarity,
      level: this.level,
      stats: stats,
      description: `A ${rarity} ${itemType} dropped by a level ${this.level} ${this.type}.`
    };
  }
  
  createConsumableDrop() {
    // Different consumables based on enemy type
    let itemName, effects;
    
    switch(this.type) {
      case 'skeleton':
        itemName = 'Bone Marrow Potion';
        effects = { health: 20 * this.level };
        break;
        
      case 'bat':
        itemName = 'Echo Potion';
        effects = { health: 15 * this.level };
        break;
        
      case 'snake':
        itemName = 'Venom Extract';
        effects = { 
          buff: {
            id: 'venom_buff',
            duration: 30000, // 30 seconds
            stats: { attackDamage: 5 * this.level }
          }
        };
        break;
        
      case 'vampire':
        itemName = 'Blood Vial';
        effects = { 
          health: 10 * this.level,
          buff: {
            id: 'blood_buff',
            duration: 60000, // 60 seconds
            stats: { attackDamage: 3 * this.level, defense: 3 * this.level }
          }
        };
        break;
        
      default:
        itemName = 'Strange Potion';
        effects = { health: 10 * this.level };
    }
    
    return {
      id: 'consumable_' + Math.floor(Math.random() * 1000000),
      name: itemName,
      type: 'consumable',
      rarity: 'common',
      effects: effects,
      description: `A consumable dropped by a level ${this.level} ${this.type}.`
    };
  }
  
  cleanup() {
    if (this.model) {
      this.scene.remove(this.model);
    }
  }
}
