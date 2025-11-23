/**
 * Disposable utilities for proper Three.js resource management
 * Prevents memory leaks by properly disposing of geometries, materials, and textures
 */

/**
 * Dispose of a single Three.js object
 * @param {Object} object - Three.js object to dispose
 */
export function disposeObject(object) {
    if (!object) return;

    // Dispose geometry
    if (object.geometry) {
        object.geometry.dispose();
    }

    // Dispose material(s)
    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(material => {
                disposeMaterial(material);
            });
        } else {
            disposeMaterial(object.material);
        }
    }

    // Dispose textures
    if (object.texture) {
        object.texture.dispose();
    }

    // Recursively dispose children
    if (object.children && object.children.length > 0) {
        object.children.forEach(child => {
            disposeObject(child);
        });
    }

    // Remove from parent
    if (object.parent) {
        object.parent.remove(object);
    }
}

/**
 * Dispose of a material and its textures
 * @param {THREE.Material} material - Material to dispose
 */
export function disposeMaterial(material) {
    if (!material) return;

    // Dispose textures
    const textureProperties = [
        'map',
        'normalMap',
        'bumpMap',
        'roughnessMap',
        'metalnessMap',
        'alphaMap',
        'aoMap',
        'emissiveMap',
        'displacementMap',
        'envMap'
    ];

    textureProperties.forEach(prop => {
        if (material[prop]) {
            material[prop].dispose();
        }
    });

    // Dispose the material itself
    material.dispose();
}

/**
 * DisposableObject class for tracking and disposing multiple objects
 */
export class DisposableObject {
    constructor() {
        this.disposables = [];
        this.disposed = false;
    }

    /**
     * Track an object for disposal
     * @param {Object} object - Object to track
     * @returns {Object} The tracked object
     */
    track(object) {
        if (!this.disposed) {
            this.disposables.push(object);
        }
        return object;
    }

    /**
     * Dispose all tracked objects
     */
    dispose() {
        if (this.disposed) return;

        this.disposables.forEach(obj => {
            disposeObject(obj);
        });

        this.disposables = [];
        this.disposed = true;
    }

    /**
     * Check if already disposed
     * @returns {boolean}
     */
    isDisposed() {
        return this.disposed;
    }
}

/**
 * Dispose a block and all its components
 * @param {THREE.Mesh} block - Block to dispose
 */
export function disposeBlock(block) {
    if (!block) return;

    // Dispose edges if they exist
    if (block.userData && block.userData.edges) {
        disposeObject(block.userData.edges);
    }

    // Dispose the block itself
    disposeObject(block);
}

/**
 * Dispose an entire vehicle
 * @param {Object} vehicle - Vehicle object with blocks and group
 */
export function disposeVehicle(vehicle) {
    if (!vehicle) return;

    // Dispose all blocks
    if (vehicle.blocks && Array.isArray(vehicle.blocks)) {
        vehicle.blocks.forEach(block => {
            disposeBlock(block);
        });
        vehicle.blocks = [];
    }

    // Dispose the group
    if (vehicle.group) {
        disposeObject(vehicle.group);
        vehicle.group = null;
    }

    // Reset block counts
    if (vehicle.blockCounts) {
        Object.keys(vehicle.blockCounts).forEach(key => {
            vehicle.blockCounts[key] = 0;
        });
    }
}

/**
 * ResourceManager class for managing all game resources
 */
export class ResourceManager {
    constructor() {
        this.resources = new Map();
    }

    /**
     * Register a resource for tracking
     * @param {string} id - Resource identifier
     * @param {Object} resource - Resource to track
     */
    register(id, resource) {
        this.resources.set(id, resource);
    }

    /**
     * Unregister and dispose a resource
     * @param {string} id - Resource identifier
     */
    unregister(id) {
        const resource = this.resources.get(id);
        if (resource) {
            if (resource.dispose) {
                resource.dispose();
            } else {
                disposeObject(resource);
            }
            this.resources.delete(id);
        }
    }

    /**
     * Dispose all tracked resources
     */
    disposeAll() {
        this.resources.forEach((resource, id) => {
            this.unregister(id);
        });
        this.resources.clear();
    }

    /**
     * Get a resource by ID
     * @param {string} id - Resource identifier
     * @returns {Object} The resource
     */
    get(id) {
        return this.resources.get(id);
    }
}