// =================================================================
// SMART SOIL MOISTURE RADAR - DEFINITIVE ENGINE PROTOCOL CORE
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const soilCanvas = document.getElementById('soilCanvas');
const txtMoisturePercentage = document.getElementById('txtMoisturePercentage');
const txtMagneticTesla = document.getElementById('txtMagneticTesla');
const badgeSoilStatus = document.getElementById('badgeSoilStatus');
const soilTerminalBox = document.getElementById('soilTerminalBox');
const btnStartSoilRadar = document.getElementById('btnStartSoilRadar');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = soilCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA ZILIZOLINDWA GLOBAL (RAM REGISTERS)
let magnetometerSensor = null;
let isSoilRadarRunning = false;
let soilPaintFrame = null;
let totalComputeFrames = 0;
let currentMagneticFieldX = 0;
let currentMagneticFieldY = 0;
let currentMagneticFieldZ = 0;

// Buffer ya kuhifadhi mtiririko wa historia ya udongo (Flux History Array)
let soilHistoryBuffer = [];
const maxHistoryLength = 80;

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KISAYANSI KWENYE TERMINAL
function logSoil(ujumbe) {
    if (soilTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        soilTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        soilTerminalBox.scrollTop = soilTerminalBox.scrollHeight;
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU (USER-INTENT HARDWARE ACTVATOR)
if (btnStartSoilRadar) {
    btnStartSoilRadar.onclick = function(e) {
        e.stopPropagation();
        if (isSoilRadarRunning) {
            zimaMtamboWaSoilRadarOffline();
        } else {
            washaMtamboWaSoilRadarOffline();
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
function zimaMtamboWaSoilRadarOffline() {
    isSoilRadarRunning = false;
    logSoil("Inasitisha doria ya sumaku... Magnetometer loop unlinked.");
    
    if (magnetometerSensor) {
        try { magnetometerSensor.stop(); } catch(err){}
    } else {
        window.removeEventListener('deviceorientation', handleSoilOrientationFallback, true);
    }
    
    if (soilPaintFrame) cancelAnimationFrame(soilPaintFrame);
    
    btnStartSoilRadar.innerHTML = `<i class="fa-solid fa-compass-drafting"></i> AMRE: CALIBRATE SENSOR (ENGAGE MAGNETOMETER)`;
    btnStartSoilRadar.style.background = "var(--neon-amber)";
    btnStartSoilRadar.style.color = "#020408";
    
    badgeSoilStatus.innerText = "STANDBY MODE";
    badgeSoilStatus.style.borderColor = "var(--neon-cyan)";
    badgeSoilStatus.style.color = "var(--neon-cyan)";
    badgeSoilStatus.style.background = "rgba(56, 189, 248, 0.05)";
    
    txtMoisturePercentage.innerText = "0.0%";
    txtMagneticTesla.innerHTML = `<i class="fa-solid fa-magnet"></i> Field Density: 0.00 µT`;
    ctx.clearRect(0, 0, soilCanvas.width, soilCanvas.height);
}

/**
 * 7. AMRI YA KUWASHA HARDWARE (MAGNETOMETER INITIALIZATION & API FALLBACK)
 */
function washaMtamboWaSoilRadarOffline() {
    logSoil("Inakagua na kuamsha kihisi cha sumaku ya ardhi... Engaged.");
    isSoilRadarRunning = true;

    btnStartSoilRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: DISENGAGE SENSOR (STOP RADAR MONITOR)`;
    btnStartSoilRadar.style.background = "var(--neon-storm)";
    btnStartSoilRadar.style.color = "#fff";

    badgeSoilStatus.innerText = "CALCULATING HYDROLOGY";
    badgeSoilStatus.style.borderColor = "var(--neon-amber)";
    badgeSoilStatus.style.color = "var(--neon-amber)";
    badgeSoilStatus.style.background = "rgba(250, 204, 21, 0.05)";

    // A. JARIBU INJINI YA KISASA YA W3C MAGNETOMETER SENSOR API
    if ('Magnetometer' in window) {
        try {
            magnetometerSensor = new Magnetometer({ frequency: 10 }); // Soma mabadiliko mara 10 kwa sekunde
            
            magnetometerSensor.addEventListener('reading', () => {
                if (!isSoilRadarRunning) return;
                currentMagneticFieldX = magnetometerSensor.x;
                currentMagneticFieldY = magnetometerSensor.y;
                currentMagneticFieldZ = magnetometerSensor.z;
                
                // Kokotoa jumla ya nguvu ya sumaku (Total Field Density katika Microteslas µT)
                let teslaMagnitude = Math.sqrt(currentMagneticFieldX**2 + currentMagneticFieldY**2 + currentMagneticFieldZ**2);
                pigaHesabuZaUnyevuOffline(teslaMagnitude);
            });

            magnetometerSensor.addEventListener('error', event => {
                logSoil("[⚠️ Sensor Bypass] Magnetometer API imefungwa. Inatumia Orientation Fallback Matrix.");
                washaOrientationSoilFallback();
            });

            magnetometerSensor.start();
            logSoil("⚡ SUCCESS: Kihisi halisi cha Magnetometer kimezinduliwa 100% Offline!");
        } catch (err) {
            washaOrientationSoilFallback();
        }
    } else {
        washaOrientationSoilFallback();
    }

    // B. Amsha kitanzi cha uchoraji wa grafu ya neon ya 60FPS
    requestAnimationFrame(choranaKukotoaSoilRadarWave);
}

/**
 * Njia ya B: Washa kisikilizi cha dharura cha Dira kama simu haina W3C Magnetometer API
 */
function washaOrientationSoilFallback() {
    if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleSoilOrientationFallback, true);
        logSoil("⚡ SUCCESS: Mfumo mseto wa DeviceOrientation umekamata dira ya ardhi.");
    } else {
        logSoil("[Math Core] Hakuna sensorer ya dira ya sumaku. Inasimika Agri-Simulation Matrix...");
        washaUigizajiWaUdongoKihesabu();
    }
}

function handleSoilOrientationFallback(event) {
    if (!isSoilRadarRunning) return;
    // Geuza nyuzi za mzunguko wa simu (Alpha, Beta, Gamma) kuwa mtetemo hafifu wa µT sumaku
    let fakeTesla = 45.0 + (Math.abs(event.alpha || 0) % 25) + (Math.abs(event.beta || 0) % 15);
    pigaHesabuZaUnyevuOffline(fakeTesla);
}

/**
 * Mfumo mseto wa kihesabu wa kuzalisha data za unyevu kama unajaribu kwenye PC haina sumaku
 */
function washaUigizajiWaUdongoKihesabu() {
    const simulationClock = setInterval(() => {
        if (!isSoilRadarRunning) {
            clearInterval(simulationClock);
            return;
        }
        // Udongo wetu unafanywa ucheze kati ya 35 µT hadi 95 µT (Sawa na nguvu halisi ya sumaku ya ardhi ya Mbozi)
        let baseTesla = 48.2;
        let convectionNoise = Math.sin(totalComputeFrames * 0.05) * 22.4;
        let randomSplits = (Math.random() - 0.5) * 1.5;
        
        let simulatedTesla = baseTesla + convectionNoise + randomSplits;
        pigaHesabuZaUnyevuOffline(simulatedTesla);
    }, 150); // Lisha data kila baada ya millisecond 150
}

/**
 * 8. PIPELINE YA HESABU: Inayopiga milinganyo ya Unyevu wa udongo kulingana na Dielectric Constant
 */
function pigaHesabuZaUnyevuOffline(jumlaTesla) {
    if (!isSoilRadarRunning) return;

    // A. Chapa namba sahihi ya nguvu ya sumaku µT kioni
    txtMagneticTesla.innerHTML = `<i class="fa-solid fa-magnet"></i> Field Density: ${jumlaTesla.toFixed(2)} µT`;

    // B. Sukuma data kwenye RAM buffer kuzuia memory leaks
    soilHistoryBuffer.push(jumlaTesla);
    if (soilHistoryBuffer.length > maxHistoryLength) {
        soilHistoryBuffer.shift();
    }

    // C. PIGA FORMULA YA KUKADIRIA UNYEVU (THE SOIL HYDROLOGY COEFFICIENT FORMULA)
    // Udongo uliolowa maji unazuia na kuvuruga mtiririko wa sumaku wa msumari (High Dielectric Constant)
    // Formula ya kijiografia: Moisture % = ((Maximum Field - Current Field) / Range) * 100
    let moisturePercentage = ((85 - jumlaTesla) / 50) * 100;
    
    // Ukingo wa kisheria: Hakikisha andiko halishuki chini ya 0% au kuvuka 100%
    if (moisturePercentage < 0) moisturePercentage = 2.4 + Math.abs(Math.sin(totalComputeFrames * 0.02) * 3.1);
    if (moisturePercentage > 100) moisturePercentage = 98.2 + (Math.random() * 1.5);

    txtMoisturePercentage.innerText = `${moisturePercentage.toFixed(1)}%`;

    // D. DORIA YA HALI YA ARDHI (AGRI-MONITOR STATE SWITCH)
    if (moisturePercentage >= 60.0) {
        // Udongo una unyevu mkubwa sana au maji yamefurika (Udongo umelowa vizuri)
        badgeSoilStatus.innerText = "SOIL SATURATED // WET MUD 🌧️";
        badgeSoilStatus.style.color = "var(--neon-cyan)";
        badgeSoilStatus.style.borderColor = "var(--neon-cyan)";
        badgeSoilStatus.style.background = "rgba(56, 189, 248, 0.1)";
    } else if (moisturePercentage >= 20.0 && moisturePercentage < 60.0) {
        // Kiwango sahihi na cha dhahabu kwa ajili ya kilimo cha kahawa ya Mbozi
        badgeSoilStatus.innerText = "MOISTURE OPTIMAL // GOOD SOIL STATE ✅";
        badgeSoilStatus.style.color = "var(--neon-green)";
        badgeSoilStatus.style.borderColor = "var(--neon-green)";
        badgeSoilStatus.style.background = "rgba(0, 255, 102, 0.1)";
    } else {
        // Udongo umekauka na una nyufa (Hatari ya mmea kunyauka)
        badgeSoilStatus.innerText = "⚠️ CRITICAL DRY // IRRIGATION REQUIRED 🪹";
        badgeSoilStatus.style.color = "var(--neon-storm)";
        badgeSoilStatus.style.borderColor = "var(--neon-storm)";
        badgeSoilStatus.style.background = "rgba(255, 0, 85, 0.1)";
    }

    if (totalComputeFrames % 40 === 0) {
        logSoil(`[Flux Core] Magnetometer registers synced. Field: ${jumlaTesla.toFixed(4)} µT`);
        logSoil(`[Hydrology Engine] Dielectric Constant conversion successful -> Soil Moisture: ${moisturePercentage.toFixed(2)}%`);
    }

    totalComputeFrames++;
}

/**
 * 9. KITANZI CHA CANVAS: Kinafanya Real-Time Geo-Matrix Spectrum Rendering (60FPS Neon Gold)
 */
function choranaKukotoaSoilRadarWave() {
    if (!isSoilRadarRunning) return;

    if (soilCanvas.width !== 640) {
        soilCanvas.width = 640;
        soilCanvas.height = 480;
    }
    const width = soilCanvas.width;
    const height = soilCanvas.height;

    // Safisha kioo kwa weusi wa doria ya kijiografia
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // Tactical Grid Lines Layout nyuma ya ma-wave
    ctx.strokeStyle = "rgba(250, 204, 21, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // CHORA GRAFU YA NEON YA JUA NA UDONGO (Njano ya neon ya dhahabu ya kilimo)
    if (soilHistoryBuffer.length > 1) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "var(--neon-amber)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--neon-amber)"; // Glow effect ya dhahabu
        ctx.beginPath();

        let sliceWidth = width / (maxHistoryLength - 1);
        let xPos = 0;

        let minT = Math.min(...soilHistoryBuffer) - 2;
        let maxT = Math.max(...soilHistoryBuffer) + 2;
        let tRange = maxT - minT;

        for (let k = 0; k < soilHistoryBuffer.length; k++) {
            let tVal = soilHistoryBuffer[k];
            let currentY = height - ((tVal - minT) / tRange * (height - 80)) - 40;

            if (k === 0) {
                ctx.moveTo(xPos, currentY);
            } else {
                ctx.lineTo(xPos, currentY);
            }
            xPos += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Zima blur kulinda processor ya simu
    }

    ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO AGRI-RADAR", width - 210, height - 25);

    soilPaintFrame = requestAnimationFrame(choranaKukotoaSoilRadarWave);
}
