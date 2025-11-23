/**
 * Combat system module
 * Handles shooting, damage, collision, and battle mechanics
 */

import * as THREE from 'three';
import { ProjectilePool, ParticlePool } from '../utils/pool.js';

/**
 * CombatSystem class for managing combat mechanics
 */
export class CombatSystem {
    constructor(scene, gameState, vehicleBuilder, enemyManager) {
        this.scene = scene;
        this.gameState = gameState;
        this.vehicleBuilder = vehicleBuilder;
        this.enemyManager = enemyManager;

        // Projectile and particle systems
        this.projectilePool = new ProjectilePool(scene);
        this.particlePool = new ParticlePool(scene);

        // Combat state
        this.lastShotTime = 0;
        this.shotCooldown = 200; // ms between shots
        this.spikeCollisionCooldown = new Map(); // Track spike collision cooldowns
    }

    /**
     * Fire projectiles from vehicle weapons
     * @returns {boolean} True if projectiles were fired
     */
    fireWeapons() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < this.shotCooldown) {
            return false;
        }

        const weaponBlocks = this.gameState.vehicle.blocks.filter(
            block => block.userData.type === 'weapon'
        );

        if (weaponBlocks.length === 0) return false;

        weaponBlocks.forEach(weapon => {
            // Get weapon world position
            const weaponWorldPos = new THREE.Vector3();
            weapon.getWorldPosition(weaponWorldPos);

            // Calculate firing direction based on weapon and vehicle rotation
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.gameState.vehicle.group.quaternion);
            direction.applyQuaternion(weapon.quaternion);

            // Fire projectile
            this.projectilePool.fire(
                weaponWorldPos,
                direction,
                30, // Speed
                'player', // Owner
                10 // Damage
            );

            // Muzzle flash effect
            this.createMuzzleFlash(weaponWorldPos);
        });

        this.lastShotTime = currentTime;
        return true;
    }

    /**
     * Fire projectiles from enemy weapons
     * @param {Object} enemy - Enemy firing weapons
     * @param {THREE.Vector3} targetDirection - Direction to target
     */
    fireEnemyWeapons(enemy, targetDirection) {
        const weaponBlocks = enemy.blocks.filter(
            block => block.userData.type === 'weapon'
        );

        weaponBlocks.forEach(weapon => {
            // Get weapon world position
            const weaponWorldPos = new THREE.Vector3();
            weapon.getWorldPosition(weaponWorldPos);
            weaponWorldPos.add(enemy.group.position);

            // Fire projectile
            this.projectilePool.fire(
                weaponWorldPos,
                targetDirection,
                20, // Slower than player projectiles
                'enemy', // Owner
                8 // Less damage than player
            );
        });
    }

    /**
     * Update combat system
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update projectiles
        this.projectilePool.update(deltaTime);

        // Update particles
        this.particlePool.update(deltaTime);

        // Check projectile collisions
        this.checkProjectileCollisions();

        // Check vehicle collisions
        this.checkVehicleCollisions();

        // Update spike collision cooldowns
        const currentTime = Date.now();
        for (const [key, time] of this.spikeCollisionCooldown.entries()) {
            if (currentTime - time > 1000) { // 1 second cooldown
                this.spikeCollisionCooldown.delete(key);
            }
        }
    }

    /**
     * Check projectile collisions with vehicles
     */
    checkProjectileCollisions() {
        const activeProjectiles = this.projectilePool.getActive();

        activeProjectiles.forEach(projectile => {
            const owner = projectile.userData.owner;
            const projectilePos = projectile.position;

            if (owner === 'player') {
                // Check collision with enemies
                this.gameState.enemies.forEach(enemy => {
                    if (enemy.blocks.length === 0) return;

                    const distance = enemy.group.position.distanceTo(projectilePos);
                    if (distance < 3) { // Hit radius
                        // Damage enemy
                        const result = this.enemyManager.damageEnemy(enemy, projectile.userData.damage);

                        // Create impact effect
                        this.createImpactEffect(projectilePos);

                        // Release projectile
                        this.projectilePool.release(projectile);

                        // Check if enemy was destroyed
                        if (result.enemyDestroyed) {
                            this.onEnemyDestroyed(enemy);
                        }
                    }
                });
            } else if (owner === 'enemy') {
                // Check collision with player
                const playerPos = this.gameState.vehicle.group.position;
                const distance = playerPos.distanceTo(projectilePos);

                if (distance < 3) { // Hit radius
                    // Damage player
                    const result = this.vehicleBuilder.damageRandomBlock(projectile.userData.damage);

                    // Create impact effect
                    this.createImpactEffect(projectilePos);

                    // Release projectile
                    this.projectilePool.release(projectile);

                    // Check if core was destroyed
                    if (result && result.wasCore) {
                        this.onPlayerCoreDestroyed();
                    }

                    // Update health bar
                    this.updateHealthBar();
                }
            }
        });
    }

    /**
     * Check vehicle-to-vehicle collisions
     */
    checkVehicleCollisions() {
        if (this.gameState.mode !== 'battle') return;

        const playerPos = this.gameState.vehicle.group.position;
        const currentTime = Date.now();

        this.gameState.enemies.forEach(enemy => {
            if (enemy.blocks.length === 0) return;

            const enemyPos = enemy.group.position;
            const distance = playerPos.distanceTo(enemyPos);

            if (distance < 4) { // Collision radius
                // Check for spike damage
                const playerSpikes = this.gameState.vehicle.blockCounts.spike;
                const enemySpikes = enemy.blockCounts.spike;

                // Player spike damage to enemy
                if (playerSpikes > 0) {
                    const speed = this.vehicleBuilder.vehicleVelocity.length();
                    if (speed > 0.08) { // Minimum speed for spike damage
                        const collisionKey = `player-${enemy.group.id}`;
                        if (!this.spikeCollisionCooldown.has(collisionKey)) {
                            const spikeDamage = 15 * playerSpikes;
                            const result = this.enemyManager.damageEnemy(enemy, spikeDamage);

                            // Visual effect
                            this.createSpikeImpact(enemyPos);

                            this.spikeCollisionCooldown.set(collisionKey, currentTime);

                            if (result.enemyDestroyed) {
                                this.onEnemyDestroyed(enemy);
                            }
                        }
                    }
                }

                // Enemy collision damage to player (reduced if player has spikes)
                const collisionKey = `enemy-${enemy.group.id}`;
                if (!this.spikeCollisionCooldown.has(collisionKey)) {
                    let collisionDamage = 10;
                    if (playerSpikes > 0) {
                        collisionDamage *= 0.5; // Spikes reduce incoming damage
                    }

                    const result = this.vehicleBuilder.damageRandomBlock(collisionDamage);

                    // Visual effect
                    this.createCollisionEffect(playerPos);

                    this.spikeCollisionCooldown.set(collisionKey, currentTime);

                    if (result && result.wasCore) {
                        this.onPlayerCoreDestroyed();
                    }

                    this.updateHealthBar();
                }

                // Push vehicles apart
                const pushDirection = playerPos.clone().sub(enemyPos).normalize();
                this.gameState.vehicle.group.position.add(pushDirection.multiplyScalar(0.1));
                enemy.group.position.sub(pushDirection.multiplyScalar(0.1));
            }
        });
    }

    /**
     * Create muzzle flash effect
     * @param {THREE.Vector3} position - Flash position
     */
    createMuzzleFlash(position) {
        const flash = new THREE.PointLight(0xffff00, 2, 5);
        flash.position.copy(position);
        this.scene.add(flash);

        setTimeout(() => {
            this.scene.remove(flash);
        }, 50);
    }

    /**
     * Create impact effect
     * @param {THREE.Vector3} position - Impact position
     */
    createImpactEffect(position) {
        this.particlePool.emit(position, 10, {
            color: 0xffaa00,
            speed: 5,
            spread: 2,
            lifetime: 0.5
        });
    }

    /**
     * Create spike impact effect
     * @param {THREE.Vector3} position - Impact position
     */
    createSpikeImpact(position) {
        this.particlePool.emit(position, 15, {
            color: 0xff0000,
            speed: 8,
            spread: 3,
            lifetime: 0.7
        });
    }

    /**
     * Create collision effect
     * @param {THREE.Vector3} position - Collision position
     */
    createCollisionEffect(position) {
        this.particlePool.emit(position, 20, {
            color: 0xffffff,
            speed: 10,
            spread: 4,
            lifetime: 0.3
        });
    }

    /**
     * Handle enemy destruction
     * @param {Object} enemy - Destroyed enemy
     */
    onEnemyDestroyed(enemy) {
        // Award materials
        const baseIron = 15 + Math.floor(Math.random() * 10);
        const baseCopper = 10 + Math.floor(Math.random() * 10);
        const rewards = this.gameState.awardMaterials(baseIron, baseCopper);

        // Update score
        this.gameState.score++;

        // Create destruction effect
        this.particlePool.emit(enemy.group.position, 50, {
            color: 0xff0000,
            speed: 15,
            spread: 5,
            lifetime: 1
        });

        // Remove enemy
        this.enemyManager.removeEnemy(enemy);

        // Show reward notification
        this.showRewardNotification(rewards);

        // Check if all enemies defeated
        if (this.gameState.enemies.length === 0) {
            this.onWaveComplete();
        }
    }

    /**
     * Handle player core destruction
     */
    onPlayerCoreDestroyed() {
        // Reset wave number but keep materials and vehicle
        this.gameState.coreDestroyed();

        // Show defeat message
        alert(`Core destroyed! Returning to Wave 1.\nYou kept your materials and vehicle.`);

        // Return to build mode
        this.endBattle();
    }

    /**
     * Handle wave completion
     */
    onWaveComplete() {
        // Advance wave
        this.gameState.nextWave();

        // Show victory message
        alert(`Wave ${this.gameState.waveNumber - 1} Complete!\nPrepare for Wave ${this.gameState.waveNumber}`);

        // Return to build mode
        this.endBattle();
    }

    /**
     * End battle and return to build mode
     */
    endBattle() {
        // Clear combat objects
        this.projectilePool.clear();
        this.particlePool.clear();
        this.enemyManager.clearEnemies();

        // Reset vehicle position
        this.gameState.vehicle.group.position.set(0, 0, 0);
        this.gameState.vehicle.group.rotation.set(0, 0, 0);

        // Switch mode
        this.gameState.mode = 'build';

        // Update UI
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.textContent = 'START BATTLE';
        }

        document.body.classList.remove('battle-mode');
    }

    /**
     * Update health bar display
     */
    updateHealthBar() {
        const healthPercentage = this.gameState.getCoreHealthPercentage();
        const healthFill = document.getElementById('healthFill');
        if (healthFill) {
            healthFill.style.width = `${healthPercentage}%`;
        }
    }

    /**
     * Show reward notification
     * @param {Object} rewards - Reward amounts
     */
    showRewardNotification(rewards) {
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = `+${rewards.iron} Iron, +${rewards.copper} Copper`;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.projectilePool.dispose();
        this.particlePool.dispose();
        this.spikeCollisionCooldown.clear();
    }
}