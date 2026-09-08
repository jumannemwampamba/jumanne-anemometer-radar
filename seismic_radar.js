// =================================================================
// JUMANNE VEO - MECHANICAL STRUCTURAL PULSE RADAR (PART 1)
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html (DOM LINKS)
const seismicCanvas = document.getElementById('seismicCanvas');
const ctx = seismicCanvas.getContext('2d');
const txtKineticForce = document.getElementById('txtKineticForce');
const txtPeakAcceleration = document.getElementById('txtPeakAcceleration');
const badgeSafetyStatus = document.getElementById('badgeSafetyStatus');
const seismicTerminalBox = document.getElementById('seismicTerminalBox');
const btnStartSeismicRadar = document.getElementById('btnStartSeismicRadar');
const lblVectorRate = document.getElementById('lblVectorRate');
const lblKineticTrend = document.getElementById('lblKineticTrend');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let motionSensor = null;
let isSeismicRadarRunning = false;
let seismicPaintFrame = null;
let totalComputeFrames = 0;

// Kuhifadhi mtiririko wa historia ya mitetemo ya 3-Axis (X, Y, Z Buffer)
let axisHistoryBuffer = []; 
const maxHistoryLength = 100; // Tunza nukta 100 za mwisho za mawimbi ya ardhi

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KIHESABU KWENYE TERMINAL
function logSeismic(ujumbe) {
    if (seismicTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        seismicTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        seismicTerminalBox.scrollTop = seismicTerminalBox.scrollHeight; 
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (HARDWARE INTENT GESTURE SWITCH)
if (btnStartSeismicRadar) {
    btnStartSeismicRadar.onclick = function(e) {
        e.stopPropagation();
        if (isSeismicRadarRunning) {
            zimaMtamboWaSeismicRadarOffline();
        } else {
            washaMtamboWaSeismicRadarOffline();
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
// =================================================================
// JUMANNE VEO - MECHANICAL STRUCTURAL PULSE RADAR (PART 2)
// =================================================================

/**
 * 6. AMRI YA KUZIMA HARDWARE (SENSOR RECOVERY SHUTDOWN)
 */
function zimaMtamboWaSeismicRadarOffline() {
    isSeismicRadarRunning = false;
    logSeismic("Inasitisha sensor ya Accelerometer... Kinetic loop detached.");
    
    if (motionSensor) {
        try { motionSensor.stop(); } catch(err){}
    } else {
        // Zima kisikilizi cha dharura cha window kama kilitumika
        window.removeEventListener('devicemotion', handleDeviceMotionFallback);
    }
    
    if (seismicPaintFrame) cancelAnimationFrame(seismicPaintFrame);
    
    btnStartSeismicRadar.innerHTML = `<i class="fa-solid fa-tower-broadcast"></i> AMRE: ENGAGE KINETIC RADAR (START SENSOR)`;
    btnStartSeismicRadar.style.background = "var(--neon-crimson)";
    
    badgeSafetyStatus.innerText = "STANDBY MODE";
    badgeSafetyStatus.style.borderColor = "var(--neon-green)";
    badgeSafetyStatus.style.color = "var(--neon-green)";
    badgeSafetyStatus.style.background = "rgba(0, 255, 102, 0.05)";
    
    ctx.clearRect(0, 0, seismicCanvas.width, seismicCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA SENSOR (ACCELEROMETER INJECTION & FALLBACK ROUTE)
 */
function washaMtamboWaSeismicRadarOffline() {
    logSeismic("Inakagua na kuamsha sensorer ya mtetemo wa jengo... Engaged.");
    isSeismicRadarRunning = true;

    btnStartSeismicRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: ZIMA KINETIC RADAR (DISENGAGE)`;
    btnStartSeismicRadar.style.background = "var(--neon-storm)";

    badgeSafetyStatus.innerText = "COMPUTING AXIS";
    badgeSafetyStatus.style.borderColor = "var(--neon-gold)";
    badgeSafetyStatus.style.color = "var(--neon-gold)";
    badgeSafetyStatus.style.background = "rgba(250, 204, 21, 0.05)";

    // A. JARIBU INJINI YA KISASA YA W3C LINEAR ACCELERATION SENSOR (HAKUNA GRAVITY NYUMA)
    if ('LinearAccelerationSensor' in window) {
        try {
            motionSensor = new LinearAccelerationSensor({ frequency: 60 }); // Nyonya data mara 60 kwa sekunde
            
            motionSensor.addEventListener('reading', () => {
                if (!isSeismicRadarRunning) return;
                pigaHesabuZoteZaMtetemoOffline(motionSensor.x, motionSensor.y, motionSensor.z);
            });

            motionSensor.addEventListener('error', event => {
                logSeismic("[⚠️ Sensor Bypass] Linear Sensor imefungwa. Inajaribu DeviceMotion...");
                washaMawasilianoYaDeviceMotion();
            });

            motionSensor.start();
            logSeismic("⚡ SUCCESS: Sensor halisi ya Linear Accelerometer imewaka Offline!");
        } catch (err) {
            washaMawasilianoYaDeviceMotion();
        }
    } else {
        washaMawasilianoYaDeviceMotion();
    }

    // B. Washa kitanzi cha Live Seismic Graphics na uchoraji wa mawimbi ya pande tatu
    requestAnimationFrame(choranaKukotoaSeismicRadarWave);
}

/**
 * Njia ya B: Washa kisikilizi cha zamani cha DeviceMotion kama simu haina Linear API
 */
function washaMawasilianoYaDeviceMotion() {
    if ('DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', handleDeviceMotionFallback);
        logWeather("⚡ SUCCESS: Sensor ya dharura ya DeviceMotionEvent imezinduliwa.");
    } else {
        logSeismic("[ℹ️ Notification] Hakuna sensorer halisi ya mtetemo. Inawasha Math Simulation Core...");
        washaUigizajiWaMtetemoKihesabu();
    }
}

function handleDeviceMotionFallback(event) {
    if (!isSeismicRadarRunning) return;
    // Vuta acceleration isiyokuwa na nguvu ya gravity (accelerationIncludingGravity fallback)
    let accX = event.acceleration ? event.acceleration.x : (event.accelerationIncludingGravity ? event.accelerationIncludingGravity.x : 0);
    let accY = event.acceleration ? event.acceleration.y : (event.accelerationIncludingGravity ? event.accelerationIncludingGravity.y : 0);
    let accZ = event.acceleration ? event.acceleration.z : (event.accelerationIncludingGravity ? event.accelerationIncludingGravity.z : 0);
    
    pigaHesabuZoteZaMtetemoOffline(accX || 0, accY || 0, accZ || 0);
}

/**
 * Mtambo mseto wa kihesabu wa kuzalisha mawimbi ya mitetemo kama upo kwenye kifaa kisicho na sensorer
 */
function washaUigizajiWaMtetemoKihesabu() {
    logSeismic("[Math Core] Mtambo wa uigizaji wa mtetemo wa jengo la Mbozi umewaka.");
    
    const simulationClock = setInterval(() => {
        if (!isSeismicRadarRunning) {
            clearInterval(simulationClock);
            return;
        }
        
        // Tengeneza mawimbi ya mtetemo (Seismic Background Noise Simulation)
        let noiseX = (Math.sin(totalComputeFrames * 0.2) * 0.15) + (Math.random() - 0.5) * 0.05;
        let noiseY = (Math.cos(totalComputeFrames * 0.15) * 0.12) + (Math.random() - 0.5) * 0.04;
        let noiseZ = (Math.sin(totalComputeFrames * 0.3) * 0.22) + (Math.random() - 0.5) * 0.08;
        
        // Mara moja kwa sekunde chache lipua kishindo kikubwa cha mteja anayetembea karibu na meza
        if (totalComputeFrames % 120 === 0) {
            noiseX += 1.8; noiseY += 1.4; noiseZ += 2.5;
        }
        
        pigaHesabuZoteZaMtetemoOffline(noiseX, noiseY, noiseZ);
    }, 16); // Kulisha data kila baada ya millisecond 16 (Sawa na kasi ya 60Hz halisi!)
}
// =================================================================
// JUMANNE VEO - MECHANICAL STRUCTURAL PULSE RADAR (PART 3 - FINAL)
// =================================================================

/**
 * 8. PIPELINE YA HESABU: Inayopiga milinganyo ya Kinetic Force na Peak Ground Acceleration (PGA)
 */
function pigaHesabuZoteZaMtetemoOffline(xVal, yVal, zVal) {
    if (!isSeismicRadarRunning) return;

    // A. PIGA FORMULA YA VECTOR MAGNITUDE (Kujua jumla ya nguvu ya mtetemo katika G-Force)
    let gForceMagnitude = Math.sqrt(xVal * xVal + yVal * yVal + zVal * zVal) / 9.80665;
    
    // B. PIGA HESABU YA PEAK GROUND ACCELERATION (Convert G-Force direct kwenda kipimo cha Gal - cm/s²)
    let pgaGalValue = Math.sqrt(xVal * xVal + yVal * yVal + zVal * zVal) * 100;

    // Chapa namba kubwa za neon kioo kizima
    txtKineticForce.innerText = `${gForceMagnitude.toFixed(3)} G`;
    txtPeakAcceleration.innerHTML = `<i class="fa-solid fa-gauge"></i> Peak PGA: ${pgaGalValue.toFixed(2)} Gal`;

    // C. VECTOR TIMELINE REGISTERS: Sukuma nukta za pande tatu kwenye RAM buffer
    axisHistoryBuffer.push({ x: xVal, y: yVal, z: zVal });
    if (axisHistoryBuffer.length > maxHistoryLength) {
        axisHistoryBuffer.shift(); // Zuia memory overflow ya simu
    }

    if (lblVectorRate) {
        lblVectorRate.innerText = `${(1000 / 16).toFixed(1)} Hz`;
    }

    // D. DORIA YA USALAMA WA NYUMBA (STRUCTURAL SAFETY REAL-TIME SWITCH)
    if (pgaGalValue > 150) {
        // Mtetemo mkubwa sana unaohatarisha kuta na ghorofa (Critical Structural Shock!)
        badgeSafetyStatus.innerText = "⚠️ CRITICAL SHOCK DETECTED ⚠️";
        badgeSafetyStatus.style.color = "var(--neon-crimson)";
        badgeSafetyStatus.style.borderColor = "var(--neon-crimson)";
        badgeSafetyStatus.style.background = "rgba(255, 0, 85, 0.1)";
        txtKineticForce.style.color = "var(--neon-crimson)";
        txtKineticForce.style.textShadow = "0 0 25px rgba(255, 0, 85, 0.6)";
        if (lblKineticTrend) {
            lblKineticTrend.innerText = "CRITICAL SHIFT DETECTED";
            lblKineticTrend.style.color = "var(--neon-crimson)";
        }
    } else if (pgaGalValue > 15 && pgaGalValue <= 150) {
        // Kuna mwendo au mtetemo wa kawaida wa karibu (Mtu anatembea au gari inapita)
        badgeSafetyStatus.innerText = "VIBRATION ALERT ⚠️";
        badgeSafetyStatus.style.color = "var(--neon-gold)";
        badgeSafetyStatus.style.borderColor = "var(--neon-gold)";
        badgeSafetyStatus.style.background = "rgba(250, 204, 21, 0.05)";
        txtKineticForce.style.color = "var(--neon-gold)";
        txtKineticForce.style.textShadow = "0 0 25px rgba(250, 204, 21, 0.5)";
        if (lblKineticTrend) {
            lblKineticTrend.innerText = "DYNAMIC AXIS MOVEMENT";
            lblKineticTrend.style.color = "var(--neon-gold)";
        }
    } else {
        // Jengo limetulia kwa amani na usafi wa 100%
        badgeSafetyStatus.innerText = "STRUCTURE SECURE ✅";
        badgeSafetyStatus.style.color = "var(--neon-green)";
        badgeSafetyStatus.style.borderColor = "var(--neon-green)";
        badgeSafetyStatus.style.background = "rgba(0, 255, 102, 0.05)";
        txtKineticForce.style.color = "var(--neon-crimson)"; // Rudisha rangi ya asili ya urembo wako mkuu
        txtKineticForce.style.textShadow = "0 0 25px rgba(255, 0, 85, 0.4)";
        if (lblKineticTrend) {
            lblKineticTrend.innerText = "STABLE COMPRESSION AXIS";
            lblKineticTrend.style.color = "var(--neon-green)";
        }
    }

    if (totalComputeFrames % 60 === 0) {
        logSeismic(`[Seismic Core] Vector links synced. Computed Magnitude -> ${gForceMagnitude.toFixed(5)} G`);
        logSeismic(`[Kinetic Pipeline] PGA Calculated -> ${pgaGalValue.toFixed(2)} Gal // Internal Axis Balancer Stable.`);
    }

    totalComputeFrames++;
}

/**
 * 9. KITANZI CHA CANVAS: Kinafanya Real-Time 3-Axis Multi-Wave Rendering (60FPS Neon)
 */
function choranaKukotoaSeismicRadarWave() {
    if (!isSeismicRadarRunning) return;

    if (seismicCanvas.width !== 640) {
        seismicCanvas.width = 640;
        seismicCanvas.height = 480;
    }
    const width = seismicCanvas.width;
    const height = seismicCanvas.height;

    // Safisha background kwa weusi wa doria ya kijiografia
    ctx.fillStyle = "#000104";
    ctx.fillRect(0, 0, width, height);

    // Kuchora mistari ya siri ya gridi (Tactical Seismic Grid Layout)
    ctx.strokeStyle = "rgba(255, 0, 85, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // Kuchora mistari mitatu ya siri ya mistari ya katikati (Zero Balance Axes)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
    ctx.stroke();

    // CHORA NYOYA ZA 3-AXES (MISTARI MITATU YA NEON INAYOCHEZA KWA MKUPUO MMOJA)
    if (axisHistoryBuffer.length > 1) {
        let sliceWidth = width / (maxHistoryLength - 1);

        // A. CHORA MAPINDUZI YA WAVE X (Rangi ya Cyan ya Neon)
        ctx.lineWidth = 2;
        ctx.strokeStyle = "var(--neon-cyan)";
        ctx.beginPath();
        let currentX = 0;
        for (let m = 0; m < axisHistoryBuffer.length; m++) {
            let yPos = (height / 2) - (axisHistoryBuffer[m].x * 30); // Kukuza mawimbi ili yaonekane vizuri
            if (m === 0) ctx.moveTo(currentX, yPos); else ctx.lineTo(currentX, yPos);
            currentX += sliceWidth;
        }
        ctx.stroke();

        // B. CHORA MAPINDUZI YA WAVE Y (Rangi ya Gold ya Neon)
        ctx.strokeStyle = "var(--neon-gold)";
        ctx.beginPath();
        currentX = 0;
        for (let n = 0; n < axisHistoryBuffer.length; n++) {
            let yPos = (height / 2) - (axisHistoryBuffer[n].y * 30);
            if (n === 0) ctx.moveTo(currentX, yPos); else ctx.lineTo(currentX, yPos);
            currentX += sliceWidth;
        }
        ctx.stroke();

        // C. CHORA MAPINDUZI YA WAVE Z (Rangi ya Nyekundu ya Crimson - King'ao cha chuma)
        ctx.lineWidth = 3;
        ctx.strokeStyle = "var(--neon-crimson)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "var(--neon-crimson)";
        ctx.beginPath();
        currentX = 0;
        for (let q = 0; q < axisHistoryBuffer.length; q++) {
            let yPos = (height / 2) - (axisHistoryBuffer[q].z * 30);
            if (q === 0) ctx.moveTo(currentX, yPos); else ctx.lineTo(currentX, yPos);
            currentX += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Zima blur haraka kulinda processor ya simu
    }

    // Lebo ya Watermark kulia chini ya Canvas
    ctx.fillStyle = "rgba(255, 0, 85, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO KINETIC RADAR", width - 210, height - 25);

    seismicPaintFrame = requestAnimationFrame(choranaKukotoaSeismicRadarWave);
}
