/**
 * Renderer module for Three.js scene management
 * Handles scene, camera, lighting, and rendering
 */

import * as THREE from 'three';
import { ResourceManager } from '../utils/disposable.js';

/**
 * Renderer class for managing Three.js rendering
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.resources = new ResourceManager();

        // Camera controls
        this.cameraAngle = 0;
        this.cameraDistance = 15;
        this.cameraHeight = 8;
        this.isOrbiting = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Ground and visual elements
        this.basePlate = null;
        this.ground = null;
        this.gridHelper = null;
        this.placementGrid = [];

        this.init();
    }

    /**
     * Initialize the renderer and scene
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a0e27, 10, 100);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add lights
        this.setupLights();

        // Add ground and grid
        this.setupGround();

        // Setup base plate for building
        this.setupBasePlate();

        // Generate placement grid
        this.generatePlacementGrid();

        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Setup scene lighting
     */
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x808080, 1);
        this.scene.add(ambientLight);
        this.resources.register('ambientLight', ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);
        this.resources.register('mainLight', mainLight);

        // Base plate light
        const baseLight = new THREE.PointLight(0x00ffff, 2, 30);
        baseLight.position.set(0, 10, 0);
        this.scene.add(baseLight);
        this.resources.register('baseLight', baseLight);

        // Fill light
        const fillLight = new THREE.PointLight(0xff0088, 0.5);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
        this.resources.register('fillLight', fillLight);
    }

    /**
     * Setup ground plane and grid
     */
    setupGround() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1f3a,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.5;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        this.resources.register('ground', this.ground);

        // Grid helper
        this.gridHelper = new THREE.GridHelper(200, 40, 0x00ffcc, 0x1a1f3a);
        this.gridHelper.material.opacity = 0.2;
        this.gridHelper.material.transparent = true;
        this.scene.add(this.gridHelper);
        this.resources.register('gridHelper', this.gridHelper);
    }

    /**
     * Setup base plate for building
     */
    setupBasePlate() {
        // Create visible base plate
        const baseGeometry = new THREE.BoxGeometry(7, 0.2, 7);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.5,
            roughness: 0.5
        });

        this.basePlate = new THREE.Mesh(baseGeometry, baseMaterial);
        this.basePlate.position.set(0, -0.1, 0);
        this.basePlate.receiveShadow = true;
        this.basePlate.castShadow = false;
        this.scene.add(this.basePlate);
        this.resources.register('basePlate', this.basePlate);

        // Add edge lines to base plate
        const edgesGeometry = new THREE.EdgesGeometry(baseGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.basePlate.add(edges);

        // Add grid on top of base plate - aligned with block placement positions
        const gridSize = 7;
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5
        });

        const gridPoints = [];
        for (let i = -3; i <= 3; i++) {
            // Horizontal lines - just above baseplate where blocks sit
            gridPoints.push(new THREE.Vector3(-3, 0.01, i));
            gridPoints.push(new THREE.Vector3(3, 0.01, i));
            // Vertical lines
            gridPoints.push(new THREE.Vector3(i, 0.01, -3));
            gridPoints.push(new THREE.Vector3(i, 0.01, 3));
        }

        const gridGeometry = new THREE.BufferGeometry().setFromPoints(gridPoints);
        const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
        this.scene.add(grid);
        this.resources.register('basePlateGrid', grid);
    }

    /**
     * Generate placement grid positions
     */
    generatePlacementGrid() {
        this.placementGrid = [];

        // Generate grid positions (7x7x7 cube centered at origin)
        // Block centers at y=0.5, 1.5, 2.5... so bottoms sit on ground
        for (let x = -3; x <= 3; x++) {
            for (let y = 0; y <= 6; y++) {
                for (let z = -3; z <= 3; z++) {
                    this.placementGrid.push(new THREE.Vector3(x, y + 0.5, z));
                }
            }
        }
    }

    /**
     * Update camera position based on controls
     * @param {string} mode - Current game mode
     */
    updateCamera(mode = 'build') {
        if (mode === 'build') {
            // Build mode camera
            const x = Math.sin(this.cameraAngle) * this.cameraDistance;
            const z = Math.cos(this.cameraAngle) * this.cameraDistance;
            this.camera.position.set(x, this.cameraHeight, z);
            this.camera.lookAt(0, 0, 0);
        } else {
            // Battle mode camera - follow vehicle from behind
            // This will be updated by the game core
        }
    }

    /**
     * Start camera orbit
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    startOrbit(mouseX, mouseY) {
        this.isOrbiting = true;
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }

    /**
     * Update camera orbit
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    updateOrbit(mouseX, mouseY) {
        if (!this.isOrbiting) return;

        const deltaX = mouseX - this.lastMouseX;
        const deltaY = mouseY - this.lastMouseY;

        this.cameraAngle += deltaX * 0.01;
        this.cameraHeight = Math.max(2, Math.min(20, this.cameraHeight - deltaY * 0.05));

        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;

        this.updateCamera();
    }

    /**
     * Stop camera orbit
     */
    stopOrbit() {
        this.isOrbiting = false;
    }

    /**
     * Zoom camera
     * @param {number} delta - Zoom delta (positive = zoom in)
     */
    zoom(delta) {
        this.cameraDistance = Math.max(5, Math.min(30, this.cameraDistance - delta * 0.01));
        this.updateCamera();
    }

    /**
     * Set battle mode visibility
     * @param {boolean} inBattle - Whether in battle mode
     */
    setBattleMode(inBattle) {
        // Hide base plate and grid in battle mode
        if (this.basePlate) {
            this.basePlate.visible = !inBattle;
            // Also remove base plate from physics/raycasting in battle mode
            this.basePlate.userData.ignoreRaycast = inBattle;
        }
        if (this.gridHelper) this.gridHelper.visible = !inBattle;

        // Update CSS class on body
        document.body.classList.toggle('battle-mode', inBattle);
    }

    /**
     * Render the scene
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize
     */
    onResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Get raycaster for mouse picking
     * @param {number} mouseX - Normalized mouse X (-1 to 1)
     * @param {number} mouseY - Normalized mouse Y (-1 to 1)
     * @returns {THREE.Raycaster}
     */
    getRaycaster(mouseX, mouseY) {
        const raycaster = new THREE.Raycaster();
        const mouseVector = new THREE.Vector2(mouseX, mouseY);
        raycaster.setFromCamera(mouseVector, this.camera);
        return raycaster;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.resources.disposeAll();

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }

        window.removeEventListener('resize', () => this.onResize());
    }
}