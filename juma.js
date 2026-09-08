// =================================================================
// BONGO AI ENGINE v10.0 - PRODUCTION MASTER CORE (PART 1)
// =================================================================

// 1. KITENGO CHA KUKAMATA VIPENGELE VYOTE VYA HTML (DOM Elements)
const statusBox = document.getElementById('status-box');
const btnGenerate = document.getElementById('btn-generate');
const productInput = document.getElementById('product-input');
const chatContainer = document.getElementById('chat-messages-container');
const historyContainer = document.getElementById('history-container');

const btnToggleLeft = document.getElementById('toggle-left-menu');
const sidebarLeft = document.getElementById('sidebar-l');
const imageFileInput = document.getElementById('image-file-input');
const btnCameraTrigger = document.getElementById('btn-camera-trigger');
const btnNewChat = document.getElementById('btn-new-chat');

// Kukamata textareas zote mbili kwa ajili ya kulisha mamilioni ya data zenu
const swaliInput = document.getElementById('swali-input');
const jibuInput = document.getElementById('jibu-input');
const btnFeedDataset = document.getElementById('btn-feed-dataset');
const btnClearHistory = document.getElementById('btn-clear-history');

// Parameter za kumbukumbu ya ndani ya mfumo
let pichaIliyochaguliwaJina = null;
let pichaIliyochaguliwaData = null;
let db = null; // Inaanza kama null, itajazwa hifadhidata ikifunguka salama

// Orodha thabiti ya maswali 10 ya mwanzo ya ukaribisho yanayofyatuka
// =================================================================
// BONGO AI ENGINE v10.5 - GLOBAL TOPIC EXTENSION (MADA 40)
// =================================================================

// Orodha kuu ya mada zote za mtaani zitakazotumiwa na Tuning Engine kufyatua chips
const CHIPS_ZA_KIBONGO_10 = [
    // 1. Vyumba vya Kikazi na Barua 🚪
    "Barua ya Likizo 🏖️", "Barua ya Udhamini 🤝", "Barua ya Kuacha Kazi 🚪", 
    "Barua ya Kupandishwa Cheo 📈", "Barua ya Kuomba Udhamini 🎓", "Barua ya Malalamiko ⚠️",
    "Barua ya Kuomba Mkopo 💰", "Mkataba wa Kazi 📜", "Uandishi wa CV 📄", "Mahojiano ya Kazi 👔",
    
    // 2. Vyumba vya Biashara, Hela na Hustle 💰
    "Mtaji wa Elfu 20 💰", "WhatsApp Marketing 📱", "Kutafuta Wateja 🤝", 
    "Andika Tangazo ✍️", "Biashara ya Duka 🏪", "Biashara ya Mama Lishe 🍲",
    "Ujuzi wa Kupiga Hela 💻", "Kujenga Uaminifu ✨", "Kuweka Akiba 🐷", "Kupata Mkopo mtaani 🏦",
    
    // 3. Vyumba vya Mahusiano na Mapenzi 💔
    "Kusameheana 💔", "Maneno ya Busara 👑", "Kujenga Uaminifu ✨",
    "Ushauri wa Ndoa 💍", "Kutafuta Mchumba 🌹", "Kutibu Maumivu ya Moyo 🩹",
    "Urafiki wa Kweli 🫂", "Misingi ya Familia 🏡", "Kuishi na Wakwe 🧘", "Malezi ya Watoto 👶",
    
    // 4. Mada Mengineyo ya Mtaani na Maisha 🌍
    "Mbinu za Town 🏙️", "Afya ya Mwili 🍏", "Kilimo Biashara 🌱", 
    "Ufugaji wa Kuku 🐔", "Usimamizi wa Muda ⏳", "Kujenga Nidhamu 🦾",
    "Kusoma Vitabu 📚", "Kushinda Msongo wa Mawazo 🧠", "Sheria za Mtaani ⚖️", "Kujiajiri 🚀"
];


// 2. SYSTEM LOGS (Mtambo wa kutoa ripoti ya mazingira upande wa kushoto)
function logMfumo(ujumbe) {
    const muda = new Date().toLocaleTimeString();
    if (statusBox) {
        statusBox.innerHTML += `<br>[${muda}] ${ujumbe}`;
        statusBox.scrollTop = statusBox.scrollHeight; // Shusha log chini yenyewe
    }
}

// Mtambo wa kufungua na kufunga Menu ya simu ukigusa kifungo cha bars
if (btnToggleLeft && sidebarLeft) {
    btnToggleLeft.onclick = (e) => {
        e.stopPropagation();
        sidebarLeft.classList.toggle('open');
    };
}




// =================================================================
// REKEBISHO LA CHUMA: MUUNDO WA KAWAIDA WA KUTIRIRIKA (NO FUNCTIONS)
// =================================================================

// 3. UZINDUZI WA DATABASE KWA MUUNDO WA KAWAIDA (LINEAR LAUNCH)
logMfumo("Inazindua hifadhidata mpya ya BongoAI...");

