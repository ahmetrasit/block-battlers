/**
 * Block Battlers 2.0 - Main Entry Point
 * Modern modular version with Vite build system
 */

import './styles/main.css';
import { game } from './game/core.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

/**
 * Initialize the game
 */
async function initGame() {
    try {
        console.log('Block Battlers 2.0 - Starting...');

        // Initialize game
        await game.init();

        console.log('Block Battlers 2.0 - Ready!');

        // Handle page visibility for pause
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Handle window unload
        window.addEventListener('beforeunload', handleBeforeUnload);

    } catch (error) {
        console.error('Failed to initialize Block Battlers:', error);
        showErrorScreen(error);
    }
}

/**
 * Handle page visibility change
 */
function handleVisibilityChange() {
    if (document.hidden && game.gameState) {
        // Auto-pause when tab is hidden (only in battle mode)
        if (game.gameState.mode === 'battle' && !game.gameState.isPaused) {
            game.controlSystem?.togglePause();
        }
    }
}

/**
 * Handle before unload
 */
function handleBeforeUnload(event) {
    if (game.gameState && game.gameState.vehicle.blocks.length > 0) {
        // Auto-save before leaving
        if (game.saveSystem) {
            game.saveSystem.save(game.gameState);
        }

        // Show confirmation if vehicle has blocks
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
}

/**
 * Show error screen
 * @param {Error} error - Error to display
 */
function showErrorScreen(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a2540 0%, #2a3f5f 50%, #1f2a3d 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ff4444;
        font-family: 'Rajdhani', sans-serif;
        z-index: 10000;
    `;

    errorDiv.innerHTML = `
        <h1 style="font-family: 'Orbitron', sans-serif; font-size: 3rem; margin-bottom: 20px;">
            INITIALIZATION ERROR
        </h1>
        <div style="
            background: rgba(10, 14, 39, 0.95);
            border: 2px solid #ff4444;
            border-radius: 8px;
            padding: 30px;
            max-width: 600px;
            text-align: center;
        ">
            <p style="font-size: 1.2rem; margin-bottom: 15px;">
                Failed to start Block Battlers
            </p>
            <p style="color: #aaa; font-family: monospace; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;">
                ${error.message}
            </p>
            <button onclick="location.reload()" style="
                margin-top: 20px;
                background: linear-gradient(135deg, rgba(255, 68, 68, 0.3), rgba(255, 68, 68, 0.1));
                color: #ff4444;
                border: 2px solid #ff4444;
                padding: 12px 24px;
                cursor: pointer;
                font-family: 'Rajdhani', sans-serif;
                font-size: 1rem;
                font-weight: 600;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 1px;
            ">
                Reload Page
            </button>
        </div>
    `;

    document.body.appendChild(errorDiv);
}

// Export for debugging
window.BlockBattlers = {
    game,
    version: '2.0.0',
    debug: {
        getState: () => game.gameState?.export(),
        save: () => game.saveSystem?.save(game.gameState),
        load: () => game.saveSystem?.load(),
        clearSave: () => game.saveSystem?.delete()
    }
};