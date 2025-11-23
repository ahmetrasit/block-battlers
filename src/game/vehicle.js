/**
 * Vehicle building and management module
 * Handles vehicle construction, block placement, and validation
 */

import * as THREE from 'three';
import { createBlock, createPreviewBlock, BLOCK_COSTS, BLOCK_MAX_HEALTH } from './blocks.js';
import { disposeBlock, disposeVehicle } from '../utils/disposable.js';

/**
 * VehicleBuilder class for managing vehicle construction
 */
export class VehicleBuilder {
    constructor(scene, renderer, gameState) {
        this.scene = scene;
        this.renderer = renderer;
        this.gameState = gameState;

        // Preview block for placement
        this.previewBlock = null;
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();

        // Vehicle physics
        this.vehicleVelocity = new THREE.Vector3();
        this.vehicleRotation = 0;

        this.init();
    }

    /**
     * Initialize vehicle builder
     */
    init() {
        // Create vehicle group
        this.gameState.vehicle.group = new THREE.Group();
        this.scene.add(this.gameState.vehicle.group);

        // Create initial preview block
        this.createPreviewBlock();
    }

    /**
     * Create preview block for current selected type
     */
    createPreviewBlock() {
        // Remove old preview if exists
        if (this.previewBlock) {
            this.scene.remove(this.previewBlock);
            disposeBlock(this.previewBlock);
        }

        this.previewBlock = createPreviewBlock(this.gameState.selectedBlockType);
        this.scene.add(this.previewBlock);
    }

    /**
     * Update preview block type when selection changes
     */
    updatePreviewBlockType() {
        this.createPreviewBlock();
    }