// Fungua database kwa jina jipya kabisa ili isigongane na takataka za zamani
const request = window.indexedDB.open("BongoAI_Ultimate_DB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    logMfumo("[DB] Inatengeneza meza mpya zilizosafishwa kabisa...");
    
    if (!db.objectStoreNames.contains('Akili_Ya_Mfumo')) {
        db.createObjectStore('Akili_Ya_Mfumo');
    }
    if (!db.objectStoreNames.contains('Chat_History')) {
        db.createObjectStore('Chat_History', { keyPath: 'id', autoIncrement: true });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    logMfumo("IndexedDB ipo salama na tayari kabisa! ✅");
    
    // MAAGIZO YAKO MKUU: Toa ripoti safi kwenye Console ya simu/pc
    console.log("db imefunguka sarama");
    
    // Amsha zana zingine mara moja bila kuchelewesha kioo
    kaguaKikashaChaUjumbe();
    vutaNaUnyoosheHistory();
};

request.onerror = function(event) {
    logMfumo("[-] Kushindwa kuzindua hifadhidata.");
    console.log("Database error:", event.target.error);
};



// =================================================================
// KITENGO CHA 4 KILICHOBORESHWA: VISUAL PREVIEW LOCKER (HAIPONYOKI CHAT)
// =================================================================
const previewContainer = document.getElementById('image-preview-container');
const pendingImg = document.getElementById('img-pending-preview');
const pendingName = document.getElementById('img-pending-name');
const btnRemovePreview = document.getElementById('btn-remove-preview');

if (btnCameraTrigger && imageFileInput) {
    btnCameraTrigger.onclick = (e) => { 
        e.stopPropagation(); 
        imageFileInput.click(); 
    };
    
    imageFileInput.onchange = (e) => {
        const file = e.target.files[0]; // Kamata faili kwa usahihi kabisa leo tarehe 7 Septemba 2026
        if (file) {
            pichaIliyochaguliwaJina = file.name;
            logMfumo(`[📷] Picha imepakiwa kwenye pending preview: ${file.name}`);
            
            const reader = new FileReader();
            reader.onload = function(event) {
                pichaIliyochaguliwaData = event.target.result;
                
                // MAPINDUZI: Chora muonekano wa picha (Preview) hapo hapo juu ya input box
                if (pendingImg && pendingName && previewContainer) {
                    pendingImg.src = pichaIliyochaguliwaData;
                    pendingName.innerText = file.name;
                    previewContainer.style.display = "flex"; // Ionyeshe picha kinyamwezi!
                }
                
                kaguaKikashaChaUjumbe(); // Washa kitufe cha bluu mara moja picha ikiingia
            };
            reader.readAsDataURL(file);
        }
    };
}

// Mtambo wa kufuta picha kwenye preview mteja akibonyeza X bila kuituma
if (btnRemovePreview) {
    btnRemovePreview.onclick = function(e) {
        e.stopPropagation();
        pichaIliyochaguliwaJina = null;
        pichaIliyochaguliwaData = null;
        if (imageFileInput) imageFileInput.value = "";
        if (previewContainer) previewContainer.style.display = "none"; // Ficha kasha
        logMfumo("[📷] Picha imeondolewa kwenye preview.");
        kaguaKikashaChaUjumbe(); // Zima kitufe kama uwanja uko tupu
    };
}

function wekaPichaKwenyeChat(imgData, jinaLaPicha) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg user';
    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.gap = '5px';

    const imgElement = document.createElement('img');
    imgElement.src = imgData;
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '150px';
    imgElement.style.borderRadius = '8px';
    imgElement.style.objectFit = 'cover';

    const textLabel = document.createElement('span');
    textLabel.innerText = `📷 Picha: ${jinaLaPicha}`;
    textLabel.style.fontSize = '12px';
    textLabel.style.color = 'var(--accent)';

    msgDiv.appendChild(imgElement);
    msgDiv.appendChild(textLabel);
    if (chatContainer) {
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function wekaMesejiKwenyeChat(maandishi, mtumishi) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${mtumishi}`;
    msgDiv.innerText = maandishi;
    if (chatContainer) {
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}



// =================================================================
// KITENGO CHA 5 KILICHOBORESHWA: PURE PERSISTENT WRITER (NO CHIPS RE-TRIGGER)
// =================================================================
if (btnFeedDataset) {
    btnFeedDataset.onclick = function(e) {
        e.stopPropagation();
        
        // Ukaguzi wa Chuma: Kama database haipo imara, kimbia kuifungua upya papo hapo!
        if (!db) {
            logMfumo("⚠️ Database ilikuwa imelala. Inaiamsha sasa hivi...");
            const reOpenRequest = window.indexedDB.open("BongoAI_Ultimate_DB", 1);
            reOpenRequest.onsuccess = function(evt) {
                db = reOpenRequest.result;
                alert("Mkuu database imeshazinduka! Gonga tena kitufe cha Kariri Majibu sasa hivi! 🧠");
            };
            return;
        }

        const swaliKey = swaliInput.value.trim().toLowerCase();
        const jibuValue = jibuInput.value.trim();

        if (!swaliKey || !jibuValue) {
            logMfumo("⚠️ Tafadhali jaza sote viwanja vya Swali na Jibu mkuu!");
            alert("Mkuu, huwezi kulisha kisanduku kikiwa tupu!");
            return;
        }

        const hesabuYaManeno = jibuValue.split(/\s+/).length;
        logMfumo(`[Brain] Inasindika na kuandika andiko kubwa la maneno ${hesabuYaManeno.toLocaleString()} kwenye chuma...`);

        // AMRI YA CHUMA: Fungua meza kwa nguvu ya kuandika (readwrite)
        const myTx = db.transaction(['Akili_Ya_Mfumo'], 'readwrite');
        const store = myTx.objectStore('Akili_Ya_Mfumo');
        
        // Piga amri ya kuweka data (put)
        const hitajiLaKuweka = store.put(jibuValue, swaliKey);

        hitajiLaKuweka.onsuccess = function() {
            logMfumo(`[Brain] 💾 IndexedDB imehifadhi kikamilifu neno: "${swaliKey}"`);
        };

        myTx.oncomplete = function() {
            logMfumo(`[Brain] ✅ USHINDI: AI imekariri na kufunga faili: "${swaliKey}"`);
            swaliInput.value = "";
            jibuInput.value = "";
            alert("Mkuu, maarifa yamesajiliwa na kuhifadhiwa kwa 100% Offline kwenye simu yako! 🧠");
            
            // MAPINDUZI: Tumefuta kabisa ule mstari uliokuwa unaita 'tiririshaMasandukuKumiYaKaribu'!
            // Kioo sasa hivi kinabaki thabiti bila kulazimisha chips za ukaribisho kujirudia upya!
        };

        myTx.onerror = function(err) {
            logMfumo("[-] Hifadhi imefeli: " + err.target.error);
            alert("⚠️ Simu imegoma kuandika data kisa: " + err.target.error);
        };
    };
}




// 6. INJINI KUU YA GEMINI STREAMING (KASI YA RADI SEKUNDE 2 KWA BENDERA YA TZ)
function tiririshaJibuKamaGemini(andikoKamili) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cursor = 'pointer';
    msgDiv.title = "Bonyeza kucopy andiko hili mkuu 📋";

    // Kagua kama ni barua rasmi ili kuvaa muundo nadhifu wa kioo
    const niBaruaRasmi = andikoKamili.includes("S.L.P") || andikoKamili.includes("YAH:") || andikoKamili.includes("Ndugu,");
    if (niBaruaRasmi) {
        msgDiv.className = 'msg ai official-doc-box';
    } else {
        msgDiv.className = 'msg ai';
    }

    // Mfumo wa kucopy andiko kwa kugusa bubble
    msgDiv.onclick = function() {
        navigator.clipboard.writeText(msgDiv.innerText).then(() => {
            logMfumo("[📋 Copy] Ujumbe umekopishwa kwenye simu yako!");
            const zamaniBg = msgDiv.style.backgroundColor;
            msgDiv.style.backgroundColor = "rgba(74, 222, 128, 0.2)";
            setTimeout(() => { msgDiv.style.backgroundColor = zamaniBg; }, 1000);
        });
    };

    if (chatContainer) chatContainer.appendChild(msgDiv);

    const scrollAnchor = document.createElement('div');
    scrollAnchor.style.clear = 'both';
    if (chatContainer) chatContainer.appendChild(scrollAnchor);

    let index = 0;
    let herufiCount = 0;
    
    // KASI YA RADI ILI MAANDISHI YAISHE NDANI YA SEKUNDE 2
    const spidiYaKuteleza = 2; 
    const rangiZaBendera = ["#4ade80", "#facc15", "#000000", "#38bdf8"]; // Kijani, Njano, Nyeusi, Bluu
    let rangiIndex = 0;

    let mkuuAnascrollKwaMkono = false;
    if (chatContainer) {
        chatContainer.onscroll = () => {
            const umbaliKutokaChini = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
            mkuuAnascrollKwaMkono = (umbaliKutokaChini > 50);
        };
    }

    function vutaHerufiMstari() {
        if (index < andikoKamili.length) {
            let herufiYaSasa = andikoKamili.charAt(index);
            
            if (herufiYaSasa.trim() !== "") {
                herufiCount++;
                if (herufiCount % 20 === 0) {
                    rangiIndex = (rangiIndex + 1) % rangiZaBendera.length;
                }
            }

            const spanHerufi = document.createElement('span');
            spanHerufi.innerText = herufiYaSasa;
            spanHerufi.style.color = rangiZaBendera[rangiIndex];
            
            if (rangiZaBendera[rangiIndex] === "#000000") {
                spanHerufi.style.textShadow = "0 0 3px rgba(255,255,255,0.4)";
            }

            msgDiv.appendChild(spanHerufi);
            index++;
            
            if (!mkuuAnascrollKwaMkono && scrollAnchor) {
                scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            
            setTimeout(vutaHerufiMstari, spidiYaKuteleza);
        } else {
            if (scrollAnchor) scrollAnchor.remove(); // Ondoa nanga chapa ikiisha
            kamilishaNaWekaMaswaliYaMteja(); // Zindua masanduku ya maswali ya mteja yaliyotokana na database yenu pekee!
        }
    }

}



// =================================================================
// KITENGO CHA 6 KILICHOBORESHWA: CHIPS EXTRACTOR YA MADA 40 (UNLIMITED TOKENS)
// =================================================================
function tiririshaJibuKamaGemini(andikoKamili) {
    let andikoLaChapa = andikoKamili;
    let chipsZilizopatikana = [];

    // MTAMBO WA CHUMA: Regex inayosaka neno-siri "Mada:" au "mada:" bila kujali herufi kubwa/ndogo
    const madaRegex = /mada:/i;
    
    if (madaRegex.test(andikoKamili)) {
        // Kata andiko mara mbili kupata sehemu ya juu (jibu) na ya chini (mada zote 40)
        const vipande = andikoKamili.split(madaRegex);
        
        if (vipande.length > 1) {
            andikoLaChapa = vipande[0].trim(); // Jibu safi linaloenda kwenye chat bubble
            
            // Chukua safu ya chini, igawanye kwa alama ya mkato (,) ili kufyatua chips hadi 40!
            chipsZilizopatikana = vipande[1].split(",").map(item => item.trim()).filter(item => item !== "");
            
            logMfumo(`[Tuning Engine] Zimepatikana mada ${chipsZilizopatikana.length} kutoka kwenye database.`);
        }
    }

    const msgDiv = document.createElement('div');
    msgDiv.style.cursor = 'pointer';
    msgDiv.title = "Bonyeza kucopy andiko hili mkuu 📋";

    const niBaruaRasmi = andikoLaChapa.includes("S.L.P") || andikoLaChapa.includes("YAH:") || andikoLaChapa.includes("Ndugu,");
    if (niBaruaRasmi) {
        msgDiv.className = 'msg ai official-doc-box';
    } else {
        msgDiv.className = 'msg ai';
    }

    msgDiv.onclick = function() {
        navigator.clipboard.writeText(msgDiv.innerText).then(() => {
            logMfumo("[📋 Copy] Ujumbe umekopishwa kwenye simu yako!");
            const zamaniBg = msgDiv.style.backgroundColor;
            msgDiv.style.backgroundColor = "rgba(74, 222, 128, 0.2)";
            setTimeout(() => { msgDiv.style.backgroundColor = zamaniBg; }, 1000);
        });
    };

    if (chatContainer) chatContainer.appendChild(msgDiv);

    const scrollAnchor = document.createElement('div');
    scrollAnchor.style.clear = 'both';
    if (chatContainer) chatContainer.appendChild(scrollAnchor);

    let index = 0;
    let herufiCount = 0;
    const spidiYaKuteleza = 2; 
    const rangiZaBendera = ["#4ade80", "#facc15", "#fffff", "#38bdf8"]; // Kijani, Njano, Nyeusi, Bluu
    let rangiIndex = 0;

    let mkuuAnascrollKwaMkono = false;
    if (chatContainer) {
        chatContainer.onscroll = () => {
            const umbaliKutokaChini = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
            mkuuAnascrollKwaMkono = (umbaliKutokaChini > 50);
        };
    }

    function vutaHerufiMstari() {
        if (index < andikoLaChapa.length) {
            let herufiYaSasa = andikoLaChapa.charAt(index);
            
            if (herufiYaSasa.trim() !== "") {
                herufiCount++;
                if (herufiCount % 20 === 0) {
                    rangiIndex = (rangiIndex + 1) % rangiZaBendera.length;
                }
            }

            const spanHerufi = document.createElement('span');
            spanHerufi.innerText = herufiYaSasa;
            spanHerufi.style.color = rangiZaBendera[rangiIndex];
            
            if (rangiZaBendera[rangiIndex] === "#000000") {
                spanHerufi.style.textShadow = "0 0 3px rgba(255,255,255,0.4)";
            }

            msgDiv.appendChild(spanHerufi);
            index++;
            
            if (!mkuuAnascrollKwaMkono && scrollAnchor) {
                scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            
            setTimeout(vutaHerufiMstari, spidiYaKuteleza);
        } else {
            if (scrollAnchor) scrollAnchor.remove();
            
            // Fyatua chips zote zilizopatikana (hata zikiwa 40) mara herufi ya mwisho inapoishia!
            if (chipsZilizopatikana.length > 0 && typeof fyatuaChipsZaMuktadha === 'function') {
                logMfumo(`[UI] Inafyatua chips ${chipsZilizopatikana.length} kwenye kioo...`);
                fyatuaChipsZaMuktadha(chipsZilizopatikana);
            } else {
                logMfumo("[Gemini Engine] Utiririshaji umekamilika safi kabisa.");
            }
        }
    }

    vutaHerufiMstari();
}


function fyatuaChipsZaMuktadha(safuYaMaswali) {
    const followUpArea = document.createElement('div');
    followUpArea.style.display = 'flex';
    followUpArea.style.flexWrap = 'wrap';
    followUpArea.style.gap = '8px';
    followUpArea.style.margin = '15px auto';
    followUpArea.style.maxWidth = '96%';
    followUpArea.style.width = '100%';
    followUpArea.style.justifyContent = 'center';

    safuYaMaswali.forEach(swaliText => {
        const btnChip = document.createElement('button');
        btnChip.innerText = swaliText.trim();
        
        btnChip.style.background = "rgba(56, 189, 248, 0.05)";
        btnChip.style.color = "var(--accent)";
        btnChip.style.border = "1px solid rgba(56, 189, 248, 0.15)";
        btnChip.style.padding = "8px 14px";
        btnChip.style.borderRadius = "20px";
        btnChip.style.fontSize = "13px";
        btnChip.style.cursor = "pointer";
        btnChip.style.fontFamily = "inherit";
        btnChip.style.transition = "all 0.2s";

        btnChip.onmouseover = () => { btnChip.style.background = "var(--accent)"; btnChip.style.color = "#0b1329"; };
        btnChip.onmouseout = () => { btnChip.style.background = "rgba(56, 189, 248, 0.05)"; btnChip.style.color = "var(--accent)"; };

        btnChip.onclick = function(e) {
            e.stopPropagation();
            if (productInput && btnGenerate) {
                // Safisha herufi wakati wa kubonyeza ili isukume neno tupu
                productInput.value = swaliText.trim(); 
                btnGenerate.click(); 
            }
            followUpArea.remove(); 
        };

        followUpArea.appendChild(btnChip);
    });

    if (chatContainer) {
        chatContainer.appendChild(followUpArea);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}




// =================================================================
// KITENGO CHA 7 KIZIMA: ZERO-CURSOR ENGINE + INSTANT UI PURGE LOCK
// =================================================================

// PARAMETER ZA SIRI: Kushika kumbukumbu ya hatua (State Management)
let sogaYaBaruaHatua = 0; // 0 = Kawaida, 1 = Anasubiri Kazi, 2 = Anasubiri Posta, 3 = Anasubiri Mwandikiwa
let dataYaBaruaMteja = {
    swaliAsili: "",
    mifupaBarua: "",
    kazi: "",
    posta: "",
    mwandikiwa: ""
};

if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
        if (!db) return alert("Hifadhidata haijakaa sawa bado mkuu!");
        
        const userText = productInput.value.trim();
        if (!userText && !pichaIliyochaguliwaJina) return;

        let swaliLaKutafuta = userText.toLowerCase().trim();
        wekaMesejiKwenyeChat(userText || "[📷 Picha ya Bidhaa]", 'user');
        
        productInput.value = "";
        kaguaKikashaChaUjumbe();

        // MAPINDUZI YA KIOO: Futa kabisa lile sanduku la ukaribisho na zile chips 10 mara moja hapa!
        // Hii inazuia kwa 100% zile chips zisijiguse zenyewe kwa siri chini kwa chini (Ghost clicks)
        const welcomeBlock = document.getElementById('gemini-welcome-block');
        if (welcomeBlock) {
            welcomeBlock.remove(); // Ng'oa kabisa isionekane mkuu!
            logMfumo("[UI] Sanduku la mwanzo limeondolewa kulinda soga.");
        }
        
        // Futa pia na chips zote za ziada zilizobaki kwenye chat container
        const masandukuYaMifano = document.getElementById('suggestion-chips-container');
        if (masandukuYaMifano) masandukuYaMifano.remove();

        // ----------------=============================================
        // MAHOJIANO HATUA YA 2: Kamata Kazi na Uliza kuhusu Sanduku la Posta
        // ----------------=============================================
        if (sogaYaBaruaHatua === 1) {
            dataYaBaruaMteja.kazi = userText;
            logMfumo(`[Soga Engine] Kazi imekaririwa: ${userText}`);
            
            sogaYaBaruaHatua = 2; // Shusha hatua kwenda kwenye Posta
            
            setTimeout(() => {
                const jibuLaSoga2 = `Safi sana kiongozi! Na **Sanduku lako la Posta (S.L.P)** ni namba ngapi na ipo mji gani?\n\n*(Mfano: S.L.P 4050, Dar es Salaam)*`;
                tiririshaJibuKamaGemini(jibuLaSoga2);
            }, 600);
            return; // STRICT SHORT-CIRCUIT
        }

        // ----------------=============================================
        // MAHOJIANO HATUA YA 3: Kamata Posta na Uliza kuhusu Mwandikiwa (Bosi)
        // ----------------=============================================
        if (sogaYaBaruaHatua === 2) {
            dataYaBaruaMteja.posta = userText;
            logMfumo(`[Soga Engine] Posta imekaririwa: ${userText}`);
            
            sogaYaBaruaHatua = 3; // Shusha hatua kwenda kwa bosi mwandikiwa
            
            setTimeout(() => {
                const jibuLaSoga3 = `Umeeleweka vyema mkuu! Mwisho kabisa, huyo **Bosi au Mwandikiwa** wa hii barua ana cheo gani na ni wa kampuni gani?\n\n*(Mfano: Mkurugenzi Mkuu wa Azam)*`;
                tiririshaJibuKamaGemini(jibuLaSoga3);
            }, 600);
            return; // STRICT SHORT-CIRCUIT
        }

        // ----------------=============================================
        // MAHOJIANO HATUA YA 4: Kamata Mwandikiwa na Fyatua Barua Moja kwa Moja
        // ----------------=============================================
        if (sogaYaBaruaHatua === 3) {
            dataYaBaruaMteja.mwandikiwa = userText;
            logMfumo(`[Soga Engine] Mwandikiwa amekaririwa: ${userText}`);
            
            sogaYaBaruaHatua = 0; // Safisha hatua rudi sifuri kazi imeisha
            
            setTimeout(() => {
                const thinkingDiv = document.createElement('div');
                thinkingDiv.className = 'msg ai';
                thinkingDiv.id = 'ai-thinking-box';
                thinkingDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--accent); margin-right: 8px;"></i> <span style="color: #94a3b8; font-style: italic;">Mkuu, AI inaunganisha doti zote na kutwanga barua...</span>`;
                if (chatContainer) chatContainer.appendChild(thinkingDiv);

                setTimeout(() => {
                    const openThinkingBox = document.getElementById('ai-thinking-box');
                    if (openThinkingBox) openThinkingBox.remove();

                    // REPLACEMENT ENGINE: Safe string formatting lookup
                    let baruaFinal = dataYaBaruaMteja.mifupaBarua;
                    baruaFinal = baruaFinal.replace(/S\.L\.P\s*4050,\s*DAR\s*ES\s*SALAAM,\s*TANZANIA\./gi, dataYaBaruaMteja.posta.toUpperCase());
                    baruaFinal = baruaFinal.replace(/UTANGAZAJI\s*NA\s*MAHUSIANO\s*MLOGANZILA/gi, dataYaBaruaMteja.kazi.toUpperCase());
                    baruaFinal = baruaFinal.replace(/MKURUGENZI\s*MKUU/gi, dataYaBaruaMteja.mwandikiwa.toUpperCase());

                    tiririshaJibuKamaGemini(baruaFinal);
                    hifadhiKwenyeHistory(dataYaBaruaMteja.swaliAsili, baruaFinal);
                }, 800);
            }, 400);
            return; // STRICT SHORT-CIRCUIT
        }

        // ----------------=============================================
        // DIRECT GET LOOKUP (ZERO LATENCY CHUMA ENGINE)
        // ----------------=============================================
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'msg ai';
        thinkingDiv.id = 'ai-thinking-box';
        thinkingDiv.style.border = "1px dashed var(--accent)";
        thinkingDiv.style.background = "rgba(56, 189, 248, 0.03)";
        thinkingDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--accent); margin-right: 8px;"></i> <span style="color: #94a3b8; font-style: italic;">Mkuu, AI inavuta data instantly...</span>`;
        if (chatContainer) {
            chatContainer.appendChild(thinkingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        const tx = db.transaction(['Akili_Ya_Mfumo'], 'readonly');
        const store = tx.objectStore('Akili_Ya_Mfumo');
        
        // Amri ya Direct GET
        const hitajiLaData = store.get(swaliLaKutafuta);

        hitajiLaData.onsuccess = function(event) {
            const openThinkingBox = document.getElementById('ai-thinking-box');
            if (openThinkingBox) openThinkingBox.remove(); // Safisha kioo papo hapo

            const jibuLililopatikana = event.target.result;

            // MAHOJIANO HATUA YA 1: Mteja akiomba "barua", anzisha soga hatua ya kwanza
            if (swaliLaKutafuta.includes("barua") && jibuLililopatikana) {
                logMfumo(`[Soga Engine] Barua imegunduliwa kwa njia ya Direct Get. Inafungua soga...`);
                
                sogaYaBaruaHatua = 1; 
                dataYaBaruaMteja.swaliAsili = userText;
                dataYaBaruaMteja.mifupaBarua = jibuLililopatikana;

                setTimeout(() => {
                    const jibuLaSoga1 = `Habari ya uzazi mkuu! Nipo tayari kabisa kukuandikia barua ya uhakika. \n\nJe, ungependa hii barua iwe ya **kazi gani au inahusiana na nafasi ipi** mkuu wangu?\n*(Mfano: Uhasibu, IT Specialist, Udereva)*`;
                    tiririshaJibuKamaGemini(jibuLaSoga1);
                }, 400);
                return;
            }

            // Kama sio barua na jibu lipo, litiririshe kawaida
            if (jibuLililopatikana) {
                logMfumo(`[Direct Lookup] ✅ Data imepatikana kwenye index.`);
                tiririshaJibuKamaGemini(jibuLililopatikana);
                hifadhiKwenyeHistory(userText, jibuLililopatikana);
            } else {
                const jibuLaAkiba = "Samahani mkuu, sijalishwa jibu la swali hili bado. Tafadhali nilishe kupitia sidebar ya kushoto! 🧠";
                tiririshaJibuKamaGemini(jibuLaAkiba);
                logMfumo(`[Direct Lookup] ⚠️ Swali halipo kwenye hifadhidata.`);
            }
        };

        hitajiLaData.onerror = function() {
            const openThinkingBox = document.getElementById('ai-thinking-box');
            if (openThinkingBox) openThinkingBox.remove();
            logMfumo("[-] Direct lookup error.");
        };
    });
}

        pichaIliyochaguliwaJina = null;
        pichaIliyochaguliwaData = null;
        if (imageFileInput) imageFileInput.value = "";
   
