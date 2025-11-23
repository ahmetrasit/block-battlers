/**
 * UI management module
 * Handles all user interface updates and interactions
 */

/**
 * UIManager class for managing UI elements
 */
export class UIManager {
    constructor(gameState, saveSystem) {
        this.gameState = gameState;
        this.saveSystem = saveSystem;
        this.elements = {};

        this.init();
    }

    /**
     * Initialize UI manager
     */
    init() {
        this.cacheElements();
        this.setupSaveLoadPanel();
        this.updateAll();
    }

    /**
     * Cache UI element references
     */
    cacheElements() {
        this.elements = {
            ironCount: document.getElementById('ironCount'),
            copperCount: document.getElementById('copperCount'),
            waveNumber: document.getElementById('waveNumber'),
            blockCount: document.getElementById('blockCount'),
            enemyCount: document.getElementById('enemyCount'),
            healthBar: document.getElementById('healthBar'),
            healthFill: document.getElementById('healthFill'),
            modeToggle: document.getElementById('modeToggle'),
            buildPanel: document.getElementById('buildPanel'),
            instructions: document.getElementById('instructions')
        };
    }

    /**
     * Setup save/load panel
     */
    setupSaveLoadPanel() {
        // Create save/load panel
        const panel = document.createElement('div');
        panel.id = 'saveLoadPanel';
        panel.innerHTML = `
            <button id="saveButton">💾 Save</button>
            <button id="loadButton">📂 Load</button>
            <button id="newGameButton">🆕 New</button>
        `;

        const ui = document.getElementById('ui');
        if (ui) {
            ui.appendChild(panel);
        }

        // Setup button handlers
        this.setupSaveLoadHandlers();
    }

