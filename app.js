// =================================================================
// AUTONOMOUS SIDEBAR TOGGLE CONTROLLER - CORE SIGNALS
// =================================================================

document.addEventListener("DOMContentLoaded", function() {
    // 1. KUKAMATA VIPENGELE VYA MAUNZI KUTOKA KWENYE HTML
    const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
    const sidebarProfile = document.querySelector('.sidebar-profile');

    // 2. KIKOMANDOO CHA SWICHI: AMRI YA KUFUNGUA NA KUFUNGA (TOGGLE)
    if (toggleSidebarBars && sidebarProfile) {
        toggleSidebarBars.onclick = function(e) {
            // Zuia amri isisafiri kwenda kwenye bodi ya nyuma (Event Propagation)
            e.stopPropagation(); 
            
            // Weka au ondoa class ya ufunguzi kitalanta
            sidebarProfile.classList.toggle('fungua-bars');
            
            console.log("[Sidebar Link] Active signal inverted. Current State: " + 
                        (sidebarProfile.classList.contains('fungua-bars') ? "OPEN" : "CLOSED"));
        };

        // 3. SECURE AUTO-CLOSE: Gonga popote nje ya sidebar ili ijifunge yenyewe
        document.addEventListener('click', function(event) {
            // Ukurasa ukiwa wazi, kagua kama kidole kimekanyaga nje ya bodi ya wasifu
            if (sidebarProfile.classList.contains('fungua-bars')) {
                if (!sidebarProfile.contains(event.target) && !toggleSidebarBars.contains(event.target)) {
                    sidebarProfile.classList.remove('fungua-bars');
                    console.log("[Sidebar Link] Click detected outside boundary. Sidebar automatically unlinked.");
                }
            }
        });
    } else {
        console.log("[-] WARNING: Vipengele vya dira ya sidebar havijapatikana kwenye kioo hiki.");
    }
});

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const weatherCanvas = document.getElementById('weatherCanvas');
const txtPressureValue = document.getElementById('txtPressureValue');
const txtAltitudeValue = document.getElementById('txtAltitudeValue');
const badgeStormStatus = document.getElementById('badgeStormStatus');
const weatherTerminalBox = document.getElementById('weatherTerminalBox');
const btnStartWeatherRadar = document.getElementById('btnStartWeatherRadar');
const lblPressureTrend = document.getElementById('lblPressureTrend');
const lblComputeRate = document.getElementById('lblComputeRate');

// MAPINDUZI: Kamata muktadha thabiti wa Canvas kwa jina la 'ctx'
const ctx = weatherCanvas.getContext('2d');

// 2. VARIABLES KUU ZA SHINA LA NDANI YA RAM
let barometerSensor = null;
let isWeatherRadarRunning = false;
let weatherPaintFrame = null;
let totalComputeFrames = 0;
let pressureHistoryBuffer = []; 
const maxHistoryLength = 60; 

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA MAREKANI KWENYE TERMINAL
function logWeather(ujumbe) {
    if (weatherTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        weatherTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        weatherTerminalBox.scrollTop = weatherTerminalBox.scrollHeight; 
    }
}

// 4. KISIKILIZI CHA KITUFE CHA DHAHABU
if (btnStartWeatherRadar) {
    btnStartWeatherRadar.onclick = function(e) {
        e.stopPropagation();
        if (isWeatherRadarRunning) {
            zimaMtamboWaWeatherRadarOffline();
        } else {
            washaMtamboWaWeatherRadarOffline();
        }
    };
}

/**
 * 5. AMRI YA KUZIMA HARDWARE
 */
