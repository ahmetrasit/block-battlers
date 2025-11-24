/**
 * Core game module
 * Main game loop and coordination between all systems
 */

import * as THREE from 'three';
import { Renderer } from './renderer.js';
import { GameState, SaveSystem } from './state.js';
import { VehicleBuilder } from './vehicle.js';
import { EnemyManager } from './enemies.js';
import { CombatSystem } from './combat.js';
import { ControlSystem } from './controls.js';
import { UIManager } from './ui.js';
import { disposeVehicle } from '../utils/disposable.js';

/**
 * Game class - Main game controller
 */
export class Game {
    constructor() {
        this.initialized = false;
        this.animationId = null;
        this.lastTime = 0;
        this.deltaTime = 0;

        // FPS tracking
        this.frameCount = 0;
        this.fpsTime = 0;
        this.currentFPS = 0;

        // Game systems
        this.renderer = null;
        this.gameState = null;
        this.saveSystem = null;
        this.vehicleBuilder = null;
        this.enemyManager = null;
        this.combatSystem = null;
        this.controlSystem = null;
        this.uiManager = null;
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('=== BLOCK BATTLERS 2.0 INITIALIZING ===');

        try {
            // Get canvas
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            // Initialize core systems
            this.gameState = new GameState();
            this.saveSystem = new SaveSystem();
            this.renderer = new Renderer(canvas);

            // Load settings
            this.gameState.settings = this.saveSystem.loadSettings();

            // Initialize game systems
            this.vehicleBuilder = new VehicleBuilder(
                this.renderer.scene,
                this.renderer,
                this.gameState
            );

            this.enemyManager = new EnemyManager(
                this.renderer.scene,
                this.gameState
            );

            this.combatSystem = new CombatSystem(
                this.renderer.scene,
                this.gameState,
                this.vehicleBuilder,
                this.enemyManager,
                () => this.endBattle() // Pass endBattle as callback
            );

            this.controlSystem = new ControlSystem(
                this.gameState,
                this.vehicleBuilder,
                this.renderer,
                this.combatSystem
            );

            this.uiManager = new UIManager(
                this.gameState,
                this.saveSystem
            );

            // Setup event listeners
            this.setupEventListeners();

            // Setup mode toggle
            this.setupModeToggle();

            // Check for auto-save
            this.setupAutoSave();

            this.initialized = true;
            console.log('=== GAME INITIALIZATION COMPLETE ===');

            // Start game loop
            this.animate();

        } catch (error) {
            console.error('Game initialization failed:', error);
            this.uiManager?.showError('Failed to initialize game: ' + error.message);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Load game event
        document.addEventListener('loadGame', (event) => {
            this.loadGameData(event.detail);
        });

        // New game event
        document.addEventListener('newGame', () => {
            this.newGame();
        });

        // Graphics quality change
        document.addEventListener('graphicsQualityChanged', (event) => {
            this.updateGraphicsQuality(event.detail);
        });
    }

    /**
     * Setup mode toggle button
     */
    setupModeToggle() {
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.onclick = null; // Clear old handler
            modeToggle.addEventListener('click', () => {
                this.toggleMode();
            });
        }
    }

    /**
     * Toggle between build and battle modes
     */
    toggleMode() {
        if (this.gameState.mode === 'build') {
            // Validate vehicle before entering battle
            const validation = this.vehicleBuilder.validateVehicle();

            if (!validation.valid) {
                const message = 'You need at least:\n• ' + validation.errors.join('\n• ') +
                              '\n\nArmor (blue) is optional but recommended!';
                this.uiManager.showError(message);
                return;
            }

            // Enter battle mode
            this.startBattle();
        } else {
            // Return to build mode
            this.endBattle();
        }
    }

    /**
     * Start battle mode
     */
    startBattle() {
        this.gameState.mode = 'battle';

        // Position vehicle slightly above ground for battle
        this.gameState.vehicle.group.position.set(0, 0.5, 0);
        this.gameState.vehicle.group.rotation.set(0, 0, 0);
        this.vehicleBuilder.vehicleVelocity.set(0, 0, 0);
        this.vehicleBuilder.vehicleRotation = 0;

        // Create enemies for current wave
        this.enemyManager.createEnemies();

        // Update UI
        this.uiManager.updateModeToggle('battle');
        this.uiManager.toggleBattleMode(true);
        this.uiManager.updateHealth();

        // Update renderer
        this.renderer.setBattleMode(true);

        // Hide preview block
        if (this.vehicleBuilder.previewBlock) {
            this.vehicleBuilder.previewBlock.visible = false;
        }

        // Clear hover state when switching to battle mode
        this.vehicleBuilder.clearHoverState();

        console.log(`Starting Wave ${this.gameState.waveNumber}`);
    }

