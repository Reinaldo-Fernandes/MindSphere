let timer;
let timeLeft = 1500;
const totalTime = 1500;
const display = document.getElementById('timer-display');
const statusText = document.getElementById('status-text');
const circle = document.querySelector('.progress-ring__circle');
const garden = document.getElementById('garden-layer');
const ambientLayer = document.getElementById('ambient-layer');

// Configuração do Círculo
const circumference = 212 * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;

// Áudio
const sounds = {
    rain: document.getElementById('audio-rain'),
    fire: document.getElementById('audio-fire'),
    plant: document.getElementById('audio-plant'),
    alarm: document.getElementById('audio-alarm')
};

// --- CÉREBRO DO ORBIT ---
const orbitSpeech = document.getElementById('orbit-speech');
const phrases = {
    start: ["Vamos começar? No seu tempo.", "Foco iniciado. Estou aqui com você.", "Passos pequenos, grandes resultados."],
    panic: ["Respire fundo. O tempo parou para você.", "Tudo bem pausar. Vamos recomeçar depois.", "Segurança em primeiro lugar."],
    complete: ["Você conseguiu! Sinta o dever cumprido.", "Incrível! Que tal um descanso agora?", "Sessão finalizada com sucesso!"],
    idle: ["Bebeu água hoje?", "Seus ombros estão relaxados?", "Estou gostando do seu ritmo."]
};

function orbitTalk(type) {
    const pool = phrases[type];
    orbitSpeech.innerText = pool[Math.floor(Math.random() * pool.length)];
    orbitSpeech.classList.add('active');
    setTimeout(() => orbitSpeech.classList.remove('active'), 5000);
}

function updateTimer() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    
    const offset = circumference - (timeLeft / totalTime) * circumference;
    circle.style.strokeDashoffset = offset;

    if (timeLeft % 300 === 0 && timeLeft !== totalTime && timeLeft > 0) spawnPlant();

    if (timeLeft > 0) {
        timeLeft--;
    } else {
        clearInterval(timer);
        timer = null;
        sounds.alarm.play().catch(() => {});
        statusText.innerText = "Sessão Concluída";
        orbitTalk('complete');
    }
}

function spawnPlant() {
    sounds.plant.play().catch(() => {});
    const flora = ['🌱', '🌿', '🌸', '🌼', '🍀'];
    const p = document.createElement('span');
    p.innerText = flora[Math.floor(Math.random() * flora.length)];
    p.style.fontSize = '24px';
    garden.appendChild(p);
}

// Botões
document.getElementById('start-btn').addEventListener('click', () => {
    if (timer) return;
    statusText.innerText = "Foco Ativo";
    orbitTalk('start');
    timer = setInterval(updateTimer, 1000);
});

document.getElementById('panic-btn').addEventListener('click', () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    circle.style.strokeDashoffset = 0;
    garden.innerHTML = "";
    statusText.innerText = "Respira fundo...";
    orbitTalk('panic');
});

// Mixer e Goblin Mode
document.getElementById('rain-vol').addEventListener('input', (e) => {
    sounds.rain.volume = e.target.value;
    if (e.target.value > 0) {
        sounds.rain.play();
        ambientLayer.classList.add('mode-rain');
        ambientLayer.style.opacity = e.target.value;
    }
});

document.getElementById('break-task-btn').addEventListener('click', () => {
    const input = document.getElementById('task-input');
    const list = document.getElementById('subtasks-list');
    if(!input.value) return;

    list.innerHTML = `<div class="subtask-item"><input type="checkbox"> 1. Abrir ${input.value}</div>
                      <div class="subtask-item"><input type="checkbox"> 2. Focar por 5 min</div>`;
    orbitSpeech.innerText = "Tarefas divididas! Ficou mais leve?";
    orbitSpeech.classList.add('active');
    input.value = "";
});

function setMode(mode) {
    const colors = {'dopamina': '#ff2da4', 'serenidade': '#5ef3ff', 'autonomia': '#adff2f'};
    document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
}