// =================================================================
// 8. SIDEBAR HISTORY MANAGEMENT
// =================================================================
function hifadhiKwenyeHistory(swali, jibu) {
    if (!db) return;
    const tx = db.transaction(['Chat_History'], 'readwrite');
    const store = tx.objectStore('Chat_History');
    store.add({ kichwa: swali, jibu: jibu });
    tx.oncomplete = () => vutaNaUnyoosheHistory();
}

function vutaNaUnyoosheHistory() {
    if (!historyContainer || !db) return;
    historyContainer.innerHTML = "";
    
    const tx = db.transaction(['Chat_History'], 'readonly');
    const store = tx.objectStore('Chat_History');
    
    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerText = cursor.value.kichwa.substring(0, 18) + "...";
            
            const jibuHifadhi = cursor.value.jibu;
            item.onclick = (e) => {
                e.stopPropagation();
                wekaMesejiKwenyeChat(jibuHifadhi, 'ai');
                if (window.innerWidth <= 900) sidebarLeft.classList.remove('open');
            };
            historyContainer.appendChild(item);
            cursor.continue();
        }
    };
}



// =================================================================
// REKEBISHO LA CHUMA PART 5-A: KUZUIA ALERT YA DATABASE HAIJAKAA SAWA
// =================================================================

// 9. AUTOMATIC ACTIVE/DISABLE BUTTON NA ENTER CONTROL (HERUFI 1 TRIGGER)
function kaguaKikashaChaUjumbe() {
    if (!productInput || !btnGenerate) return;
    
    // MKAKATI: Kama database haijafunguka bado (db === null), ZIMA kitufe moja kwa moja kulinda mfumo!
    if (!db) {
        btnGenerate.disabled = true;
        btnGenerate.style.opacity = "0.3";
        btnGenerate.style.cursor = "not-allowed";
        btnGenerate.style.boxShadow = "none";
        return;
    }
    
    // Kipimo cha urefu halisi wa maandishi baada ya database kuwa ready
    if (productInput.value.length === 0 && !pichaIliyochaguliwaJina) {
        btnGenerate.disabled = true;
        btnGenerate.style.opacity = "0.3";
        btnGenerate.style.cursor = "not-allowed";
        btnGenerate.style.boxShadow = "none";
    } else {
        btnGenerate.disabled = false;
        btnGenerate.style.opacity = "1";
        btnGenerate.style.cursor = "pointer";
        btnGenerate.style.boxShadow = "0 0 12px rgba(37, 99, 235, 0.6)";
    }
}

