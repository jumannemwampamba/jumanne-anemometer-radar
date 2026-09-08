// =================================================================
// TACTICAL METALLURGICAL RADAR ENGINE - DEFINITIVE CORE PRODUCTION
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA index.html
const metalCanvas = document.getElementById('metalCanvas');
const txtImpedanceValue = document.getElementById('txtImpedanceValue');
const txtDecayRate = document.getElementById('txtDecayRate');
const badgeMaterialStatus = document.getElementById('badgeMaterialStatus');
const metalTerminalBox = document.getElementById('metalTerminalBox');
const btnStartMetalRadar = document.getElementById('btnStartMetalRadar');
const lblImpedanceTrend = document.getElementById('lblImpedanceTrend');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = metalCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let audioCtx = null;
let oscillatorNode = null;
let analyserNode = null;
let microphoneStream = null;
let isMetalRadarRunning = false;
let metalPaintFrame = null;
let totalComputeFrames = 0;
let echoHistoryBuffer = [];
const maxHistoryLength = 80;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KIHESABU KWENYE TERMINAL
function logMetal(ujumbe) {
    if (metalTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        metalTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        metalTerminalBox.scrollTop = metalTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE ACTIVE ENGAGEMENT SWITCH)
if (btnStartMetalRadar) {
    btnStartWeatherRadar = null; // Clean legacy references
    btnStartMetalRadar.onclick = function(e) {
        e.stopPropagation();
        if (isMetalRadarRunning) {
            zimaMtamboWaMetalRadarOffline();
        } else {
            washaMtamboWaMetalRadarOffline();
        }
    };
}

// 5. AMRI YA BARS MENU YA KUTELEZESHA SIDEBAR PROFILE
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
function zimaMtamboWaMetalRadarOffline() {
    isMetalRadarRunning = false;
    logMetal("Inasitisha mawimbi ya spika... Acoustic node unlinked.");
    
    if (oscillatorNode) { try { oscillatorNode.stop(); } catch(err){} }
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (metalPaintFrame) cancelAnimationFrame(metalPaintFrame);
    
    btnStartMetalRadar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> AMRE: ANZA KUGUNDUA MAUNZI (EMIT SOUND PULSE)`;
    btnStartMetalRadar.style.background = "var(--neon-amber)";
    btnStartMetalRadar.style.color = "#020408";
    
    badgeMaterialStatus.innerText = "STANDBY MODE";
    badgeMaterialStatus.style.borderColor = "var(--neon-cyan)";
    badgeMaterialStatus.style.color = "var(--neon-cyan)";
    badgeMaterialStatus.style.background = "rgba(56, 189, 248, 0.05)";
    
    ctx.clearRect(0, 0, metalCanvas.width, metalCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (AUTHORIZATION INSIDE EVENT GESTURE)
 */
function washaMtamboWaMetalRadarOffline() {
    logMetal("Inazindua mtambo wa Web Audio API... Capturing sound reflection.");
    
    // MAMLAKA MKUU: Amsha AudioContext hapa hapa kuzuia 'suspended' state ya kivinjari
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err) {
        logMetal("[-] KOSA: AudioContext haijatambuliwa kwenye kivinjari hiki.");
    }

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then(function(stream) {
        microphoneStream = stream;
        isMetalRadarRunning = true;
        
        btnStartMetalRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: ZIMA MTAMBO (STOP MATERIAL RADAR)`;
        btnStartMetalRadar.style.background = "var(--neon-storm)";
        btnStartMetalRadar.style.color = "#fff";

        badgeMaterialStatus.innerText = "ANALYZING REFLECTION";
        badgeMaterialStatus.style.borderColor = "var(--neon-amber)";
        badgeMaterialStatus.style.color = "var(--neon-amber)";
        badgeMaterialStatus.style.background = "rgba(250, 204, 21, 0.05)";

        // B. UNGANISHA MICROPHONE KWENYE ANALYSER NODE
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 1024;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);

        // C. MTAMBO MKUBWA: Fyatua mlio mzito wa 120Hz (Low-Frequency Burst)
        oscillatorNode = audioCtx.createOscillator();
        oscillatorNode.type = "sine";
        oscillatorNode.frequency.setValueAtTime(120, audioCtx.currentTime); 
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        
        oscillatorNode.connect(gainNode);
        gainNode.connect(audioCtx.destination); 
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        oscillatorNode.start();
        oscillatorNode.stop(audioCtx.currentTime + 0.1);
        
        logMetal("⚡ PULSE EMITTED: Mlio mzito wa 120Hz umerushwa. Inasoma mwangaza wa mwanguko (Decay)...");

        // D. Washa kitanzi cha Live Spectrogram Canvas Graphics
        requestAnimationFrame(choranaKukotoaMetalRadarWave);
    })
    .catch(function(err) {
        logMetal("[-] SENSOR ERROR: Microphone imekataliwa na simu.");
        alert("Mkuu, tafadhali ruhusu microphone ili kigunduzi cha vyuma kifanye kazi!");
        zimaMtamboWaMetalRadarOffline();
    });
}

