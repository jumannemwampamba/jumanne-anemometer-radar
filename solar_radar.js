// =================================================================
// AUTONOMOUS SOLAR ORBIT TRACKER - CORE VOLTAGE (PART 1)
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KUTOKA KWENYE index.html
const solarCanvas = document.getElementById('solarCanvas');
const ctx = solarCanvas.getContext('2d');
const txtAzimuthValue = document.getElementById('txtAzimuthValue');
const txtElevationValue = document.getElementById('txtElevationValue');
const badgeSolarStatus = document.getElementById('badgeSolarStatus');
const solarTerminalBox = document.getElementById('solarTerminalBox');
const btnStartSolarRadar = document.getElementById('btnStartSolarRadar');
const lblSolarTrend = document.getElementById('lblSolarTrend');
const toggleSidebarBars = document.getElementById('toggle-sidebar-bars');
const sidebarProfile = document.querySelector('.sidebar-profile');

// 2. VARIABLES KUU ZA NDANI YA RAM (ASTRONOMICAL REGISTERS)
let isSolarRadarRunning = false;
let solarPaintFrame = null;
let hardwareHeadingCompass = 0; // Nyuzi za dira ya sumaku kutoka Kaskazini (0-360)
let localLatitude = -9.26;      // Majiranukta halisi ya Mbozi, Tanzania (Latitude)
let localLongitude = 32.75;     // Majiranukta halisi ya Mbozi, Tanzania (Longitude)

// 3. FUNCTION YA KUTEMA LOGS HALISI ZA KISAYANSI KWENYE TERMINAL
function logSolar(ujumbe) {
    if (solarTerminalBox) {
        const muda = new Date().toLocaleTimeString();
        solarTerminalBox.innerHTML += `\n[${muda}] ${ujumbe}`;
        solarTerminalBox.scrollTop = solarTerminalBox.scrollHeight;
    }
}

// 4. KIKOKOTOO CHA TAREHE: Piga hesabu ya siku ya mwaka (Day of the Year for 2026)
function pataSikuYaMwaka() {
    const sasa = new Date();
    const mwanzo = new Date(sasa.getFullYear(), 0, 1);
    const tofautiMuda = sasa - mwanzo;
    const sikuMojaMs = 1000 * 60 * 60 * 24;
    return Math.floor(tofautiMuda / sikuMojaMs) + 1;
}

// 5. KISIKILIZI CHA KITUFE CHA DHAHABU (USER-INTENT SENSOR ACTVATOR)
if (btnStartSolarRadar) {
    btnStartSolarRadar.onclick = function(e) {
        e.stopPropagation();
        if (isSolarRadarRunning) {
            zimaMtamboWaSolarRadarOffline();
        } else {
            washaMtamboWaSolarRadarOffline();
        }
    };
}

// 6. AMRI YA BARS MENU YA KUTELEZESHA SIDEBAR ON MOBILE
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
 * 7. AMRI YA KUZIMA HARDWARE (SENSOR RECOVERY SHUTDOWN)
 */
function zimaMtamboWaSolarRadarOffline() {
    isSolarRadarRunning = false;
    logSolar("Inasitisha doria ya sumaku... Sensor loop detached.");
    
    // Futa kisikilizi cha dira ya sumaku kwenye hardware ya simu
    window.removeEventListener('deviceorientation', handleCompassOrientation, true);
    window.removeEventListener('deviceorientationabsolute', handleCompassOrientation, true);
    
    if (solarPaintFrame) cancelAnimationFrame(solarPaintFrame);
    
    btnStartSolarRadar.innerHTML = `<i class="fa-solid fa-circle-nodes"></i> AMRE: WASHA DIAL COMPASS (ENGAGE MAGNETOMETER)`;
    btnStartSolarRadar.style.background = "var(--neon-amber)";
    btnStartSolarRadar.style.color = "#020408";
    
    badgeSolarStatus.innerText = "STANDBY MODE";
    badgeSolarStatus.style.borderColor = "var(--neon-green)";
    badgeSolarStatus.style.color = "var(--neon-green)";
    badgeSolarStatus.style.background = "rgba(0, 255, 102, 0.05)";
    
    ctx.clearRect(0, 0, solarCanvas.width, solarCanvas.height);
}
// =================================================================
// AUTONOMOUS SOLAR ORBIT TRACKER - SENSOR & ASTRO MATH (PART 2)
// =================================================================

