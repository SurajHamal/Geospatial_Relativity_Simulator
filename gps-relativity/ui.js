/**
 * @fileoverview State-Based HUD with Scientific & Engineering Annotations
 * Author: Suraj Hamal
 *
 * This module provides a lightweight heads-up display for focused object tracking.
 * Design Principles:
 * - Event-driven: decouples UI from simulation loop for performance.
 * - Minimalist: only shows Focus Bar and Time Dilation control.
 * - Scientific context: shows the effect of scaled time to simulate relativistic drift.
 */

export function createUI(callbacks) {
    // --------------------------
    // Global CSS Styles for HUD
    // --------------------------
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        :root {
            --neon: #00f2ff;
            --panel-bg: rgba(10, 10, 15, 0.8);
            --blur: blur(20px) saturate(180%);
        }

        .hud-base {
            position: fixed; /* Always overlay on top of 3D canvas */
            z-index: 1000;
            font-family: 'Inter', sans-serif;
            color: white;
            transition: all 0.4s ease;
        }

        .focus-bar {
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 30px;
            background: var(--panel-bg);
            backdrop-filter: var(--blur);
            border: 1px solid var(--neon);
            border-radius: 100px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 0 30px rgba(0, 242, 255, 0.15);
        }

        .exit-btn {
            background: var(--neon);
            color: #000;
            border: none;
            padding: 6px 16px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 10px;
            cursor: pointer;
            text-transform: uppercase;
        }

        .hidden { 
            opacity: 0; 
            pointer-events: none; 
            transform: translate(-50%, 20px); 
        }

        .earth-clock {
            top: 20px;
            right: 20px;
            background: rgba(10,10,15,0.8);
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 12px;
            color: var(--neon);
            text-align: center;
            pointer-events: none;
        }
    `;
    document.head.appendChild(styleSheet);

    // --------------------------
    // HUD Elements
    // --------------------------
    const focusBar = document.createElement('div');
    focusBar.className = 'hud-base focus-bar hidden';
    focusBar.innerHTML = `
        <span id="focus-label" style="font-size: 11px; letter-spacing: 2px; font-weight: 600;">TRACKING SYSTEM</span>
        <button class="exit-btn">Return to Earth</button>
    `;
    focusBar.querySelector('button').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('backToSystem'));
    });
    
    // --- Time Dilation Slider & Simulated Time UI ---
    const speedBox = document.createElement('div');
    speedBox.className = 'hud-base';
    speedBox.style.cssText = `bottom: 20px; left: 20px; pointer-events: auto; display: flex; flex-direction: column; gap: 4px;`;

    // Display current simulated time on top of the slider
    const timeDisplay = document.createElement('div');
    timeDisplay.style.cssText = "font-size: 10px; color: #00f2ff; letter-spacing: 1px;";
    timeDisplay.innerText = "Simulated Time: --:--:--";
    speedBox.appendChild(timeDisplay);

    // Slider itself
    const speedSliderContainer = document.createElement('div');
    speedSliderContainer.innerHTML = `
        <div style="font-size: 9px; opacity: 0.5; margin-bottom: 2px; letter-spacing: 1px;">
            TIME DILATION
        </div>
        <input type="range" id="global-speed" min="1" max="100000" value="1000" style="width:150px">
    `;
    speedBox.appendChild(speedSliderContainer);

    // Real-Time Earth Clock
    const earthClock = document.createElement('div');
    earthClock.className = 'hud-base earth-clock';
    earthClock.innerText = "🌍 Earth Time: Loading...";

    // Append elements to the DOM
    document.body.append(focusBar, speedBox, earthClock);

    // --------------------------
    // Bind Slider Callback
    // --------------------------
    const speedInput = document.getElementById('global-speed');
    speedInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        window.timeScale = val;
    });

    // --- Real-Time Clock Update ---
    setInterval(() => {
        const now = new Date();
        const formatted = now.getFullYear() + '-' +
                          String(now.getMonth()+1).padStart(2,'0') + '-' +
                          String(now.getDate()).padStart(2,'0') + ' ' +
                          String(now.getHours()).padStart(2,'0') + ':' +
                          String(now.getMinutes()).padStart(2,'0') + ':' +
                          String(now.getSeconds()).padStart(2,'0');
        earthClock.innerText = `🌍 Earth Time: ${formatted}`;
    }, 1000);

    // --------------------------
    // Function to update simulated time in UI
    // --------------------------
    function updateSimulatedTime(simTime) {
        timeDisplay.innerText = "Simulated Time: " + simTime.toLocaleString();
    }

    // --------------------------
    // Return UI elements for animate loop
    // --------------------------
    return { focusBar, callbacks, earthClock, updateSimulatedTime };
}

// --------------------------
// Updates the HUD based on simulation focus
// --------------------------
export function updateUI(ui, satellites, simulatedTime, timeScale, focusTarget) {
    const isFocusMode = (focusTarget.type !== 'SYSTEM' && focusTarget.type !== 'EARTH');

    if (isFocusMode) {
        ui.focusBar.classList.remove('hidden');
        const label = focusTarget.type === 'SATELLITE' 
            ? satellites[focusTarget.index]?.userData.id
            : focusTarget.type;
        document.getElementById('focus-label').innerText = `TRACKING: ${label}`;
    } else {
        ui.focusBar.classList.add('hidden');
    }
}