if (productInput) {
    productInput.addEventListener('input', kaguaKikashaChaUjumbe);
    productInput.addEventListener('keyup', kaguaKikashaChaUjumbe);
    productInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') logMfumo("[Chat] Mstari umevunjwa kwenda chini.");
    });
}

// =================================================================
// KITENGO CHA 10 KILICHOBORESHWA: SUGGESTION CHIPS NA AUTO-TRIGGER
// =================================================================
function tiririshaMasandukuKumiYaKaribu() {
    const chipsContainer = document.getElementById('suggestion-chips-container');
    if (!chipsContainer) return;
    chipsContainer.innerHTML = "";
    let chipIndex = 0;

    function sikaChipInayofuata() {
        if (chipIndex < CHIPS_ZA_KIBONGO_10.length) {
            const swaliKamili = CHIPS_ZA_KIBONGO_10[chipIndex];
            const btnChip = document.createElement('button');
            btnChip.style.background = "rgba(56, 189, 248, 0.05)";
            btnChip.style.color = "var(--accent)";
            btnChip.style.border = "1px solid rgba(56, 189, 248, 0.15)";
            btnChip.style.padding = "8px 14px";
            btnChip.style.borderRadius = "20px";
            btnChip.style.fontSize = "13px";
            btnChip.style.cursor = "pointer";
            btnChip.style.fontFamily = "inherit";
            btnChip.style.transition = "all 0.2s ease";
            btnChip.style.opacity = "0";

            btnChip.onmouseover = () => { btnChip.style.background = "var(--accent)"; btnChip.style.color = "#0b1329"; };
            btnChip.onmouseout = () => { btnChip.style.background = "rgba(56, 189, 248, 0.05)"; btnChip.style.color = "var(--accent)"; };

            btnChip.onclick = function(e) {
                e.stopPropagation();
                if (productInput && btnGenerate) {
                    productInput.value = swaliKamili;
                    btnGenerate.click();
                }
                const welcomeBlock = document.getElementById('gemini-welcome-block');
                if (welcomeBlock) welcomeBlock.remove();
            };

            chipsContainer.appendChild(btnChip);
            let herufiIndex = 0;
            btnChip.style.opacity = "1";

            function chapaHerufiNdaniYaKifungo() {
                if (herufiIndex < swaliKamili.length) {
                    btnChip.innerText += swaliKamili.charAt(herufiIndex);
                    herufiIndex++;
                    setTimeout(chapaHerufiNdaniYaKifungo, 10);
                } else {
                    chipIndex++;
                    setTimeout(sikaChipInayofuata, 50);
                }
            }
            chapaHerufiNdaniYaKifungo();
        }
    }
    sikaChipInayofuata();
}