/**
 * 8. AMRI YA KUWASHA SENSOR (COMPASS ALIGNMENT & INFRASTRUCTURE ENGAGEMENT)
 */
function washaMtamboWaSolarRadarOffline() {
    logSolar("Inatafuta uelekeo wa Kaskazini... Engaging Magnetometer sensor.");
    isSolarRadarRunning = true;

    btnStartSolarRadar.innerHTML = `<i class="fa-solid fa-power-off"></i> AMRE: ZIMA DIAL COMPASS (DISENGAGE)`;
    btnStartSolarRadar.style.background = "var(--neon-storm)";
    btnStartSolarRadar.style.color = "#fff";

    badgeSolarStatus.innerText = "TRACKING ORBIT";
    badgeSolarStatus.style.borderColor = "var(--neon-amber)";
    badgeSolarStatus.style.color = "var(--neon-amber)";
    badgeSolarStatus.style.background = "rgba(250, 204, 21, 0.05)";

    // A. TEGA MASIKIO KWENYE DIRA YA SUMAKU YA SIMU (COMPASS HARDWARE HEADING)
    if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleCompassOrientation, true);
        logSolar("⚡ SUCCESS: Sensor halisi ya Dira ya Sumaku (Absolute Magnetometer) imewaka!");
    } else if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleCompassOrientation, true);
        logSolar("⚡ SUCCESS: Sensor ya kawaida ya DeviceOrientation imezinduliwa Offline.");
    } else {
        logSolar("[ℹ️ Notification] Vifaa vya Dira havijapatikana. Inatumia uelekeo wa dharura (0° North).");
    }

    // B. Amsha kitanzi cha Live Spatial Canvas Graphics kwa 60FPS
    requestAnimationFrame(choranaKukotoaSolarRadarWave);
}

/**
 * Kazi inayochambua mawimbi ya dira kuzuia makosa ya simu ya Android na iPhone (Heading Fix)
 */
function handleCompassOrientation(event) {
    if (!isSolarRadarRunning) return;
    
    // Angalia uelekeo wa dira ya chuma (Compass Heading kuelekea North)
    if (event.webkitCompassHeading) {
        hardwareHeadingCompass = event.webkitCompassHeading; // Ufumbuzi wa vifaa vya iPhone
    } else if (event.alpha !== null) {
        // Ufumbuzi wa vifaa vya Android (alpha inazunguka kinyume, tunaigeuza kisheria)
        hardwareHeadingCompass = 360 - event.alpha;
    }
}

/**
 * 9. INFRASTRUCTURE CALCULUS ENGINE: Kupiga fomula ngumu za Solar Coordinates (Azimuth & Elevation)
 */