    /**
     * Update preview block position based on mouse
     * @param {number} mouseX - Normalized mouse X
     * @param {number} mouseY - Normalized mouse Y
     */
    updatePreview(mouseX, mouseY) {
        if (!this.previewBlock) return;

        try {
            this.mouseVector.set(mouseX, mouseY);
            this.raycaster.setFromCamera(this.mouseVector, this.renderer.camera);

            // Check intersection with existing blocks first
            const intersects = this.raycaster.intersectObjects(this.gameState.vehicle.blocks, false);
            let targetPoint = null;

            if (intersects.length > 0 && intersects[0].face) {
                // Get the face normal to determine placement direction
                const intersection = intersects[0];
                const normal = intersection.face.normal.clone();

                // Transform normal to world space
                normal.transformDirection(intersection.object.matrixWorld);

                // Get the intersection point and add normal to get adjacent position
                targetPoint = intersection.point.clone().add(normal.multiplyScalar(0.5));
            } else {
                // Fall back to base plate intersection
                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                targetPoint = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(plane, targetPoint);
            }

            if (targetPoint) {
                // Snap to nearest grid position
                let closestDist = Infinity;
                let closestPos = null;

                for (const gridPos of this.renderer.placementGrid) {
                    const dist = targetPoint.distanceTo(gridPos);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPos = gridPos;
                    }
                }

                if (closestPos && this.isPositionValid(closestPos)) {
                    this.previewBlock.position.copy(closestPos);
                    this.previewBlock.rotation.y = (this.gameState.blockRotation * Math.PI) / 180;
                    this.previewBlock.visible = true;
                } else {
                    this.previewBlock.visible = false;
                }
            } else {
                this.previewBlock.visible = false;
            }
        } catch (error) {
            // Silently handle errors to prevent console spam
            this.previewBlock.visible = false;
        }
    }

    /**
     * Check if a position is valid for block placement
     * @param {THREE.Vector3} pos - Position to check
     * @returns {boolean}
     */
    isPositionValid(pos) {
        // Check if position is already occupied
        for (const block of this.gameState.vehicle.blocks) {
            const blockWorldPos = new THREE.Vector3();
            block.getWorldPosition(blockWorldPos);
            if (blockWorldPos.distanceTo(pos) < 0.5) {
                return false;
            }
        }

        // Check if within base plate bounds (7x7 grid)
        if (Math.abs(pos.x) > 3 || Math.abs(pos.z) > 3) {
            return false;
        }

        // If no blocks exist, can place anywhere on base (y = 0.5)
        if (this.gameState.vehicle.blocks.length === 0) {
            return pos.y === 0.5;
        }

        // Other blocks must be adjacent to at least one existing block or on the base
        let hasAdjacent = false;

        // Check if on base plate (bottom layer)
        if (pos.y === 0.5) {
            hasAdjacent = true;
        }

        // Check adjacency to existing blocks
        for (const block of this.gameState.vehicle.blocks) {
            const blockWorldPos = new THREE.Vector3();
            block.getWorldPosition(blockWorldPos);
            const distance = blockWorldPos.distanceTo(pos);

            // Adjacent means exactly 1 unit away (sharing a face)
            if (Math.abs(distance - 1.0) < 0.1) {
                hasAdjacent = true;
                break;
            }
        }

        return hasAdjacent;
    }

    /**
     * Place a block at the preview position
     * @returns {boolean} Success status
     */
    placeBlockAtPreview() {
        if (!this.previewBlock || !this.previewBlock.visible) return false;

        const worldPos = this.previewBlock.position.clone();
        const type = this.gameState.selectedBlockType;

        // Only allow one core
        if (type === 'core' && this.gameState.vehicle.blockCounts.core > 0) {
            alert('You can only have one CORE block!');
            return false;
        }

        const cost = BLOCK_COSTS[type];

        // Check if player has enough materials
        if (!this.gameState.canAfford(cost)) {
            alert(`Not enough materials!\nNeed: ${cost.iron} Iron, ${cost.copper} Copper\nHave: ${this.gameState.materials.iron} Iron, ${this.gameState.materials.copper} Copper`);
            return false;
        }

        // Deduct materials
        this.gameState.spendMaterials(cost);

        // Create the block
        const block = createBlock(type, {
            rotation: this.gameState.blockRotation
        });

        block.position.copy(worldPos);
        block.castShadow = true;
        block.receiveShadow = true;

        this.gameState.vehicle.blocks.push(block);
        this.gameState.vehicle.blockCounts[type]++;
        this.gameState.vehicle.group.add(block);

        // Update UI
        document.getElementById('blockCount').textContent = this.gameState.vehicle.blocks.length;
        this.updateMaterialDisplay();

        return true;
    }

    /**
     * Remove the last placed block
     */
    removeLastBlock() {
        if (this.gameState.vehicle.blocks.length === 0) return;

        const block = this.gameState.vehicle.blocks.pop();
        const type = block.userData.type;

        // Refund materials
        const cost = BLOCK_COSTS[type];
        this.gameState.refundMaterials(cost);

        // Update counts
        this.gameState.vehicle.blockCounts[type]--;

        // Remove from scene
        this.gameState.vehicle.group.remove(block);
        disposeBlock(block);

        // Update UI
        document.getElementById('blockCount').textContent = this.gameState.vehicle.blocks.length;
        this.updateMaterialDisplay();
    }

    /**
     * Clear entire vehicle
     */
    clearVehicle() {
        // Refund all materials
        this.gameState.vehicle.blocks.forEach(block => {
            const cost = BLOCK_COSTS[block.userData.type];
            this.gameState.refundMaterials(cost);
        });

        // Dispose of vehicle
        disposeVehicle(this.gameState.vehicle);

        // Reset vehicle
        this.gameState.vehicle.blocks = [];
        Object.keys(this.gameState.vehicle.blockCounts).forEach(key => {
            this.gameState.vehicle.blockCounts[key] = 0;
        });

        // Update UI
        document.getElementById('blockCount').textContent = 0;
        this.updateMaterialDisplay();
    }

    /**
     * Validate vehicle for battle
     * @returns {Object} Validation result
     */
    validateVehicle() {
        const counts = this.gameState.vehicle.blockCounts;
        const hasWeapon = counts.weapon > 0 || counts.spike > 0;
        const hasWheel = counts.wheel > 0 || counts.largewheel > 0;

        const errors = [];
        if (counts.core === 0) errors.push('Core (purple)');
        if (counts.engine === 0) errors.push('Engine (gold)');
        if (!hasWheel) errors.push('Wheel or Large Wheel');
        if (!hasWeapon) errors.push('Weapon or Spike');

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Calculate vehicle stats
     * @returns {Object} Vehicle statistics
     */
    calculateVehicleStats() {
        const blocks = this.gameState.vehicle.blocks;
        const counts = this.gameState.vehicle.blockCounts;

        // Calculate total weight
        let totalWeight = 0;
        blocks.forEach(block => {
            const type = block.userData.type;
            totalWeight += require('./blocks.js').BLOCK_WEIGHTS[type] || 1;
        });

        // Calculate wheel capacity
        let wheelCapacity = 0;
        wheelCapacity += counts.wheel * require('./blocks.js').WHEEL_CAPACITY.wheel;
        wheelCapacity += counts.largewheel * require('./blocks.js').WHEEL_CAPACITY.largewheel;

        // Calculate movement stats
        const enginePower = counts.engine * 1.5;
        const weightRatio = wheelCapacity > 0 ? totalWeight / wheelCapacity : Infinity;
        const speedMultiplier = Math.max(0.2, Math.min(1, 1 / weightRatio));

        // Calculate combat stats
        const weaponDamage = counts.weapon * 10;
        const spikeDamage = counts.spike * 15;
        const totalHealth = blocks.reduce((sum, block) => sum + block.userData.health, 0);

        return {
            totalWeight,
            wheelCapacity,
            enginePower,
            speedMultiplier,
            weaponDamage,
            spikeDamage,
            totalHealth,
            blockCount: blocks.length
        };
    }

    /**
     * Update material display in UI
     */
    updateMaterialDisplay() {
        const ironElement = document.getElementById('ironCount');
        const copperElement = document.getElementById('copperCount');

        if (ironElement) ironElement.textContent = this.gameState.materials.iron;
        if (copperElement) copperElement.textContent = this.gameState.materials.copper;
    }

    /**
     * Apply damage to a random block
     * @param {number} damage - Damage amount
     * @returns {Object|null} Damaged block info or null if no damage
     */
    damageRandomBlock(damage) {
        if (this.gameState.vehicle.blocks.length === 0) return null;

        // Choose random block
        const randomIndex = Math.floor(Math.random() * this.gameState.vehicle.blocks.length);
        const block = this.gameState.vehicle.blocks[randomIndex];

        // Apply damage
        block.userData.health -= damage;

        // Flash effect
        this.flashBlock(block);

        // Check if block is destroyed
        if (block.userData.health <= 0) {
            const type = block.userData.type;

            // Remove block
            this.gameState.vehicle.blocks.splice(randomIndex, 1);
            this.gameState.vehicle.blockCounts[type]--;
            this.gameState.vehicle.group.remove(block);
            disposeBlock(block);

            // Check if core was destroyed
            if (type === 'core') {
                return { destroyed: true, wasCore: true, type };
            }

            return { destroyed: true, wasCore: false, type };
        }

        return { destroyed: false, remainingHealth: block.userData.health, type: block.userData.type };
    }

    /**
     * Flash a block to indicate damage
     * @param {THREE.Mesh} block - Block to flash
     */
    flashBlock(block) {
        const originalEmissive = block.material.emissive.clone();
        block.material.emissive.setHex(0xff0000);

        setTimeout(() => {
            block.material.emissive.copy(originalEmissive);
        }, 300);
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        if (this.previewBlock) {
            this.scene.remove(this.previewBlock);
            disposeBlock(this.previewBlock);
            this.previewBlock = null;
        }

        disposeVehicle(this.gameState.vehicle);
    }
}