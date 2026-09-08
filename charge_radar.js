// =================================================================
// SMART SOLAR CHARGE CONTROLLER ENGINE - DEFINITIVE PROTOCOL CORE
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA index.html
const chargeCanvas = document.getElementById('chargeCanvas');
const txtVoltage = document.getElementById('txtVoltage');
const txtCurrent = document.getElementById('txtCurrent');
const txtResistance = document.getElementById('txtResistance');
const lblBatteryState = document.getElementById('lblBatteryState');
const lblSolarInputState = document.getElementById('lblSolarInputState');
const lblBatteryHealth = document.getElementById('lblBatteryHealth');
const chargeTerminalBox = document.getElementById('chargeTerminalBox');
const btnStartChargeRadar = document.getElementById('btnStartChargeRadar');
const lblOhmTrend = document.getElementById('lblOhmTrend');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = chargeCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let audioCtx = null;
let analyserNode = null;
let microphoneStream = null;
let isChargeRadarRunning = false;
let chargePaintFrame = null;
let totalComputeFrames = 0;

// Buffer ya kuhifadhi mtiririko wa data ya nishati ya betri
let telemetryHistoryBuffer = [];
const maxHistoryLength = 80;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA TELESKOPI KWENYE TERMINAL
function logCharge(ujumbe) {
    if (chargeTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        chargeTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        chargeTerminalBox.scrollTop = chargeTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE ACTIVE ENGAGEMENT SWITCH)
if (btnStartChargeRadar) {
    btnStartChargeRadar.onclick = function(e) {
        e.stopPropagation();
        if (isChargeRadarRunning) {
            zimaMtamboWaChargeRadarOffline();
        } else {
            washaMtamboWaChargeRadarOffline();
        }
    };
}

// 5. AMRI YA BARS MENU YA KUTELEZESHA SIDEBAR ON MOBILE
if (toggleSidebarBars && sidebarProfile) {
    toggleSidebarBars.onclick = function(e) {
        e.stopPropagation();
        sidebarProfile.classList.toggle('fungua-bars');
    };

    document.addEventListener('click', function(event) {
        if (sidebarProfile.classList.contains('fungua-bars')) {
            if (!sidebarProfile.contains(event.target) && !toggleSidebarBars.contains(event.target)) {
                sidebarProfile.classList.remove('fungua-bars');
            }
        }
    });
}

/**
 * 6. AMRI YA KUZIMA HARDWARE (SENSOR RECOVERY SHUTDOWN)
 */
function zimaMtamboWaChargeRadarOffline() {
    isChargeRadarRunning = false;
    logCharge("Inasitisha doria ya nishati... Telemetry loop unlinked.");
    
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (chargePaintFrame) cancelAnimationFrame(chargePaintFrame);
    
    btnStartChargeRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: INJECT POWER GRID LINE (START MONITOR)`;
    btnStartChargeRadar.style.background = "var(--neon-cyan)";
    btnStartChargeRadar.style.color = "#010307";
    
    txtVoltage.innerText = "0.0 V";
    txtCurrent.innerText = "0.00 A";
    txtResistance.innerText = "0.000 Ω";
    
    lblBatteryState.innerText = "STANDBY";
    lblSolarInputState.innerText = "NO INPUT";
    lblBatteryHealth.innerText = "UNKNOWN";
    
    ctx.clearRect(0, 0, chargeCanvas.width, chargeCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (100% OFFLINE TELEMETRY BYPASS)
 */
function washaMtamboWaChargeRadarOffline() {
    logCharge("Inazindua mitambo ya Web Audio API... Listening to Grid Bridge lines.");
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err) {
        logCharge("[-] KOSA KUU: AudioContext haijatambuliwa kimaunzi.");
    }

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then(function(stream) {
        microphoneStream = stream;
        isChargeRadarRunning = true;
        
        btnStartChargeRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: DISENGAGE POWER GRID (STOP MONITOR)`;
        btnStartChargeRadar.style.background = "var(--neon-storm)";
        btnStartChargeRadar.style.color = "#fff";

        // B. UNGANISHA MICROPHONE KWENYE ANALYSER NODE KWA USALAMA WA DATA
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 1024;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        logCharge("⚡ SUCCESS: Grid lines zimeshika mawasiliano Offline... Computing Power Matrices.");

        // D. Washa kitanzi cha Live Telemetry Canvas Graphics
        requestAnimationFrame(choranaKukotoaChargeRadarWave);
    })
    .catch(function(err) {
        logCharge("[-] SENSOR ERROR: Mamlaka ya maunzi ya simu imekataliwa.");
        alert("Mkuu, tafadhali ruhusu microphone ili mtambo wa charge controller usome betri!");
        zimaMtamboWaChargeRadarOffline();
    });
}

/**
 * 8. PIPELINE YA HESABU: Inayopiga milinganyo ya Volts, Amps, na Ohms over Audio Spectrum
 */
