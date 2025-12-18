/* Version: #4 */

// === TILSTAND ===
let peer = null;
let connections = []; // Liste over alle tilkoblede elever
let currentPoll = null; // { question: "", options: [] }
let voteCounts = {}; // { 0: 5, 1: 3 ... } (index -> antall stemmer)

// === DOM ELEMENTER ===
const ui = {
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    roomCode: document.getElementById('room-code-display'),
    playerCount: document.getElementById('player-count'),
    
    lobbyPanel: document.getElementById('lobby-panel'),
    createPanel: document.getElementById('create-panel'),
    resultsPanel: document.getElementById('results-panel'),
    
    inputQuestion: document.getElementById('input-question'),
    optionsContainer: document.getElementById('options-container'),
    btnAddOption: document.getElementById('btn-add-option'),
    btnStart: document.getElementById('btn-start-vote'),
    btnStop: document.getElementById('btn-stop-vote'),
    
    displayQuestion: document.getElementById('display-question'),
    barsContainer: document.getElementById('bars-container'),
    votesReceived: document.getElementById('votes-received'),
    
    log: document.getElementById('debug-log')
};

// === LOGGING ===
function log(msg) {
    console.log(msg);
    ui.log.textContent = msg;
}

// === PEERJS SETUP ===
function initPeer() {
    // Generer en tilfeldig 4-bokstavs ID (A-Z)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let id = "";
    for(let i=0; i<4; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    
    log(`Starter server med ID: ${id}...`);
    
    peer = new Peer(id, { debug: 1 });

    peer.on('open', (peerId) => {
        log(`Server klar. Kode: ${peerId}`);
        ui.roomCode.textContent = peerId;
        ui.statusDot.classList.add('status-connected');
        ui.statusText.textContent = "Online";
        
        // Vis opprettelses-panelet
        ui.createPanel.classList.remove('hidden');
    });

    peer.on('connection', (conn) => {
        handleConnection(conn);
    });

    peer.on('error', (err) => {
        log(`Feil: ${err.type}`);
        if(err.type === 'unavailable-id') initPeer(); // Prøv igjen hvis uheldig kollisjon
    });
    
    peer.on('disconnected', () => {
        ui.statusText.textContent = "Mistet nettverk";
        ui.statusDot.classList.remove('status-connected');
    });
}

function handleConnection(conn) {
    conn.on('open', () => {
        connections.push(conn);
        updateCount();
        
        // Hvis en avstemning pågår, send den til den nye eleven
        if (currentPoll) {
            conn.send({ type: 'POLL', data: currentPoll });
        }
    });

    conn.on('data', (data) => {
        if (data.type === 'VOTE') {
            registerVote(data.optionIndex);
        }
    });

    conn.on('close', () => {
        connections = connections.filter(c => c !== conn);
        updateCount();
    });
}

function updateCount() {
    ui.playerCount.textContent = connections.length;
}

// === AVSTEMNINGS-LOGIKK ===

function addOptionField() {
    const div = document.createElement('div');
    div.className = 'option-input-group';
    div.innerHTML = `<input type="text" class="option-input" placeholder="Alternativ">`;
    ui.optionsContainer.appendChild(div);
}

function startVote() {
    const question = ui.inputQuestion.value.trim();
    if (!question) return alert("Du må skrive et spørsmål!");

    // Samle alternativer
    const inputs = document.querySelectorAll('.option-input');
    const options = [];
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) options.push(val);
    });

    if (options.length < 2) return alert("Du må ha minst 2 alternativer!");

    // Nullstill stemmer
    voteCounts = {};
    options.forEach((_, idx) => voteCounts[idx] = 0);
    
    currentPoll = { question, options };
    
    // Oppdater UI
    ui.createPanel.classList.add('hidden');
    ui.resultsPanel.classList.remove('hidden');
    ui.displayQuestion.textContent = question;
    renderBars();

    // Send til alle elever
    broadcast('POLL', currentPoll);
}

function stopVote() {
    // Send beskjed om at det er slutt (valgfritt, men pent)
    broadcast('RESET', null);
    
    currentPoll = null;
    ui.resultsPanel.classList.add('hidden');
    ui.createPanel.classList.remove('hidden');
    
    // Tøm input for neste runde? Nei, la det stå så læreren kan redigere lett.
}

function broadcast(type, payload) {
    connections.forEach(conn => {
        if (conn.open) conn.send({ type, data: payload });
    });
}

function registerVote(index) {
    if (!currentPoll) return;
    
    // Enkel telling. (Her sjekker vi ikke om samme person stemmer to ganger, 
    // men klienten sperrer for det. I en seriøs app ville vi brukt peerId for å sjekke.)
    if (voteCounts[index] !== undefined) {
        voteCounts[index]++;
        renderBars();
    }
}

function renderBars() {
    ui.barsContainer.innerHTML = '';
    
    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
    ui.votesReceived.textContent = totalVotes;

    currentPoll.options.forEach((optText, index) => {
        const count = voteCounts[index] || 0;
        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        
        const div = document.createElement('div');
        div.className = 'result-bar-container';
        div.innerHTML = `
            <div class="result-header">
                <span>${optText}</span>
                <span>${count} (${Math.round(pct)}%)</span>
            </div>
            <div class="result-track">
                <div class="result-fill" style="width: ${pct}%"></div>
            </div>
        `;
        ui.barsContainer.appendChild(div);
    });
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    initPeer();
    
    ui.btnAddOption.addEventListener('click', addOptionField);
    ui.btnStart.addEventListener('click', startVote);
    ui.btnStop.addEventListener('click', stopVote);
});
/* Version: #4 */
