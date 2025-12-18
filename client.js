/* Version: #8 */

// === KONFIGURASJON ===
const BROKER = "broker.emqx.io";
const PORT = 8084; 
const MY_ID = "client_" + Math.random().toString(16).substr(2, 8);

let client = null;
let roomCode = "";
let connected = false;

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
    choicesContainer: document.getElementById('choices-container')
};

function showPanel(name) {
    ui.loginPanel.classList.add('hidden');
    ui.waitPanel.classList.add('hidden');
    ui.votePanel.classList.add('hidden');
    ui.sentPanel.classList.add('hidden');
    
    if (name === 'login') ui.loginPanel.classList.remove('hidden');
    if (name === 'wait') ui.waitPanel.classList.remove('hidden');
    if (name === 'vote') ui.votePanel.classList.remove('hidden');
    if (name === 'sent') ui.sentPanel.classList.remove('hidden');
}

function joinGame() {
    const code = ui.inputCode.value.trim().toUpperCase();
    if (code.length !== 4) return alert("Koden må være 4 tegn.");
    
    roomCode = code;
    ui.btnJoin.disabled = true;
    ui.btnJoin.textContent = "Kobler til...";
    
    client = new Paho.MQTT.Client(BROKER, PORT, MY_ID);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    const options = {
        useSSL: true,
        onSuccess: onConnect,
        onFailure: onFail,
        keepAliveInterval: 30
    };
    client.connect(options);
}

function onConnect() {
    console.log("MQTT Tilkoblet");
    connected = true;
    ui.statusDot.classList.add('status-connected');
    ui.statusText.textContent = "Tilkoblet";
    
    showPanel('wait');

    // Abonner på meldinger FRA host
    client.subscribe(`mentometer/${roomCode}/host`);

    // Send "Jeg er her" melding
    sendMessage(`mentometer/${roomCode}/client`, { type: 'JOIN', id: MY_ID });
}

function onFail(err) {
    alert("Tilkobling feilet: " + err.errorMessage);
    ui.btnJoin.disabled = false;
    ui.btnJoin.textContent = "Koble til";
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Mistet forbindelse: " + responseObject.errorMessage);
        ui.statusDot.classList.remove('status-connected');
        ui.statusText.textContent = "Frakoblet";
        alert("Mistet kontakten med serveren.");
        showPanel('login');
        ui.btnJoin.disabled = false;
        ui.btnJoin.textContent = "Koble til";
    }
}

function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);
        
        if (data.type === 'POLL') {
            renderPoll(data.data);
        } else if (data.type === 'RESET') {
            showPanel('wait');
        }
    } catch (e) {
        console.error("Ugyldig data", e);
    }
}

function sendMessage(topic, msgObj) {
    const message = new Paho.MQTT.Message(JSON.stringify(msgObj));
    message.destinationName = topic;
    client.send(message);
}

function renderPoll(poll) {
    ui.questionText.textContent = poll.question;
    ui.choicesContainer.innerHTML = '';
    
    poll.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn choice-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            sendMessage(`mentometer/${roomCode}/client`, { type: 'VOTE', index: idx, id: MY_ID });
            showPanel('sent');
        };
        ui.choicesContainer.appendChild(btn);
    });
    
    showPanel('vote');
}

document.addEventListener('DOMContentLoaded', () => {
    ui.btnJoin.addEventListener('click', joinGame);
    ui.inputCode.addEventListener('keyup', (e) => { if (e.key==='Enter') joinGame(); });
});
/* Version: #8 */
