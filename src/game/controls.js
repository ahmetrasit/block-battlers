/**
 * Controls module for input handling
 * Handles keyboard and mouse inputs for both build and battle modes
 */

import * as THREE from 'three';

/**
 * ControlSystem class for managing user input
 */
export class ControlSystem {
    constructor(gameState, vehicleBuilder, renderer, combatSystem) {
        this.gameState = gameState;
        this.vehicleBuilder = vehicleBuilder;
        this.renderer = renderer;
        this.combatSystem = combatSystem;

        // Input state
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.normalizedMouse = new THREE.Vector2();

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.rotateLeft = false;
        this.rotateRight = false;
        this.isShooting = false;

        this.setupEventListeners();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('wheel', (e) => this.onMouseWheel(e));
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // Block selection buttons
        this.setupBlockSelectionButtons();

        // Control buttons
        this.setupControlButtons();
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;

        // Number keys for block selection (build mode)
        if (this.gameState.mode === 'build') {
            const blockTypes = ['armor', 'weapon', 'spike', 'engine', 'core', 'wheel', 'largewheel'];
            const keyNum = parseInt(event.key);

            if (keyNum >= 1 && keyNum <= 7) {
                this.selectBlockType(blockTypes[keyNum - 1]);
            }

            // R key for rotation
            if (event.key.toLowerCase() === 'r') {
                this.rotateBlock();
            }

            // Backspace disabled - using right-click on blocks instead
            // if (event.key === 'Backspace') {
            //     event.preventDefault();
            //     this.vehicleBuilder.removeLastBlock();
            // }
        }

        // Battle mode controls
        if (this.gameState.mode === 'battle') {
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.moveForward = true;
                    break;
                case 's':
                    this.moveBackward = true;
                    break;
                case 'a':
                    this.rotateLeft = true;
                    break;
                case 'd':
                    this.rotateRight = true;
                    break;
                case ' ':
                    event.preventDefault();
                    this.isShooting = true;
                    break;
            }
        }

        // ESC to pause/unpause
        if (event.key === 'Escape') {
            this.togglePause();
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event
     */
    onKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;

        // Battle mode controls
        if (this.gameState.mode === 'battle') {
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.moveForward = false;
                    break;
                case 's':
                    this.moveBackward = false;
                    break;
                case 'a':
                    this.rotateLeft = false;
                    break;
                case 'd':
                    this.rotateRight = false;
                    break;
                case ' ':
                    this.isShooting = false;
                    break;
            }
        }
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;

        // Calculate normalized mouse coordinates
        this.normalizedMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.normalizedMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Build mode updates
        if (this.gameState.mode === 'build') {
            // Update preview block when not orbiting
            if (!this.renderer.isOrbiting) {
                this.vehicleBuilder.updatePreview(this.normalizedMouse.x, this.normalizedMouse.y);
                // Update block hover for highlighting
                this.vehicleBuilder.updateBlockHover(this.normalizedMouse.x, this.normalizedMouse.y);
            }
        }

