/* Version: #9 */

// === KONFIGURASJON ===
// Vi bytter til Eclipse sin broker på port 443 (Standard HTTPS).
// Dette går gjennom nesten alle brannmurer.
const BROKER = "mqtt.eclipseprojects.io";
const PORT = 443; 
const PATH = "/mqtt"; 
const CLIENT_ID = "host_" + Math.random().toString(16).substr(2, 8);

let client = null;
let roomCode = "";
let currentPoll = null;
let voteCounts = {};
let activePlayers = new Set(); 

// === UI ELEMENTER ===
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
    btnReconnect: document.getElementById('btn-reconnect')
};

// === INIT ===
function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

function initMQTT() {
    roomCode = generateCode();
    ui.roomCode.textContent = roomCode;
    
    console.log(`Kobler til ${BROKER}:${PORT}${PATH} som ${CLIENT_ID}`);
    
    client = new Paho.MQTT.Client(BROKER, PORT, PATH, CLIENT_ID);

    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    const options = {
        useSSL: true, // Påkrevd for port 443
        onSuccess: onConnect,
        onFailure: onFail,
        keepAliveInterval: 30,
        timeout: 10
    };
    
    try {
        client.connect(options);
    } catch (e) {
        console.error("Connect error:", e);
        onFail({ errorMessage: e.message });
    }
}

function onConnect() {
    console.log("MQTT Tilkoblet!");
    ui.statusDot.classList.add('status-connected');
    ui.statusText.textContent = "Online (Brannmur-sikker)";
    ui.createPanel.classList.remove('hidden');
    ui.btnReconnect.classList.add('hidden');

    client.subscribe(`mentometer/${roomCode}/client`);
}

function onFail(responseObject) {
    console.log("MQTT Feilet: " + responseObject.errorMessage);
    ui.statusText.textContent = "Tilkobling feilet";
    ui.btnReconnect.classList.remove('hidden');
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("MQTT Mistet forbindelse: " + responseObject.errorMessage);
        ui.statusDot.classList.remove('status-connected');
        ui.statusText.textContent = "Mistet nettet";
        ui.btnReconnect.classList.remove('hidden');
    }
}

function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);
        
        if (data.type === 'JOIN') {
            activePlayers.add(data.id);
            ui.playerCount.textContent = activePlayers.size;
            if (currentPoll) sendMessage(`mentometer/${roomCode}/host`, { type: 'POLL', data: currentPoll });
        }
        
        if (data.type === 'VOTE') {
            if (currentPoll && voteCounts[data.index] !== undefined) {
                voteCounts[data.index]++;
                renderBars();
                activePlayers.add(data.id); 
                ui.playerCount.textContent = activePlayers.size;
            }
        }
    } catch (e) { console.error("Datafeil", e); }
}

function sendMessage(topic, msgObj) {
    if (!client.isConnected()) return;
    const message = new Paho.MQTT.Message(JSON.stringify(msgObj));
    message.destinationName = topic;
    client.send(message);
}

// === SPILL LOGIKK ===

function addOption() {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'option-input';
    input.placeholder = "Alternativ";
    ui.optionsContainer.appendChild(input);
}

function startVote() {
    const q = ui.inputQuestion.value.trim();
    if (!q) return alert("Mangler spørsmål");
    
    const opts = [];
    document.querySelectorAll('.option-input').forEach(i => {
        if (i.value.trim()) opts.push(i.value.trim());
    });
    
    if (opts.length < 2) return alert("Minst 2 alternativer");

    currentPoll = { question: q, options: opts };
    voteCounts = {};
    opts.forEach((_, i) => voteCounts[i] = 0);
    
    ui.createPanel.classList.add('hidden');
    ui.resultsPanel.classList.remove('hidden');
    ui.displayQuestion.textContent = q;
    renderBars();

    sendMessage(`mentometer/${roomCode}/host`, { type: 'POLL', data: currentPoll });
}

function stopVote() {
    currentPoll = null;
    sendMessage(`mentometer/${roomCode}/host`, { type: 'RESET' });
    ui.resultsPanel.classList.add('hidden');
    ui.createPanel.classList.remove('hidden');
}

function renderBars() {
    ui.barsContainer.innerHTML = '';
    const total = Object.values(voteCounts).reduce((a, b) => a + b, 0);
    ui.votesReceived.textContent = total;

    currentPoll.options.forEach((opt, idx) => {
        const count = voteCounts[idx] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const div = document.createElement('div');
        div.className = 'result-bar-container';
        div.innerHTML = `
            <div class="result-header"><span>${opt}</span><span>${count} (${Math.round(pct)}%)</span></div>
            <div class="result-track"><div class="result-fill" style="width:${pct}%"></div></div>
        `;
        ui.barsContainer.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMQTT();
    ui.btnAddOption.addEventListener('click', addOption);
    ui.btnStart.addEventListener('click', startVote);
    ui.btnStop.addEventListener('click', stopVote);
    ui.btnReconnect.addEventListener('click', () => window.location.reload());
});
/* Version: #9 */
