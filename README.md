# 🎮 Block Battlers

A 3D vehicle combat game where you build custom battle vehicles from blocks and fight in intense arena battles!

![Block Battlers](https://img.shields.io/badge/version-2.0-blue) ![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3001 in your browser
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## 🎯 How to Play

### Building Mode
1. Select blocks using number keys (1-7) or click on the left panel
2. Move your mouse to see a ghost preview of block placement
3. Left-click to place blocks
4. Press **R** to rotate blocks before placing
5. Right-click + drag to orbit the camera
6. Scroll to zoom in/out

### Battle Mode
1. Click **START BATTLE** when your vehicle is ready
2. Use **W/A/S/D** to move and rotate
3. Press **SPACE** to fire weapons
4. Destroy all enemies to advance to the next wave!

### Block Types
- 🛡️ **Armor** - High HP defensive block
- ⚔️ **Weapon** - Fires projectiles
- 🔺 **Spike** - Ramming damage at high speed
- ⚡ **Engine** - Powers movement
- 💎 **Core** - Your vehicle's heart (protect it!)
- 🎡 **Wheel** - Standard mobility
- ⭕ **Large Wheel** - Faster movement

## ✨ Features

- **Creative Building** - Design unique vehicles with 7 block types
- **Dynamic Combat** - Real-time 3D battles with physics
- **Wave Progression** - Face increasingly difficult enemies
- **Save/Load System** - Auto-saves progress every 60 seconds
- **Resource Management** - Earn materials from victories
- **Block Health System** - Individual blocks can be destroyed

## 🏗️ Technical Stack

- **Three.js 0.160** - 3D rendering
- **Vite 5.0** - Build tool and dev server
- **ES6+ JavaScript** - Modern modular architecture
- **LocalStorage API** - Save/load system

## 📁 Project Structure

```
/src
  /game          # Core game modules
    core.js      # Main game loop
    vehicle.js   # Vehicle building logic
    combat.js    # Battle system
    renderer.js  # Three.js rendering
    ui.js        # UI management
    state.js     # Save/load system
    blocks.js    # Block definitions
    enemies.js   # Enemy AI
    controls.js  # Input handling
  /utils         # Utility modules
    pool.js      # Object pooling
    disposable.js # Resource management
  /styles        # CSS styles
    main.css
  main.js        # Entry point
```

## 🔧 Development

### Code Organization
The codebase is organized into specialized modules:
- Each module handles a specific aspect of the game
- ES6 imports/exports for clean dependencies
- Clear separation of concerns

### Performance Optimizations
- Object pooling for projectiles
- Proper Three.js resource disposal
- Batched DOM updates
- Optimized raycasting

### Memory Management
- All Three.js geometries and materials properly disposed
- Resource manager prevents memory leaks
- Garbage collection friendly architecture

## 🛣️ Roadmap

### Phase 1 ✅ (Complete)
- [x] Modular architecture with Vite
- [x] Save/load system
- [x] Memory leak fixes
- [x] Object pooling
- [x] Performance optimizations

### Phase 2 (Planned)
- [ ] Audio system (music and sound effects)
- [ ] Damage numbers and particle effects
- [ ] More block types (shields, boosters, missiles)
- [ ] Tutorial system
- [ ] Better enemy AI

### Phase 3 (Future)
- [ ] **Multiplayer support** 🎯
- [ ] Matchmaking system
- [ ] Leaderboards
- [ ] Custom arenas
- [ ] Tournament mode

## 📝 Version History

### v2.0 (Current)
- Migrated to modular ES6 architecture
- Added save/load system with auto-save
- Fixed memory leaks
- Added object pooling
- Improved performance

### v1.0
- Initial release
- 7 block types
- Wave-based combat
- Material economy

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🎮 Credits

Created with ❤️ by the Block Battlers team

---

**Have fun building and battling!** 🚀
