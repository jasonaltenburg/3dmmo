import * as THREE from '/lib/three/build/three.module.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.regions = [];
    this.createTown();
    this.createCemetery();
    this.createCave();
    this.createField();
    this.createCastle();
  }

  createTown() {
    // Central town area
    const townSize = 20;
    const townGeometry = new THREE.PlaneGeometry(townSize, townSize);
    const townMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x999999,
      roughness: 0.7,
      metalness: 0.1
    });
    const town = new THREE.Mesh(townGeometry, townMaterial);
    town.rotation.x = -Math.PI / 2;
    town.receiveShadow = true;
    town.position.set(0, 0.01, 0); // Slightly above ground to prevent z-fighting
    this.scene.add(town);
    this.town = town;
    
    // Add buildings
    this.addBuildings();
    
    // Add region data
    this.regions.push({
      name: 'Town',
      position: new THREE.Vector3(0, 0, 0),
      radius: townSize / 2,
      type: 'safe',
      enemies: []
    });
  }
  
  addBuildings() {
    // Add some simple buildings to the town
    const buildingPositions = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 },
      { x: 0, z: 0 }, // Center building
    ];
    
    buildingPositions.forEach((pos, index) => {
      const isCenter = index === buildingPositions.length - 1;
      const size = isCenter ? 4 : 3;
      const height = isCenter ? 5 : 3;
      
      // Building base
      const buildingGeometry = new THREE.BoxGeometry(size, height, size);
      const buildingMaterial = new THREE.MeshStandardMaterial({ 
        color: isCenter ? 0x8b4513 : 0xd2b48c,
        roughness: 0.8,
        metalness: 0.2
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(pos.x, height / 2, pos.z);
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      
      // Roof
      const roofGeometry = new THREE.ConeGeometry(size * 0.8, height / 2, 4);
      const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: isCenter ? 0x800000 : 0xa52a2a,
        roughness: 0.7,
        metalness: 0.1
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(pos.x, height + height / 4, pos.z);
      roof.castShadow = true;
      roof.rotation.y = Math.PI / 4; // Rotate 45 degrees to align with building
      this.scene.add(roof);
    });
  }

  createCemetery() {
    // North area - Cemetery with skeletons
    const cemeterySize = 50;
    const cemeteryGeometry = new THREE.PlaneGeometry(cemeterySize, cemeterySize);
    const cemeteryMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.0
    });
    const cemetery = new THREE.Mesh(cemeteryGeometry, cemeteryMaterial);
    cemetery.rotation.x = -Math.PI / 2;
    cemetery.position.set(0, 0, -40); // North of town
    cemetery.receiveShadow = true;
    this.scene.add(cemetery);
    
    // Add gravestones
    this.addGravestones();
    
    // Add region data
    this.regions.push({
      name: 'Cemetery',
      position: new THREE.Vector3(0, 0, -40),
      radius: cemeterySize / 2,
      type: 'combat',
      enemyType: 'skeleton',
      enemyLevel: 1,
      maxEnemies: 10
    });
  }
  
  addGravestones() {
    // Add some gravestones to the cemetery
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 40 - 20;
      const z = Math.random() * 40 - 20 - 40; // Offset to center in cemetery
      
      const stoneGeometry = new THREE.BoxGeometry(1, 2, 0.3);
      const stoneMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x999999,
        roughness: 1.0,
        metalness: 0.0
      });
      const gravestone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      gravestone.position.set(x, 1, z);
      gravestone.castShadow = true;
      gravestone.receiveShadow = true;
      this.scene.add(gravestone);
    }
  }

  createCave() {
    // East area - Cave with bats
    const caveSize = 50;
    const caveGeometry = new THREE.PlaneGeometry(caveSize, caveSize);
    const caveMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 1.0,
      metalness: 0.1
    });
    const cave = new THREE.Mesh(caveGeometry, caveMaterial);
    cave.rotation.x = -Math.PI / 2;
    cave.position.set(40, 0, 0); // East of town
    cave.receiveShadow = true;
    this.scene.add(cave);
    
    // Add cave entrance
    this.addCaveEntrance();
    
    // Add region data
    this.regions.push({
      name: 'Cave',
      position: new THREE.Vector3(40, 0, 0),
      radius: caveSize / 2,
      type: 'combat',
      enemyType: 'bat',
      enemyLevel: 2,
      maxEnemies: 8
    });
  }
  
  addCaveEntrance() {
    // Create a cave entrance on the eastern side
    const entranceGeometry = new THREE.CylinderGeometry(5, 5, 10, 32, 1, false, 0, Math.PI);
    const entranceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2f2f2f,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.BackSide
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(30, 5, 0);
    entrance.rotation.y = Math.PI / 2; // Facing west (toward town)
    this.scene.add(entrance);
    
    // Add some rocks around the entrance
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI;
      const radius = 6 + Math.random() * 4;
      const x = 30 + Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 1.5, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x707070,
        roughness: 0.9,
        metalness: 0.1
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, 1, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  createField() {
    // South area - Field with snakes
    const fieldSize = 50;
    const fieldGeometry = new THREE.PlaneGeometry(fieldSize, fieldSize);
    const fieldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc2b280,
      roughness: 0.9,
      metalness: 0.0
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.set(0, 0, 40); // South of town
    field.receiveShadow = true;
    this.scene.add(field);
    
    // Add tall grass
    this.addTallGrass();
    
    // Add region data
    this.regions.push({
      name: 'Field',
      position: new THREE.Vector3(0, 0, 40),
      radius: fieldSize / 2,
      type: 'combat',
      enemyType: 'snake',
      enemyLevel: 3,
      maxEnemies: 12
    });
  }
  
  addTallGrass() {
    // Add clusters of tall grass to the field
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 40 - 20;
      const z = Math.random() * 40 - 20 + 40; // Offset to center in field
      
      const grassGeometry = new THREE.PlaneGeometry(3, 3);
      const grassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x556b2f,
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide
      });
      
      // Create crossed planes for grass tuft
      const grassTuft = new THREE.Group();
      
      const grassPlane1 = new THREE.Mesh(grassGeometry, grassMaterial);
      grassPlane1.position.set(0, 1.5, 0);
      grassTuft.add(grassPlane1);
      
      const grassPlane2 = new THREE.Mesh(grassGeometry, grassMaterial);
      grassPlane2.position.set(0, 1.5, 0);
      grassPlane2.rotation.y = Math.PI / 2;
      grassTuft.add(grassPlane2);
      
      grassTuft.position.set(x, 0, z);
      grassTuft.rotation.y = Math.random() * Math.PI;
      this.scene.add(grassTuft);
    }
  }

  createCastle() {
    // West area - Castle with vampires
    const castleSize = 50;
    const castleGroundGeometry = new THREE.PlaneGeometry(castleSize, castleSize);
    const castleGroundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.2
    });
    const castleGround = new THREE.Mesh(castleGroundGeometry, castleGroundMaterial);
    castleGround.rotation.x = -Math.PI / 2;
    castleGround.position.set(-40, 0, 0); // West of town
    castleGround.receiveShadow = true;
    this.scene.add(castleGround);
    
    // Add castle structure
    this.addCastleStructure();
    
    // Add region data
    this.regions.push({
      name: 'Castle',
      position: new THREE.Vector3(-40, 0, 0),
      radius: castleSize / 2,
      type: 'combat',
      enemyType: 'vampire',
      enemyLevel: 5,
      maxEnemies: 6
    });
  }
  
  addCastleStructure() {
    // Main castle structure
    const castleGroup = new THREE.Group();
    
    // Base
    const baseGeometry = new THREE.BoxGeometry(20, 10, 20);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x606060,
      roughness: 0.8,
      metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    castleGroup.add(base);
    
    // Towers at each corner
    const towerPositions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 }
    ];
    
    towerPositions.forEach(pos => {
      const towerGeometry = new THREE.CylinderGeometry(3, 3, 20, 8);
      const tower = new THREE.Mesh(towerGeometry, baseMaterial);
      tower.position.set(pos.x, 10, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      castleGroup.add(tower);
      
      // Tower roof
      const roofGeometry = new THREE.ConeGeometry(4, 5, 8);
      const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x800000,
        roughness: 0.7,
        metalness: 0.3
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(0, 12.5, 0);
      roof.castShadow = true;
      tower.add(roof);
    });
    
    // Center tower
    const centerTowerGeometry = new THREE.CylinderGeometry(5, 5, 30, 8);
    const centerTower = new THREE.Mesh(centerTowerGeometry, baseMaterial);
    centerTower.position.set(0, 15, 0);
    centerTower.castShadow = true;
    centerTower.receiveShadow = true;
    castleGroup.add(centerTower);
    
    // Center tower roof
    const centerRoofGeometry = new THREE.ConeGeometry(6, 8, 8);
    const centerRoof = new THREE.Mesh(centerRoofGeometry, baseMaterial);
    centerRoof.position.set(0, 19, 0);
    centerRoof.castShadow = true;
    castleGroup.add(centerRoof);
    
    // Castle entrance
    const entranceGeometry = new THREE.BoxGeometry(8, 8, 1);
    const entranceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.2
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 4, 10.5);
    castleGroup.add(entrance);
    
    // Position the entire castle
    castleGroup.position.set(-40, 0, 0);
    this.scene.add(castleGroup);
  }

  getRegionAtPosition(position) {
    for (const region of this.regions) {
      const distance = position.distanceTo(region.position);
      if (distance < region.radius) {
        return region;
      }
    }
    return null; // Not in any specific region
  }
}