/**
 * Object pooling for projectiles
 * Improves performance by reusing projectile objects instead of creating/destroying them
 */

import * as THREE from 'three';
import { disposeObject } from './disposable.js';

/**
 * ProjectilePool class for managing projectile objects
 */
export class ProjectilePool {
    constructor(scene, maxSize = 50) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this.maxSize = maxSize;

        // Pre-create some projectiles
        this.preallocate(10);
    }

    /**
     * Pre-allocate projectiles to the pool
     * @param {number} count - Number of projectiles to pre-allocate
     */
    preallocate(count) {
        for (let i = 0; i < count && this.pool.length < this.maxSize; i++) {
            this.pool.push(this.createProjectile());
        }
    }

    /**
     * Create a new projectile object
     * @returns {THREE.Mesh} Projectile mesh
     */
    createProjectile() {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });

        const projectile = new THREE.Mesh(geometry, material);
        projectile.visible = false;

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.add(glow);

        // Initialize projectile data
        projectile.userData = {
            velocity: new THREE.Vector3(),
            lifetime: 0,
            damage: 10,
            owner: null,
            active: false,
            glow: glow
        };

        return projectile;
    }

    /**
     * Get a projectile from the pool
     * @returns {THREE.Mesh|null} Projectile mesh or null if pool is exhausted
     */
    get() {
        let projectile = this.pool.pop();

        // Create new projectile if pool is empty and we haven't reached max
        if (!projectile && this.active.length < this.maxSize) {
            projectile = this.createProjectile();
        }

        if (projectile) {
            projectile.visible = true;
            projectile.userData.active = true;
            projectile.userData.lifetime = 0;
            this.active.push(projectile);
            this.scene.add(projectile);
        }

        return projectile;
    }

    /**
     * Release a projectile back to the pool
     * @param {THREE.Mesh} projectile - Projectile to release
     */
    release(projectile) {
        if (!projectile) return;

        projectile.visible = false;
        projectile.userData.active = false;
        projectile.userData.velocity.set(0, 0, 0);
        projectile.userData.owner = null;

        // Remove from scene
        this.scene.remove(projectile);

        // Remove from active list
        const index = this.active.indexOf(projectile);
        if (index > -1) {
            this.active.splice(index, 1);

            // Add back to pool if there's space
            if (this.pool.length < this.maxSize) {
                this.pool.push(projectile);
            } else {
                // Dispose if pool is full
                disposeObject(projectile);
            }
        }
    }

    /**
     * Update all active projectiles
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const toRelease = [];

        this.active.forEach(projectile => {
            if (!projectile.userData.active) return;

            // Update position
            const velocity = projectile.userData.velocity;
            projectile.position.x += velocity.x * deltaTime;
            projectile.position.y += velocity.y * deltaTime;
            projectile.position.z += velocity.z * deltaTime;

            // Update lifetime
            projectile.userData.lifetime += deltaTime;

            // Check if projectile should be released (lifetime > 3 seconds or out of bounds)
            if (projectile.userData.lifetime > 3 ||
                Math.abs(projectile.position.x) > 100 ||
                Math.abs(projectile.position.z) > 100 ||
                projectile.position.y < -10 ||
                projectile.position.y > 50) {
                toRelease.push(projectile);
            }
        });

        // Release expired projectiles
        toRelease.forEach(projectile => {
            this.release(projectile);
        });
    }

    /**
     * Fire a projectile
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to fire
     * @param {number} speed - Projectile speed
     * @param {Object} owner - Owner of the projectile
     * @param {number} damage - Damage amount
     * @returns {THREE.Mesh|null} The fired projectile or null if pool is exhausted
     */
    fire(position, direction, speed = 20, owner = null, damage = 10) {
        const projectile = this.get();

        if (projectile) {
            projectile.position.copy(position);
            projectile.userData.velocity.copy(direction).multiplyScalar(speed);
            projectile.userData.owner = owner;
            projectile.userData.damage = damage;
        }

        return projectile;
    }

    /**
     * Get all active projectiles
     * @returns {Array} Array of active projectiles
     */
    getActive() {
        return this.active.filter(p => p.userData.active);
    }

    /**
     * Clear all projectiles
     */
    clear() {
        // Release all active projectiles
        [...this.active].forEach(projectile => {
            this.release(projectile);
        });

        // Dispose pool projectiles
        this.pool.forEach(projectile => {
            disposeObject(projectile);
        });

        this.pool = [];
        this.active = [];
    }

    /**
     * Dispose of the entire pool
     */
    dispose() {
        this.clear();
    }
}