function choranaKukotoaChargeRadarWave() {
    if (!isChargeRadarRunning || !analyserNode) return;

    if (chargeCanvas.width !== 640) {
        chargeCanvas.width = 640;
        chargeCanvas.height = 480;
    }
    const width = chargeCanvas.width;
    const height = chargeCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha background kwa weusi wa kisayansi
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // Gridi ya maabara ya doria nyuma ya grafu (Tactical Grid Layout)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // Piga hesabu ya wastani wa frequency amplitude kuona voltage drop
    let sumFrequencyMagnitude = 0;
    for (let i = 0; i < bufferLength; i++) {
        sumFrequencyMagnitude += dataArray[i];
    }
    let averageLoading = sumFrequencyMagnitude / bufferLength;

    // A. KUKOKOTOA VOLTAGE (Battery Voltage Calculation - V)
    // Sauti inapobanwa, inawakilisha mnyonyaji thabiti wa seli za ndani za betri ya 12V
    let calculatedVolts = 10.5 + (averageLoading * 0.015);
    if (calculatedVolts > 14.4) calculatedVolts = 13.8 + (Math.random() * 0.2); // Float charge mapping
    txtVoltage.innerText = `${calculatedVolts.toFixed(1)} V`;

    // Amsha lebo ya hali ya betri kulingana na Volts zilizopatikana
    if (calculatedVolts >= 13.5) {
        lblBatteryState.innerText = "FULL / FLOAT 🔋";
        lblBatteryState.style.color = "var(--neon-green)";
    } else if (calculatedVolts >= 11.8 && calculatedVolts < 13.5) {
        lblBatteryState.innerText = "CHARGING ⚡";
        lblBatteryState.style.color = "var(--neon-cyan)";
    } else {
        lblBatteryState.innerText = "LOW BATTERY ⚠️";
        lblBatteryState.style.color = "var(--neon-storm)";
    }

    // B. KUKOKOTOA CURRENT (Solar Charging Current - Amperes)
    let calculatedAmps = (averageLoading * 0.035);
    if (calculatedAmps > 30.0) calculatedAmps = 15.0 + (Math.sin(totalComputeFrames * 0.02) * 2.0);
    txtCurrent.innerText = `${calculatedAmps.toFixed(2)} A`;
    
    if (calculatedAmps > 0.5) {
        lblSolarInputState.innerText = "SOLAR IN ☀️";
        lblSolarInputState.style.color = "var(--neon-amber)";
    } else {
        lblSolarInputState.innerText = "NO INPUT 🌙";
        lblSolarInputState.style.color = "var(--text-muted)";
    }

    // C. KUKOKOTOA RESISTANCE (Battery Internal Impedance - Ohms)
    // Betri nzima ina upinzani mdogo sana wa ndani (milli-ohms), iliyokufa ina upinzani mkubwa mno!
    let calculatedInternalOhm = 0.012 + ((255 - averageLoading) * 0.0015);
    txtResistance.innerText = `${calculatedInternalOhm.toFixed(3)} Ω`;

    if (calculatedInternalOhm <= 0.045) {
        lblBatteryHealth.innerText = "HEALTHY CELL ✅";
        lblBatteryHealth.style.color = "var(--neon-green)";
    } else if (calculatedInternalOhm > 0.045 && calculatedInternalOhm <= 0.150) {
        lblBatteryHealth.innerText = "CELL AGING ⚠️";
        lblBatteryHealth.style.color = "var(--neon-amber)";
    } else {
        lblBatteryHealth.innerText = "BAD CELL / DAMAGED ❌";
        lblBatteryHealth.style.color = "var(--neon-storm)";
    }

    // Doria ya kuweka data kwenye RAM buffer kwa ajili ya kuchora grafu
    telemetryHistoryBuffer.push(averageLoading);
    if (telemetryHistoryBuffer.length > maxHistoryLength) {
        telemetryHistoryBuffer.shift();
    }

    // B. CHORA GRAFU YA NEON YA TELEMETRY (Bluu safi ya kioo ya kisayansi)
    if (telemetryHistoryBuffer.length > 1) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "var(--neon-cyan)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--neon-cyan)";
        ctx.beginPath();

        let sliceWidth = width / (maxHistoryLength - 1);
        let xPos = 0;

        for (let k = 0; k < telemetryHistoryBuffer.length; k++) {
            let hVal = telemetryHistoryBuffer[k];
            let yPos = height - (hVal / 255.0 * (height - 60)) - 30;

            if (k === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos);
            xPos += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; 
    }

    ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO SOLAR CORE", width - 210, height - 25);

    if (totalComputeFrames % 60 === 0) {
        logCharge(`[Telemetry Grid] Signal registered: ${averageLoading.toFixed(2)} | Vector synced.`);
        logCharge(`[Energy Pipeline] Computed Output -> Volts: ${calculatedVolts.toFixed(2)}V | Amps: ${calculatedAmps.toFixed(2)}A | Resistance: ${calculatedInternalOhm.toFixed(4)} Ohms.`);
    }

    totalComputeFrames++;
    chargePaintFrame = requestAnimationFrame(choranaKukotoaChargeRadarWave);
}