function pigaHesabuZaJuaMbozi() {
    // A. Tafuta wakati halisi wa sasa hivi hapa Mbozi leo tarehe 7 Septemba 2026
    const sasa = new Date();
    const masaaLocal = sasa.getHours() + sasa.getMinutes() / 60 + sasa.getSeconds() / 3600;
    
    // B. Hesabu Siku ya Mwaka (Day of the Year)
    const N = pataSikuYaMwaka();

    // C. PIGA FORMULA YA DECLINATION ANGLE (𝛿 - Nyuzi ya mwinuko wa jua kaskazini au kusini mwa ikweta)
    // Kanuni safi ya kujiografia ya Spencer (Fourier Series Approximation)
    const fractionalYearRad = (2 * Math.PI / 365) * (N - 1 + (masaaLocal - 12) / 24);
    const declinationRad = 0.006918 - 0.399912 * Math.cos(fractionalYearRad) + 0.070257 * Math.sin(fractionalYearRad) 
                           - 0.006758 * Math.cos(2 * fractionalYearRad) + 0.000907 * Math.sin(2 * fractionalYearRad) 
                           - 0.002697 * Math.cos(3 * fractionalYearRad) + 0.00148 * Math.sin(3 * fractionalYearRad);
    
    const declinationDeg = declinationRad * (180 / Math.PI);

    // D. PIGA FORMULA YA SOLAR HOUR ANGLE (𝜔 - Nyuzi za mzunguko wa dunia kwa saa)
    const equationOfTimeMin = 229.18 * (0.000075 + 0.001868 * Math.cos(fractionalYearRad) - 0.032077 * Math.sin(fractionalYearRad)
                              - 0.014615 * Math.cos(2 * fractionalYearRad) - 0.040849 * Math.sin(2 * fractionalYearRad));
    
    // Solar Time Correction kwa ajili ya Longitude ya Mbozi (32.75° East) dhidi ya Standard Meridian (37.5° East EAT)
    const timeZoneMeridian = 37.5;
    const timeLongitudeCorrection = 4 * (localLongitude - timeZoneMeridian) + equationOfTimeMin;
    const solarTimeHours = masaaLocal + (timeLongitudeCorrection / 60);
    const hourAngleDeg = 15 * (solarTimeHours - 12);
    const hourAngleRad = hourAngleDeg * (Math.PI / 180);

    // E. PIGA FORMULA YA ELEVATION ANGLE (𝛼 - Urefu wa jua kutoka ukingo wa upeo wa macho)
    const latRad = localLatitude * (Math.PI / 180);
    const sinElevation = Math.sin(latRad) * Math.sin(declinationRad) + Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
    const elevationRad = Math.asin(sinElevation);
    let elevationDeg = elevationRad * (180 / Math.PI);

    // F. PIGA FORMULA YA SOLAR AZIMUTH ANGLE (𝜙 - Mwelekeo wa jua kuanzia Kaskazini mwa dira)
    const cosAzimuth = (Math.sin(declinationRad) - Math.sin(latRad) * Math.sin(elevationRad)) / (Math.cos(latRad) * Math.cos(elevationRad));
    let azimuthRad = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))); // Piga ukingo kuzuia NaN errors
    let azimuthDeg = azimuthRad * (180 / Math.PI);

    // Rekebisha nyuzi za azimuth kulingana na asubuhi au jioni (Hour Angle Sign Check)
    if (hourAngleDeg > 0) {
        azimuthDeg = 360 - azimuthDeg;
    }

    return {
        azimuth: azimuthDeg,
        elevation: elevationDeg,
        dayIndex: N
    };
}
// =================================================================
// AUTONOMOUS SOLAR ORBIT TRACKER - GRAPHICS & RENDER (PART 3 - FINAL)
// =================================================================

/**
 * 10. KITANZI KIKUU: Kinafanya Real-Time Spatial Spatial Canvas Rendering (60FPS Neon Gold)
 */