/**
 * ParticlePool for visual effects
 */
export class ParticlePool {
    constructor(scene, maxSize = 100) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this.maxSize = maxSize;

        // Pre-create particles
        this.preallocate(20);
    }

    preallocate(count) {
        for (let i = 0; i < count && this.pool.length < this.maxSize; i++) {
            this.pool.push(this.createParticle());
        }
    }

    createParticle() {
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8
        });

        const particle = new THREE.Mesh(geometry, material);
        particle.visible = false;

        particle.userData = {
            velocity: new THREE.Vector3(),
            lifetime: 0,
            maxLifetime: 1,
            active: false
        };

        return particle;
    }

    emit(position, count = 10, options = {}) {
        const {
            color = 0xffaa00,
            speed = 5,
            spread = 1,
            lifetime = 1
        } = options;

        for (let i = 0; i < count; i++) {
            let particle = this.pool.pop();

            if (!particle && this.active.length < this.maxSize) {
                particle = this.createParticle();
            }

            if (particle) {
                particle.position.copy(position);
                particle.material.color.setHex(color);
                particle.material.opacity = 0.8;

                // Random velocity
                particle.userData.velocity.set(
                    (Math.random() - 0.5) * spread,
                    Math.random() * spread,
                    (Math.random() - 0.5) * spread
                ).multiplyScalar(speed);

                particle.userData.lifetime = 0;
                particle.userData.maxLifetime = lifetime;
                particle.userData.active = true;
                particle.visible = true;

                this.active.push(particle);
                this.scene.add(particle);
            }
        }
    }

    update(deltaTime) {
        const toRelease = [];

        this.active.forEach(particle => {
            if (!particle.userData.active) return;

            // Update position
            particle.position.add(
                particle.userData.velocity.clone().multiplyScalar(deltaTime)
            );

            // Apply gravity
            particle.userData.velocity.y -= 9.8 * deltaTime;

            // Update lifetime
            particle.userData.lifetime += deltaTime;
            const lifeRatio = particle.userData.lifetime / particle.userData.maxLifetime;

            // Fade out
            particle.material.opacity = 0.8 * (1 - lifeRatio);

            // Scale down
            const scale = 1 - lifeRatio * 0.5;
            particle.scale.set(scale, scale, scale);

            // Check if particle should be released
            if (particle.userData.lifetime >= particle.userData.maxLifetime) {
                toRelease.push(particle);
            }
        });

        // Release expired particles
        toRelease.forEach(particle => {
            this.release(particle);
        });
    }

    release(particle) {
        if (!particle) return;

        particle.visible = false;
        particle.userData.active = false;
        particle.scale.set(1, 1, 1);

        this.scene.remove(particle);

        const index = this.active.indexOf(particle);
        if (index > -1) {
            this.active.splice(index, 1);

            if (this.pool.length < this.maxSize) {
                this.pool.push(particle);
            } else {
                disposeObject(particle);
            }
        }
    }

    clear() {
        [...this.active].forEach(particle => {
            this.release(particle);
        });

        this.pool.forEach(particle => {
            disposeObject(particle);
        });

        this.pool = [];
        this.active = [];
    }

    dispose() {
        this.clear();
    }
}