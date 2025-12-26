/**
 * @fileoverview Main Orchestration Engine - EventLoop Lab
 * @author Suraj Hamal, Computer Scientist
 */

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js?module';
import * as PHYSICS from './physics.js'; 
import { createSpace } from './space.js';
import { createSun } from './celestial/sun.js';
import { createEarthSystem } from './celestial/earth.js';
import { createMoon } from './celestial/moon.js';
import { createSatellites, updateSatellites } from './entities/satellite.js';
import { createUI, updateUI } from './ui.js';
import { initCameraControls, updateCameraLimits } from './camera.js';

// --- Global State ---
let simulatedTime = new Date(); 
let timeScale = 1000; 
let trackingMode = 'EARTH'; 
// focusTarget tracks what the UI is currently "detailed" on
let focusTarget = { type: 'SYSTEM', index: null }; 
let activeSatIndex = 0; 
const clock = new THREE.Clock();

// --- Helper Functions ---
function createOrbitPath(radius, color = 0xffffff) {
    const points = [];
    const segments = 256; 
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.3 });
    return new THREE.Line(geometry, material);
}

// --- Scene Initialization ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000000);
camera.position.set(15400, 100, 500); 

const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.0;

const controls = initCameraControls(camera, renderer.domElement);
const textureLoader = new THREE.TextureLoader();

// --- System Initialization ---
createSpace(scene);

const sun = createSun();
scene.add(sun); 
const sunLight = new THREE.PointLight(0xffffff, 5, 0, 0); 
scene.add(sunLight);

const earthOrbitPivot = new THREE.Group();
scene.add(earthOrbitPivot);
scene.add(createOrbitPath(15000, 0xffff00)); 

const { group: earthGroup, earth, clouds } = createEarthSystem(textureLoader);
earthGroup.position.set(15000, 0, 0); 
earthGroup.rotation.z = PHYSICS.AXIAL_TILT_RADIANS;
earthOrbitPivot.add(earthGroup);

const moonMesh = createMoon(textureLoader);
const moonOrbitPivot = new THREE.Group();
moonOrbitPivot.rotation.z = PHYSICS.MOON_INCLINATION_RADIANS; 
moonOrbitPivot.add(createOrbitPath(PHYSICS.MOON_DISTANCE_UNITS, 0xffffff));
moonMesh.position.set(PHYSICS.MOON_DISTANCE_UNITS, 0, 0);
moonMesh.rotation.y = Math.PI / 2; 
moonOrbitPivot.add(moonMesh);
earthGroup.add(moonOrbitPivot);

for (let i = 0; i < 6; i++) {
    const gpsPivot = new THREE.Group();
    gpsPivot.rotation.z = 0.96; 
    gpsPivot.rotation.y = (i * Math.PI) / 3; 
    gpsPivot.add(createOrbitPath(415, 0x00ffff));
    earthGroup.add(gpsPivot);
}

const satellites = createSatellites(earthGroup, textureLoader);

// --- UI Interaction Logic ---
const uiContainer = createUI({
    // Triggered when a specific GPS unit is clicked in the list
    onSelectGPS: (index) => {
        focusTarget = { type: 'SATELLITE', index: index };
        trackingMode = 'SATELLITE';
        activeSatIndex = index;
        updateCameraLimits(controls, 'SATELLITE');

        const targetSat = satellites[index];
        const satWorldPos = new THREE.Vector3();
        targetSat.getWorldPosition(satWorldPos);

        controls.target.copy(satWorldPos);
        camera.position.set(satWorldPos.x + 20, satWorldPos.y + 10, satWorldPos.z + 20);
        controls.update();
    },
    // Triggered for Earth, Moon, Sun
    onModeChange: (mode) => {
        focusTarget = { type: mode, index: null };
        trackingMode = mode;
        updateCameraLimits(controls, mode);
        
        if (mode === 'SATELLITE') {
            // Default to first satellite if clicking generic "SATELLITE" mode
            focusTarget = { type: 'SATELLITE', index: 0 };
            activeSatIndex = 0;
        }
    },
    onSpeedChange: (val) => { timeScale = val; },
    onReset: () => { simulatedTime = new Date(); }
});

/**
 * BRIDGE: Listen for Custom Events from the UI
 * This allows the HTML buttons inside the glass panels to talk back to Three.js
 */
window.addEventListener('selectGPS', (e) => {
    // e.detail is the index of the satellite (0, 1, 2...)
    uiContainer.callbacks.onSelectGPS(e.detail);
});

window.addEventListener('backToSystem', () => {
    focusTarget = { type: 'SYSTEM', index: null };
    trackingMode = 'EARTH';
    updateCameraLimits(controls, 'EARTH');
});

// --- Main Simulation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    const realDt = clock.getDelta();
    const scaledDt = realDt * timeScale; 
    simulatedTime = new Date(simulatedTime.getTime() + (scaledDt * 1000));

    // Orbital Mechanics
    earthOrbitPivot.rotation.y += (PHYSICS.EARTH_ORBIT_SPEED || 0.0000002) * scaledDt;
    if (earth) earth.rotation.y += PHYSICS.EARTH_ROTATION_SPEED * scaledDt;
    if (clouds) clouds.rotation.y += (PHYSICS.EARTH_ROTATION_SPEED * 1.05) * scaledDt;

    if (moonOrbitPivot && moonMesh) {
        moonOrbitPivot.rotation.y += PHYSICS.MOON_ORBIT_SPEED * scaledDt;
    }

    // Camera Tracking Logic
    const targetPos = new THREE.Vector3();
    if (trackingMode === 'SATELLITE' && satellites.length > 0) {
        satellites[activeSatIndex].getWorldPosition(targetPos);
    } else if (trackingMode === 'MOON' && moonMesh) {
        moonMesh.getWorldPosition(targetPos);
    } else if (trackingMode === 'SUN') {
        targetPos.set(0, 0, 0);
    } else {
        earth.getWorldPosition(targetPos);
    }

    const followSpeed = (trackingMode === 'SATELLITE') ? 0.4 : 0.1;
    controls.target.lerp(targetPos, followSpeed);

    // Update Systems
    updateSatellites(satellites, scaledDt, camera); // Pass camera for 3D labels
    updateUI(uiContainer, satellites, simulatedTime, timeScale, focusTarget);

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});