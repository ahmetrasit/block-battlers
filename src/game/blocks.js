/**
 * Block definitions and creation module
 * Handles block properties, geometries, and block creation
 */

import * as THREE from 'three';

// Block material costs (increased for progression)
export const BLOCK_COSTS = {
    armor: { iron: 5, copper: 2 },
    weapon: { iron: 4, copper: 5 },
    engine: { iron: 6, copper: 6 },
    core: { iron: 8, copper: 8 },
    wheel: { iron: 3, copper: 2 },
    spike: { iron: 2, copper: 1 },
    largewheel: { iron: 5, copper: 4 },
    // Advanced blocks
    shield: { iron: 6, copper: 7 },
    booster: { iron: 8, copper: 5 },
    repair: { iron: 7, copper: 8 },
    heavyarmor: { iron: 10, copper: 3 },
    laser: { iron: 8, copper: 10 },
    tanktread: { iron: 45, copper: 15 },  // Late-game mobility
    cannon: { iron: 30, copper: 20 }      // Late-game weapon
};

// Max health for each block type
export const BLOCK_MAX_HEALTH = {
    armor: 50,
    weapon: 20,
    engine: 30,
    core: 100,
    wheel: 25,
    spike: 15,
    largewheel: 40,
    // New blocks
    shield: 35,
    booster: 25,
    repair: 30,
    heavyarmor: 100,
    laser: 30,
    tanktread: 50,
    cannon: 40
};

// Block colors
export const BLOCK_COLORS = {
    armor: 0x4a9eff,      // Bright blue
    weapon: 0xff1744,     // Bright red
    engine: 0xffd700,     // Gold
    core: 0x9c27b0,       // Purple
    wheel: 0x2c2c2c,      // Dark gray
    spike: 0xff6b00,      // Orange
    largewheel: 0x1a1a1a, // Darker gray
    // New blocks
    shield: 0x00ffff,     // Cyan
    booster: 0xff00ff,    // Magenta
    repair: 0x00ff00,     // Green
    heavyarmor: 0x1e3a8a, // Dark blue
    laser: 0xff0080,      // Hot pink
    tanktread: 0x3d3d3d,  // Medium gray
    cannon: 0x8b0000      // Dark red
};

// Block weights for physics calculation (increased for challenge)
export const BLOCK_WEIGHTS = {
    armor: 4.0,       // Was 1.05
    weapon: 3.0,      // Was 0.7
    engine: 5.5,      // Was 1.4
    core: 7.0,        // Was 1.75
    wheel: 2.5,       // Was 0.7
    spike: 1.5,       // Was 0.35
    largewheel: 4.0,  // Was 1.05
    // Advanced blocks
    shield: 3.5,      // Was 0.9
    booster: 3.0,     // Was 0.8
    repair: 4.0,      // Was 1.0
    heavyarmor: 10.0, // Was 2.5
    laser: 5.0,       // Was 1.2
    tanktread: 0,     // Weightless - carries weight
    cannon: 150       // Extremely heavy late-game weapon
};

// Weight capacity each wheel type can support
export const WHEEL_CAPACITY = {
    wheel: 3.5,       // Was 10, now 35% of original
    largewheel: 7,    // Was 20
    tanktread: 50     // Massive capacity for heavy tanks
};

// Block display names
export const BLOCK_NAMES = {
    armor: 'Armor',
    weapon: 'Weapon',
    engine: 'Engine',
    core: 'Core',
    wheel: 'Wheel',
    spike: 'Spike',
    largewheel: 'Large Wheel',
    shield: 'Shield',
    booster: 'Booster',
    repair: 'Repair',
    heavyarmor: 'Heavy Armor',
    laser: 'Laser',
    tanktread: 'Tank Tread',
    cannon: 'Cannon'
};

// Block descriptions
export const BLOCK_DESCRIPTIONS = {
    armor: 'High HP defense',
    weapon: 'Fires projectiles',
    engine: 'Powers movement',
    core: 'Vehicle heart',
    wheel: 'Basic mobility',
    spike: 'Ramming damage',
    largewheel: 'Fast movement',
    shield: 'Energy barrier',
    booster: 'Speed burst',
    repair: 'Self-repair',
    heavyarmor: 'Ultra defense',
    laser: 'Continuous beam',
    tanktread: 'Carries 50 weight',
    cannon: 'Splash damage'
};

