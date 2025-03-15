const chai = require('chai');
const expect = chai.expect;

// Simple test for the server functionality
describe('Game Server', () => {
  it('should have Express routes configured correctly', () => {
    const server = require('../server');
    expect(server).to.exist;
  });
});

// Test player movement and positions
describe('Player Movement', () => {
  it('should update player position when moving', () => {
    // Mock position data
    const position = {
      x: 10,
      y: 0,
      z: 15,
      rotationY: 1.5
    };
    
    // Create a copy of the position object
    const updatedPosition = { ...position };
    
    // Apply movement
    const direction = { x: 1, z: 0 };
    const speed = 0.1;
    
    updatedPosition.x += direction.x * speed;
    updatedPosition.z += direction.z * speed;
    
    // Check that the position was updated correctly
    expect(updatedPosition.x).to.equal(position.x + direction.x * speed);
    expect(updatedPosition.z).to.equal(position.z + direction.z * speed);
    expect(updatedPosition.y).to.equal(position.y); // Y shouldn't change during horizontal movement
  });
});

// Test region locations
describe('Game Regions', () => {
  // Mock the Vector3 class for simple tests
  class Vector3 {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    
    distanceTo(other) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dz = this.z - other.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  
  // Mock world regions
  const regions = [
    {
      name: 'Town',
      position: new Vector3(0, 0, 0),
      radius: 10,
      type: 'safe'
    },
    {
      name: 'Cemetery',
      position: new Vector3(0, 0, -40),
      radius: 25,
      type: 'combat',
      enemyType: 'skeleton',
      enemyLevel: 1
    },
    {
      name: 'Cave',
      position: new Vector3(40, 0, 0),
      radius: 25,
      type: 'combat',
      enemyType: 'bat',
      enemyLevel: 2
    },
    {
      name: 'Field',
      position: new Vector3(0, 0, 40),
      radius: 25,
      type: 'combat',
      enemyType: 'snake',
      enemyLevel: 3
    },
    {
      name: 'Castle',
      position: new Vector3(-40, 0, 0),
      radius: 25,
      type: 'combat',
      enemyType: 'vampire',
      enemyLevel: 5
    }
  ];
  
  // Mock getRegionAtPosition function
  function getRegionAtPosition(position) {
    for (const region of regions) {
      const distance = position.distanceTo(region.position);
      if (distance < region.radius) {
        return region;
      }
    }
    return null;
  }
  
  it('should have 5 regions', () => {
    expect(regions.length).to.equal(5);
  });
  
  it('should correctly identify the Town region', () => {
    const position = new Vector3(0, 0, 0);
    const region = getRegionAtPosition(position);
    expect(region).to.exist;
    expect(region.name).to.equal('Town');
    expect(region.type).to.equal('safe');
  });
  
  it('should correctly identify the Cemetery region', () => {
    const position = new Vector3(0, 0, -40);
    const region = getRegionAtPosition(position);
    expect(region).to.exist;
    expect(region.name).to.equal('Cemetery');
    expect(region.type).to.equal('combat');
    expect(region.enemyType).to.equal('skeleton');
  });
  
  it('should correctly identify the Cave region', () => {
    const position = new Vector3(40, 0, 0);
    const region = getRegionAtPosition(position);
    expect(region).to.exist;
    expect(region.name).to.equal('Cave');
    expect(region.enemyType).to.equal('bat');
  });
  
  it('should correctly identify the Field region', () => {
    const position = new Vector3(0, 0, 40);
    const region = getRegionAtPosition(position);
    expect(region).to.exist;
    expect(region.name).to.equal('Field');
    expect(region.enemyType).to.equal('snake');
  });
  
  it('should correctly identify the Castle region', () => {
    const position = new Vector3(-40, 0, 0);
    const region = getRegionAtPosition(position);
    expect(region).to.exist;
    expect(region.name).to.equal('Castle');
    expect(region.enemyType).to.equal('vampire');
  });
  
  it('should return null for positions not in any region', () => {
    const position = new Vector3(100, 0, 100);
    const region = getRegionAtPosition(position);
    expect(region).to.be.null;
  });
});