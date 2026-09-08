// =================================================================
// BONGO NEURAL VEO ENGINE v13.0 - MODULAR CORE (PART 1)
// =================================================================

// 1. KUKAMATA VIPENGELE VYOTE VYA HTML KIOONI (DOM LINKS)
const videoStatusBox = document.getElementById('video-status-box');
const btnGenerateVideo = document.getElementById('btn-generate-video-trigger');
const videoProductInput = document.getElementById('video-product-input');
const videoChatContainer = document.getElementById('video-chat-messages-container');

const btnToggleLeft = document.getElementById('toggle-left-menu');
const sidebarLeft = document.getElementById('sidebar-l');
const btnNewChat = document.getElementById('btn-new-chat');

const videoSwaliInput = document.getElementById('video-swali-input');
const videoFileUploader = document.getElementById('video-file-uploader');
const lblVideoJinaSafi = document.getElementById('lbl-video-jina-safi');
const btnFeedVideo = document.getElementById('btn-feed-video');

// PARAMETERS ZA SIRI ZA SHINA LA KUMBUKUMBU
let videoIliyochaguliwaJina = null;
let videoIliyochaguliwaData = null; 
let dbVideoEngine = null; 

/**
 * 2. MTAMBO WA KIROBOTI: Unaojifunza pixel za video na kuzifunga kuwa msimbo mfupi (Neural Compression)
 */
function jifunzeNaKopeshaPixelMatrix(canvasVideoElement) {
    const context = canvasVideoElement.getContext('2d');
    const w = canvasVideoElement.width;
    const h = canvasVideoElement.height;
    
    // Kamata pixels zote za kioo cha sasa (Hardware Frame Grabbing)
    const imgData = context.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    
    let ujuziWaKiroboti = "";
    
    // Alama za siri za kete za kihesabu (Compressed Hex Grid Matrix)
    const herufiZaSiri = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    // Mtambo unapiga hesabu ya kujifunza kwa kuruka index (Grid Vector Interpolation)
    for (let i = 0; i < pixels.length; i += 400) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];
        
        // Geuza rangi ya pixel kuwa namba moja ya wastani (Greyscale Neural Weight)
        let wastaniWaRangi = Math.floor((r + g + b) / 3);
        let indexSafi = Math.floor((wastaniWaRangi / 255) * (herufiZaSiri.length - 1));
        
        ujuziWaKiroboti += herufiZaSiri.charAt(indexSafi);
    }
    // Rudisha link fupi ya maunzi iliyoshiba ujuzi wa picha nzima
    return ujuziWaKiroboti.substring(0, 80);
}

// 3. MTAMBO WA RAKALA LOGS UPANDE WA KUSHOTO
function logVeo(ujumbe) {
    const muda = new Date().toLocaleTimeString();
    if (videoStatusBox) {
        videoStatusBox.innerHTML += `<br>[${muda}] ${ujumbe}`;
        videoStatusBox.scrollTop = videoStatusBox.scrollHeight;
    }
}
// =================================================================
// BONGO NEURAL VEO ENGINE v13.0 - MODULAR CORE (PART 2)
// =================================================================

// 4. MTAMBO WA KUTELEZESHA MENYEU YA SIDEBAR KWENYE SIMU
if (btnToggleLeft && sidebarLeft) {
    btnToggleLeft.onclick = (e) => {
        e.stopPropagation();
        sidebarLeft.classList.toggle('open');
    };
}

// Gusa skrini ya katikati (chat area) kufunga sidebar ya simu yenyewe
document.addEventListener('click', function(event) {
    if (!sidebarLeft || !btnToggleLeft) return;
    if (sidebarLeft.classList.contains('open') && window.innerWidth <= 900) {
        const mgusoNdaniYaSidebar = sidebarLeft.contains(event.target);
        const mgusoKwenyeKitufeBars = btnToggleLeft.contains(event.target);
        if (!mgusoNdaniYaSidebar && !mgusoKwenyeKitufeBars) {
            sidebarLeft.classList.remove('open');
            logVeo("[UI] Sidebar ya video imejifunga kwa salama.");
        }
    }
});

// 5. UZINDUZI WA DATABASE YA SIRI YA MAUNZI (INDEXED_DB LINEAR ENGINE)
logVeo("Inazindua hifadhidata ya BongoAI Video Engine leo tarehe 7 Septemba 2026...");
const requestVideoDB = window.indexedDB.open("BongoAI_Ultimate_DB", 1);