// UJANJA WA FOCUS NA BLUR (MTUMIAJI AKIGUSA CHAT YANAPOTEA, AKIGHAAIRI YANARUDI)
if (productInput) {
    productInput.addEventListener('focus', () => {
        const welcomeBlock = document.getElementById('gemini-welcome-block');
        if (welcomeBlock) {
            welcomeBlock.style.transition = "opacity 0.2s ease, transform 0.2s ease";
            welcomeBlock.style.opacity = "0";
            welcomeBlock.style.transform = "scale(0.95)";
            setTimeout(() => { 
                if (productInput === document.activeElement) welcomeBlock.style.display = "none"; 
            }, 200);
        }
    });

    productInput.addEventListener('blur', () => {
        setTimeout(() => {
            const welcomeBlock = document.getElementById('gemini-welcome-block');
            const ujumbeUliopo = productInput.value.trim();
            const hesabuYaMeseji = chatContainer ? chatContainer.getElementsByClassName('msg').length : 0;

            // Akighairi na uwanja uko mweupe, yarudishe instantly kitalanta
            if (ujumbeUliopo === "" && welcomeBlock && hesabuYaMeseji <= 1) {
                welcomeBlock.style.display = "flex";
                setTimeout(() => { 
                    welcomeBlock.style.opacity = "1"; 
                    welcomeBlock.style.transform = "scale(1)"; 
                }, 50);
            }
        }, 200);
    });
}