function zimaMtamboWaWeatherRadarOffline() {
    isWeatherRadarRunning = false;
    logWeather("Inasitisha sensor ya Barometer... Hardware loop detached.");
    
    if (barometerSensor) {
        try { barometerSensor.stop(); } catch(err){}
    }
    
    if (weatherPaintFrame) cancelAnimationFrame(weatherPaintFrame);
    
    btnStartWeatherRadar.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> AMRE: WASHA BAROMETRIC RADAR (ENGAGE SENSOR)`;
    btnStartWeatherRadar.style.background = "var(--neon-cyan)";
    btnStartWeatherRadar.style.color = "#02050d";
    
    badgeStormStatus.innerText = "STANDBY MODE";
    badgeStormStatus.style.borderColor = "var(--neon-green)";
    badgeStormStatus.style.color = "var(--neon-green)";
    badgeStormStatus.style.background = "rgba(0, 255, 102, 0.05)";
    
    ctx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
}

/**
 * 6. AMRI YA KUWASHA SENSOR
 */
function washaMtamboWaWeatherRadarOffline() {
    logWeather("Inakagua na kuamsha sensorer ya presha ya hewa... Engaged.");
    isWeatherRadarRunning = true;

    btnStartWeatherRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: ZIMA BAROMETRIC RADAR (DISENGAGE)`;
    btnStartWeatherRadar.style.background = "var(--neon-storm)";
    btnStartWeatherRadar.style.color = "#fff";

    badgeStormStatus.innerText = "MONITORING LIVE";
    badgeStormStatus.style.borderColor = "var(--neon-amber)";
    badgeStormStatus.style.color = "var(--neon-amber)";
    badgeStormStatus.style.background = "rgba(250, 204, 21, 0.05)";

    if ('Barometer' in window) {
        try {
            barometerSensor = new Barometer({ frequency: 1 });
            
            barometerSensor.addEventListener('reading', () => {
                let rawPressure = barometerSensor.pressure;
                pigaHesabuZoteZaHaliYaHewaOffline(rawPressure);
            });

            barometerSensor.addEventListener('error', event => {
                logWeather(`[⚠️ Sensor Bypass] Barometer imefungwa. Inawasha Math Fallback Matrix.`);
                washaUigizajiWaPreshaKihesabu();
            });

            barometerSensor.start();
            logWeather("⚡ SUCCESS: Sensor halisi ya Barometer ya simu imewaka 100% Offline!");
        } catch (err) {
            washaUigizajiWaPreshaKihesabu();
        }
    } else {
        logWeather("[ℹ️ Notification] Vifaa vya Barometer havijapatikana. Inasimika Math Vector Engine...");
        washaUigizajiWaPreshaKihesabu();
    }

    requestAnimationFrame(choranaKukotoaHaliYaHewaWave);
}

/**
 * Mfumo mseto wa kihesabu wa kuzalisha mawimbi ya presha ya dharura
 */
function washaUigizajiWaPreshaKihesabu() {
    logWeather("[Math Core] Mtambo wa uigizaji wa mawimbi ya presha ya hewa ya Mbozi umewaka.");
    
    // Mtambo unalisha data kila sekunde 1 kitalanta kabisa
    const simulationClock = setInterval(() => {
        if (!isWeatherRadarRunning) {
            clearInterval(simulationClock);
            return;
        }
        
        let simulatedBase = 1011.5;
        let tishioLaDhoruba = Math.sin(totalComputeFrames * 0.1) * 4.5;
        let noiseHaifu = (Math.random() - 0.5) * 0.3;
        
        let pressureSimulated = simulatedBase + tishioLaDhoruba + noiseHaifu;
        
        // MAREKEBISHO YA USHINDI: Variable sasa imelingana kwa 100% hapa!
        pigaHesabuZoteZaHaliYaHewaOffline(pressureSimulated);
    }, 1000);
}

/**
 * 7. PIPELINE YA HESABU: Inayopiga milinganyo ya Altitude na Barometric Tendency
 */
