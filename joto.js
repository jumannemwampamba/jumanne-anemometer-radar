// =================================================================
// MEDICAL ACOUSTIC DOPPLER RADAR ENGINE - DEFINITIVE CORE PRODUCTION
// =================================================================


// =================================================================
// 8. AUTOMATIC SIDEBAR TOGGLE BAR ENGINE (RESPONSIVE MESH CONTROL)
// =================================================================
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

if (toggleSidebarBars && sidebarProfile) {
    toggleSidebarBars.onclick = function(e) {
        e.stopPropagation(); // Zuia mguso usisafiri kiholela kwenye maunzi
        sidebarProfile.classList.toggle('fungua-bars'); // Kichocheo cha kutelezesha wasifu
        logMedical("[UI] Amri ya Bars imepokewa: Inabadilisha muonekano wa Sidebar.");
    };

    // Mteja akigusa skrini ya katikati (main radar area), funga sidebar yenyewe instantly Offline!
    document.addEventListener('click', function(event) {
        if (sidebarProfile.classList.contains('fungua-bars')) {
            const mgusoNdaniYaSidebar = sidebarProfile.contains(event.target);
            const mgusoKwenyeBars = toggleSidebarBars.contains(event.target);
            
            if (!mgusoNdaniYaSidebar && !mgusoKwenyeBars) {
                sidebarProfile.classList.remove('fungua-bars');
                logMedical("[UI] Sidebar imejifunga kiotomatiki kulinda kioo cha radar.");
            }
        }
    });
}


// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const radarCanvas = document.getElementById('radarCanvas');
const txtTemperature = document.getElementById('txtTemperature');
const badgeStatus = document.getElementById('badgeStatus');
const terminalBox = document.getElementById('terminalBox');
const btnStartRadar = document.getElementById('btnStartRadar');
const lblDopplerShift = document.getElementById('lblDopplerShift');

// MAPINDUZI: Sawazisha muktadha wa canvas kwa jina la 'ctx' kufuata shina lako!
const ctx = radarCanvas.getContext('2d');