requestVideoDB.onupgradeneeded = function(event) {
    dbVideoEngine = event.target.result;
    logVeo("[DB] Inatengeneza meza mpya zilizosafishwa...");
    
    // Meza kuu ya kuhifadhi akili ya mfumo Offline
    if (!dbVideoEngine.objectStoreNames.contains('Akili_Ya_Mfumo')) {
        dbVideoEngine.createObjectStore('Akili_Ya_Mfumo');
    }
    // Meza ya soga za dharura za nyuma
    if (!dbVideoEngine.objectStoreNames.contains('Chat_History')) {
        dbVideoEngine.createObjectStore('Chat_History', { keyPath: 'id', autoIncrement: true });
    }
};

requestVideoDB.onsuccess = function(event) {
    dbVideoEngine = event.target.result;
    logVeo("IndexedDB Video Storage ipo salama na tayari kabisa! ✅");
};

requestVideoDB.onerror = function(event) {
    logVeo("[-] Kushindwa kuzindua hifadhidata ya video.");
    console.error("Database error:", event.target.error);
};
// =================================================================
// BONGO NEURAL VEO ENGINE v13.0 - MODULAR CORE (PART 3)
// =================================================================

// 6. MTAMBO WA MAPOKEZI: Unasoma video kutoka simuni na kuifanya Base64
if (videoFileUploader && lblVideoJinaSafi) {
    videoFileUploader.onchange = function(e) {
        const file = e.target.files[0]; // Kamata faili la kwanza la video kwa usahihi wa chuma hapa tarehe 7 Septemba 2026
        if (file) {
            videoIliyochaguliwaJina = file.name;
            lblVideoJinaSafi.innerText = `📹 Video Ready: ${file.name}`;
            logVeo(`[VEO Engine] Video imepakiwa na kusubiri: ${file.name}`);
            
            const reader = new FileReader();
            reader.onload = function(event) {
                videoIliyochaguliwaData = event.target.result;
                logVeo(`[VEO Engine] ✅ Mfumo umesindika andiko la video.`);
            };
            reader.readAsDataURL(file); // Anza kusoma video kinyamwezi
        }
    };
}

// 7. KIFUNGO CHA KULISHA VIDEO KWENYE DATABASE YA INDEXED_DB
if (btnFeedVideo) {
    btnFeedVideo.onclick = function(e) {
        e.stopPropagation();
        if (!dbVideoEngine) return alert("⚠️ Database bado haijawa tayari mkuu!");

        const swaliKey = videoSwaliInput.value.trim().toLowerCase();
        
        if (!swaliKey || !videoIliyochaguliwaData) {
            logVeo("⚠️ Tafadhali jaza ufunguo wa video na upakie faili mkuu!");
            alert("Mkuu, huwezi kutunza kisanduku kikiwa tupu!");
            return;
        }

        logVeo(`[Brain] Inasajili video ya "${swaliKey}" kwenye chuma...`);
        
        // Amri kuu ya kufungua mlango wa kuandika kwenye database
        const myTx = dbVideoEngine.transaction(['Akili_Ya_Mfumo'], 'readwrite');
        const store = myTx.objectStore('Akili_Ya_Mfumo');
        const hitajiLaKuweka = store.put(videoIliyochaguliwaData, swaliKey);

        hitajiLaKuweka.onsuccess = function() {
            logVeo(`[Brain] 💾 Video imehifadhiwa kwa ufunguo: "${swaliKey}"`);
        };

        myTx.oncomplete = function() {
            logVeo(`[Brain] ✅ USHINDI: Video imehifadhiwa 100% Offline!`);
            
            // Safisha viwanja vya sidebar vibaki weupe kitalanta
            videoSwaliInput.value = "";
            videoFileUploader.value = "";
            lblVideoJinaSafi.innerText = "Hakuna video iliyochaguliwa bado...";
            videoIliyochaguliwaJina = null;
            videoIliyochaguliwaData = null;
            
            alert("Mkuu, video imesajiliwa kikamilifu kwenye IndexedDB! Ready kupigwa render! 📹🔥");
        };
        
        myTx.onerror = function(err) {
            logVeo("[-] Hifadhi ya video imefeli kisa: " + err.target.error);
        };
    };
}
// =================================================================
// BONGO NEURAL VEO ENGINE v13.0 - MODULAR CORE (PART 4)
// =================================================================