function pigaHesabuZoteZaHaliYaHewaOffline(preshaSafi) {
    if (!isWeatherRadarRunning) return;

    txtPressureValue.innerText = `${preshaSafi.toFixed(1)} hPa`;

    pressureHistoryBuffer.push(preshaSafi);
    if (pressureHistoryBuffer.length > maxHistoryLength) {
        pressureHistoryBuffer.shift(); 
    }

    // FORMULA YA HYPSOMETRIC ALTITUDE CALCULUS
    let altitudeMeters = 44330 * (1 - Math.pow((preshaSafi / 1013.25), 0.190284));
    if (altitudeMeters < 0) altitudeMeters = 0;
    
    txtAltitudeValue.innerHTML = `<i class="fa-solid fa-mountain"></i> Est. Altitude: ${altitudeMeters.toFixed(2)} m`;

    if (pressureHistoryBuffer.length >= 2) {
        let preshaYaZamani = pressureHistoryBuffer[0];
        let tofautiYaPresha = preshaSafi - preshaYaZamani; 
        
        if (lblComputeRate) {
            lblComputeRate.innerText = `${tofautiYaPresha.toFixed(3)} hPa/trend`;
        }

        if (tofautiYaPresha <= -0.5) {
            badgeStormStatus.innerText = "⚠️ STORM WARNING // RAIN RISK HIGH";
            badgeStormStatus.style.color = "var(--neon-storm)";
            badgeStormStatus.style.borderColor = "var(--neon-storm)";
            badgeStormStatus.style.background = "rgba(255, 0, 85, 0.1)";
            lblPressureTrend.innerText = "RAPID DROPPING STATE";
            lblPressureTrend.style.color = "var(--neon-storm)";
        } else if (tofautiYaPresha > -0.5 && tofautiYaPresha < 0.5) {
            badgeStormStatus.innerText = "ATMOSPHERE STABLE // SUNNY OR OVERCAST ☀️";
            badgeStormStatus.style.color = "var(--neon-green)";
            badgeStormStatus.style.borderColor = "var(--neon-green)";
            badgeStormStatus.style.background = "rgba(0, 255, 102, 0.1)";
            lblPressureTrend.innerText = "STABLE BAR STATE";
            lblPressureTrend.style.color = "var(--neon-green)";
        } else if (tofautiYaPresha >= 0.5) {
            badgeStormStatus.innerText = "CLEAR SKIES AHEAD // HIGH PRESSURE ⛅";
            badgeStormStatus.style.color = "var(--neon-cyan)";
            badgeStormStatus.style.borderColor = "var(--neon-cyan)";
            badgeStormStatus.style.background = "rgba(56, 189, 248, 0.1)";
            lblPressureTrend.innerText = "RISING BAR VECTOR";
            lblPressureTrend.style.color = "var(--neon-cyan)";
        }
    }

    totalComputeFrames++;
}

/**
 * 8. KITANZI CHA CANVAS: Kinafanya Real-Time 2D Rendering ya grafu ya neon (60FPS)
 */
function choranaKukotoaHaliYaHewaWave() {
    if (!isWeatherRadarRunning) return;

    if (weatherCanvas.width !== 640) {
        weatherCanvas.width = 640;
        weatherCanvas.height = 480;
    }
    const width = weatherCanvas.width;
    const height = weatherCanvas.height;

    ctx.fillStyle = "#000205";
    ctx.fillRect(0, 0, width, height);

    // Tactical Grid Lines Layout
    ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    if (pressureHistoryBuffer.length > 1) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#38bdf8"; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#38bdf8"; 
        ctx.beginPath();

        let sliceWidth = width / (maxHistoryLength - 1);
        let currentX = 0;

        let minP = Math.min(...pressureHistoryBuffer) - 1;
        let maxP = Math.max(...pressureHistoryBuffer) + 1;
        let pRange = maxP - minP;

        // MAREKEBISHO YA CHUMA: Kitengo kimeshasawazishwa kuwa herufi 'k' mfululizo! No more freezing!
        for (let k = 0; k < pressureHistoryBuffer.length; k++) {
            let pVal = pressureHistoryBuffer[k];
            let currentY = height - ((pVal - minP) / pRange * (height - 80)) - 40;

            if (k === 0) {
                ctx.moveTo(currentX, currentY);
            } else {
                ctx.lineTo(currentX, currentY);
            }
            currentX += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Zima shadow blur mara moja kulinda processor ya simu
    }

    ctx.fillStyle = "rgba(0, 255, 102, 0.4)";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillText("⚡ JUMANNE VEO RADAR", width - 180, height - 30);

    weatherPaintFrame = requestAnimationFrame(choranaKukotoaHaliYaHewaWave);
}
