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
    constructor(scene, gameState, vehicleBuilder, enemyManager, onBattleEnd = null) {
        this.scene = scene;
        this.gameState = gameState;
        this.vehicleBuilder = vehicleBuilder;
        this.enemyManager = enemyManager;
        this.onBattleEnd = onBattleEnd; // Callback for when battle should end

        // Projectile and particle systems
        this.projectilePool = new ProjectilePool(scene);
        this.particlePool = new ParticlePool(scene);

        // Combat state
        this.lastShotTime = 0;
        this.shotCooldown = 200; // ms between shots
        this.lastCannonTime = 0;
        this.cannonCooldown = 1000; // ms between cannon shots (slower)
        this.spikeCollisionCooldown = new Map(); // Track spike collision cooldowns
    }

    /**
     * Fire projectiles from vehicle weapons
     * @returns {boolean} True if projectiles were fired
     */
    fireWeapons() {
        const currentTime = Date.now();
        let fired = false;

        // Fire regular weapons and lasers
        if (currentTime - this.lastShotTime >= this.shotCooldown) {
            const weaponBlocks = this.gameState.vehicle.blocks.filter(
                block => block.userData.type === 'weapon' || block.userData.type === 'laser'
            );

            if (weaponBlocks.length > 0) {
                weaponBlocks.forEach(weapon => {
                    // Get weapon world position
                    const weaponWorldPos = new THREE.Vector3();
                    weapon.getWorldPosition(weaponWorldPos);

                    // Calculate firing direction based on weapon and vehicle rotation
                    const direction = new THREE.Vector3(0, 0, -1);
                    direction.applyQuaternion(this.gameState.vehicle.group.quaternion);
                    direction.applyQuaternion(weapon.quaternion);

                    // Laser weapons have different properties
                    const isLaser = weapon.userData.type === 'laser';
                    const speed = isLaser ? 40 : 30; // Lasers are faster
                    const damage = isLaser ? 15 : 10; // Regular damage

                    // Fire projectile
                    const projectile = this.projectilePool.fire(
                        weaponWorldPos,
                        direction,
                        speed,
                        'player', // Owner
                        damage
                    );

                    // Muzzle flash effect (different color for laser)
                    if (isLaser) {
                        this.createLaserFlash(weaponWorldPos);
                    } else {
                        this.createMuzzleFlash(weaponWorldPos);
                    }
                });

                this.lastShotTime = currentTime;
                fired = true;
            }
        }

        // Fire cannons (slower rate, splash damage)
        if (currentTime - this.lastCannonTime >= this.cannonCooldown) {
            const cannonBlocks = this.gameState.vehicle.blocks.filter(
                block => block.userData.type === 'cannon'
            );

            if (cannonBlocks.length > 0) {
                cannonBlocks.forEach(cannon => {
                    // Get cannon world position
                    const cannonWorldPos = new THREE.Vector3();
                    cannon.getWorldPosition(cannonWorldPos);

                    // Calculate firing direction
                    const direction = new THREE.Vector3(0, 0, -1);
                    direction.applyQuaternion(this.gameState.vehicle.group.quaternion);
                    direction.applyQuaternion(cannon.quaternion);

                    // Fire cannon projectile (slow, heavy damage, splash)
                    const projectile = this.projectilePool.fire(
                        cannonWorldPos,
                        direction,
                        20, // Slower than regular weapons
                        'player',
                        30 // High damage
                    );

                    // Mark as cannon shot for splash damage
                    if (projectile) {
                        projectile.userData.isCannon = true;
                    }

                    // Cannon flash (orange/yellow)
                    this.createCannonFlash(cannonWorldPos);
                });

                this.lastCannonTime = currentTime;
                fired = true;
            }
        }

        return fired;
    }

    /**
     * Fire projectiles from enemy weapons
     * @param {Object} enemy - Enemy firing weapons
     * @param {THREE.Vector3} targetDirection - Direction to target
     */
    fireEnemyWeapons(enemy, targetDirection) {
        const weaponBlocks = enemy.blocks.filter(
            block => block.userData.type === 'weapon' || block.userData.type === 'laser'
        );

        weaponBlocks.forEach(weapon => {
            // Get weapon world position
            const weaponWorldPos = new THREE.Vector3();
            weapon.getWorldPosition(weaponWorldPos);
            weaponWorldPos.add(enemy.group.position);

            // Laser weapons have different properties
            const isLaser = weapon.userData.type === 'laser';
            const speed = isLaser ? 30 : 20; // Enemy lasers faster than regular weapons
            const damage = isLaser ? 12 : 8; // Enemy lasers do more damage

            // Fire projectile
            this.projectilePool.fire(
                weaponWorldPos,
                targetDirection,
                speed,
                'enemy', // Owner
                damage
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
                // Check collision with enemy blocks
                this.gameState.enemies.forEach(enemy => {
                    if (enemy.blocks.length === 0) return;

                    const isCannon = projectile.userData.isCannon;

                    // Check each enemy block for hit
                    for (let block of enemy.blocks) {
                        const blockWorldPos = new THREE.Vector3();
                        block.getWorldPosition(blockWorldPos);
                        blockWorldPos.add(enemy.group.position);

                        const distance = blockWorldPos.distanceTo(projectilePos);
                        if (distance < 0.8) { // Tight hit radius per block
                            // Damage enemy
                            const result = this.enemyManager.damageEnemy(enemy, projectile.userData.damage);

                            // Cannon splash damage - damage nearby blocks
                            if (isCannon) {
                                const splashRadius = 2.5;
                                enemy.blocks.forEach(nearbyBlock => {
                                    const nearbyPos = new THREE.Vector3();
                                    nearbyBlock.getWorldPosition(nearbyPos);
                                    nearbyPos.add(enemy.group.position);

                                    const splashDist = nearbyPos.distanceTo(projectilePos);
                                    if (splashDist < splashRadius && splashDist > 0.8) {
                                        // Reduced splash damage
                                        this.enemyManager.damageEnemy(enemy, projectile.userData.damage * 0.5);
                                    }
                                });
                                // Bigger explosion effect
                                this.createCannonExplosion(projectilePos);
                            } else {
                                this.createImpactEffect(projectilePos);
                            }

                            // Release projectile
                            this.projectilePool.release(projectile);

                            // Check if enemy was destroyed
                            if (result.enemyDestroyed) {
                                this.onEnemyDestroyed(enemy);
                            }
                            return; // Exit loop after hit
                        }
                    }
                });
            } else if (owner === 'enemy') {
                // Check collision with player blocks
                if (this.gameState.vehicle.blocks.length === 0) return;

                // Check each player block for hit
                for (let block of this.gameState.vehicle.blocks) {
                    const blockWorldPos = new THREE.Vector3();
                    block.getWorldPosition(blockWorldPos);

                    const distance = blockWorldPos.distanceTo(projectilePos);
                    if (distance < 0.8) { // Tight hit radius per block
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
                        return; // Exit loop after hit
                    }
                }
            }
        });
    }

    /**
     * Check vehicle-to-vehicle collisions
     */
    checkVehicleCollisions() {
        if (this.gameState.mode !== 'battle') return;

        const currentTime = Date.now();

        this.gameState.enemies.forEach(enemy => {
            if (enemy.blocks.length === 0) return;

            // Check for collision between any player block and any enemy block
            let collision = false;
            for (let playerBlock of this.gameState.vehicle.blocks) {
                const playerBlockPos = new THREE.Vector3();
                playerBlock.getWorldPosition(playerBlockPos);

                for (let enemyBlock of enemy.blocks) {
                    const enemyBlockPos = new THREE.Vector3();
                    enemyBlock.getWorldPosition(enemyBlockPos);
                    enemyBlockPos.add(enemy.group.position);

                    const distance = playerBlockPos.distanceTo(enemyBlockPos);
                    if (distance < 1.2) { // Collision radius per block pair
                        collision = true;
                        break;
                    }
                }
                if (collision) break;
            }

            if (collision) { // Blocks are colliding
                // Get vehicle positions for effects and pushing
                const playerPos = this.gameState.vehicle.group.position;
                const enemyPos = enemy.group.position;

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

                // Push vehicles apart with gentle consistent force
                const pushDirection = playerPos.clone().sub(enemyPos);
                const distance = pushDirection.length();

                // Avoid division by zero if vehicles are at exact same position
                if (distance > 0.01) {
                    pushDirection.normalize();

                    // Apply gentle separation force
                    const pushForce = 0.08; // Gentle but consistent push

                    this.gameState.vehicle.group.position.add(pushDirection.multiplyScalar(pushForce));
                    enemy.group.position.sub(pushDirection.clone().multiplyScalar(pushForce));
                }
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
     * Create laser flash effect (cyan/blue)
     * @param {THREE.Vector3} position - Flash position
     */
    createLaserFlash(position) {
        const flash = new THREE.PointLight(0x00ffff, 3, 6);
        flash.position.copy(position);
        this.scene.add(flash);

        setTimeout(() => {
            this.scene.remove(flash);
        }, 50);
    }

    /**
     * Create cannon flash effect (bright orange)
     * @param {THREE.Vector3} position - Flash position
     */
    createCannonFlash(position) {
        const flash = new THREE.PointLight(0xff6600, 4, 8);
        flash.position.copy(position);
        this.scene.add(flash);

        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
    }

    /**
     * Create cannon explosion effect (large splash)
     * @param {THREE.Vector3} position - Explosion position
     */
    createCannonExplosion(position) {
        // Large explosion particles
        this.particlePool.emit(position, 20, {
            color: 0xff6600,
            speed: 8,
            spread: 3,
            lifetime: 1000
        });

        // Bright explosion flash
        const flash = new THREE.PointLight(0xff6600, 6, 10);
        flash.position.copy(position);
        this.scene.add(flash);

        setTimeout(() => {
            this.scene.remove(flash);
        }, 150);
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

        // Return to build mode via callback
        if (this.onBattleEnd) {
            this.onBattleEnd();
        }
    }

    /**
     * Handle wave completion
     */
    onWaveComplete() {
        // Advance wave
        this.gameState.nextWave();

        // Show victory message
        alert(`Wave ${this.gameState.waveNumber - 1} Complete!\nPrepare for Wave ${this.gameState.waveNumber}`);

        // Return to build mode via callback
        if (this.onBattleEnd) {
            this.onBattleEnd();
        }
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