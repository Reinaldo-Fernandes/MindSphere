let timer;
let timeLeft = 1500;
const totalTime = 1500;
const display = document.getElementById('timer-display');
const statusText = document.getElementById('status-text');
const circle = document.querySelector('.progress-ring__circle');
const garden = document.getElementById('garden-layer');
const ambientLayer = document.getElementById('ambient-layer');
const orbitSpeech = document.getElementById('orbit-speech');
const orbitImg = document.getElementById('orbit-img');

const circumference = 212 * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;

const sounds = {
    rain: document.getElementById('audio-rain'),
    fire: document.getElementById('audio-fire'),
    plant: document.getElementById('audio-plant'),
    alarm: document.getElementById('audio-alarm')
};

const phrases = {
    start: ["Vamos começar? No seu tempo.", "Foco iniciado. Estou aqui com você.", "Passos pequenos, grandes resultados."],
    panic: ["Respire fundo. O tempo parou para você.", "Tudo bem pausar. Vamos recomeçar depois."],
    complete: ["Você conseguiu!", "Incrível! Que tal um descanso?", "Sessão finalizada com sucesso!"],
    idle: ["Bebeu água hoje?", "Seus ombros estão relaxados?", "Estou gostando do seu ritmo."]
};

function orbitTalk(type) {
    const pool = phrases[type] || phrases.idle;
    orbitSpeech.innerText = pool[Math.floor(Math.random() * pool.length)];
    orbitSpeech.classList.add('active');
    setTimeout(() => orbitSpeech.classList.remove('active'), 5000);
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        sounds.alarm.play().catch(() => {});
        statusText.innerText = "Sessão Concluída";
        orbitTalk('complete');
        return;
    }

    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    
    const offset = circumference - (timeLeft / totalTime) * circumference;
    circle.style.strokeDashoffset = offset;

    // MELHORIA: Aparece a primeira planta aos 24:00 (60s após iniciar) 
    // e depois a cada 5 minutos (300s)
    if ((timeLeft === 1440) || (timeLeft > 0 && timeLeft % 300 === 0)) {
        spawnItem();
    }
}

function spawnItem() {
    if (sounds.plant) {
        sounds.plant.currentTime = 0;
        sounds.plant.play().catch(() => {});
    }
    
    const styles = {
        plantas: ['🌱', '🌿', '🌸', '🌼', '🍀'],
        notas: ['🎵', '🎶', '🎼', '🎹', '🎸'],
        espaco: ['✨', '⭐', '🌟', '☄️', '🌙'],
        comida: ['🍎', '🍇', '🍫', '☕', '🥨']
    };
    
    const style = document.getElementById('garden-style').value;
    const pool = styles[style] || styles.plantas;
    
    const span = document.createElement('span');
    span.innerText = pool[Math.floor(Math.random() * pool.length)];
    span.style.fontSize = '28px';
    span.style.position = 'absolute';
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 150; 
    span.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
    span.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
    
    garden.appendChild(span);
}

// Event Listeners permanecem iguais aos seus ficheiros originais...
document.getElementById('start-btn').addEventListener('click', () => {
    const container = document.getElementById('orbit-assistant');
    if (container.classList.contains('intro')) {
        container.classList.remove('intro');
        orbitImg.src = "./assistente/Orbit2.png";
        setTimeout(() => orbitTalk('start'), 800);
    }
    if (!timer) {
        statusText.innerText = "Foco Ativo";
        timer = setInterval(updateTimer, 1000);
    }
});

document.getElementById('panic-btn').addEventListener('click', () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    circle.style.strokeDashoffset = 0;
    garden.innerHTML = "";
    statusText.innerText = "Respira fundo...";
    orbitImg.src = "./assistente/Orbit2.png";
    orbitTalk('panic');
    sounds.rain.pause();
    sounds.fire.pause();
    document.getElementById('rain-vol').value = 0;
    document.getElementById('fire-vol').value = 0;
    ambientLayer.style.opacity = 0;
});

document.getElementById('rain-vol').addEventListener('input', (e) => {
    const v = e.target.value;
    sounds.rain.volume = v;
    if (v > 0) {
        sounds.rain.play().catch(() => {});
        ambientLayer.classList.add('mode-rain');
        ambientLayer.style.opacity = v;
    } else {
        sounds.rain.pause();
        ambientLayer.style.opacity = 0;
    }
});

document.getElementById('fire-vol').addEventListener('input', (e) => {
    sounds.fire.volume = e.target.value;
    if (e.target.value > 0) sounds.fire.play().catch(() => {});
    else sounds.fire.pause();
});

document.getElementById('break-task-btn').addEventListener('click', () => {
    const input = document.getElementById('task-input');
    const list = document.getElementById('subtasks-list');
    if (!input.value) return;
    list.innerHTML = `
        <div class="subtask-item"><input type="checkbox"> 1. Abrir ${input.value}</div>
        <div class="subtask-item"><input type="checkbox"> 2. Focar no primeiro passo</div>
        <div class="subtask-item"><input type="checkbox"> 3. Revisar o que fez</div>
    `;
    orbitTalk('idle');
    input.value = "";
});

function setMode(mode) {
    const colors = { 'dopamina': '#ff2da4', 'serenidade': '#5ef3ff', 'autonomia': '#adff2f' };
    document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
    orbitImg.src = `./assistente/${mode}.png`;
    const msgs = {
        'dopamina': "Bora! Muita energia!",
        'serenidade': "Calma e foco... no seu tempo.",
        'autonomia': "Você está no comando."
    };
    orbitSpeech.innerText = msgs[mode];
    orbitSpeech.classList.add('active');
    setTimeout(() => orbitSpeech.classList.remove('active'), 4000);
}