// =================================================================
// MSTARI WA CHUMA WA CHINI KABISA WA FAILI (ZINDUA MTAMBO)
// =================================================================


// MAPINDUZI: Website ikifunguka tu, fyatua na ufungue yale maneno 10 yenyewe instantly bila kusubiri!
tiririshaMasandukuKumiYaKaribu(); 

kaguaKikashaChaUjumbe();


// =================================================================
// BONGO AI ENGINE v10.0 - PRODUCTION MASTER CORE (PART 5 - B)
// =================================================================

// 11. VIFUNGO VYA UTENDAJI (NEW CHAT NA CLEAR ALL ACTIONS)
if (btnNewChat) {
    btnNewChat.onclick = function(e) {
        e.stopPropagation();
        logMfumo("[Chat] Mkuu amezindua New Chat. Inasafisha kioo...");
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div id="gemini-welcome-block" style="text-align: center; padding: 25px 15px; margin: auto; max-width: 90%; display: flex; flex-direction: column; align-items: center;">
                    <h1 style="color: var(--accent); font-size: 26px; margin-bottom: 8px; text-shadow: 0 0 15px rgba(56, 189, 248, 0.4);">Haujambo mkuu,</h1>
                    <p style="font-size: 16px; color: #94a3b8; margin-top: 0; line-height: 1.5; margin-bottom: 20px;">Je, ungependa tuzungumzie nini leo?</p>
                    <div id="suggestion-chips-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; width: 100%; max-width: 600px; box-sizing: border-box;"></div>
                    <span style="font-size: 11px; color: #576f93; display: block; margin-top: 25px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px; width: 100%;">
                        <i class="fa-solid fa-brain" style="margin-right: 4px;"></i> Lisha maswali na majibu upande wa kushoto, kisha chapa hapa chini au gusa vifungo juu.
                    </span>
                </div>
            `;
        }
        productInput.value = "";
        kaguaKikashaChaUjumbe();
        tiririshaMasandukuKumiYaKaribu(); // Fyatua tena masanduku 10 upya kitalanta!
    };
}

if (btnClearHistory) {
    btnClearHistory.onclick = function(e) {
        e.stopPropagation();
        if (!db) return alert("⚠️ Hifadhidata bado haijawa tayari!");
        if (confirm("⚠️ ONYO MKUU: Je, una uhakika unataka kufuta KILA KITU? Jambo hili litasafisha historia YA CHAT pamoja na MAKALA/MAJIBU yote mliyolisha!")) {
            logMfumo("[Hifadhidata] Inasafisha meza zote mbili...");
            const myTransaction = db.transaction(['Chat_History', 'Akili_Ya_Mfumo'], 'readwrite');
            const storeHistory = myTransaction.objectStore('Chat_History');
            const storeAkili = myTransaction.objectStore('Akili_Ya_Mfumo');
            
            storeHistory.clear();
            storeAkili.clear();

            myTransaction.oncomplete = function() {
                logMfumo("[Hifadhidata] ✅ Clear All Imekamilika!");
                if (chatContainer) chatContainer.innerHTML = '<div class="msg ai">Mambo vipi mkuu! Mfumo umesafishwa kabisa kwa amri ya Clear All na hifadhidata imerudi kuwa mweupe. Tafadhali ulisha upya maarifa kwenye sidebar! 🧠🚀</div>';
                if (historyContainer) historyContainer.innerHTML = "";
                swaliInput.value = "";
                jibuInput.value = "";
                alert("Mfumo mzima wa IndexedDB umesafishwa kikamilifu mkuu! 🧹🧠");
            };
        }
    };
}




// =================================================================
// BONGO AI ENGINE v10.0 - PRODUCTION MASTER CORE (PART 5 - C)
// =================================================================

// 12. SEARCH ENGINE YA SIDEBAR HISTORY (LIMIT 10 NA ALERTS)
document.getElementById('search-history-input')?.addEventListener('input', function(e) {
    const nenoTafutwa = e.target.value.trim().toLowerCase();
    const historyListContainer = document.getElementById('history-container');
    if (!historyListContainer) return;
    
    const items = historyListContainer.getElementsByClassName('history-item');
    let noResultLabel = document.getElementById('search-no-results');
    if (noResultLabel) noResultLabel.remove();
    
    let hesabuYaZilizopatikana = 0;

    for (let i = 0; i < items.length; i++) {
        const maandishiYaItem = items[i].innerText.toLowerCase();
        if (nenoTafutwa === "") {
            items[i].style.display = "";
            continue;
        }
        if (maandishiYaItem.includes(nenoTafutwa) && hesabuYaZilizopatikana < 10) {
            items[i].style.display = ""; 
            hesabuYaZilizopatikana++;    
        } else {
            items[i].style.display = "none"; 
        }
    }

    if (nenoTafutwa !== "" && hesabuYaZilizopatikana === 0) {
        const label = document.createElement('div');
        label.id = 'search-no-results';
        label.style.fontSize = "12px"; 
        label.style.color = "#ef4444"; 
        label.style.padding = "10px 5px"; 
        label.style.textAlign = "center"; 
        label.style.fontStyle = "italic"; 
        label.style.border = "1px dashed rgba(239, 68, 68, 0.2)"; 
        label.style.borderRadius = "8px"; 
        label.style.marginTop = "5px";
        label.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Mkuu, andiko hili halijapatikana...`;
        historyListContainer.appendChild(label);
    }
});



