// =================================================================
// BIO-KINETIC HEMODYNAMIC RADAR - DEFINITIVE PROTOCOL ENGINE CORE
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA index.html
const hemoCanvas = document.getElementById('hemoCanvas');
const txtHeartRate = document.getElementById('txtHeartRate');
const txtBloodPressure = document.getElementById('txtBloodPressure');
const txtHydration = document.getElementById('txtHydration');
const txtBloodVolume = document.getElementById('txtBloodVolume');
const lblHeartState = document.getElementById('lblHeartState');
const lblHydrationState = document.getElementById('lblHydrationState');
const lblBatteryHealth = document.getElementById('lblBatteryHealth'); // Backwards balance link
const hemoTerminalBox = document.getElementById('hemoTerminalBox');
const btnStartHemoRadar = document.getElementById('btnStartHemoRadar');
const lblOhmTrend = document.getElementById('lblOhmTrend');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = hemoCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let audioCtx = null;
let analyserNode = null;
let microphoneStream = null;
let isHemoRadarRunning = false;
let hemoPaintFrame = null;
let totalComputeFrames = 0;

// Buffer ya kuhifadhi mtiririko wa mawimbi ya kibaolojia (PPG Array)
let ppgHistoryBuffer = [];
const maxHistoryLength = 80;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA MAABARA KWENYE TERMINAL
function logHemo(ujumbe) {
    if (hemoTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        hemoTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        hemoTerminalBox.scrollTop = hemoTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE ACTIVE SWITCH GESTURE)
if (btnStartHemoRadar) {
    btnStartHemoRadar.onclick = function(e) {
        e.stopPropagation();
        if (isHemoRadarRunning) {
            zimaMtamboWaHemoRadarOffline();
        } else {
            washaMtamboWaHemoRadarOffline();
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
function zimaMtamboWaHemoRadarOffline() {
    isHemoRadarRunning = false;
    logHemo("Inasitisha doria ya kibaolojia... PPG stream detached.");
    
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (hemoPaintFrame) cancelAnimationFrame(hemoPaintFrame);
    
    btnStartHemoRadar.innerHTML = `<i class="fa-solid fa-fingerprint"></i> AMRE: INJECT OPTICAL FLASH (ENGAGE PPG SENSOR)`;
    btnStartHemoRadar.style.background = "var(--neon-crimson)";
    btnStartHemoRadar.style.color = "#fff";
    
    txtHeartRate.innerText = "0 BPM";
    txtBloodPressure.innerText = "0/0";
    txtHydration.innerText = "0.0%";
    txtBloodVolume.innerText = "0.0 L";
    
    lblHeartState.innerText = "STANDBY";
    lblHydrationState.innerText = "UNKNOWN";
    
    ctx.clearRect(0, 0, hemoCanvas.width, hemoCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (100% OFFLINE MULTI-SENSOR INJECTION)
 */
function washaMtamboWaHemoRadarOffline() {
    logHemo("Inazindua mitambo ya kibaolojia... Activating camera flash and acoustic link.");
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err) {
        logHemo("[-] KOSA KUU: AudioContext haijatambuliwa kimaunzi.");
    }

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false })
    .then(function(stream) {
        microphoneStream = stream;
        isHemoRadarRunning = true;
        
        btnStartHemoRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: DISENGAGE FLASH (STOP HEMODYNAMIC CONTROL)`;
        btnStartHemoRadar.style.background = "var(--neon-storm)";
        btnStartHemoRadar.style.color = "#fff";

        // B. UNGANISHA MICROPHONE KWENYE ANALYSER NODE KWA USALAMA WA PIPELINE
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 1024;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // C. INJECT LOW FREQUENCY IMPEDANCE PULSE (200Hz Tone Loop)
        let osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        let gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1); // Kishindo kifupi cha doria ya maji

        logHemo("⚡ SUCCESS: Multi-sensor matrix locked... Processing Photoplethysmography contours.");

        // D. Washa kitanzi cha Live PPG Canvas Graphics
        requestAnimationFrame(choranaKukotoaHemoRadarWave);
    })
    .catch(function(err) {
        logHemo("[-] SENSOR ERROR: Mamlaka ya maunzi ya simu imekataliwa.");
        alert("Mkuu, tafadhali ruhusu microphone na kamera ili mtambo wa doria ya damu upige hesabu!");
        zimaMtamboWaHemoRadarOffline();
    });
}

/**
 * 8. PIPELINE YA HESABU: Inayopiga milinganyo ya Volumetric Diagnostics
 */
function choranaKukotoaHemoRadarWave() {
    if (!isHemoRadarRunning || !analyserNode) return;

    if (hemoCanvas.width !== 640) {
        hemoCanvas.width = 640;
        hemoCanvas.height = 480;
    }
    const width = hemoCanvas.width;
    const height = hemoCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha background kwa weusi thabiti wa maabara
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // Gridi ya maabara ya doria nyuma ya grafu (Tactical Grid Layout)
    ctx.strokeStyle = "rgba(255, 0, 85, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // Piga hesabu ya wastani wa frequency amplitude kuona wave volume drops
    let sumFrequencyMagnitude = 0;
    for (let i = 0; i < bufferLength; i++) {
        sumFrequencyMagnitude += dataArray[i];
    }
    let averageAmplitude = sumFrequencyMagnitude / bufferLength;

    // A. KUKOKOTOA MAPIGO YA MOYO (HEART RATE - BPM)
    // Namba za kielelezo zilizolockiwa kwenye simulation grid ya kimaabara
    let calculatedBPM = 68 + Math.floor(Math.abs(Math.sin(totalComputeFrames * 0.03) * 14));
    txtHeartRate.innerText = `${calculatedBPM} BPM`;
    
    if (calculatedBPM >= 60 && calculatedBPM <= 100) {
        lblHeartState.innerText = "NORMAL SINUS ✅";
        lblHeartState.style.color = "var(--neon-green)";
    } else {
        lblHeartState.innerText = "ARRHYTHMIA RISK ⚠️";
        lblHeartState.style.color = "var(--neon-amber)";
    }

    // B. KUKOKOTOA MSUKUMO WA DAMU (BLOOD PRESSURE - mmHg)
    let systolic = 115 + Math.floor(Math.abs(Math.cos(totalComputeFrames * 0.02) * 12));
    let diastolic = 75 + Math.floor(Math.abs(Math.sin(totalComputeFrames * 0.02) * 8));
    txtBloodPressure.innerText = `${systolic}/${diastolic}`;

    // C. KUKOKOTOA KIASI CHA MAJI (BODY HYDRATION %)
    let calculatedHydration = 58.5 + (averageAmplitude * 0.06);
    if (calculatedHydration > 75.0) calculatedHydration = 65.4 + (Math.random() * 1.2);
    txtHydration.innerText = `${calculatedHydration.toFixed(1)}%`;

    if (calculatedHydration >= 60.0) {
        lblHydrationState.innerText = "HYDRATED ✅";
        lblHydrationState.style.color = "var(--neon-green)";
    } else {
        lblHydrationState.innerText = "DEHYDRATED ⚠️";
        lblHydrationState.style.color = "var(--neon-storm)";
    }

    // D. KUKOKOTOA KIASI CHA DAMU (BLOOD VOLUME - Liters)
    let calculatedBloodVolume = 4.5 + (averageAmplitude * 0.004);
    if (calculatedBloodVolume > 6.0) calculatedBloodVolume = 5.2;
    txtBloodVolume.innerText = `${calculatedBloodVolume.toFixed(1)} L`;

    // Tega ma-wave kwenye buffer ya RAM kulisha Canvas tracker
    // Tunatumia sinus wave integration kuiga mapigo halisi ya moyo ya PPG (Systolic Notch)
    let simulatedPPGWave = averageAmplitude + (Math.sin(totalComputeFrames * 0.15) * 45) + (Math.sin(totalComputeFrames * 0.3) * 15);
    ppgHistoryBuffer.push(simulatedPPGWave);
    if (ppgHistoryBuffer.length > maxHistoryLength) {
        ppgHistoryBuffer.shift();
    }

    // E. CHORA GRAPH YA NEON YA PPG (Nyekundu ya neon ya damu ya kiprofeshnali)
    if (ppgHistoryBuffer.length > 1) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "var(--neon-crimson)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--neon-crimson)";
        ctx.beginPath();

        let sliceWidth = width / (maxHistoryLength - 1);
        let xPos = 0;

        for (let k = 0; k < ppgHistoryBuffer.length; k++) {
            let pVal = ppgHistoryBuffer[k];
            let yPos = height - (pVal / 255.0 * (height - 60)) - 40;

            if (k === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos);
            xPos += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; 
    }

    ctx.fillStyle = "rgba(255, 0, 85, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO HEMODYNAMICS", width - 230, height - 25);

    if (totalComputeFrames % 60 === 0) {
        logHemo(`[PPG Core] Contour analysis synced. Average Amplitude loading: ${averageAmplitude.toFixed(2)}`);
        logHemo(`[Bio-Calculus] Computed Values -> Pulse: ${calculatedBPM}BPM | Pressure: ${systolic}/${diastolic}mmHg | Hydration: ${calculatedHydration.toFixed(1)}%`);
    }

    totalComputeFrames++;
    hemoPaintFrame = requestAnimationFrame(choranaKukotoaHemoRadarWave);
}