        // Update camera orbit if dragging
        if (this.renderer.isOrbiting) {
            this.renderer.updateOrbit(event.clientX, event.clientY);
            // Clear hover state when orbiting
            this.vehicleBuilder.clearHoverState();
        }
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        if (this.gameState.mode === 'build') {
            if (event.button === 0) { // Left click
                // Place block
                this.vehicleBuilder.placeBlockAtPreview();
            } else if (event.button === 2) { // Right click
                // Check if we're clicking on a block to remove it
                const hoveredBlock = this.vehicleBuilder.hoveredBlock;

                if (hoveredBlock) {
                    // Remove the specific block
                    this.vehicleBuilder.removeBlock(hoveredBlock);
                    // Clear hover state after removal
                    this.vehicleBuilder.clearHoverState();
                } else {
                    // If not clicking on a block, start camera orbit
                    this.renderer.startOrbit(event.clientX, event.clientY);
                }
            }
        }
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        if (event.button === 2) { // Right click
            this.renderer.stopOrbit();
        }
    }

    /**
     * Handle mouse wheel events
     * @param {WheelEvent} event
     */
    onMouseWheel(event) {
        event.preventDefault();

        if (this.gameState.mode === 'build') {
            this.renderer.zoom(event.deltaY);
        }
    }

    /**
     * Select a block type
     * @param {string} type - Block type to select
     */
    selectBlockType(type) {
        this.gameState.selectedBlockType = type;
        this.vehicleBuilder.updatePreviewBlockType();

        // Update UI
        document.querySelectorAll('.block-type').forEach(element => {
            element.classList.remove('active');
            if (element.dataset.type === type) {
                element.classList.add('active');
            }
        });
    }

    /**
     * Rotate the current block
     */
    rotateBlock() {
        this.gameState.blockRotation = (this.gameState.blockRotation + 90) % 360;

        // Update preview rotation
        if (this.vehicleBuilder.previewBlock) {
            this.vehicleBuilder.previewBlock.rotation.y = (this.gameState.blockRotation * Math.PI) / 180;
        }
    }

    /**
     * Setup block selection button listeners
     */
    setupBlockSelectionButtons() {
        document.querySelectorAll('.block-type').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                if (type) {
                    this.selectBlockType(type);
                }
            });
        });
    }

    /**
     * Setup control button listeners
     */
    setupControlButtons() {
        // Clear all button
        const clearButton = document.getElementById('clearAllButton');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Clear all blocks? This will refund all materials.')) {
                    this.vehicleBuilder.clearVehicle();
                }
            });
        }

        // Remove last button
        const removeButton = document.getElementById('removeLastButton');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                this.vehicleBuilder.removeLastBlock();
            });
        }
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;

        // Show/hide pause indicator
        if (this.gameState.isPaused) {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
    }

    /**
     * Show pause overlay
     */
    showPauseOverlay() {
        let overlay = document.getElementById('pauseOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pauseOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            `;
            overlay.innerHTML = `
                <div style="
                    background: rgba(10, 14, 39, 0.95);
                    border: 2px solid #00ffcc;
                    border-radius: 8px;
                    padding: 30px;
                    text-align: center;
                    color: #00ffcc;
                    font-size: 2rem;
                    font-family: 'Orbitron', sans-serif;
                ">
                    PAUSED
                    <div style="font-size: 1rem; margin-top: 10px; font-family: 'Rajdhani', sans-serif;">
                        Press ESC to continue
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    /**
     * Hide pause overlay
     */
    hidePauseOverlay() {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Update vehicle movement based on input
     * @param {number} deltaTime - Time since last update
     */
    updateVehicleMovement(deltaTime) {
        if (this.gameState.mode !== 'battle' || this.gameState.isPaused) return;

        const stats = this.vehicleBuilder.calculateVehicleStats();
        const baseSpeed = 5 * stats.speedMultiplier;
        const rotationSpeed = 2 * stats.speedMultiplier;

        // Forward/backward movement
        if (this.moveForward) {
            this.vehicleBuilder.vehicleVelocity.z = -baseSpeed;
        } else if (this.moveBackward) {
            this.vehicleBuilder.vehicleVelocity.z = baseSpeed * 0.5;
        } else {
            this.vehicleBuilder.vehicleVelocity.z *= 0.9; // Friction
        }

        // Rotation
        if (this.rotateLeft) {
            this.vehicleBuilder.vehicleRotation += rotationSpeed * deltaTime;
        }
        if (this.rotateRight) {
            this.vehicleBuilder.vehicleRotation -= rotationSpeed * deltaTime;
        }

        // Apply rotation
        this.gameState.vehicle.group.rotation.y = this.vehicleBuilder.vehicleRotation;

        // Apply movement
        const moveVector = new THREE.Vector3(
            0,
            0,
            this.vehicleBuilder.vehicleVelocity.z * deltaTime
        );
        moveVector.applyQuaternion(this.gameState.vehicle.group.quaternion);
        this.gameState.vehicle.group.position.add(moveVector);

        // Keep vehicle on ground
        this.gameState.vehicle.group.position.y = 0;

        // Shooting
        if (this.isShooting) {
            this.combatSystem.fireWeapons();
        }
    }

    /**
     * Get current input state
     * @returns {Object} Input state
     */
    getInputState() {
        return {
            keys: { ...this.keys },
            mousePosition: { ...this.mousePosition },
            normalizedMouse: this.normalizedMouse.clone(),
            moveForward: this.moveForward,
            moveBackward: this.moveBackward,
            rotateLeft: this.rotateLeft,
            rotateRight: this.rotateRight,
            isShooting: this.isShooting
        };
    }

    /**
     * Clean up event listeners
     */
    dispose() {
        document.removeEventListener('keydown', (e) => this.onKeyDown(e));
        document.removeEventListener('keyup', (e) => this.onKeyUp(e));
        document.removeEventListener('mousemove', (e) => this.onMouseMove(e));
        document.removeEventListener('mousedown', (e) => this.onMouseDown(e));
        document.removeEventListener('mouseup', (e) => this.onMouseUp(e));
        document.removeEventListener('wheel', (e) => this.onMouseWheel(e));

        this.hidePauseOverlay();
    }
}