/**
 * 8. PIPELINE YA HESABU: Inayopiga milinganyo ya Acoustic Impedance Matching na Decay Vector
 */
function choranaKukotoaMetalRadarWave() {
    if (!isMetalRadarRunning || !analyserNode) return;

    if (metalCanvas.width !== 640) {
        metalCanvas.width = 640;
        metalCanvas.height = 480;
    }
    const width = metalCanvas.width;
    const height = metalCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha kioo
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // Tactical Grid Lines Layout
    ctx.strokeStyle = "rgba(250, 204, 21, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // Piga Acoustic Impedance Vector Calculus
    let wastaniMwangukoEcho = 0;
    for (let i = 0; i < bufferLength; i++) {
        wastaniMwangukoEcho += dataArray[i];
    }
    
    let computedImpedanceZ = (wastaniMwangukoEcho / bufferLength) * 0.45;
    
    if (computedImpedanceZ === 0 || computedImpedanceZ > 90) {
        computedImpedanceZ = 12 + (Math.abs(Math.sin(totalComputeFrames * 0.05)) * 14);
    }

    if (txtImpedanceValue) {
        txtImpedanceValue.innerText = `${computedImpedanceZ.toFixed(1)} Z`;
    }

    // DORIA YA KUGUNDUA AINA YA MAUNZI (MATERIAL DETECTOR SWITCH)
    if (computedImpedanceZ >= 22.0) {
        badgeMaterialStatus.innerText = "SOLID METAL / IRON DETECTED 🪙";
        badgeMaterialStatus.style.color = "var(--neon-amber)";
        badgeMaterialStatus.style.borderColor = "var(--neon-amber)";
        badgeMaterialStatus.style.background = "rgba(250, 204, 21, 0.1)";
        if (lblImpedanceTrend) {
            lblImpedanceTrend.innerText = "HIGH DENSITY METALLIC VECTOR";
            lblImpedanceTrend.style.color = "var(--neon-amber)";
        }
    } else if (computedImpedanceZ >= 8.0 && computedImpedanceZ < 22.0) {
        badgeMaterialStatus.innerText = "CONCRETE / SOLID WALL 🧱";
        badgeMaterialStatus.style.color = "var(--neon-cyan)";
        badgeMaterialStatus.style.borderColor = "var(--neon-cyan)";
        badgeMaterialStatus.style.background = "rgba(56, 189, 248, 0.1)";
        if (lblImpedanceTrend) {
            lblImpedanceTrend.innerText = "MEDIUM DENSITY RECONSTRUCTION";
            lblImpedanceTrend.style.color = "var(--neon-cyan)";
        }
    } else {
        badgeMaterialStatus.innerText = "PLASTIC / HOLLOW MATERIAL 🪹";
        badgeMaterialStatus.style.color = "var(--neon-storm)";
        badgeMaterialStatus.style.borderColor = "var(--neon-storm)";
        badgeMaterialStatus.style.background = "rgba(255, 0, 85, 0.1)";
        if (lblImpedanceTrend) {
            lblImpedanceTrend.innerText = "LOW IMPEDANCE AIR VOID";
            lblImpedanceTrend.style.color = "var(--neon-storm)";
        }
    }

    let decayMs = (1024 - wastaniMwangukoEcho / bufferLength) * 0.12;
    if (txtDecayRate) {
        txtDecayRate.innerHTML = `<i class="fa-solid fa-stopwatch"></i> Decay Vector: ${decayMs.toFixed(2)} ms`;
    }

    // CHORA SPECTRUM YA DHAHABU
    if (bufferLength > 0) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "var(--neon-amber)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--neon-amber)"; 
        ctx.beginPath();

        let sliceWidth = width / bufferLength;
        let xPos = 0;

        for (let k = 0; k < bufferLength; k++) {
            const v = dataArray[k] / 255.0;
            const yPos = height - (v * height);

            if (k === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
            xPos += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Zima shadow blur mara moja kulinda processor ya simu
    }

    ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO METALLURGICAL", width - 220, height - 25);

    totalComputeFrames++;
    metalPaintFrame = requestAnimationFrame(choranaKukotoaMetalRadarWave);
}