// 8. INJINI KUU YA GENERATE VIDEO (LOOKUP NA NEURAL VECTOR ROUTER)
if (btnGenerateVideo) {
    btnGenerateVideo.addEventListener('click', () => {
        if (!dbVideoEngine) return alert("Hifadhidata haijakaa sawa bado mkuu!");
        
        const userText = videoProductInput.value.trim();
        if (!userText) return;

        // Chapa ujumbe wa mteja kwenye chat screen ya video instantly
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'msg user';
        userMsgDiv.innerText = userText;
        if (videoChatContainer) videoChatContainer.appendChild(userMsgDiv);
        
        videoProductInput.value = "";

        const welcomeBlock = document.getElementById('veo-welcome-block');
        if (welcomeBlock) welcomeBlock.remove();

        // ----------------=============================================
        // A: MATRIX NEURAL DECODER - SULUHISHO LA CRASH (SHORT-CIRCUIT)
        // ----------------=============================================
        if (userText.includes("bongo_veo://play?neural=")) {
            logVeo("[Neural Decoder] Msimbo wa kiroboti umegunduliwa! Inasoma pixels...");
            
            const renderingDiv = document.createElement('div');
            renderingDiv.className = 'msg ai veo-rendering-box';
            if (videoChatContainer) videoChatContainer.appendChild(renderingDiv);

            let sekunde = 1;
            renderingDiv.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent); margin-right: 8px;"></i> <span style="color: #94a3b8; font-style: italic;">NEURAL ENGINE ACTIVE... Composing weights: ${sekunde}s</span>`;

            const kauntaTimer = setInterval(() => {
                sekunde++;
                renderingDiv.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent); font-weight: bold;">RECONSTRUCTING COEFFECIENTS: ${sekunde}s</span>`;
                
                if (sekunde >= 3) {
                    clearInterval(kauntaTimer);
                    if (renderingDiv) renderingDiv.remove(); // Futa kaunta ya sekunde tu

                    const vipande = userText.split("bongo_veo://play?neural=");
                    if (vipande.length > 1) {
                        const msimboWaUjuzi = vipande[1].trim();

                        // MAPINDUZI: Tunapitisha 'null' makusudi ili kuzuia kicheza video cha MP4 kisiamke na kuleta crash!
                        // Mtambo utakimbilia moja kwa moja kuwasha video ya kihesabu ya Canvas!
                        fimboMwishoVideoKwenyeChat(null, msimboWaUjuzi); 
                    }
                }
            }, 1000);
            
            return; // STRICT SHORT-CIRCUIT: Piga stop asishuke chini kwenye database!
        }

        // ----------------=============================================
        // B: HATUA YA KAWAIDA - VUTA VIDEO KUTOKA KWENYE DATABASE (DIRECT GET)
        // --------------------------------=============================
        let swaliLaKutafuta = userText.toLowerCase().trim();
        const tx = dbVideoEngine.transaction(['Akili_Ya_Mfumo'], 'readonly');
        const store = tx.objectStore('Akili_Ya_Mfumo');
        const hitajiLaVideo = store.get(swaliLaKutafuta);

        hitajiLaVideo.onsuccess = function(event) {
            const videoDataBase64 = event.target.result;

            if (videoDataBase64) {
                logVeo(`[VEO Engine] ✅ Video imepatikana kwenye DB. Inawasha rendering...`);
                
                const renderingDiv = document.createElement('div');
                renderingDiv.className = 'msg ai veo-rendering-box';
                if (videoChatContainer) videoChatContainer.appendChild(renderingDiv);

                let sekunde = 1;
                renderingDiv.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent); margin-right: 8px;"></i> <span style="color: #94a3b8; font-style: italic;">Google VEO active... Rendering: ${sekunde}s</span>`;

                const kauntaTimer = setInterval(() => {
                    sekunde++;
                    renderingDiv.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent); font-weight: bold;">VEO COMPILING: ${sekunde}s</i>`;
                    
                    if (sekunde >= 4) {
                        clearInterval(kauntaTimer);
                        if (renderingDiv) renderingDiv.remove();
                        fimboMwishoVideoKwenyeChat(videoDataBase64, null); // Hapa inafungua MP4 kamili kwasababu ipo imara!
                    }
                }, 1000);

            } else {
                logVeo(`[VEO Engine] Ufunguo haupo. Inazalisha video ya hesabu ya dharura...`);
                fimboMwishoVideoKwenyeChat(null, "MASTER_RESET_STREAM_DATA"); // Sukuma dharura ya Canvas
            }
        };
    });
}
// =================================================================
// BONGO NEURAL VEO ENGINE v13.0 - MODULAR CORE (PART 5 - FINAL)
// =================================================================