// Block icons (emoji for now)
export const BLOCK_ICONS = {
    armor: '🛡️',
    weapon: '⚔️',
    engine: '⚡',
    core: '💎',
    wheel: '🎡',
    spike: '🔺',
    largewheel: '⭕',
    shield: '🔷',
    booster: '🚀',
    repair: '🔧',
    heavyarmor: '🏰',
    laser: '💥',
    tanktread: '🚜',
    cannon: '💣'
};

/**
 * Create geometry for a specific block type
 * @param {string} type - Block type
 * @returns {THREE.BufferGeometry} Block geometry
 */
export function createBlockGeometry(type) {
    let geometry;
    switch(type) {
        case 'armor':
            // Thick cube for armor
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
        case 'weapon':
            // Tapered barrel - narrow front for clear firing direction
            geometry = new THREE.ConeGeometry(0.4, 1.2, 6);
            geometry.rotateX(-Math.PI / 2); // Point forward (negative Z)
            break;
        case 'engine':
            // Octagonal prism for engine
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
            geometry.rotateX(Math.PI / 2);
            break;
        case 'core':
            // Sphere for core
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
            break;
        case 'wheel':
            // Torus/wheel shape
            geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 16);
            geometry.rotateZ(Math.PI / 2);
            break;
        case 'spike':
            // Cone for spike
            geometry = new THREE.ConeGeometry(0.3, 1, 8);
            geometry.rotateX(-Math.PI / 2); // Point forward
            break;
        case 'largewheel':
            // Larger wheel - takes up 2x space
            geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.6, 20);
            geometry.rotateZ(Math.PI / 2);
            break;
        case 'shield':
            // Hexagonal shield generator
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 6);
            break;
        case 'booster':
            // Conical booster
            geometry = new THREE.ConeGeometry(0.4, 1.2, 8);
            geometry.rotateX(Math.PI / 2); // Point backward
            break;
        case 'repair':
            // Plus-shaped repair block
            geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
            break;
        case 'heavyarmor':
            // Thick, imposing cube
            geometry = new THREE.BoxGeometry(1, 1.2, 1);
            break;
        case 'laser':
            // Tapered laser emitter - narrow front for clear firing direction
            geometry = new THREE.CylinderGeometry(0.15, 0.4, 1.4, 8);
            geometry.rotateX(-Math.PI / 2); // Narrow end points forward (negative Z)
            break;
        case 'tanktread':
            // Flat rectangular tread
            geometry = new THREE.BoxGeometry(1.2, 1.0, 0.8);
            break;
        case 'cannon':
            // Massive 3x3x2 artillery cannon
            geometry = new THREE.BoxGeometry(3, 3, 2);
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    return geometry;
}

/**
 * Create a block mesh with proper materials and edges
 * @param {string} type - Block type
 * @param {Object} options - Optional parameters for block creation
 * @returns {THREE.Mesh} Complete block mesh with edges
 */
export function createBlock(type, options = {}) {
    const {
        color = BLOCK_COLORS[type],
        emissive = color,
        emissiveIntensity = 0.3,
        metalness = 0.8,
        roughness = 0.2,
        rotation = 0
    } = options;

    const geometry = createBlockGeometry(type);
    const material = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity,
        metalness,
        roughness
    });

    const block = new THREE.Mesh(geometry, material);

    // Add white edges for visibility
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    block.add(edges);

    // Set user data
    block.userData = {
        type: type,
        health: BLOCK_MAX_HEALTH[type],
        maxHealth: BLOCK_MAX_HEALTH[type],
        rotation: rotation,
        edges: edges // Store reference for disposal
    };

    // Apply rotation if specified
    if (rotation) {
        block.rotation.y = (rotation * Math.PI) / 180;
    }

    return block;
}

/**
 * Create a preview block for placement
 * @param {string} type - Block type
 * @returns {THREE.Mesh} Preview block mesh
 */
export function createPreviewBlock(type) {
    const geometry = createBlockGeometry(type);
    const material = new THREE.MeshStandardMaterial({
        color: BLOCK_COLORS[type],
        emissive: BLOCK_COLORS[type],
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7
    });

    const previewBlock = new THREE.Mesh(geometry, material);

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    previewBlock.add(edges);

    previewBlock.visible = false;
    previewBlock.userData = {
        type: type,
        edges: edges // Store reference for disposal
    };

    return previewBlock;
}