function choranaKukotoaSolarRadarWave() {
    if (!isSolarRadarRunning) return;

    // Lazimisha upana thabiti wa chuma ili dira isiandame kishujaa kiooni
    if (solarCanvas.width !== 640) {
        solarCanvas.width = 640;
        solarCanvas.height = 480;
    }
    const width = solarCanvas.width;
    const height = solarCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // A. Piga hesabu za astronomia za jua za sekunde hii hii hapa Mbozi
    const dataJua = pigaHesabuZaJuaMbozi();
    
    // B. Sasisha namba za kidijitali za kioo cha kulia
    txtAzimuthValue.innerText = `${dataJua.azimuth.toFixed(1)}° AZ`;
    txtElevationValue.innerHTML = `<i class="fa-solid fa-sun-plant-wilt"></i> Sun Elevation: ${dataJua.elevation.toFixed(2)}°`;

    // Badilisha beji ya hali ya jua kulingana na mwinuko wake (Day/Night state)
    if (dataJua.elevation > 0) {
        badgeSolarStatus.innerText = "SUN ABOVE HORIZON ☀️";
        badgeSolarStatus.style.color = "var(--neon-amber)";
        badgeSolarStatus.style.borderColor = "var(--neon-amber)";
        badgeSolarStatus.style.background = "rgba(250, 204, 21, 0.1)";
        if (lblSolarTrend) {
            lblSolarTrend.innerText = "ACTIVE SOLAR ENERGY WINDOW";
            lblSolarTrend.style.color = "var(--neon-green)";
        }
    } else {
        badgeSolarStatus.innerText = "SUN BELOW HORIZON 🌙";
        badgeSolarStatus.style.color = "var(--neon-cyan)";
        badgeSolarStatus.style.borderColor = "var(--neon-cyan)";
        badgeSolarStatus.style.background = "rgba(56, 189, 248, 0.1)";
        if (lblSolarTrend) {
            lblSolarTrend.innerText = "NIGHT CYCLE / NO OPTICAL VECTOR";
            lblSolarTrend.style.color = "var(--neon-storm)";
        }
    }

    // C. Safisha background kwa weusi thabiti wa anga giza la kiganga
    ctx.fillStyle = "#000103";
    ctx.fillRect(0, 0, width, height);

    // D. CHORA DIAL COMPASS CO-ORDINATES: Inajizungusha live kufuata dira ya sumaku ya simu!
    ctx.save();
    ctx.translate(centerX, centerY);
    // Geuza kioo kizima kulingana na uelekeo wa simu halisi (Heading rotation in radians)
    ctx.rotate(-hardwareHeadingCompass * Math.PI / 180);

    // Chora duara kuu la dira ya neon ya dhahabu
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Chora alama za nyuzi na doria (Compass ticks for North, South, East, West)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    // Alama ya Kaskazini (North)
    ctx.fillText("N", 0, -radius + 15);
    // Alama ya Kusini (South)
    ctx.fillText("S", 0, radius - 15);
    // Alama ya Mashariki (East)
    ctx.fillText("E", radius - 15, 0);
    // Alama ya Magharibi (West)
    ctx.fillText("W", -radius + 15, 0);

    // Chora mistari ya siri ya doria ya crosshair ya dira
    ctx.strokeStyle = "rgba(250, 204, 21, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(0, radius); ctx.stroke();

    // =================================================================
    // E. CHORA MSHALE WA JUA: Mshale unaelekeza wapi jua lilipo angani sekunde hii!
    // =================================================================
    // Azimuth ya jua inahesabiwa kutoka North kwenda saa (Clockwise), tunaigeuza iingie kwenye radians
    let solarAngleRad = (dataJua.azimuth - 90) * Math.PI / 180;
    
    // Urefu wa mshale unategemea kama joto la jua lipo juu (Elevation scaling effect)
    let solarArrowLength = radius * Math.cos(Math.max(0, dataJua.elevation) * Math.PI / 180);
    let sunTargetX = solarArrowLength * Math.cos(solarAngleRad);
    let sunTargetY = solarArrowLength * Math.sin(solarAngleRad);

    // Chora mstari wa neon wa uelekeo wa jua
    ctx.lineWidth = 4;
    ctx.strokeStyle = "var(--neon-amber)";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "var(--neon-amber)"; // Glow effect ya jua
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sunTargetX, sunTargetY);
    ctx.stroke();

    // Chora lile duara la jua lenyewe la neon mwishoni mwa mshale mkuu
    if (dataJua.elevation > 0) {
        ctx.fillStyle = "var(--neon-amber)";
        ctx.beginPath();
        ctx.arc(sunTargetX, sunTargetY, 12, 0, 2 * Math.PI);
        ctx.fill();
    } else {
        // Jua likiwa limezama, chora kama alama ya siri ya anga la usiku (Dotted orbit halo)
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sunTargetX, sunTargetY, 8, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.shadowBlur = 0; // Zima shadow blur mara moja kulinda processor ya simu

    ctx.restore(); // Rudisha kioo kwenye muundo wake wa asili wa juu

    // Kaunta ya mahesabu ya chuma chini ya kioo ya doria ya kila sekunde
    if (totalComputeFrames % 60 === 0) {
        logSolar(`[Astro Core] Orbital matrix links synced. DOY Index: #${dataJua.dayIndex}`);
        logSolar(`[Spatial Engine] Sol Vector -> Azimuth: ${dataJua.azimuth.toFixed(2)}° | Elevation: ${dataJua.elevation.toFixed(2)}°`);
    }

    totalComputeFrames++;
    
    // G. KITANZI CHA MAUNZI: Teleza mfululULE KASI YA RADI LIVE PORINI
    totalComputeFrames = totalComputeFrames % 100000; // Kinga ya RAM variable overflow
    solarPaintFrame = requestAnimationFrame(choranaKukotoaSolarRadarWave);
}
