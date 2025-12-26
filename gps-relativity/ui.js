/**
 * @fileoverview High-End EventLoop Lab UI - Suraj Hamal
 */

export function createUI(callbacks) {
    const sharedGlassStyle = `
        backdrop-filter: blur(12px) saturate(180%);
        background: rgba(15, 15, 20, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        font-family: 'Inter', system-ui, sans-serif;
        color: #ffffff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    // 1. LEFT CONTAINER: Main Panel
    const dataContainer = document.createElement('div');
    dataContainer.style.cssText = `
        position: absolute; top: 30px; left: 30px;
        padding: 24px; min-width: 300px; z-index: 1000;
        pointer-events: auto; ${sharedGlassStyle}
    `;
    document.body.appendChild(dataContainer);

    const statsDisplay = document.createElement('div');
    dataContainer.appendChild(statsDisplay);

    // 2. RIGHT CONTAINER: Clock
    const clockOverlay = document.createElement('div');
    clockOverlay.style.cssText = `
        position: absolute; top: 30px; right: 30px;
        padding: 18px 24px; min-width: 240px; z-index: 1000;
        text-align: right; pointer-events: none; ${sharedGlassStyle}
    `;
    document.body.appendChild(clockOverlay);

    // 3. NAVIGATION CONSOLE
    const navPanel = document.createElement('div');
    navPanel.style.cssText = `margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 8px;`;
    dataContainer.appendChild(navPanel);

    const createModeBtn = (text, mode) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.cssText = `
            background: rgba(255, 255, 255, 0.05); color: #fff; border: none;
            padding: 12px; font-weight: 500; font-size: 11px; letter-spacing: 1px;
            cursor: pointer; border-radius: 8px; transition: all 0.3s ease;
            text-align: left; text-transform: uppercase;
        `;
        btn.onmouseover = () => btn.style.background = "rgba(255, 255, 255, 0.15)";
        btn.onmouseout = () => btn.style.background = "rgba(255, 255, 255, 0.05)";
        btn.onclick = () => callbacks.onModeChange(mode);
        navPanel.appendChild(btn);
    };

    ["SUN", "EARTH", "MOON", "SATELLITE"].forEach(m => createModeBtn(`View ${m}`, m));

    // 4. SPEED CONTROL
    const speedContainer = document.createElement('div');
    speedContainer.style.cssText = `
        position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
        padding: 15px 40px; min-width: 350px; text-align: center;
        z-index: 1000; pointer-events: auto; ${sharedGlassStyle}
    `;
    
    const speedLabel = document.createElement('div');
    speedLabel.style.cssText = `font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;`;
    
    const speedInput = document.createElement('input');
    speedInput.type = 'range'; speedInput.min = '1'; speedInput.max = '100000'; speedInput.value = '1000';
    speedInput.oninput = (e) => callbacks.onSpeedChange(parseFloat(e.target.value));

    speedContainer.appendChild(speedLabel);
    speedContainer.appendChild(speedInput);
    document.body.appendChild(speedContainer);

    return { statsDisplay, clockOverlay, speedLabel, callbacks };
}

export function updateUI(ui, satellites, simulatedTime, timeScale, focusTarget) {
    // A. Update Clock
    ui.clockOverlay.innerHTML = `
        <div style="font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); margin-bottom: 4px; letter-spacing: 1px;">MISSION TIME (UTC)</div>
        <div style="font-size: 18px; font-weight: 300;">${simulatedTime.toUTCString().replace('GMT', '')}</div>
    `;

    // B. Update Speed
    ui.speedLabel.innerText = `Temporal Scale: ${Math.floor(timeScale).toLocaleString()}x`;

    // C. Route to specific View
    if (focusTarget.type === 'SATELLITE') {
        renderSatelliteDetail(ui, satellites[focusTarget.index], focusTarget.index);
    } else if (focusTarget.type === 'EARTH') {
        renderEarthDetail(ui);
    } else if (focusTarget.type === 'MOON') {
        renderMoonDetail(ui);
    } else if (focusTarget.type === 'SUN') {
        renderSunDetail(ui);
    } else {
        renderFleetOverview(ui, satellites);
    }
}

// --- Specific View Renderers ---

function renderFleetOverview(ui, satellites) {
    let html = `<div style="font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); margin-bottom: 15px; letter-spacing: 1.5px; text-transform: uppercase;">Fleet Overview</div>`;
    
    satellites.forEach((sat, i) => {
        const drift = (sat.userData.satTime - sat.userData.earthTime) * 1e6;
        html += `
        <div onclick="window.dispatchEvent(new CustomEvent('selectGPS', {detail: ${i}}))" 
             style="display: flex; justify-content: space-between; margin-bottom: 6px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; transition: 0.2s;">
            <span style="font-size: 11px; font-weight: 600;">GPS UNIT ${i + 1}</span>
            <span style="font-size: 11px; color: #55ffaa; font-family: monospace;">+${drift.toFixed(3)} μs</span>
        </div>`;
    });
    // Global listener hack for the onclick above
    window.onSelectGPS_Internal = (i) => ui.callbacks.onSelectGPS(i);

    ui.statsDisplay.innerHTML = html;
}

function renderSatelliteDetail(ui, sat, index) {
    const data = sat.userData;
    const drift = (data.satTime - data.earthTime) * 1e6;

    ui.statsDisplay.innerHTML = `
        <button onclick="window.dispatchEvent(new CustomEvent('backToSystem'))" style="background:none; border:none; color:rgba(255,255,255,0.4); font-size:9px; cursor:pointer; padding:0; margin-bottom:10px;">← BACK TO SYSTEM</button>
        <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">GPS UNIT ${index + 1}</div>
        <div style="font-size: 10px; color: #55ffaa; margin-bottom: 20px;">STATE: ACTIVE RECKONING</div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
                <div style="font-size: 8px; color: #888;">VELOCITY</div>
                <div style="font-size: 13px;">3.87 <span style="font-size: 9px;">km/s</span></div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
                <div style="font-size: 8px; color: #888;">ALTITUDE</div>
                <div style="font-size: 13px;">20,200 <span style="font-size: 9px;">km</span></div>
            </div>
        </div>

        <div style="padding: 15px; background: rgba(85, 255, 170, 0.05); border: 1px solid rgba(85, 255, 170, 0.2); border-radius: 12px;">
            <div style="font-size: 9px; color: #55ffaa; margin-bottom: 5px; font-weight: 700;">RELATIVITY OFFSET</div>
            <div style="font-size: 22px; font-family: monospace; color: #55ffaa;">+${drift.toFixed(4)} μs</div>
        </div>
    `;
}

function renderEarthDetail(ui) {
    ui.statsDisplay.innerHTML = `
        <button onclick="window.dispatchEvent(new CustomEvent('backToSystem'))" style="background:none; border:none; color:rgba(255,255,255,0.4); font-size:9px; cursor:pointer; padding:0; margin-bottom:10px;">← BACK TO SYSTEM</button>
        <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">EARTH</div>
        <div style="font-size: 10px; color: #55aaff; margin-bottom: 20px;">HABITABLE ZONE TERRESTRIAL</div>

        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 10px;">
            <div style="font-size: 9px; color: #888; margin-bottom: 5px;">ATMOSPHERIC PRESSURE</div>
            <div style="font-size: 18px;">101.325 <span style="font-size: 11px;">kPa</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
            <div style="font-size: 9px; color: #888; margin-bottom: 5px;">ROTATIONAL VELOCITY</div>
            <div style="font-size: 18px;">1,670 <span style="font-size: 11px;">km/h</span></div>
        </div>
    `;
}

function renderMoonDetail(ui) {
    ui.statsDisplay.innerHTML = `
        <button onclick="window.dispatchEvent(new CustomEvent('backToSystem'))" style="background:none; border:none; color:rgba(255,255,255,0.4); font-size:9px; cursor:pointer; padding:0; margin-bottom:10px;">← BACK TO SYSTEM</button>
        <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">LUNA (MOON)</div>
        <div style="font-size: 10px; color: #aaa; margin-bottom: 20px;">TIDALLY LOCKED SATELLITE</div>

        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 10px;">
            <div style="font-size: 9px; color: #888; margin-bottom: 5px;">SURFACE GRAVITY</div>
            <div style="font-size: 18px;">1.62 <span style="font-size: 11px;">m/s²</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
            <div style="font-size: 9px; color: #888; margin-bottom: 5px;">DISTANCE FROM EARTH</div>
            <div style="font-size: 18px;">384,400 <span style="font-size: 11px;">km</span></div>
        </div>
    `;
}

function renderSunDetail(ui) {
    ui.statsDisplay.innerHTML = `
        <button onclick="window.dispatchEvent(new CustomEvent('backToSystem'))" style="background:none; border:none; color:rgba(255,255,255,0.4); font-size:9px; cursor:pointer; padding:0; margin-bottom:10px;">← BACK TO SYSTEM</button>
        <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">THE SUN</div>
        <div style="font-size: 10px; color: #ffaa00; margin-bottom: 20px;">G-TYPE MAIN-SEQUENCE STAR</div>

        <div style="background: rgba(255, 200, 0, 0.05); border: 1px solid rgba(255, 200, 0, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 10px;">
            <div style="font-size: 9px; color: #ffaa00; margin-bottom: 5px;">CORE TEMPERATURE</div>
            <div style="font-size: 18px;">15.7 Million <span style="font-size: 11px;">K</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
            <div style="font-size: 9px; color: #888; margin-bottom: 5px;">MASS</div>
            <div style="font-size: 18px;">1.989 × 10³⁰ <span style="font-size: 11px;">kg</span></div>
        </div>
    `;
}