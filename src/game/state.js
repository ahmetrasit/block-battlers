/**
 * State management and save/load system
 * Handles game state persistence using localStorage
 */

import { createBlock } from './blocks.js';

/**
 * SaveSystem class for managing game saves
 */
export class SaveSystem {
    constructor() {
        this.saveKey = 'blockBattlers_save';
        this.settingsKey = 'blockBattlers_settings';
    }

    /**
     * Save the current game state
     * @param {Object} gameState - Current game state
     * @returns {boolean} Success status
     */
    save(gameState) {
        try {
            const saveData = {
                version: '2.0.0',
                timestamp: Date.now(),
                vehicle: this.serializeVehicle(gameState.vehicle),
                materials: {
                    iron: gameState.materials.iron,
                    copper: gameState.materials.copper
                },
                stats: {
                    waveNumber: gameState.waveNumber,
                    battlesWon: gameState.battlesWon,
                    score: gameState.score
                }
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    /**
     * Load a saved game state
     * @returns {Object|null} Saved game data or null if no save exists
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;

            const data = JSON.parse(savedData);

            // Version compatibility check
            if (data.version !== '2.0.0') {
                console.warn('Save file version mismatch, attempting migration...');
                // Add migration logic here if needed
            }

            return data;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    /**
     * Delete the current save
     * @returns {boolean} Success status
     */
    delete() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * Check if a save exists
     * @returns {boolean}
     */
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * Get save metadata without loading full save
     * @returns {Object|null}
     */
    getSaveInfo() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;

            const data = JSON.parse(savedData);
            return {
                timestamp: data.timestamp,
                waveNumber: data.stats?.waveNumber || 1,
                blockCount: data.vehicle?.blocks?.length || 0
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Serialize vehicle data for saving
     * @param {Object} vehicle - Vehicle object
     * @returns {Object} Serialized vehicle data
     */
    serializeVehicle(vehicle) {
        if (!vehicle || !vehicle.blocks) return null;

        return {
            blocks: vehicle.blocks.map(block => ({
                type: block.userData.type,
                position: {
                    x: block.position.x,
                    y: block.position.y,
                    z: block.position.z
                },
                rotation: block.userData.rotation || 0,
                health: block.userData.health,
                maxHealth: block.userData.maxHealth
            })),
            blockCounts: { ...vehicle.blockCounts }
        };
    }

    /**
     * Deserialize vehicle data from save
     * @param {Object} vehicleData - Serialized vehicle data
     * @param {THREE.Group} vehicleGroup - Vehicle group to add blocks to
     * @returns {Object} Reconstructed vehicle
     */
    deserializeVehicle(vehicleData, vehicleGroup) {
        if (!vehicleData) return null;

        const vehicle = {
            blocks: [],
            group: vehicleGroup,
            blockCounts: vehicleData.blockCounts || {
                armor: 0, weapon: 0, engine: 0,
                core: 0, wheel: 0, spike: 0, largewheel: 0
            }
        };

        // Recreate blocks
        if (vehicleData.blocks) {
            vehicleData.blocks.forEach(blockData => {
                const block = createBlock(blockData.type, {
                    rotation: blockData.rotation
                });

                block.position.set(
                    blockData.position.x,
                    blockData.position.y,
                    blockData.position.z
                );

                block.userData.health = blockData.health;
                block.userData.maxHealth = blockData.maxHealth;

                vehicle.blocks.push(block);
                vehicleGroup.add(block);
            });
        }

        return vehicle;
    }

    /**
     * Save game settings
     * @param {Object} settings - Game settings
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Load game settings
     * @returns {Object} Game settings
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Get default game settings
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return {
            soundEnabled: true,
            musicVolume: 0.5,
            effectsVolume: 0.7,
            graphicsQuality: 'medium',
            showFPS: false
        };
    }
}

/**
 * GameState class for managing current game state
 */
export class GameState {
    constructor() {
        this.mode = 'build';
        this.health = 100;
        this.score = 0;
        this.waveNumber = 1;
        this.battlesWon = 0;
        this.materials = {
            iron: 50,
            copper: 50
        };
        this.vehicle = {
            blocks: [],
            group: null,
            blockCounts: {
                armor: 0,
                weapon: 0,
                engine: 0,
                core: 0,
                wheel: 0,
                spike: 0,
                largewheel: 0
            }
        };
        this.enemies = [];
        this.projectiles = [];
        this.selectedBlockType = 'armor';
        this.blockRotation = 0;
        this.isPaused = false;
        this.settings = {};
    }

    /**
     * Reset game state to defaults
     */
    reset() {
        this.mode = 'build';
        this.health = 100;
        this.score = 0;
        this.waveNumber = 1;
        this.battlesWon = 0;
        this.materials.iron = 50;
        this.materials.copper = 50;
        this.enemies = [];
        this.projectiles = [];
        this.selectedBlockType = 'armor';
        this.blockRotation = 0;
        this.isPaused = false;

        // Reset vehicle
        this.vehicle.blocks = [];
        Object.keys(this.vehicle.blockCounts).forEach(key => {
            this.vehicle.blockCounts[key] = 0;
        });
    }

    /**
     * Update material count
     * @param {string} material - Material type (iron/copper)
     * @param {number} amount - Amount to add (negative to subtract)
     */
    updateMaterial(material, amount) {
        if (this.materials[material] !== undefined) {
            this.materials[material] = Math.max(0, this.materials[material] + amount);
        }
    }

    /**
     * Check if player has enough materials
     * @param {Object} cost - Cost object with iron and copper amounts
     * @returns {boolean}
     */
    canAfford(cost) {
        return this.materials.iron >= (cost.iron || 0) &&
               this.materials.copper >= (cost.copper || 0);
    }

    /**
     * Deduct materials
     * @param {Object} cost - Cost object with iron and copper amounts
     * @returns {boolean} Success status
     */
    spendMaterials(cost) {
        if (!this.canAfford(cost)) return false;

        this.materials.iron -= cost.iron || 0;
        this.materials.copper -= cost.copper || 0;
        return true;
    }

    /**
     * Refund materials
     * @param {Object} cost - Cost object with iron and copper amounts
     */
    refundMaterials(cost) {
        this.materials.iron += cost.iron || 0;
        this.materials.copper += cost.copper || 0;
    }

    /**
     * Award materials for enemy defeat
     * @param {number} baseIron - Base iron amount
     * @param {number} baseCopper - Base copper amount
     */
    awardMaterials(baseIron = 20, baseCopper = 15) {
        const waveBonus = this.waveNumber - 1;
        const ironReward = baseIron + (waveBonus * 5);
        const copperReward = baseCopper + (waveBonus * 3);

        this.materials.iron += ironReward;
        this.materials.copper += copperReward;

        return { iron: ironReward, copper: copperReward };
    }

    /**
     * Advance to next wave
     */
    nextWave() {
        this.waveNumber++;
        this.battlesWon++;
    }

    /**
     * Handle core destruction
     */
    coreDestroyed() {
        this.waveNumber = 1;
        this.battlesWon = 0;
        this.health = 100;
    }

    /**
     * Get current core health percentage
     * @returns {number} Health percentage (0-100)
     */
    getCoreHealthPercentage() {
        const coreBlock = this.vehicle.blocks.find(block => block.userData.type === 'core');
        if (!coreBlock) return 0;

        return (coreBlock.userData.health / coreBlock.userData.maxHealth) * 100;
    }

    /**
     * Export state for analytics or debugging
     * @returns {Object} Complete state snapshot
     */
    export() {
        return {
            mode: this.mode,
            health: this.health,
            score: this.score,
            waveNumber: this.waveNumber,
            battlesWon: this.battlesWon,
            materials: { ...this.materials },
            vehicleBlockCount: this.vehicle.blocks.length,
            vehicleBlockCounts: { ...this.vehicle.blockCounts },
            enemyCount: this.enemies.length,
            timestamp: Date.now()
        };
    }
}