# Block Battlers - Game Documentation

## Overview
Block Battlers is a 3D block-building vehicle combat game where players construct vehicles from various block types and battle against increasingly difficult enemy waves. The game combines creative building mechanics with tactical combat and resource management.

---

## Current Features

### Building System
- **7 Block Types Available**
  - 🛡️ **Armor** (3 Iron) - High health defensive block (50 HP)
  - ⚔️ **Weapon** (2 Iron, 3 Copper) - Fires projectiles (20 HP)
  - 🔺 **Spike** (1 Iron) - Ramming damage when moving fast (15 HP)
  - ⚡ **Engine** (4 Iron, 4 Copper) - Powers movement and reduces weight penalty (30 HP)
  - 💎 **Core** (5 Iron, 5 Copper) - Vehicle heart, loss = game over (100 HP)
  - 🎡 **Wheel** (2 Iron, 1 Copper) - Standard mobility (25 HP)
  - ⭕ **Large Wheel** (3 Iron, 2 Copper) - Faster movement, 2x larger (40 HP)

- **Build Controls**
  - Number keys (1-7) for quick block selection
  - Mouse movement shows ghost preview of placement
  - Left click to place block at preview location
  - R key to rotate blocks (90° increments)
  - Right-click drag to orbit camera around build platform
  - Mouse scroll to zoom in/out
  - Backspace to remove last placed block
  - Clear All button to reset vehicle

- **Build Platform**
  - Bright cyan 8x8 base plate with yellow grid lines
  - Grid-based placement system (1x1x1 unit blocks)
  - Blocks must be adjacent to existing blocks or on base
  - Visual feedback with white wireframe edges on all blocks

### Combat System
- **Vehicle Requirements**
  - Must have: Core, Engine, Weapon OR Spike, Wheel OR Large Wheel
  - Armor is optional but recommended

- **Combat Mechanics**
  - WASD movement (W/S = forward/back, A/D = rotate)
  - Space bar to fire weapons
  - Spike damage requires minimum speed (0.08+) and ramming
  - Projectiles damage random enemy blocks
  - Enemy collisions damage random player blocks
  - Spikes reduce incoming damage by 50%

- **Block Health System**
  - Each block has individual health pool
  - Blocks break off permanently when health reaches 0
  - Core destruction = instant loss
  - Visual feedback: damaged blocks flash red
  - Health bar displays core health percentage

### Enemy System
- **Block-Based Enemies**
  - Enemies constructed from blocks (cores, armor, weapons, wheels, spikes)
  - Red glowing appearance for visibility
  - Individual block health and destruction
  - Enemy core destruction = enemy defeated

- **Wave Progression**
  - Wave 1: 1 enemy with basic components
  - Higher waves: More enemies (up to 4), more blocks, better equipment
  - Wave 3+: Enemies can spawn with spikes
  - Enemies start farther away in later waves
  - Difficulty scales infinitely

- **Enemy AI**
  - Enemies chase player vehicle
  - Collision damage to player blocks
  - Attacks player every ~1 second

### Resource & Progression System
- **Materials**
  - 🔩 **Iron**: Primary building material (start: 50)
  - 🔶 **Copper**: Advanced component material (start: 50)

- **Resource Economy**
  - Each block costs specific iron/copper amounts
  - Removing blocks refunds 100% of materials
  - Enemy defeats award materials (15-24 iron, 10-19 copper base)
  - Higher waves give bonus materials (Wave × 5 iron, Wave × 3 copper)

- **Progression**
  - Wave number tracks current difficulty
  - Battles won counter tracks consecutive victories
  - Score tracks total enemy defeats
  - Core destruction resets wave to 1 (but keeps vehicle and materials)
  - Vehicle persists between battles (repair/upgrade strategy)

### Visual & UI
- **Graphics**
  - Three.js 3D rendering
  - Bright blue-gray gradient background
  - Emissive glowing blocks (player: colorful, enemies: red)
  - White wireframe edges on all blocks
  - Directional and point lighting

- **User Interface**
  - Top bar: Iron/Copper counts, Wave number, Block count, Enemy count
  - Health bar (tracks core health)
  - Build panel with block costs visible
  - Instructions panel
  - Mode toggle button (Build ↔ Battle)

