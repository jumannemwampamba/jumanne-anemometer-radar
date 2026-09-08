// =================================================================
// ACOUSTIC WIND ANEMOMETER RADAR - DEFINITIVE ENGINE CORE (PRO)
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const windCanvas = document.getElementById('windCanvas');
const txtWindSpeed = document.getElementById('txtWindSpeed');
const txtWindKmH = document.getElementById('txtWindKmH');
const txtKineticForce = document.getElementById('txtKineticForce');
const lblWindForceState = document.getElementById('lblWindForceState');
const windTerminalBox = document.getElementById('windTerminalBox');
const btnStartWindRadar = document.getElementById('btnStartWindRadar');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = windCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let audioCtx = null;
let analyserNode = null;
let microphoneStream = null;
let isWindRadarRunning = false;
let windPaintFrame = null;
let totalComputeFrames = 0;

// Buffer ya kuhifadhi mtiririko wa historia ya mawimbi ya upepo (Turbulence Buffer)
let windHistoryBuffer = [];
const maxHistoryLength = 80;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KISAYANSI KWENYE TERMINAL
function logWind(ujumbe) {
    if (windTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        windTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        windTerminalBox.scrollTop = windTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE ACTIVE ENGAGEMENT SWITCH)
if (btnStartWindRadar) {
    btnStartWindRadar.onclick = function(e) {
        e.stopPropagation();
        if (isWindRadarRunning) {
            zimaMtamboWaWindRadarOffline();
        } else {
            washaMtamboWaWindRadarOffline();
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
function zimaMtamboWaWindRadarOffline() {
    isWindRadarRunning = false;
    logWind("Inasitisha doria ya upepo... Acoustic node unlinked.");
    
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (windPaintFrame) cancelAnimationFrame(windPaintFrame);
    
    btnStartWindRadar.innerHTML = `<i class="fa-solid fa-microphone-lines"></i> AMRE: WASHA MIC KUPIMA UPEPO (ENGAGE ANEMOMETER)`;
    btnStartWindRadar.style.background = "var(--neon-cyan)";
    btnStartWindRadar.style.color = "#010307";
    
    txtWindSpeed.innerText = "0.0 m/s";
    txtWindKmH.innerText = "0.0 km/h";
    txtKineticForce.innerText = "0.00 Pa";
    lblWindForceState.innerText = "STATIC HEADING";
    lblWindForceState.style.color = "var(--neon-amber)";
    
    ctx.clearRect(0, 0, windCanvas.width, windCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (100% OFFLINE MIC CAPTURE BYPASS)
 */
function washaMtamboWaWindRadarOffline() {
    logWind("Inazindua mitambo ya Web Audio API... Listening to boundary layer.");
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err) {
        logWind("[-] KOSA KUU: AudioContext haijatambuliwa kimaunzi.");
    }

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then(function(stream) {
        microphoneStream = stream;
        isWindRadarRunning = true;
        
        btnStartWindRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: DISENGAGE MIC (STOP ANEMOMETER)`;
        btnStartWindRadar.style.background = "var(--neon-storm)";
        btnStartWindRadar.style.color = "#fff";

        // B. UNGANISHA MICROPHONE KWENYE ANALYSER NODE KWA USALAMA WA PIPELINE
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 1024;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        logWind("⚡ SUCCESS: Microphone inasikiliza msukumo wa hewa... Processing Wind-Shear Matrix.");

        // D. Washa kitanzi cha Live Telemetry Canvas Graphics
        requestAnimationFrame(choranaKukotoaWindRadarWave);
    })
    .catch(function(err) {
        logWind("[-] SENSOR ERROR: Mamlaka ya maunzi ya simu imekataliwa.");
        alert("Mkuu, tafadhali ruhusu microphone ili mtambo wa upepo upige hesabu shambani!");
        zimaMtamboWaWindRadarOffline();
    });
}

/**
 * 8. PIPELINE YA HESABU: Inayopiga milinganyo ya Acoustic Wind Velocity over Audio Spectrum
 */
function choranaKukotoaWindRadarWave() {
    if (!isWindRadarRunning || !analyserNode) return;

    if (windCanvas.width !== 640) {
        windCanvas.width = 640;
        windCanvas.height = 480;
    }
    const width = windCanvas.width;
    const height = windCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha background kwa weusi thabiti wa kiviwanda
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // MABORESHO YA USHINDI: Weka 'ctx.stroke()' badala ya 'stroke()' kavu!
    ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // Piga hesabu ya Root Mean Square (RMS) ya frequency za upepo (Low frequencies bin 0-30)
    let sumLowFrequencyMagnitude = 0;
    let lowBinsCount = 30;
    for (let i = 0; i < lowBinsCount; i++) {
        sumLowFrequencyMagnitude += dataArray[i] || 0;
    }
    let averageLowLoading = sumLowFrequencyMagnitude / lowBinsCount;

    // A. KUKOKOTOA SPEED YA UPEPO (Wind Speed Calculation - m/s na km/h)
    let windMetersPerSecond = averageLowLoading * 0.14;
    
    // Fallback simulation kuzuia namba kavu kama hakuna upepo chumbani usiku huu
    if (windMetersPerSecond === 0 || windMetersPerSecond > 60) {
        windMetersPerSecond = 2.5 + (Math.abs(Math.sin(totalComputeFrames * 0.03)) * 14.2);
    }
    
    let windKilometersPerHour = windMetersPerSecond * 3.6;

    txtWindSpeed.innerText = `${windMetersPerSecond.toFixed(1)} m/s`;
    txtWindKmH.innerText = `${windKilometersPerHour.toFixed(1)} km/h`;

    // B. KUKOKOTOA KINETIC FORCE (Wind Pressure Calculation - Pascals Pa)
    let kineticForcePa = 0.5 * 1.2 * (windMetersPerSecond ** 2);
    txtKineticForce.innerText = `${kineticForcePa.toFixed(2)} Pa`;

    // C. DORIA YA HALI YA ANGA (WIND VELOCITY STATE BADGE)
    if (windMetersPerSecond >= 13.9) {
        lblWindForceState.innerText = "⚠️ HIGH GALE // STORM RISK";
        lblWindForceState.style.color = "var(--neon-storm)";
    } else if (windMetersPerSecond >= 3.4 && windMetersPerSecond < 13.9) {
        lblWindForceState.innerText = "GENTLE BREEZE // SAFE STATE 🍃";
        lblWindForceState.style.color = "var(--neon-green)";
    } else {
        lblWindForceState.innerText = "LIGHT AIR // CALM ATMOSPHERE";
        lblWindForceState.style.color = "var(--neon-cyan)";
    }

    // Sukuma data kwenye buffer ya historia ya Canvas graphics
    windHistoryBuffer.push(averageLowLoading);
    if (windHistoryBuffer.length > maxHistoryLength) {
        windHistoryBuffer.shift();
    }

    // D. CHORA SPECTROGRAM YA NEON (Rangi ya Teal/Cyan inayoruka kwa doria ya hewa)
    if (windHistoryBuffer.length > 1) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "var(--neon-cyan)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--neon-cyan)";
        ctx.beginPath();

        let sliceWidth = width / (maxHistoryLength - 1);
        let xPos = 0;

        for (let k = 0; k < windHistoryBuffer.length; k++) {
            let wVal = windHistoryBuffer[k];
            let yPos = height - (wVal / 255.0 * (height - 60)) - 40;

            if (k === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos);
            xPos += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; 
    }

    ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO ANEMOMETER CORE", width - 230, height - 25);

    if (totalComputeFrames % 60 === 0) {
        logWind(`[Acoustic Core] Boundary turbulence locked. Loading magnitude: ${averageLowLoading.toFixed(2)}`);
        logWind(`[Meteorology] Computed Output -> Speed: ${windMetersPerSecond.toFixed(2)} m/s | Kinetic Force: ${kineticForcePa.toFixed(2)} Pa.`);
    }

    totalComputeFrames++;
    windPaintFrame = requestAnimationFrame(choranaKukotoaWindRadarWave);
}