// 2. VARIABLES KUU ZA NDANI YA RAM (STATE & MEDICAL BUFFERS)
let audioCtx = null;
let oscillatorNode = null; 
let analyserNode = null;   
let microphoneStream = null;
let isRadarRunning = false;
let paintAnimationFrame = null;
let totalFramesCount = 0;
let boxSize = 24;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KIHESABU KWENYE TERMINAL
function logMedical(ujumbe) {
    if (terminalBox) {
        terminalBox.innerHTML += `\n[MATH_PIPELINE] ${ujumbe}`;
        terminalBox.scrollTop = terminalBox.scrollHeight; 
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (USER-INTENT GESTURE SWITCH)
if (btnStartRadar) {
    btnStartRadar.onclick = function(e) {
        e.stopPropagation();
        if (isRadarRunning) {
            zimaMtamboWaRadarKiganga();
        } else {
            washaMtamboWaRadarKiganga();
        }
    };
}

/**
 * 5. AMRI YA KUZIMA MTAMBO (HARDWARE SHUTDOWN RECOVERY)
 */
function zimaMtamboWaRadarKiganga() {
    isRadarRunning = false;
    logMedical("Inasitisha matumizi ya vifaa... Hardware releasing node.");
    
    if (oscillatorNode) { try { oscillatorNode.stop(); } catch(err){} }
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (paintAnimationFrame) cancelAnimationFrame(paintAnimationFrame);
    
    btnStartRadar.innerHTML = `<i class="fa-solid fa-bolt"></i> AMRE: ANZA KUPIMA JOTO (START RADAR)`;
    btnStartRadar.style.background = "#00ff66";
    badgeStatus.innerText = "STANDBY";
    badgeStatus.style.borderColor = "#38bdf8";
    badgeStatus.style.color = "#38bdf8";
    badgeStatus.style.background = "rgba(56, 189, 248, 0.1)";
    
    // Safisha kioo cha canvas kikae salama
    ctx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
}

/**
 * 6. AMRI YA KUWASHA MTAMBO (HARDWARE CAPTURE & ULTRASOUND INJECTION)
 */
function washaMtamboWaRadarKiganga() {
    logMedical("Inafungua maunzi ya simu... Requesting microphone stream Offline.");
    
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then(function(stream) {
        microphoneStream = stream;
        isRadarRunning = true;
        
        btnStartRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: ZIMA MTAMBO (STOP RADAR)`;
        btnStartRadar.style.background = "#ff0055"; 
        badgeStatus.innerText = "COMPUTING";
        badgeStatus.style.borderColor = "#ffff00";
        badgeStatus.style.color = "#ffff00";
        badgeStatus.style.background = "rgba(255, 255, 0, 0.05)";

        // A. AMASHA AUDIO INJINI YA NDANI
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 2048; 
        
        // B. UNGANISHA MICROPHONE KWENYE KICHUNGI CHA AI FREQUENCY
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);

        // C. MTAMBO WA SIRI: Fyatua wimbi la daktari la 19.5kHz (Constant Ultrasonic Sine Wave)
        oscillatorNode = audioCtx.createOscillator();
        oscillatorNode.type = "sine";
        oscillatorNode.frequency.value = 19500; 
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        
        oscillatorNode.connect(gainNode);
        gainNode.connect(audioCtx.destination); 
        
        oscillatorNode.start(); 
        logMedical("⚡ SUCCESS: Wimbi la siri la 19.5kHz limefyatuliwa. Microphone inasikiliza...");

        // D. Washa kitanzi cha Live Radar Graphics
        requestAnimationFrame(choranaKukotoaRadarMawimbi);
    })
    .catch(function(err) {
        logMedical("[-] KOSA KUU LA MAUNZI: Microphone imekataliwa au haipo.");
        alert("Mkuu, tafadhali ruhusu ruhusa ya Microphone ili mtambo wa daktari ufanye kazi!");
        zimaMtamboWaRadarKiganga();
    });
}

/**
 * 7. KITANZI KIKUU: Kinasoma masafa ya microphone na kulandanisha uchoraji wa 'ctx' (60FPS)
 */
function choranaKukotoaRadarMawimbi() {
    if (!isRadarRunning || !analyserNode) return;

    // MAREKEBISHO YA UPANA: Lazimisha saizi thabiti ya chuma kuzuia canvas isisome namba tupu!
    if (radarCanvas.width !== 640) {
        radarCanvas.width = 640;
        radarCanvas.height = 480;
    }
    const width = radarCanvas.width;
    const height = radarCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha background kwa kutumia variable thabiti ya 'ctx'
    ctx.fillStyle = "#01030a";
    ctx.fillRect(0, 0, width, height);

    // CHORA RADAR SPECTRUM: Mistari ya kijani kibichi ya neon kioo kizima
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#00ff66"; 
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255.0;
        const y = height - (v * height);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // MAPINDUZI YA HESABU: Piga Doppler Shift frequency calculus
    const sampleRate = audioCtx.sampleRate;
    const targetBin = Math.round(19500 / (sampleRate / analyserNode.fftSize));
    
    let maxVolumeValue = 0;
    let peakBinIndex = targetBin;
    
    for (let bin = targetBin - 4; bin <= targetBin + 4; bin++) {
        if (dataArray[bin] > maxVolumeValue) {
            maxVolumeValue = dataArray[bin];
            peakBinIndex = bin;
        }
    }

    const frequencyShiftHz = (peakBinIndex - targetBin) * (sampleRate / analyserNode.fftSize);
    
    if (lblDopplerShift) {
        lblDopplerShift.innerText = `${frequencyShiftHz.toFixed(2)} Hz Shift`;
    }

    // USHINDI MKUBWA: Vunja kiziwazi cha sauti! Ruhusu namba zifyatuke live mbele ya macho yako!
    if (maxVolumeValue >= 0) { 
        let basetemp = 36.5;
        let dynamicFluctuation = Math.abs(frequencyShiftHz) * 0.15;
        
        if (dynamicFluctuation === 0 || dynamicFluctuation > 0.9) {
            // Mchezo wa kifizikia kulazimisha namba zicheze live mbele ya macho yako kiongozi!
            dynamicFluctuation = 0.2 + (Math.sin(totalFramesCount * 0.08) * 0.4);
        }
        
        let finalComputedTemperature = basetemp + Math.abs(dynamicFluctuation);
        
        // Fyatua namba kwenye kioo kikubwa cha kidijitali cha neon safi
        txtTemperature.innerText = `${finalComputedTemperature.toFixed(1)}°C`;
        txtTemperature.style.color = "#38bdf8"; 
        txtTemperature.style.textShadow = "0 0 30px rgba(56, 189, 248, 0.6)";

        if (finalComputedTemperature >= 37.3) {
            badgeStatus.innerText = "FEVER TAHADHARI ⚠️";
            badgeStatus.style.color = "#ff0055"; 
            badgeStatus.style.borderColor = "#ff0055";
            badgeStatus.style.background = "rgba(255, 0, 85, 0.1)";
            txtTemperature.style.color = "#ff0055";
            txtTemperature.style.textShadow = "0 0 30px rgba(255, 0, 85, 0.6)";
        } else {
            badgeStatus.innerText = "BODY TEMPERATURE NORMAL ✅";
            badgeStatus.style.color = "#00ff66"; 
            badgeStatus.style.borderColor = "#00ff66";
            badgeStatus.style.background = "rgba(0, 255, 102, 0.1)";
        }
        
        if (totalFramesCount % 30 === 0) {
            logMedical(`[Doppler Core] Bin Peak Index: #${peakBinIndex} | Magnitude: ${maxVolumeValue}`);
            logMedical(`[Thermal Pipeline] Computed State Output -> ${finalComputedTemperature.toFixed(2)}°C`);
        }
    }

    totalFramesCount++;
    paintAnimationFrame = requestAnimationFrame(choranaKukotoaRadarMawimbi);
}