    /**
     * End battle mode
     */
    endBattle() {
        this.gameState.mode = 'build';

        // Clear combat objects
        this.combatSystem.projectilePool.clear();
        this.combatSystem.particlePool.clear();
        this.enemyManager.clearEnemies();

        // Reset vehicle position
        this.gameState.vehicle.group.position.set(0, 0, 0);
        this.gameState.vehicle.group.rotation.set(0, 0, 0);
        this.vehicleBuilder.vehicleVelocity.set(0, 0, 0);
        this.vehicleBuilder.vehicleRotation = 0;

        // Clear input state to prevent stuck keys
        this.controlSystem.clearInputState();

        // Update UI
        this.uiManager.updateModeToggle('build');
        this.uiManager.toggleBattleMode(false);

        // Update renderer
        this.renderer.setBattleMode(false);
        this.renderer.updateCamera('build');

        // Show preview block
        if (this.vehicleBuilder.previewBlock) {
            this.vehicleBuilder.previewBlock.visible = true;
        }

        console.log('Returned to Build Mode');
    }

    /**
     * Load game data
     * @param {Object} saveData - Saved game data
     */
    loadGameData(saveData) {
        if (!saveData) return;

        // Clear current vehicle
        disposeVehicle(this.gameState.vehicle);
        this.gameState.vehicle.blocks = [];

        // Recreate vehicle from save
        if (saveData.vehicle) {
            const vehicle = this.saveSystem.deserializeVehicle(
                saveData.vehicle,
                this.gameState.vehicle.group
            );

            if (vehicle) {
                this.gameState.vehicle = vehicle;
            }
        }

        // Update UI
        this.uiManager.updateAll();
    }

    /**
     * Start new game
     */
    newGame() {
        // Clear vehicle
        this.vehicleBuilder.clearVehicle();

        // Reset game state
        this.gameState.reset();

        // Update UI
        this.uiManager.updateAll();
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        // Auto-save every 60 seconds
        setInterval(() => {
            if (this.gameState.mode === 'build') {
                const success = this.saveSystem.save(this.gameState);
                if (success) {
                    console.log('Auto-saved game');
                }
            }
        }, 60000);
    }

    /**
     * Update graphics quality
     * @param {string} quality - Quality level (low/medium/high)
     */
    updateGraphicsQuality(quality) {
        if (!this.renderer.renderer) return;

        switch(quality) {
            case 'low':
                this.renderer.renderer.setPixelRatio(1);
                this.renderer.renderer.shadowMap.enabled = false;
                break;
            case 'medium':
                this.renderer.renderer.setPixelRatio(window.devicePixelRatio * 0.75);
                this.renderer.renderer.shadowMap.enabled = true;
                this.renderer.renderer.shadowMap.type = THREE.BasicShadowMap;
                break;
            case 'high':
                this.renderer.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.renderer.shadowMap.enabled = true;
                this.renderer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
        }
    }

    /**
     * Main game loop
     */
    animate(currentTime = 0) {
        if (!this.initialized) return;

        this.animationId = requestAnimationFrame((time) => this.animate(time));

        // Calculate delta time
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;

        // Calculate FPS
        this.frameCount++;
        if (currentTime - this.fpsTime > 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = currentTime;
            this.uiManager.displayFPS(this.currentFPS);
        }

        // Skip update if paused
        if (!this.gameState.isPaused) {
            this.update(this.deltaTime);
        }

        // Always render
        this.render();
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (this.gameState.mode === 'build') {
            // Update camera in build mode
            this.renderer.updateCamera('build');
        } else if (this.gameState.mode === 'battle') {
            // Update vehicle movement
            this.controlSystem.updateVehicleMovement(deltaTime);

            // Update camera to follow vehicle
            const vehiclePos = this.gameState.vehicle.group.position;
            const cameraOffset = new THREE.Vector3(0, 10, 15);
            cameraOffset.applyQuaternion(this.gameState.vehicle.group.quaternion);
            this.renderer.camera.position.copy(vehiclePos).add(cameraOffset);
            this.renderer.camera.lookAt(vehiclePos);

            // Update enemies
            this.enemyManager.updateEnemies(deltaTime, vehiclePos);

            // Handle enemy attacks
            this.gameState.enemies.forEach(enemy => {
                if (enemy.isAttacking) {
                    const direction = vehiclePos.clone().sub(enemy.group.position).normalize();
                    this.combatSystem.fireEnemyWeapons(enemy, direction);
                    enemy.isAttacking = false;
                }
            });

            // Update combat system
            this.combatSystem.update(deltaTime);

            // Update UI
            this.uiManager.updateStats();
        }
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render();
    }

    /**
     * Clean up and dispose of all resources
     */
    dispose() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Dispose all systems
        this.controlSystem?.dispose();
        this.combatSystem?.dispose();
        this.enemyManager?.dispose();
        this.vehicleBuilder?.dispose();
        this.uiManager?.dispose();
        this.renderer?.dispose();

        this.initialized = false;
    }
}

// Export singleton instance
export const game = new Game();

// Make game accessible globally for debugging
if (typeof window !== 'undefined') {
    window.blockBattlersGame = game;
}