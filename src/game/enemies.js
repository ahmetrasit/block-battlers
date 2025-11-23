/**
 * Enemy creation and AI module
 * Handles enemy vehicle generation and behavior
 */

import * as THREE from 'three';
import { createBlock } from './blocks.js';
import { disposeVehicle } from '../utils/disposable.js';

/**
 * EnemyManager class for managing enemy vehicles
 */
export class EnemyManager {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.enemies = [];
    }

    /**
     * Create enemies for current wave
     */
    createEnemies() {
        // Clear existing enemies
        this.clearEnemies();

        // Determine enemy count based on wave
        const enemyCount = Math.min(4, 1 + Math.floor(this.gameState.waveNumber / 2));

        for (let i = 0; i < enemyCount; i++) {
            const enemy = this.createEnemy(i);
            this.enemies.push(enemy);
            this.gameState.enemies.push(enemy);
        }

        // Update enemy count display
        const enemyCountElement = document.getElementById('enemyCount');
        if (enemyCountElement) {
            enemyCountElement.textContent = enemyCount;
        }
    }

    /**
     * Create a single enemy vehicle
     * @param {number} index - Enemy index for positioning
     * @returns {Object} Enemy object
     */
    createEnemy(index) {
        const enemy = {
            blocks: [],
            group: new THREE.Group(),
            velocity: new THREE.Vector3(),
            rotation: 0,
            health: 100,
            maxHealth: 100,
            lastAttackTime: 0,
            blockCounts: {
                armor: 0, weapon: 0, engine: 0,
                core: 0, wheel: 0, spike: 0, largewheel: 0
            }
        };

        // Position enemy based on index and wave
        // Fix: Use the correct enemy count calculation instead of current array length
        const enemyCount = Math.min(4, 1 + Math.floor(this.gameState.waveNumber / 2));
        const angle = (index / Math.max(1, enemyCount)) * Math.PI * 2;
        const distance = 15 + (this.gameState.waveNumber * 2); // Closer and less scaling
        enemy.group.position.set(
            Math.sin(angle) * distance,
            0.5, // Slightly above ground
            Math.cos(angle) * distance
        );

        // Generate enemy vehicle based on wave
        this.generateEnemyVehicle(enemy);

        // Add enemy group to scene
        this.scene.add(enemy.group);

        // Make sure the enemy is visible
        enemy.group.visible = true;

        return enemy;
    }

    /**
     * Generate enemy vehicle blocks based on wave difficulty
     * @param {Object} enemy - Enemy object to populate
     */
    generateEnemyVehicle(enemy) {
        const wave = this.gameState.waveNumber;

        // Core (always has one)
        this.addEnemyBlock(enemy, 'core', 0, 0.5, 0);

        // Engine (more in higher waves)
        const engineCount = 1 + Math.floor(wave / 3);
        for (let i = 0; i < engineCount; i++) {
            const pos = this.getRandomAdjacentPosition(enemy);
            if (pos) this.addEnemyBlock(enemy, 'engine', pos.x, pos.y, pos.z);
        }

        // Wheels (more in higher waves)
        const wheelCount = 2 + Math.floor(wave / 2);
        for (let i = 0; i < wheelCount; i++) {
            const uselargewheel = wave > 4 && Math.random() > 0.5;
            const type = uselargewheel ? 'largewheel' : 'wheel';
            const pos = this.getRandomAdjacentPosition(enemy);
            if (pos) this.addEnemyBlock(enemy, type, pos.x, pos.y, pos.z);
        }

        // Weapons (more in higher waves)
        const weaponCount = 1 + Math.floor(wave / 2);
        for (let i = 0; i < weaponCount; i++) {
            const pos = this.getRandomAdjacentPosition(enemy);
            if (pos) this.addEnemyBlock(enemy, 'weapon', pos.x, pos.y, pos.z);
        }

        // Armor (scales with wave)
        const armorCount = Math.floor(wave * 1.5);
        for (let i = 0; i < armorCount; i++) {
            const pos = this.getRandomAdjacentPosition(enemy);
            if (pos) this.addEnemyBlock(enemy, 'armor', pos.x, pos.y, pos.z);
        }

        // Spikes (wave 3+)
        if (wave >= 3) {
            const spikeCount = Math.floor((wave - 2) / 2);
            for (let i = 0; i < spikeCount; i++) {
                const pos = this.getRandomAdjacentPosition(enemy);
                if (pos) this.addEnemyBlock(enemy, 'spike', pos.x, pos.y, pos.z);
            }
        }

        // Calculate total health
        enemy.maxHealth = enemy.blocks.reduce((sum, block) => sum + block.userData.maxHealth, 0);
        enemy.health = enemy.maxHealth;
    }

    /**
     * Add a block to enemy vehicle
     * @param {Object} enemy - Enemy object
     * @param {string} type - Block type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    addEnemyBlock(enemy, type, x, y, z) {
        const block = createBlock(type, {
            color: 0xff0000,      // Red color for enemies
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });

        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData.isEnemy = true;

        enemy.blocks.push(block);
        enemy.blockCounts[type]++;
        enemy.group.add(block);
    }

    /**
     * Get random adjacent position for block placement
     * @param {Object} enemy - Enemy object
     * @returns {Object|null} Position object or null
     */
    getRandomAdjacentPosition(enemy) {
        if (enemy.blocks.length === 0) {
            return { x: 0, y: 0.5, z: 0 };
        }

        // Try multiple times to find valid position
        for (let attempt = 0; attempt < 20; attempt++) {
            const baseBlock = enemy.blocks[Math.floor(Math.random() * enemy.blocks.length)];
            const directions = [
                { x: 1, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 0, y: -1, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 0, y: 0, z: -1 }
            ];

            const dir = directions[Math.floor(Math.random() * directions.length)];
            const newPos = {
                x: baseBlock.position.x + dir.x,
                y: baseBlock.position.y + dir.y,
                z: baseBlock.position.z + dir.z
            };

            // Check if position is occupied
            let occupied = false;
            for (const block of enemy.blocks) {
                if (Math.abs(block.position.x - newPos.x) < 0.5 &&
                    Math.abs(block.position.y - newPos.y) < 0.5 &&
                    Math.abs(block.position.z - newPos.z) < 0.5) {
                    occupied = true;
                    break;
                }
            }

            if (!occupied && newPos.y >= 0.5 && newPos.y <= 5) {
                return newPos;
            }
        }

        return null;
    }

    /**
     * Update all enemies
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Vector3} playerPosition - Player vehicle position
     */
    updateEnemies(deltaTime, playerPosition) {
        const currentTime = Date.now();

        this.enemies.forEach(enemy => {
            if (enemy.blocks.length === 0) return;

            // Calculate center of enemy vehicle
            const enemyCenter = new THREE.Vector3();
            enemy.blocks.forEach(block => {
                enemyCenter.add(block.position);
            });
            enemyCenter.divideScalar(enemy.blocks.length);

            // Get world position
            const enemyWorldPos = enemy.group.position.clone().add(enemyCenter);

            // AI: Move towards player
            const direction = playerPosition.clone().sub(enemyWorldPos);
            const distance = direction.length();
            direction.normalize();

            // Calculate speed based on engine count
            const engineCount = enemy.blockCounts.engine;
            const speed = 2 + (engineCount * 0.5);

            // Move if not too close
            if (distance > 3) {
                enemy.velocity.lerp(direction.multiplyScalar(speed), 0.1);
                enemy.group.position.add(enemy.velocity.clone().multiplyScalar(deltaTime));
            }

            // Rotate towards player
            const angle = Math.atan2(direction.x, direction.z);
            enemy.group.rotation.y = angle;

            // Attack if close enough and has weapons
            if (distance < 15 && enemy.blockCounts.weapon > 0) {
                if (currentTime - enemy.lastAttackTime > 1000) { // Attack every second
                    this.enemyAttack(enemy, direction);
                    enemy.lastAttackTime = currentTime;
                }
            }
        });
    }

    /**
     * Enemy attack action
     * @param {Object} enemy - Enemy object
     * @param {THREE.Vector3} direction - Direction to player
     */
    enemyAttack(enemy, direction) {
        // This will be handled by the combat module
        // For now, just mark that an attack occurred
        enemy.isAttacking = true;
    }

    /**
     * Damage a random block on an enemy
     * @param {Object} enemy - Enemy to damage
     * @param {number} damage - Damage amount
     * @returns {Object} Damage result
     */
    damageEnemy(enemy, damage) {
        if (!enemy || enemy.blocks.length === 0) return { destroyed: false };

        // Choose random block
        const randomIndex = Math.floor(Math.random() * enemy.blocks.length);
        const block = enemy.blocks[randomIndex];

        // Apply damage
        block.userData.health -= damage;

        // Flash effect
        const originalEmissive = block.material.emissive.clone();
        block.material.emissive.setHex(0xffff00);
        setTimeout(() => {
            block.material.emissive.copy(originalEmissive);
        }, 300);

        // Check if block is destroyed
        if (block.userData.health <= 0) {
            const type = block.userData.type;

            // Remove block
            enemy.blocks.splice(randomIndex, 1);
            enemy.blockCounts[type]--;
            enemy.group.remove(block);

            // Check if core was destroyed
            if (type === 'core') {
                return { destroyed: true, wasCore: true, enemyDestroyed: true };
            }

            return { destroyed: true, wasCore: false, enemyDestroyed: false };
        }

        return { destroyed: false };
    }

    /**
     * Remove a destroyed enemy
     * @param {Object} enemy - Enemy to remove
     */
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        const gameIndex = this.gameState.enemies.indexOf(enemy);
        if (gameIndex > -1) {
            this.gameState.enemies.splice(gameIndex, 1);
        }

        disposeVehicle(enemy);
        this.scene.remove(enemy.group);

        // Update enemy count display
        const enemyCountElement = document.getElementById('enemyCount');
        if (enemyCountElement) {
            enemyCountElement.textContent = this.enemies.length;
        }
    }

    /**
     * Clear all enemies
     */
    clearEnemies() {
        [...this.enemies].forEach(enemy => {
            this.removeEnemy(enemy);
        });
        this.enemies = [];
        this.gameState.enemies = [];
    }

    /**
     * Check collision between enemy and player
     * @param {Object} enemy - Enemy object
     * @param {THREE.Vector3} playerPosition - Player position
     * @param {number} playerRadius - Player collision radius
     * @returns {boolean} True if colliding
     */
    checkCollision(enemy, playerPosition, playerRadius = 2) {
        const enemyPos = enemy.group.position.clone();
        const distance = enemyPos.distanceTo(playerPosition);
        return distance < playerRadius + 2; // Enemy radius approximation
    }

    /**
     * Get all enemies within range
     * @param {THREE.Vector3} position - Center position
     * @param {number} range - Range to check
     * @returns {Array} Enemies within range
     */
    getEnemiesInRange(position, range) {
        return this.enemies.filter(enemy => {
            const distance = enemy.group.position.distanceTo(position);
            return distance <= range;
        });
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.clearEnemies();
    }
}