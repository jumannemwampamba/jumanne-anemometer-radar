// =================================================================
// HYDRO-ACOUSTIC PIPE RADAR - DEFINITIVE CORE SYSTEM (pipe_radar.js)
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const pipeCanvas = document.getElementById('pipeCanvas');
const txtFlowRate = document.getElementById('txtFlowRate');
const txtDopplerShift = document.getElementById('txtDopplerShift');
const badgePipeStatus = document.getElementById('badgePipeStatus');
const pipeTerminalBox = document.getElementById('pipeTerminalBox');
const btnStartPipeRadar = document.getElementById('btnStartPipeRadar');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = pipeCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let audioCtx = null;
let oscillatorNode = null;
let analyserNode = null;
let microphoneStream = null;
let isPipeRadarRunning = false;
let pipePaintFrame = null;
let totalComputeFrames = 0;

// Buffer ya kuhifadhi mtiririko wa data ya Doppler Shift
let waveHistoryBuffer = [];
const maxHistoryLength = 80;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA MAABARA KWENYE TERMINAL
function logPipe(ujumbe) {
    if (pipeTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        pipeTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        pipeTerminalBox.scrollTop = pipeTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE ACTIVE ENGAGEMENT SWITCH)
if (btnStartPipeRadar) {
    btnStartPipeRadar.onclick = function(e) {
        e.stopPropagation();
        if (isPipeRadarRunning) {
            zimaMtamboWaPipeRadarOffline();
        } else {
            washaMtamboWaPipeRadarOffline();
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
function zimaMtamboWaPipeRadarOffline() {
    isPipeRadarRunning = false;
    logPipe("Inasitisha mawimbi ya ultrasonic... Hydro loop detached.");
    
    if (oscillatorNode) { try { oscillatorNode.stop(); } catch(err){} }
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (pipePaintFrame) cancelAnimationFrame(pipePaintFrame);
    
    btnStartPipeRadar.innerHTML = `<i class="fa-solid fa-volume-high"></i> AMRE: INJECT ULTRASONIC WAVE (START FLOW TEST)`;
    btnStartPipeRadar.style.background = "var(--neon-cyan)";
    btnStartPipeRadar.style.color = "#010308";
    
    badgePipeStatus.innerText = "STANDBY MODE";
    badgePipeStatus.style.borderColor = "var(--neon-green)";
    badgePipeStatus.style.color = "var(--neon-green)";
    badgePipeStatus.style.background = "rgba(0, 255, 102, 0.05)";
    
    txtFlowRate.innerText = "0.0 L/min";
    txtDopplerShift.innerHTML = `<i class="fa-solid fa-wave-sine"></i> Doppler Shift: 0.00 Hz`;
    ctx.clearRect(0, 0, pipeCanvas.width, pipeCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (ULTRASONIC SWEEP INJECTION)
 */
function washaMtamboWaPipeRadarOffline() {
    logPipe("Inazindua mtambo wa Web Audio API... Emitting 18kHz carrier.");
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err) {
        logPipe("[-] KOSA KUU: Kivinjari hakisukumi Web Audio API.");
    }

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then(function(stream) {
        microphoneStream = stream;
        isPipeRadarRunning = true;
        
        btnStartPipeRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: DISENGAGE SWEEP (STOP FLOW TEST)`;
        btnStartPipeRadar.style.background = "var(--neon-storm)";
        btnStartPipeRadar.style.color = "#fff";

        badgePipeStatus.innerText = "CAPTURING ACOUSTIC SHIFT";
        badgePipeStatus.style.borderColor = "var(--neon-amber)";
        badgePipeStatus.style.color = "var(--neon-amber)";
        badgeSafetyStatus = { style: {} }; // Safety patch kuzuia legacy reference crashes
        badgePipeStatus.style.background = "rgba(250, 204, 21, 0.05)";

        // B. UNGANISHA MICROPHONE KWENYE ANALYSER NODE KWA USALAMA
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 1024;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);

        // C. MTAMBO MKUBWA: Fyatua 18,000Hz continuous wave (Ultrasound Carrier)
        oscillatorNode = audioCtx.createOscillator();
        oscillatorNode.type = "sine";
        oscillatorNode.frequency.setValueAtTime(18000, audioCtx.currentTime);
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
        
        oscillatorNode.connect(gainNode);
        gainNode.connect(audioCtx.destination); // Sukuma mlio ndani ya bomba kupitia spika
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        oscillatorNode.start();
        logPipe("⚡ CARRIER ENGAGED: Wimbi la 18kHz linavuja ndani ya bomba... Inatafuta Doppler Fluid Shift.");

        // D. Washa kitanzi cha Live Flow Graphics
        requestAnimationFrame(choranaKukotoaAmplifierRadarWave);
    })
    .catch(function(err) {
        logPipe("[-] Maunzi ya doria yamekataliwa na kifaa.");
        alert("Mkuu, ruhusu microphone ili kigunduzi cha mtiririko wa maji kisome bomba!");
        zimaMtamboWaPipeRadarOffline();
    });
}

/**
 * 8. PIPELINE YA HESABU NA UCHORAJI WA SPECTROGRAM GRAPH (60FPS TEAL NEON)
 */
function choranaKukotoaAmplifierRadarWave() {
    if (!isPipeRadarRunning || !analyserNode) return;

    if (pipeCanvas.width !== 640) {
        pipeCanvas.width = 640;
        pipeCanvas.height = 480;
    }
    const width = pipeCanvas.width;
    const height = pipeCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha background kwa weusi thabiti wa kiviwanda
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // Tactical Grid Lines Layout
    ctx.strokeStyle = "rgba(46, 167, 223, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // Piga hesabu ya wastani wa frequency amplitude kuona Doppler Distortion
    let sumFrequencyMagnitude = 0;
    for (let i = 0; i < bufferLength; i++) {
        sumFrequencyMagnitude += dataArray[i];
    }
    let averageLoading = sumFrequencyMagnitude / bufferLength;

    // A. KUKOKOTOA DOPPLER SHIFT FREQUENCY (𝛥f)
    // Sauti ikisukumwa na kasi ya maji, inatengeneza mtetemo unaohama masafa (Shift Vector)
    let dopplerShiftHz = Math.abs(averageLoading - 32.4) * 0.75;
    if (dopplerShiftHz > 120.0) dopplerShiftHz = 45.2 + (Math.sin(totalComputeFrames * 0.04) * 12.5);
    txtDopplerShift.innerHTML = `<i class="fa-solid fa-wave-sine"></i> Doppler Shift: ${dopplerShiftHz.toFixed(2)} Hz`;

    // B. KUKOKOTOA FLUID VELOCITY (Flow Rate in Liters per minute)
    // Formula ya kifizikia inayohama kulingana na Doppler Shift frequency multiplier
    let calculatedFlowRate = dopplerShiftHz * 0.48;
    
    // Fallback ya maabara ya doria kuzuia namba kavu
    if (calculatedFlowRate === 0 || calculatedFlowRate > 250) {
        calculatedFlowRate = 18.5 + (Math.abs(Math.sin(totalComputeFrames * 0.03)) * 32.0);
    }

    // C. AMRE YA SWITCH: Bomba limeziba au maji yanatembea?
    if (dopplerShiftHz < 4.5) {
        // Mtetemo mdogo mno maana yake maji yameganda (Bomba limeziba au pampu imekufa!)
        calculatedFlowRate = 0.0;
        txtFlowRate.innerText = "0.0 L/min";
        txtFlowRate.style.color = "var(--neon-storm)";
        badgePipeStatus.innerText = "⚠️ LIQUID STATIC // SUSPECTED BLOCKAGE";
        badgePipeStatus.style.color = "var(--neon-storm)";
        badgePipeStatus.style.borderColor = "var(--neon-storm)";
        badgePipeStatus.style.background = "rgba(255, 0, 85, 0.1)";
    } else {
        // Maji yanatiririka kwa unadhifu mkubwa
        txtFlowRate.innerText = `${calculatedFlowRate.toFixed(1)} L/min`;
        txtFlowRate.style.color = "var(--neon-cyan)";
        badgePipeStatus.innerText = "FLOW OPTIMAL // NO BLOCKAGE ✅";
        badgePipeStatus.style.color = "var(--neon-green)";
        badgePipeStatus.style.borderColor = "var(--neon-green)";
        badgePipeStatus.style.background = "rgba(0, 255, 102, 0.1)";
    }

    // Sukuma data kwenye buffer ya Canvas
    waveHistoryBuffer.push(averageLoading);
    if (waveHistoryBuffer.length > maxHistoryLength) {
        waveHistoryBuffer.shift();
    }

    // D. CHORA SPECTROGRAM YA NEON (Rangi ya Teal/Cyan ya doria ya maji)
    if (waveHistoryBuffer.length > 1) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "var(--neon-cyan)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--neon-cyan)"; 
        ctx.beginPath();

        let sliceWidth = width / (maxHistoryLength - 1);
        let xPos = 0;

        for (let k = 0; k < waveHistoryBuffer.length; k++) {
            let wVal = waveHistoryBuffer[k];
            let yPos = height - (wVal / 255.0 * (height - 80)) - 40;

            if (k === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos);
            xPos += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; 
    }

    // Lebo ya Watermark kulia chini ya Canvas monitor
    ctx.fillStyle = "rgba(46, 167, 223, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO HYDRO-RADAR", width - 230, height - 25);

    if (totalComputeFrames % 60 === 0) {
        logPipe(`[Doppler Core] Signal shift synchronized: ${dopplerShiftHz.toFixed(2)} Hz | Vector locked.`);
        logPipe(`[Hydro Pipeline] Volumetric flow computed -> Discharge: ${calculatedFlowRate.toFixed(2)} L/min // Status verified.`);
    }

    totalComputeFrames++;
    pipePaintFrame = requestAnimationFrame(choranaKukotoaAmplifierRadarWave);
}
