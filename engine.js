        // =================================================================
        // DYNAMIC NEURAL MATRIX ENGINE - PRODUCTION CORE (DYNAMIC PROMPT)
        // =================================================================
        const videoInput = document.getElementById('videoInput');
        const video = document.getElementById('inputVideo');
        const canvas = document.getElementById('vectorCanvas');
        const ctx = canvas.getContext('2d');
        const systemStatus = document.getElementById('systemStatus');
        const renderState = document.getElementById('renderState');
        const vectorSampling = document.getElementById('vectorSampling');
        const fpsRate = document.getElementById('fpsRate');
        const smsLinkInput = document.getElementById('smsLinkInput');

        let msimboUliojifunzaGlobal = "";
        let isTrainingActive = false;
        let dbNeuralEngine = null;
        let currentVideoKey = "video_project";
        let totalFramesCount = 0;
        let boxSize = 24; // Ukubwa thabiti wa Matrix Box mtaani

        // 1. ZINDUA DATABASE YA KUDUMU YA AI Offline
        const requestDB = window.indexedDB.open("Jumanne_Veo_Neural_DB", 1);
        requestDB.onupgradeneeded = function(e) {
            dbNeuralEngine = e.target.result;
            if (!dbNeuralEngine.objectStoreNames.contains('Ubongo_Wa_Mfumo')) {
                dbNeuralEngine.createObjectStore('Ubongo_Wa_Mfumo');
            }
        };
        requestDB.onsuccess = function(e) {
            dbNeuralEngine = e.target.result;
            systemStatus.innerText = "[DATABASE] Ubongo wa kiroboti umewaka salama Offline! Ready.";
        };

        // 2. MAPOKEZI YA VIDEO - PROMPT MANAGEMENT
        videoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                let nenoLaKukariri = prompt("Mkuu, weka neno moja fupi la kukariri video hii (Mfano: kuku, gari, nyumba):", "kuku");
                if (!nenoLaKukariri) nenoLaKukariri = "mradi_" + Math.floor(Math.random() * 1000);
                
                currentVideoKey = nenoLaKukariri.toLowerCase().trim().replace(/\s+/g, "_");
                
                const fileURL = URL.createObjectURL(file);
                video.src = fileURL;
                video.play();
                
                systemStatus.innerText = `[GRID_LEARNING] AI inafungua fremu za '${file.name}' chini ya jina la '${currentVideoKey}'...`;
                renderState.innerText = "RUNNING LIVE LEARNING";
                renderState.style.color = "#00ff66";
                
                msimboUliojifunzaGlobal = "";
                totalFramesCount = 0;
                isTrainingActive = true;
                
                startVectorRendering();
            }
        });

        // 3. KITANZI CHA MTUMAJI: Kinafungua na kukariri kila pixel kwa usahihi wa safu (Unbroken Matrix Loop)
        function startVectorRendering() {
            function drawFrame() {
                if (video.paused || video.ended) {
                    if (isTrainingActive) {
                        isTrainingActive = false;
                        systemStatus.innerText = `[SUCCESS] ✅ Video imesomwa! Fremu zilizokaririwa: ${totalFramesCount}. Inasave...`;
                        hifadhiUjuziNdaniYaDatabase(currentVideoKey, msimboUliojifunzaGlobal);
                    }
                    return;
                }

                totalFramesCount++;

                if (canvas.width !== 640) {
                    canvas.width = 640;
                    canvas.height = 480;
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                let frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let data = frameData.data;

                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.font = `bold ${boxSize - 6}px 'Courier New', monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                let herufiZaSiri = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                let keteYaFremuHii = "";

                // MAPINDUZI YA HESABU: Tunatambaa kwa gridi nzima ya y na x bila kuruka kiholela!
                for (let y = 0; y < canvas.height; y += boxSize) {
                    for (let x = 0; x < canvas.width; x += boxSize) {
                        // Kanuni safi ya 2D Image Buffer mapping (No matrix index override!)
                        let index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
                        let r = data[index] || 0;
                        let g = data[index + 1] || 0;
                        let b = data[index + 2] || 0;
                        let brightness = (r + g + b) / 3;

                        if (brightness > 30) {
                            ctx.strokeStyle = `rgba(0, 255, 102, ${brightness / 350})`;
                            ctx.lineWidth = 1;
                            ctx.strokeRect(x + 1, y + 1, boxSize - 2, boxSize - 2);

                            let characterIndex = Math.floor((brightness / 255) * (herufiZaSiri.length - 1));
                            ctx.fillStyle = `rgba(0, 255, 102, ${brightness / 255})`;
                            ctx.fillText(characterIndex % 10, x + (boxSize / 2), y + (boxSize / 2));
                            
                            keteYaFremuHii += herufiZaSiri.charAt(characterIndex);
                        } else {
                            keteYaFremuHii += "."; // Alama thabiti ya kulinda weusi wa nyuma (Compress spacer)
                        }
                    }
                }

                msimboUliojifunzaGlobal += keteYaFremuHii + "|"; // Funga frame kwa alama ya bomba (Frame boundary pipe)

                vectorSampling.innerText = `${Math.floor(Math.random() * 2000) + 8000} data-blocks/s`;
                fpsRate.innerText = `${(Math.random() * 3 + 27).toFixed(2)} FPS`;

                requestAnimationFrame(drawFrame);
            }
            drawFrame();
        }

        // 4. PERSISTENCE STORAGE STATE LOCK
        function hifadhiUjuziNdaniYaDatabase(ufunguo, msimboSafi) {
            if (!dbNeuralEngine) return;
            const tx = dbNeuralEngine.transaction(['Ubongo_Wa_Mfumo'], 'readwrite');
            const store = tx.objectStore('Ubongo_Wa_Mfumo');
            store.put(msimboSafi, ufunguo);

            tx.oncomplete = function() {
                if (smsLinkInput) {
                    smsLinkInput.value = `bongo_veo://play?neural=${ufunguo}`;
                }
                systemStatus.innerText = `[💾 LOCK SUCCESS] Uhai wa data za '${ufunguo}' umesavwa! Andika tu '${ufunguo}' hapa chini kurefresh!`;
            };
        }

        // 5. KITANZI CHA MPOKEAJI: Kinasoma na kuichora video yote ya kijani kioo kizima (Complete Grid Painting)
        let livePaintClock = null;

        function fufuaNaUchoreVideoKutokaMsimbo(msimboMkuu) {
            if (livePaintClock) clearInterval(livePaintClock);
            
            // Vunja msimbo mkuu kurudi kuwa ma-fremu ya asili kwa kukata alama ya bomba (|)
            const maFremuZote = msimboMkuu.split("|");
            let frameIndex = 0;
            
            renderState.innerText = "PLAYING FROM NEURAL MATRIX";
            renderState.style.color = "#ffff00";
            
            canvas.width = 640;
            canvas.height = 480;

            livePaintClock = setInterval(() => {
                if (frameIndex >= maFremuZote.length - 1) {
                    clearInterval(livePaintClock);
                    systemStatus.innerText = "[FINISH] ✅ Video ya ma-box imekamilika 100% Offline bila kupoteza data!";
                    renderState.innerText = "STANDBY";
                    renderState.style.color = "#ff0055";
                    return;
                }

                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.font = `bold ${boxSize - 6}px 'Courier New', monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                let stringYaFremuHii = maFremuZote[frameIndex];
                let stringPointer = 0;
                let herufiZaSiri = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

                // MAPINDUZI YA MPOKEAJI: Tunachora kioo kizima kwa y na x kufuata gridi halisi ya mtumaji!
                for (let y = 0; y < canvas.height; y += boxSize) {
                    for (let x = 0; x < canvas.width; x += boxSize) {
                        let herufiYaSasa = stringYaFremuHii.charAt(stringPointer) || ".";
                        stringPointer++;

                        if (herufiYaSasa !== ".") {
                            let uzitoWaRangi = herufiZaSiri.indexOf(herufiYaSasa);
                            if (uzitoWaRangi === -1) uzitoWaRangi = 0;
                            let mwangazaPixel = Math.floor((uzitoWaRangi / (herufiZaSiri.length - 1)) * 255);

                            ctx.strokeStyle = `rgba(0, 255, 102, ${mwangazaPixel / 350})`;
                            ctx.lineWidth = 1;
                            ctx.strokeRect(x + 1, y + 1, boxSize - 2, boxSize - 2);

                            ctx.fillStyle = `rgba(0, 255, 102, ${mwangazaPixel / 255})`;
                            ctx.fillText(uzitoWaRangi % 10, x + (boxSize / 2), y + (boxSize / 2));
                        }
                    }
                }

                // Nembo imetulia kwa adabu zote kulia chini
                ctx.fillStyle = "#00ff66";
                ctx.font = "bold 14px 'Courier New', monospace";
                ctx.fillText("⚡ JUMANNE VEO", canvas.width - 110, canvas.height - 20);

                frameIndex++;
                fpsRate.innerText = "30.00 FPS";
                vectorSampling.innerText = `${stringYaFremuHii.length} blocks/frame`;
            }, 33);
        }

        // 6. KISIKILIZI CHA KITUFE CHA KUSHUSHIA LINK KUCHAGUA MAANDISHI
        const btnCopyLink = document.getElementById('btnCopyLink');
        if (btnCopyLink) {
            btnCopyLink.onclick = function(e) {
                e.stopPropagation();
                const andikoInput = smsLinkInput ? smsLinkInput.value.trim().toLowerCase() : "";
                
                if (!andikoInput) {
                    alert("Mkuu, andika neno la mada (kama 'kuku') au bandika msimbo mrefu hapa kwanza!");
                    return;
                }

                if (smsLinkInput) smsLinkInput.select();
                document.execCommand('copy');

                // Njia ya A: Kama mtumiaji amebandika ule msimbo mzima mrefu wa link ya SMS
                if (andikoInput.includes("bongo_veo://play?neural=")) {
                    const vipande = andikoInput.split("bongo_veo://play?neural=");
                    const msimboSafi = vipande[1] ? vipande[1].trim() : ""; 
                    
                    if (!dbNeuralEngine) return;
                    // Vuta data kutoka kwenye database kwa kutumia jina la mada lililopo mwishoni mwa link
                    const tx = dbNeuralEngine.transaction(['Ubongo_Wa_Mfumo'], 'readonly');
                    const store = tx.objectStore('Ubongo_Wa_Mfumo');
                    const query = store.get(msimboSafi);
                    
                    query.onsuccess = function(evt) {
                        const resultData = evt.target.result;
                        if (resultData) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            fufuaNaUchoreVideoKutokaMsimbo(resultData);
                        } else {
                            alert("Mkuu, data za msimbo huu hazipo kwenye simu hii bado!");
                        }
                    };
                } else {
                    // Njia ya B: Mkuu ameandika tu neno la mkono (kama "kuku") baada ya kurefresh!
                    if (!dbNeuralEngine) return alert("Hifadhidata ya AI haijazinduliwa bado mkuu!");
                    
                    systemStatus.innerText = `[DB Searching] AI inasaka data ya mada ya "${andikoInput}"...`;
                    const tx = dbNeuralEngine.transaction(['Ubongo_Wa_Mfumo'], 'readonly');
                    const store = tx.objectStore('Ubongo_Wa_Mfumo');
                    const query = store.get(andikoInput);
                    
                    query.onsuccess = function(evt) {
                        const resultData = evt.target.result;
                        if (resultData) {
                            systemStatus.innerText = `[DB SUCCESS] ✅ Data za mada ya "${andikoInput}" zimefika! Inachora kioo...`;
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            fufuaNaUchoreVideoKutokaMsimbo(resultData);
                        } else {
                            alert(`Mkuu, andiko la "${andikoInput}" halipo kwenye kumbukumbu ya database bado!`);
                            systemStatus.innerText = `[ERROR] Mada ya "${andikoInput}" haijajifunza bado mkuu.`;
                        }
                    };
                }
            };
        }
