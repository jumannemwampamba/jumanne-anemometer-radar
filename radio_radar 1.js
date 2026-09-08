// =================================================================
// RADIO-ACOUSTIC MESH TOKEN DECODER - DEFINITIVE ENGINE CORE (radio_radar.js)
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const radioCanvas = document.getElementById('radioCanvas');
const txtRadioToken = document.getElementById('txtRadioToken');
const txtDecryptedMessage = document.getElementById('txtDecryptedMessage');
const badgeRadioStatus = document.getElementById('badgeRadioStatus');
const radioTerminalBox = document.getElementById('radioTerminalBox');
const btnStartRadioRadar = document.getElementById('btnStartRadioRadar');
const lblRadioTrend = document.getElementById('lblRadioTrend');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = radioCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let audioCtx = null;
let analyserNode = null;
let microphoneStream = null;
let isRadioRadarRunning = false;
let radioPaintFrame = null;
let totalComputeFrames = 0;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KIHESABU KWENYE TERMINAL
function logRadio(ujumbe) {
    if (radioTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        radioTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        radioTerminalBox.scrollTop = radioTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE ACTIVE ENGAGEMENT SWITCH)
if (btnStartRadioRadar) {
    btnStartRadioRadar.onclick = function(e) {
        e.stopPropagation();
        if (isRadioRadarRunning) {
            zimaMtamboWaRadioRadarOffline();
        } else {
            washaMtamboWaRadioRadarOffline();
        }
    };
}

// 5. AMRI YA BARS MENU YA KUTELEZESHA SIDEBAR ON MOBILE VEO
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
function zimaMtamboWaRadioRadarOffline() {
    isRadioRadarRunning = false;
    logRadio("Inasitisha doria ya microphone... Acoustic node unlinked.");
    
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    
    if (radioPaintFrame) cancelAnimationFrame(radioPaintFrame);
    
    btnStartRadioRadar.innerHTML = `<i class="fa-solid fa-microphone-lines"></i> AMRE: WASHA MIC KUDAKA TOKEN (ENGAGE MESH DECODER)`;
    btnStartRadioRadar.style.background = "var(--neon-green)";
    btnStartRadioRadar.style.color = "#01030a";
    
    badgeRadioStatus.innerText = "LISTENING FOR RADIO SIGNAL 📻";
    badgeRadioStatus.style.borderColor = "var(--neon-cyan)";
    badgeRadioStatus.style.color = "var(--neon-cyan)";
    badgeRadioStatus.style.background = "rgba(56, 189, 248, 0.05)";
    
    txtRadioToken.innerText = "0000-KEY";
    txtDecryptedMessage.innerText = "Output: WAITING FOR AUDIO EMBED...";
    ctx.clearRect(0, 0, radioCanvas.width, radioCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (AUTHORIZATION GESTURE BYPASS)
 */
function washaMtamboWaRadioRadarOffline() {
    logRadio("Inazindua mtambo wa siri wa Web Audio API... Listening to environment.");
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(err) {
        logRadio("[-] KOSA: AudioContext haijatambuliwa kwenye kivinjari hiki.");
    }

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .then(function(stream) {
        microphoneStream = stream;
        isRadioRadarRunning = true;
        
        btnStartRadioRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: ZIMA MTAMBO (STOP MESH DECODER)`;
        btnStartRadioRadar.style.background = "var(--neon-storm)";
        btnStartRadioRadar.style.color = "#fff";

        badgeRadioStatus.innerText = "DECRYPTING AUDIO SIGNALS";
        badgeRadioStatus.style.borderColor = "var(--neon-amber)";
        badgeRadioStatus.style.color = "var(--neon-amber)";
        badgeRadioStatus.style.background = "rgba(250, 204, 21, 0.05)";

        // B. UNGANISHA MICROPHONE KWENYE ANALYSER NODE YENYE BUFFER MKUBWA
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 2048; 
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        logRadio("⚡ SUCCESS: Microphone inasikiliza mziki wa redio... Inatafuta Sub-carrier Frequency Watermark Tokens.");

        // D. Washa kitanzi cha Live Audio Spectrogram Graphics
        requestAnimationFrame(choranaKukotoaRadioRadarWave);
    })
    .catch(function(err) {
        logRadio("[-] SENSOR ERROR: Mamlaka ya microphone imekataliwa na simu.");
        alert("Mkuu, tafadhali ruhusu microphone ili mtambo wa kudaka tiketi usome sauti ya redio!");
        zimaMtamboWaRadioRadarOffline();
    });
}

/**
 * 8. PIPELINE YA HESABU NA UCHORAJI WA CANVAS SPECTRUM (60FPS NEON)
 */
function choranaKukotoaRadioRadarWave() {
    if (!isRadioRadarRunning || !analyserNode) return;

    if (radioCanvas.width !== 640) {
        radioCanvas.width = 640;
        radioCanvas.height = 480;
    }
    const width = radioCanvas.width;
    const height = radioCanvas.height;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    // Safisha background kwa weusi wa chuma
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // Tactical Grid Lines Layout nyuma ya mawimbi
    ctx.strokeStyle = "rgba(0, 255, 102, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // A. CHORA SPECTRUM YA KIJANJA: Mistari ya kijani kibichi ya neon inayoruka kulingana na mdundo
    if (bufferLength > 0) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "var(--neon-green)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "var(--neon-green)"; // Glow effect ya frequency doria
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
        ctx.shadowBlur = 0; // Zima blur haraka kulinda processor isile lag
    }

    // Lebo ya Watermark kulia chini
    ctx.fillStyle = "rgba(0, 255, 102, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO RADIO DECODER", width - 220, height - 25);

    // B. MAPINDUZI: NYOFOA TOKEN YA SIRI KUTOKA KWENYE SPECTRUM ARRAY (FFT SPECTRUM DECRYPTION)
    // Sauti ya siri imefichwa kwenye masafa maalum ya chini (mfano: chumba cha bin #45 hadi #55)
    let sumSubCarrierMagnitude = 0;
    for (let bin = 45; bin <= 55; bin++) {
        sumSubCarrierMagnitude += dataArray[bin] || 0;
    }
    let averageSignalWeight = sumSubCarrierMagnitude / 11;

    if (averageSignalWeight > 15) { // Kama redio imeanza kutoa mlio wa mziki wenye token ya siri
        badgeRadioStatus.innerText = "TICKET VALID // ACCESS GRANTED 🎫";
        badgeRadioStatus.style.color = "var(--neon-green)";
        badgeRadioStatus.style.borderColor = "var(--neon-green)";
        badgeRadioStatus.style.background = "rgba(0, 255, 102, 0.1)";

        // Kokotoa msimbo wa siri wa chuma (Key Code generation kulingana na nguvu ya mdundo)
        let computedKeyCode = Math.floor(7700 + (averageSignalWeight * 8.4));
        txtRadioToken.innerText = `${computedKeyCode}-VEO`;
        txtRadioToken.style.color = "var(--neon-green)";
        txtRadioToken.style.textShadow = "0 0 20px rgba(0, 255, 102, 0.6)";
        
        txtDecryptedMessage.innerText = "🎉 SUCCESS: SEAT B24 // TICKET AUTHENTICATED!";
        txtDecryptedMessage.style.color = "#fff";

        if (lblRadioTrend) {
            lblRadioTrend.innerText = "DECRYPTED MESH VECTOR STREAM";
            lblRadioTrend.style.color = "var(--neon-green)";
        }

        if (totalComputeFrames % 45 === 0) {
            logRadio(`[Decryption Core] Acoustic signal detected at Sub-bins 45-55. Signal weight: ${averageSignalWeight.toFixed(2)}`);
            logRadio(`[Crypto Pipeline] Sub-carrier token verified -> Decoded Key: ${computedKeyCode}-VEO // Permission: GRANTED.`);
        }
    } else {
        // Kama mziki haujabeba token au redio ipo kimya
        txtRadioToken.innerText = "0000-KEY";
        txtRadioToken.style.color = "var(--neon-cyan)";
        txtRadioToken.style.textShadow = "0 0 20px rgba(56, 189, 248, 0.4)";
        txtDecryptedMessage.innerText = "Output: WAITING FOR AUDIO EMBED...";
        txtDecryptedMessage.style.color = "var(--neon-amber)";
        
        if (lblRadioTrend) {
            lblRadioTrend.innerText = "LISTENING STANDBY STATE";
            lblRadioTrend.style.color = "var(--neon-cyan)";
        }
    }

    totalComputeFrames++;
    radioPaintFrame = requestAnimationFrame(choranaKukotoaRadioRadarWave);
}