- **Color Scheme**
  - Player blocks: Blue (armor), Red (weapon), Orange (spike), Gold (engine), Purple (core), Dark gray (wheels)
  - Enemy blocks: All red/orange glow
  - UI: Cyan accent color (#00ffcc)
  - Base plate: Bright cyan with yellow grid

---

## Planned Features

### Phase 1: Core Gameplay Improvements
- [ ] **Save/Load System**
  - Save vehicle designs with names
  - Load previous builds
  - Share vehicle codes with friends

- [ ] **Block Rotation Improvements**
  - Visual rotation indicator during placement
  - Allow rotation on multiple axes (X, Y, Z)
  - Preset orientations for common placements

- [ ] **Better Camera Controls**
  - Top-down view option
  - Side view option
  - Camera presets (F1-F4 keys)
  - Smoother camera transitions

- [ ] **Enhanced Visual Feedback**
  - Damage numbers floating from hit blocks
  - Block destruction particle effects
  - Screen shake on heavy impacts
  - Victory/defeat animations

### Phase 2: Extended Building
- [ ] **New Block Types**
  - Shield Generator: Creates temporary energy shield
  - Booster: Temporary speed boost ability
  - Repair Block: Slowly regenerates nearby blocks
  - Missile Launcher: Homing projectiles
  - Laser Turret: Continuous beam weapon
  - Heavy Armor: 2x2x1 block with massive HP

- [ ] **Block Upgrades**
  - Tier 2 & 3 versions of existing blocks
  - Enhanced stats but higher material costs
  - Visual distinctions (brighter glow, different geometry)

- [ ] **Modular Components**
  - Weapons with different fire rates/damage
  - Engine types (speed vs. power)
  - Specialized wheels (off-road, racing, treads)

### Phase 3: Combat Expansion
- [ ] **Special Abilities**
  - Cooldown-based super weapons
  - Dodge/dash maneuver
  - Temporary invincibility
  - Area-of-effect attacks

- [ ] **Enemy Variety**
  - Fast scout enemies
  - Tank enemies with heavy armor
  - Artillery enemies that keep distance
  - Boss enemies every 5 waves

- [ ] **Environmental Hazards**
  - Moving obstacles
  - Hazardous terrain zones
  - Destructible cover
  - Power-up pickups in arena

### Phase 4: Progression & Meta
- [ ] **Unlock System**
  - Unlock new block types by reaching certain waves
  - Permanent upgrades purchased with accumulated score
  - Achievement system

- [ ] **Multiple Arena Types**
  - Open battlefield
  - Maze with walls
  - Multi-level platforms
  - Environmental themes (desert, ice, volcano)

- [ ] **Challenge Modes**
  - Time attack: Defeat enemies before timer
  - Survival: Endless waves
  - Budget builds: Limited materials
  - Boss rush mode

### Phase 5: Polish & Quality of Life
- [ ] **Tutorial System**
  - Interactive tutorial for new players
  - Block type explanations
  - Combat tips overlay

- [ ] **Better UI/UX**
  - Minimap showing enemy positions
  - Block palette quick-access bar
  - Stat calculator showing vehicle stats before battle
  - Material requirement preview when hovering blocks

- [ ] **Performance Optimization**
  - Object pooling for projectiles
  - LOD system for distant enemies
  - Optimize particle effects

- [ ] **Audio**
  - Background music (build mode vs battle mode)
  - Sound effects (placement, combat, destruction)
  - Volume controls

---

## Gap Analysis

### Critical Gaps (High Priority)

1. **User Onboarding**
   - **Current State**: No tutorial or guidance for new players
   - **Impact**: Players may not understand mechanics
   - **Solution**: Add interactive tutorial and help tooltips
   - **Effort**: Medium

2. **Visual Feedback**
   - **Current State**: Minimal feedback for hits/damage
   - **Impact**: Combat feels less impactful
   - **Solution**: Add damage numbers, particles, screen shake
   - **Effort**: Medium

3. **Camera Usability**
   - **Current State**: Single orbital camera view
   - **Impact**: Hard to see vehicle from all angles while building
   - **Solution**: Add camera presets and better controls
   - **Effort**: Low

4. **Save/Load**
   - **Current State**: No way to save progress or designs
   - **Impact**: Players lose everything on page refresh
   - **Solution**: LocalStorage or export/import system
   - **Effort**: Low-Medium

### Moderate Gaps (Medium Priority)

5. **Block Variety**
   - **Current State**: Only 7 block types
   - **Impact**: Limited strategic depth and creativity
   - **Solution**: Add 5-10 new block types
   - **Effort**: Medium-High (each block needs balancing)

6. **Enemy Variety**
   - **Current State**: All enemies use same template (just scaled)
   - **Impact**: Combat becomes repetitive
   - **Solution**: Create distinct enemy archetypes
   - **Effort**: Medium

7. **Arena Variety**
   - **Current State**: Single flat arena
   - **Impact**: Every battle feels the same
   - **Solution**: Multiple arena layouts and themes
   - **Effort**: Medium-High

8. **Audio**
   - **Current State**: No sound at all
   - **Impact**: Game feels empty and less engaging
   - **Solution**: Add music and sound effects
   - **Effort**: Medium (depends on asset availability)

### Minor Gaps (Low Priority)

9. **Advanced Building Features**
   - **Current State**: Basic placement only
   - **Impact**: Slightly limits building creativity
   - **Solution**: Copy/paste, symmetry mode, templates
   - **Effort**: Medium

10. **Meta Progression**
    - **Current State**: Only in-battle progression
    - **Impact**: No long-term goals beyond high wave count
    - **Solution**: Unlock system with permanent upgrades
    - **Effort**: High

11. **Challenge Modes**
    - **Current State**: Only survival mode
    - **Impact**: Limited replay value
    - **Solution**: Add multiple game modes
    - **Effort**: Medium-High

12. **Social Features**
    - **Current State**: Single player only
    - **Impact**: Can't share achievements or compete
    - **Solution**: Leaderboards, vehicle sharing
    - **Effort**: High (requires backend)

### Technical Debt

- **Performance**: May lag with many projectiles/particles on screen
- **Code Organization**: Game object is large and monolithic
- **Error Handling**: Limited error handling and recovery
- **Browser Compatibility**: Not tested across all browsers

---

## Implementation Roadmap

### Immediate (Next Session)
1. Fix remaining bugs
2. Add save/load system (LocalStorage)
3. Implement damage numbers
4. Add camera presets

### Short Term (1-2 weeks)
1. Tutorial system
2. 3-5 new block types
3. Particle effects for combat
4. Sound effects

### Medium Term (1 month)
1. Enemy variety (3-4 types)
2. Boss enemies
3. Multiple arenas
4. Achievement system

### Long Term (2-3 months)
1. Advanced building tools
2. Meta progression system
3. Challenge modes
4. Polish and optimization

---

## Success Metrics

### Player Engagement
- Average session length: Target 15+ minutes
- Wave progression: Average player reaches Wave 5+
- Return rate: Players return for multiple sessions

### Game Balance
- All block types used: No single "meta" build dominates
- Victory rate: 60-70% of battles won (with appropriate difficulty scaling)
- Material economy: Players can afford upgrades without excessive grinding

### Technical Performance
- Frame rate: Consistent 60 FPS
- Load time: < 2 seconds
- No game-breaking bugs

---

## Version History

### v2.0 (Current) - Phase 1 Migration Complete
- **Architecture**: Migrated to modular ES6 structure with Vite
- **Save/Load**: LocalStorage-based persistence with auto-save
- **Performance**: Object pooling for projectiles and particles
- **Memory**: Fixed Three.js memory leaks with proper disposal
- **Build System**: Vite dev server with hot module replacement
- **Code Quality**: Split 1500-line monolith into 11 specialized modules
- **Developer Experience**: Modern tooling ready for multiplayer

### v1.0 (November 2025)
- Initial release with 7 block types
- Wave-based combat system
- Block health and destruction
- Material economy
- Basic building controls

---

## Technical Architecture

### Project Structure (v2.0)
```
/block-battlers
  /src
    /game
      core.js         # Main game loop and coordination
      vehicle.js      # Vehicle building logic
      combat.js       # Battle system and collision
      renderer.js     # Three.js rendering pipeline
      ui.js           # DOM manipulation and UI updates
      state.js        # Save/load system and state management
      blocks.js       # Block definitions and creation
      enemies.js      # Enemy AI and generation
      controls.js     # Input handling (keyboard/mouse)
    /utils
      pool.js         # Object pooling for performance
      disposable.js   # Resource management and memory leak prevention
    /styles
      main.css        # All game styles
    main.js           # Entry point
  index.html          # Main HTML file
  package.json        # Dependencies and scripts
  vite.config.js      # Build configuration
```

### Build & Development

**Development Mode:**
```bash
npm run dev          # Start dev server (http://localhost:3001)
```

**Production Build:**
```bash
npm run build        # Build optimized bundle
npm run preview      # Preview production build
```

### New Features (v2.0)

1. **Save/Load System**
   - Auto-save every 60 seconds
   - Manual save/load buttons
   - Persists vehicle, materials, wave, and score
   - Uses localStorage

2. **Memory Management**
   - Proper disposal of Three.js resources
   - Object pooling for projectiles
   - Resource manager for centralized cleanup
   - Prevents memory leaks

3. **Modular Architecture**
   - 11 specialized modules
   - Clear separation of concerns
   - ES6 modules with imports/exports
   - Easier to maintain and extend

4. **Performance Optimizations**
   - Object pooling reduces garbage collection
   - Batched DOM updates
   - Optimized raycasting
   - Hot module replacement (HMR) in dev mode

## Credits & Technology

**Built With:**
- **Three.js 0.160** - 3D rendering engine
- **Vite 5.0** - Build tool and dev server
- **Vanilla JavaScript (ES6+)** - Game logic
- **HTML5 Canvas** - Rendering surface
- **CSS3** - Styling and UI
- **LocalStorage API** - Save/load system

**Design Philosophy:**
- Easy to learn, difficult to master
- Creative expression through vehicle building
- Strategic resource management
- Escalating challenge through wave system

---

*Last Updated: November 23, 2025 - v2.0 (Phase 1 Migration Complete)*