// =================================================================
// BONGO AI ENGINE v10.0 - PRODUCTION MASTER CORE (PART 5 - D)
// =================================================================

// 13. INTERACTIVE CORNER ACTION: CLICK OUTSIDE TO CLOSE MOBILE SIDEBAR
document.addEventListener('click', function(event) {
    if (!sidebarLeft || !btnToggleLeft) return;

    // Kagua kama sidebar ipo wazi na skrini iliyopo ni ya simu (width <= 900px)
    if (sidebarLeft.classList.contains('open') && window.innerWidth <= 900) {
        const mgusoNdaniYaSidebar = sidebarLeft.contains(event.target);
        const mgusoKwenyeKitufeBars = btnToggleLeft.contains(event.target);
        
        // Ukaguzi wa chuma: Kama mguso haujatokea NDANI ya sidebar wala kwenye kitufe cha bars
        if (!mgusoNdaniYaSidebar && !mgusoKwenyeKitufeBars) {
            sidebarLeft.classList.remove('open'); // Funga sidebar instantly mkuu!
            logMfumo("[UI] Sidebar imejifunga kwa sababu mkuu amegusa chat screen.");
        }
    }
});

// =================================================================
// ZINDUA MTAMBO MZIMA WA JUMLA WAKATI UKURASA UNAPOFUNGUKA (INITIALIZE)
// =================================================================

setTimeout(tiririshaMasandukuKumiYaKaribu, 1000);
kaguaKikashaChaUjumbe();
