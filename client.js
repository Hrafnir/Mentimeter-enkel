/* Version: #6 */

// === TILSTAND ===
let peer = null;
let conn = null; // Koblingen til læreren

// === DOM ELEMENTER ===
const ui = {
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    
    loginPanel: document.getElementById('login-panel'),
    waitPanel: document.getElementById('wait-panel'),
    votePanel: document.getElementById('vote-panel'),
    sentPanel: document.getElementById('sent-panel'),
    
    inputCode: document.getElementById('input-code'),
    btnJoin: document.getElementById('btn-join'),
    
    questionText: document.getElementById('question-text'),
    choicesContainer: document.getElementById('choices-container'),
    
    log: document.getElementById('debug-log')
};

// === LOGGING ===
function log(msg) {
    console.log(msg);
    // ui.log.textContent = msg; // Avkommenter hvis du vil se feilmeldinger på skjermen
}

// === NAVIGASJON ===
function showPanel(panelName) {
    // Skjul alle først
    ui.loginPanel.classList.add('hidden');
    ui.waitPanel.classList.add('hidden');
    ui.votePanel.classList.add('hidden');
    ui.sentPanel.classList.add('hidden');
    
    // Vis den valgte
    if (panelName === 'login') ui.loginPanel.classList.remove('hidden');
    if (panelName === 'wait') ui.waitPanel.classList.remove('hidden');
    if (panelName === 'vote') ui.votePanel.classList.remove('hidden');
    if (panelName === 'sent') ui.sentPanel.classList.remove('hidden');
}

function setStatus(status) {
    if (status === 'connected') {
        ui.statusDot.classList.add('status-connected');
        ui.statusText.textContent = "Tilkoblet";
    } else if (status === 'connecting') {
        ui.statusDot.classList.remove('status-connected');
        ui.statusText.textContent = "Kobler til...";
    } else {
        ui.statusDot.classList.remove('status-connected');
        ui.statusText.textContent = "Frakoblet";
    }
}

// === PEERJS LOGIKK ===
function joinGame() {
    const code = ui.inputCode.value.trim().toUpperCase();
    if (code.length !== 4) return alert("Koden må være 4 bokstaver.");
    
    ui.btnJoin.disabled = true;
    ui.btnJoin.textContent = "Kobler til...";
    setStatus('connecting');

    // Opprett peer (klient trenger ikke egen ID, får en tilfeldig)
    peer = new Peer({ debug: 1 });

    peer.on('open', (myId) => {
        log(`Min ID: ${myId}`);
        connectToHost(code);
    });

    peer.on('error', (err) => {
        alert(`Kunne ikke starte nettverk: ${err.type}`);
        resetLogin();
    });
}

function connectToHost(hostId) {
    log(`Prøver å koble til: ${hostId}`);
    conn = peer.connect(hostId);

    conn.on('open', () => {
        log("Tilkoblet!");
        setStatus('connected');
        showPanel('wait');
    });

    conn.on('data', (msg) => {
        handleData(msg);
    });

    conn.on('close', () => {
        alert("Læreren koblet fra.");
        setStatus('disconnected');
        showPanel('login');
        resetLogin();
    });
    
    // Timeout-sikring
    setTimeout(() => {
        if (!conn.open) {
            log("Tidsavbrudd");
            // Ikke gjør noe dramatisk, noen ganger tar det bare tid
        }
    }, 5000);
}

function resetLogin() {
    ui.btnJoin.disabled = false;
    ui.btnJoin.textContent = "Koble til";
    setStatus('disconnected');
    if (peer) {
        peer.destroy();
        peer = null;
    }
}

// === SPILL-LOGIKK ===

function handleData(msg) {
    if (msg.type === 'POLL') {
        renderPoll(msg.data);
    } else if (msg.type === 'RESET') {
        showPanel('wait');
    }
}

function renderPoll(pollData) {
    // pollData = { question: "...", options: ["A", "B"] }
    ui.questionText.textContent = pollData.question;
    ui.choicesContainer.innerHTML = '';
    
    pollData.options.forEach((optText, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn choice-btn';
        btn.textContent = optText;
        
        btn.onclick = () => {
            sendVote(index);
        };
        
        ui.choicesContainer.appendChild(btn);
    });
    
    showPanel('vote');
}

function sendVote(index) {
    if (conn && conn.open) {
        conn.send({ type: 'VOTE', optionIndex: index });
        showPanel('sent');
    } else {
        alert("Mistet kontakten med læreren. Prøv å koble til på nytt.");
        showPanel('login');
        resetLogin();
    }
}

// === START ===
document.addEventListener('DOMContentLoaded', () => {
    ui.btnJoin.addEventListener('click', joinGame);
    
    // La brukeren trykke Enter i kodefeltet
    ui.inputCode.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') joinGame();
    });
});

/* Version: #6 */