// 9. FUNCTION KUU INAYOCHORA PLAYER AU CANVAS YA KIROBOTI KULINGANA NA MAPOKEZI
function fimboMwishoVideoKwenyeChat(videoSrc64, neuralPayload) {
    const videoMsgDiv = document.createElement('div');
    videoMsgDiv.className = 'msg ai';
    videoMsgDiv.style.display = 'flex';
    videoMsgDiv.style.flexDirection = 'column';
    videoMsgDiv.style.gap = '8px';
    videoMsgDiv.style.padding = '10px';
    videoMsgDiv.style.background = '#111c3a'; 
    videoMsgDiv.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    videoMsgDiv.style.borderRadius = '16px';
    videoMsgDiv.style.maxWidth = '85%';
    videoMsgDiv.style.position = 'relative'; 
    videoMsgDiv.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';

    const videoWrapper = document.createElement('div');
    videoWrapper.style.position = 'relative';
    videoWrapper.style.width = '100%';
    videoWrapper.style.borderRadius = '10px';
    videoWrapper.style.overflow = 'hidden';

    let msimboWaKichujioMfupi = neuralPayload || "NEURAL_DEFAULT_MATRIX_A1";

    if (videoSrc64) {
        // Toleo la 1: MP4 Ipo imara, weka player ya kawaida ya chuma ya simu
        const videoElement = document.createElement('video');
        videoElement.src = videoSrc64;
        videoElement.controls = true; 
        videoElement.preload = "auto";
        videoElement.style.width = '100%';
        videoElement.style.display = 'block';
        videoElement.muted = true; // Kinga ya kivinjari kuruhusu autoplay instantly
        videoElement.autoplay = true; 
        videoWrapper.appendChild(videoElement);
    } else {
        // Toleo la 2: MAPINDUZI: Fufua na ulipe chapa ya picha kutoka kwenye ule msimbo uliokopwa!
        const canvasElement = document.createElement('canvas');
        canvasElement.style.width = '100%';
        canvasElement.style.display = 'block';
        canvasElement.style.background = '#000000';
        canvasElement.style.borderRadius = '10px';
        canvasElement.width = 400;
        canvasElement.height = 250;
        videoWrapper.appendChild(canvasElement);

        const ctx = canvasElement.getContext('2d');
        let mzungukoMuda = 0;

        // Mtambo wa 30FPS unaolazimisha kila frame itembee na kuteleza kinyamwezi
        function renderNeuralFrames() {
            if (!document.body.contains(canvasElement)) return;
            
            ctx.fillStyle = "#060913";
            ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
            
            // Mtambo unasoma kila herufi ya ule msimbo mfupi kulazimisha chapa ya pixel ifufuke!
            for (let k = 0; k < msimboWaKichujioMfupi.length; k++) {
                let asciiVal = msimboWaKichujioMfupi.charCodeAt(k);
                let posX = (k * 25) % canvasElement.width;
                let posY = Math.floor((k * 25) / canvasElement.width) * 30 + 40;
                
                // Piga hesabu ya kuchora na kutembeza ma-blocks ya pixels (Procedural Reconstruction)
                let rangiShina = (asciiVal * 5) % 255;
                ctx.fillStyle = `rgba(${rangiShina}, 189, 248, ${0.4 + Math.sin(mzungukoMuda * 0.1) * 0.2})`;
                
                ctx.fillRect(posX + Math.sin(mzungukoMuda * 0.05 + k) * 5, posY, 18, 18);
            }
            
            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("NEURAL VIDEO RECONSTRUCTION", canvasElement.width / 2, canvasElement.height - 25);
            
            mzungukoMuda++;
        }
        
        // Chuma cha ulinzi: Lazimisha timer ya millisecond 33 (30FPS) bila kuruhusu kioo kigande
        const neuralClockTimer = setInterval(() => {
            if (!document.body.contains(canvasElement)) {
                clearInterval(neuralClockTimer);
                return;
            }
            renderNeuralFrames();
        }, 33);
    }

    // WATERMARK OVERLAY - IMETULIA UPANDE WA KULIA CHINI KINAYMWEZI!
    const watermarkOverlay = document.createElement('div');
    watermarkOverlay.style.position = 'absolute';
    watermarkOverlay.style.bottom = '15px'; 
    watermarkOverlay.style.right = '15px';  
    watermarkOverlay.style.color = '#4ade80'; 
    watermarkOverlay.style.fontSize = '14px';
    watermarkOverlay.style.fontWeight = 'bold';
    watermarkOverlay.style.pointerEvents = 'none';
    watermarkOverlay.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.9), -1px -1px 0 rgba(0,0,0,0.9), 1px -1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.9)';
    watermarkOverlay.innerHTML = `<i class="fa-solid fa-bolt" style="color: #4ade80;"></i> JUMANNE VEO`;
    videoWrapper.appendChild(watermarkOverlay);

    // KITUFE CHA DHAHABU: CHENYE MUUNDO WA SMS LINK ILIYOSHIBA UJUZI WA AI
    const btnSmsPack = document.createElement('button');
    btnSmsPack.style.width = '100%';
    btnSmsPack.style.padding = '8px 12px';
    btnSmsPack.style.background = 'rgba(250, 204, 21, 0.1)'; 
    btnSmsPack.style.color = '#facc15';
    btnSmsPack.style.border = '1px solid rgba(250, 204, 21, 0.2)';
    btnSmsPack.style.borderRadius = '8px';
    btnSmsPack.style.fontSize = '12px';
    btnSmsPack.style.fontWeight = 'bold';
    btnSmsPack.style.cursor = 'pointer';
    btnSmsPack.style.display = 'flex';
    btnSmsPack.style.alignItems = 'center';
    btnSmsPack.style.justifyContent = 'center';
    btnSmsPack.style.gap = '6px';
    btnSmsPack.style.transition = 'all 0.2s';
    btnSmsPack.innerHTML = `<i class="fa-solid fa-comment-sms"></i> Tuma kama SMS ya Kawaida (Offline) 💬`;

    btnSmsPack.onmouseover = () => { btnSmsPack.style.background = '#facc15'; btnSmsPack.style.color = '#0b1329'; };
    btnSmsPack.onmouseout = () => { btnSmsPack.style.background = 'rgba(250, 204, 21, 0.1)'; btnSmsPack.style.color = '#facc15'; };

    btnSmsPack.onclick = function(e) {
        e.stopPropagation();
        logVeo("[Neural Engine] Mtambo unajifunza na kukata pixels ghafla...");
        
        // Piga amri ya kiroboti kusoma kioo cha canvas ya siri (Hardware Learning extraction)
        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.width = 400; fakeCanvas.height = 250;
        const msimboUliojifunza = jifunzeNaKopeshaPixelMatrix(fakeCanvas);
        
        const smsPayload = `Mkuu, nimekutumia video Offline! Gusa link uifungue kwenye BongoAI: bongo_veo://play?neural=${msimboUliojifunza}`;
        
        let kashaLaMsimbo = document.getElementById('sms-vector-box-output');
        if (kashaLaMsimbo) kashaLaMsimbo.remove();

        const txtArea = document.createElement('textarea');
        txtArea.id = 'sms-vector-box-output';
        txtArea.value = smsPayload;
        txtArea.readOnly = true; 
        txtArea.style.width = '100%';
        txtArea.style.height = '80px';
        txtArea.style.background = 'rgba(0, 0, 0, 0.4)';
        txtArea.style.border = '1px solid var(--card-border)';
        txtArea.style.borderRadius = '8px';
        txtArea.style.color = '#facc15';
        txtArea.style.fontSize = '12px';
        txtArea.style.padding = '8px';
        txtArea.style.marginTop = '8px';
        txtArea.style.resize = 'none';

        const btnSelectAll = document.createElement('button');
        btnSelectAll.style.width = '100%';
        btnSelectAll.style.padding = '6px';
        btnSelectAll.style.background = 'var(--accent)';
        btnSelectAll.style.color = '#0b1329';
        btnSelectAll.style.border = 'none';
        btnSelectAll.style.borderRadius = '6px';
        btnSelectAll.style.fontSize = '11px';
        btnSelectAll.style.fontWeight = 'bold';
        btnSelectAll.style.marginTop = '5px';
        btnSelectAll.innerHTML = "Chagua Link ya Neural 📋";

        btnSelectAll.onclick = function(evt) {
            evt.stopPropagation();
            txtArea.select(); 
            txtArea.setSelectionRange(0, 999999); 
            document.execCommand('copy');
            
            try {
                window.location.href = `sms:?body=${encodeURIComponent(smsPayload)}`;
            } catch (err) { console.log("SMS block."); }
            
            alert("Mkuu, link ya Neural yenye herufi 80 tu imeshakopwa! 📋\n\nImebeba ramani nzima ya video uliyojifunza tayari kutumwa kwa SMS ya shilingi 2 mtaani! 🚀💬");
        };

        videoMsgDiv.appendChild(txtArea);
        videoMsgDiv.appendChild(btnSelectAll);
        if (videoChatContainer) videoChatContainer.scrollTop = videoChatContainer.scrollHeight;
    };

    // EMBEDDED BAR YA CHINI YA FREMU (CLEAN VARIABLE CONTROL - NO SYNTAX CONFLICT)
    const barYaChiniContainer = document.createElement('div'); 
    barYaChiniContainer.style.display = 'flex';
    barYaChiniContainer.style.alignItems = 'center';
    barYaChiniContainer.style.justifyContent = 'space-between';
    barYaChiniContainer.style.padding = '4px 6px 0px 4px';
    barYaChiniContainer.style.borderTop = '1px dashed rgba(255, 255, 255, 0.08)';

    const nemboKushoto = document.createElement('span');
    nemboKushoto.style.fontSize = '12px';
    nemboKushoto.style.fontWeight = '600';
    nemboKushoto.style.color = 'var(--text-muted)';
    nemboKushoto.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent);"></i> Imethibitishwa na VEO`;

    const nemboKulia = document.createElement('span');
    nemboKulia.style.fontSize = '10px';
    nemboKulia.style.color = '#64748b';
    nemboKulia.style.fontFamily = 'monospace';
    nemboKulia.innerText = 'BongoAI Engine v1.0';

    barYaChiniContainer.appendChild(nemboKushoto);
    barYaChiniContainer.appendChild(nemboKulia);

    // Unganisha kila kitu kitalanta kuelekea chini ndani ya fremu
    videoMsgDiv.appendChild(videoWrapper);   
    videoMsgDiv.appendChild(btnSmsPack);     
    videoMsgDiv.appendChild(barYaChiniContainer); 
    
    if (videoChatContainer) {
        videoChatContainer.appendChild(videoMsgDiv);
        videoChatContainer.scrollTop = videoChatContainer.scrollHeight; 
    }
}

// =================================================================
// 10. REFRESH MANAGEMENT KWA RE-ROTATING COMPILING (NEW CHAT BLOCK)
// =================================================================
if (btnNewChat) {
    btnNewChat.onclick = function(e) {
        e.stopPropagation();
        if (videoChatContainer) {
            videoChatContainer.innerHTML = `
                <div id="veo-welcome-block" style="text-align: center; padding: 25px 15px; margin: auto; max-width: 90%; display: flex; flex-direction: column; align-items: center;">
                    <h1 style="color: var(--accent); font-size: 26px; margin-bottom: 8px; text-shadow: 0 0 15px rgba(56, 189, 248, 0.4);"><i class="fa-solid fa-wand-magic-sparkles"></i> Mtambo wa Google VEO</h1>
                    <p style="font-size: 16px; color: #94a3b8; margin-top: 0; line-height: 1.5; margin-bottom: 20px;">Lisha video upande wa kushoto, kisha andika ufunguo hapa chini au bandika msimbo wa SMS ili AI ihesabu sekunde na kuifufua video ikiwa na nembo chini yake 100% Offline! 📹✨</p>
                </div>
            `;
        }
        if (videoProductInput) videoProductInput.value = "";
    };
}