    /**
     * Setup save/load button handlers
     */
    setupSaveLoadHandlers() {
        // Save button
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveGame();
            });
        }

        // Load button
        const loadButton = document.getElementById('loadButton');
        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.loadGame();
            });
        }

        // New game button
        const newGameButton = document.getElementById('newGameButton');
        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                this.newGame();
            });
        }
    }

    /**
     * Save game
     */
    saveGame() {
        const success = this.saveSystem.save(this.gameState);

        if (success) {
            this.showNotification('Game Saved!', 'success');
        } else {
            this.showNotification('Save Failed!', 'error');
        }
    }

    /**
     * Load game
     */
    loadGame() {
        const saveData = this.saveSystem.load();

        if (!saveData) {
            this.showNotification('No Save Found!', 'error');
            return;
        }

        if (confirm('Load saved game? Current progress will be lost.')) {
            // Load materials and stats
            if (saveData.materials) {
                this.gameState.materials = saveData.materials;
            }

            if (saveData.stats) {
                this.gameState.waveNumber = saveData.stats.waveNumber || 1;
                this.gameState.battlesWon = saveData.stats.battlesWon || 0;
                this.gameState.score = saveData.stats.score || 0;
            }

            // Vehicle loading should be handled by the core game
            // Trigger a custom event for the game to handle
            const event = new CustomEvent('loadGame', { detail: saveData });
            document.dispatchEvent(event);

            this.showNotification('Game Loaded!', 'success');
            this.updateAll();
        }
    }

    /**
     * Start new game
     */
    newGame() {
        if (confirm('Start a new game? All progress will be lost.')) {
            // Reset game state
            this.gameState.reset();

            // Trigger new game event
            const event = new CustomEvent('newGame');
            document.dispatchEvent(event);

            this.showNotification('New Game Started!', 'success');
            this.updateAll();
        }
    }

    /**
     * Update all UI elements
     */
    updateAll() {
        this.updateMaterials();
        this.updateStats();
        this.updateHealth();
    }

    /**
     * Update material displays
     */
    updateMaterials() {
        if (this.elements.ironCount) {
            this.elements.ironCount.textContent = this.gameState.materials.iron;
        }
        if (this.elements.copperCount) {
            this.elements.copperCount.textContent = this.gameState.materials.copper;
        }
    }

    /**
     * Update game stats displays
     */
    updateStats() {
        if (this.elements.waveNumber) {
            this.elements.waveNumber.textContent = this.gameState.waveNumber;
        }
        if (this.elements.blockCount) {
            this.elements.blockCount.textContent = this.gameState.vehicle.blocks.length;
        }
        if (this.elements.enemyCount) {
            this.elements.enemyCount.textContent = this.gameState.enemies.length;
        }
    }

    /**
     * Update health bar
     */
    updateHealth() {
        const healthPercentage = this.gameState.getCoreHealthPercentage();

        if (this.elements.healthFill) {
            this.elements.healthFill.style.width = `${healthPercentage}%`;

            // Change color based on health
            if (healthPercentage > 60) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #00ffcc, #00ff88)';
            } else if (healthPercentage > 30) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
            } else {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff4444, #ff0000)';
            }
        }
    }

    /**
     * Update mode toggle button
     * @param {string} mode - Current game mode
     */
    updateModeToggle(mode) {
        if (this.elements.modeToggle) {
            this.elements.modeToggle.textContent = mode === 'build' ? 'START BATTLE' : 'END BATTLE';
        }

        // Toggle battle mode class
        document.body.classList.toggle('battle-mode', mode === 'battle');
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success/error/info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = message;

        // Style based on type
        switch(type) {
            case 'success':
                notification.style.borderColor = '#00ff88';
                notification.style.color = '#00ff88';
                break;
            case 'error':
                notification.style.borderColor = '#ff4444';
                notification.style.color = '#ff4444';
                break;
            default:
                notification.style.borderColor = '#00ffcc';
                notification.style.color = '#00ffcc';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        alert(message);
    }

    /**
     * Show confirm dialog
     * @param {string} message - Confirmation message
     * @returns {boolean} User's choice
     */
    confirm(message) {
        return confirm(message);
    }

    /**
     * Toggle UI visibility for different modes
     * @param {boolean} inBattle - Whether in battle mode
     */
    toggleBattleMode(inBattle) {
        // Hide/show build-specific UI
        if (this.elements.buildPanel) {
            this.elements.buildPanel.style.display = inBattle ? 'none' : 'block';
        }
        if (this.elements.instructions) {
            this.elements.instructions.style.display = inBattle ? 'none' : 'block';
        }

        // Show/hide health bar
        if (this.elements.healthBar) {
            this.elements.healthBar.style.display = inBattle ? 'block' : 'none';
        }
    }

    /**
     * Display FPS counter
     * @param {number} fps - Current FPS
     */
    displayFPS(fps) {
        let fpsCounter = document.getElementById('fpsCounter');
        if (!fpsCounter && this.gameState.settings.showFPS) {
            fpsCounter = document.createElement('div');
            fpsCounter.id = 'fpsCounter';
            fpsCounter.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                color: #00ffcc;
                font-family: monospace;
                font-size: 14px;
                background: rgba(0, 0, 0, 0.5);
                padding: 5px;
                border-radius: 3px;
                z-index: 1000;
            `;
            document.body.appendChild(fpsCounter);
        }

        if (fpsCounter && this.gameState.settings.showFPS) {
            fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
        } else if (fpsCounter && !this.gameState.settings.showFPS) {
            fpsCounter.remove();
        }
    }

    /**
     * Create settings panel
     */
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'settingsPanel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 14, 39, 0.95);
            border: 2px solid #00ffcc;
            border-radius: 8px;
            padding: 20px;
            display: none;
            z-index: 1001;
        `;

        panel.innerHTML = `
            <h3 style="color: #00ffcc; font-family: 'Orbitron', sans-serif;">Settings</h3>
            <div style="margin: 10px 0;">
                <label style="color: #00ffcc;">
                    <input type="checkbox" id="showFPSCheckbox"> Show FPS
                </label>
            </div>
            <div style="margin: 10px 0;">
                <label style="color: #00ffcc;">
                    Graphics Quality:
                    <select id="graphicsQuality">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </label>
            </div>
            <button id="closeSettings" style="margin-top: 10px;">Close</button>
        `;

        document.body.appendChild(panel);

        // Setup settings handlers
        this.setupSettingsHandlers();
    }

    /**
     * Setup settings panel handlers
     */
    setupSettingsHandlers() {
        const showFPSCheckbox = document.getElementById('showFPSCheckbox');
        if (showFPSCheckbox) {
            showFPSCheckbox.checked = this.gameState.settings.showFPS;
            showFPSCheckbox.addEventListener('change', (e) => {
                this.gameState.settings.showFPS = e.target.checked;
                this.saveSystem.saveSettings(this.gameState.settings);
            });
        }

        const graphicsQuality = document.getElementById('graphicsQuality');
        if (graphicsQuality) {
            graphicsQuality.value = this.gameState.settings.graphicsQuality;
            graphicsQuality.addEventListener('change', (e) => {
                this.gameState.settings.graphicsQuality = e.target.value;
                this.saveSystem.saveSettings(this.gameState.settings);

                // Trigger graphics update event
                const event = new CustomEvent('graphicsQualityChanged', { detail: e.target.value });
                document.dispatchEvent(event);
            });
        }

        const closeButton = document.getElementById('closeSettings');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideSettings();
            });
        }
    }

    /**
     * Show settings panel
     */
    showSettings() {
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.style.display = 'block';
        }
    }

    /**
     * Hide settings panel
     */
    hideSettings() {
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * Dispose of UI resources
     */
    dispose() {
        // Remove created elements
        const saveLoadPanel = document.getElementById('saveLoadPanel');
        if (saveLoadPanel) saveLoadPanel.remove();

        const fpsCounter = document.getElementById('fpsCounter');
        if (fpsCounter) fpsCounter.remove();

        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) settingsPanel.remove();
    }
}