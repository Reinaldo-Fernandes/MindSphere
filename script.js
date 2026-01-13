let timer = null;
let timeLeft = 1500;
const totalTime = 1500;
const TIME_TO_BLOOM = 300; 

// --- REFERÊNCIAS ---
const body = document.body;
const startBtn = document.getElementById('start-btn');
const panicBtn = document.getElementById('panic-btn');
const orbitSpeech = document.getElementById('orbit-speech');
const orbitImg = document.getElementById('orbit-img');
const taskInput = document.getElementById('task-input');
const subtasksList = document.getElementById('subtasks-list');
const mixerAnchor = document.getElementById('mixer-anchor');
const circle = document.querySelector('.progress-ring__circle');
const display = document.getElementById('timer-display');

// Áudios
const audioRain = document.getElementById('audio-rain');
const audioFire = document.getElementById('audio-fire');
const audioStart = document.getElementById('audio-start'); 
const audioComplete = document.getElementById('audio-complete');

// --- CONFIGURAÇÃO CIRCULAR ---
const circumference = 212 * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// --- FUNÇÕES DE INTERAÇÃO DO ORBIT ---
function orbitTalk(t) {
    orbitSpeech.innerText = t;
    orbitSpeech.classList.add('active');
    setTimeout(() => orbitSpeech.classList.remove('active'), 5000);
}

function setOrbitState(state) {
    const paths = {
        'default': './assistente/orbits/Orbit.png',
        'goblin': './assistente/orbits/Goblin.png',
        'foco': './assistente/orbits/Foco.png',
        'login': './assistente/orbits/Orbit.png',
        'cadastro': './assistente/orbits/Orbit.png'
    };
    
    if (paths[state]) {
        orbitImg.src = paths[state];
    }

    // Efeitos de glow dinâmicos
    orbitImg.className = (state === 'login') ? 'glow-login' : (state === 'cadastro') ? 'glow-cadastro' : '';
}

// --- MODO GOBLIN ---
document.getElementById('break-task-btn').onclick = () => {
    const task = taskInput.value;
    if (!task) return orbitTalk("Diga-me o que é difícil primeiro! ");
    
    setOrbitState('goblin'); 
    
    const steps = ["Começar pequeno", "Focar 5 minutos", "Respirar", "Concluir"];
    subtasksList.innerHTML = "";
    steps.forEach(step => {
        const li = document.createElement('div');
        li.className = 'task-item';
        li.innerHTML = `<input type="checkbox"> <span>${step} ${task}</span>`;
        subtasksList.appendChild(li);
    });
    orbitTalk("Tarefa dividida! Um passo de cada vez. ");
};

// --- MODO LENTES (CORES) ---
window.setMode = (mode) => {
    const themes = {
        dopamina: { color: '#ff2da4', text: "Modo Dopamina: Estímulo máximo! " },
        serenidade: { color: '#5ef3ff', text: "Modo Serenidade: Foco calmo. " },
        autonomia: { color: '#adff2f', text: "Modo Autonomia: Você no controle. " }
    };
    const theme = themes[mode];
    document.documentElement.style.setProperty('--accent-cyan', theme.color);
    orbitTalk(theme.text);
};

// --- CONTROLE DO TIMER ---
startBtn.onclick = () => {
    // Transição do Onboarding
    if (body.classList.contains('onboarding-active')) {
        body.classList.remove('onboarding-active');
        setTimeout(() => mixerAnchor.appendChild(startBtn), 800);
    }

    if (!timer) {
        if (audioStart) audioStart.play(); 
        timer = setInterval(updateTimer, 1000);
        startBtn.innerText = "PAUSAR";
        setOrbitState('foco');
    } else {
        clearInterval(timer);
        timer = null;
        startBtn.innerText = "RETOMAR";
        setOrbitState('default');
    }
};

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        if (audioComplete) audioComplete.play();
        orbitTalk("Missão cumprida! 🏆");
        startBtn.innerText = "REINICIAR";
        return;
    }
    timeLeft--;
    
    // Lógica do Jardim (Cria itens a cada 10 segundos após os primeiros 5 min)
    if (timeLeft <= (totalTime - TIME_TO_BLOOM) && timeLeft % 10 === 0) spawnGardenItem();
    
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    circle.style.strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
}

// --- RESET DE PÂNICO ---
panicBtn.onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    
    display.innerText = "25:00";
    circle.style.strokeDashoffset = circumference;
    startBtn.innerText = "INICIAR FOCO";
    
    audioRain.pause();
    audioFire.pause();
    audioRain.currentTime = 0;
    audioFire.currentTime = 0;
    
    setOrbitState('default');
    orbitTalk("Sistema reiniciado. Respire fundo.");
};

// --- JARDIM ---
function spawnGardenItem() {
    const container = document.querySelector('.sphere-wrapper');
    const style = document.getElementById('garden-style').value;
    const items = { 
        plantas: ['🌿', '🌱', '🌸'], 
        espaco: ['✨', '🪐'], 
        notas: ['🎵', '🎹'], 
        comida: ['☕', '🍪'] 
    };
    const selected = items[style] || items.plantas;
    
    const item = document.createElement('div');
    item.className = 'garden-item';
    item.innerText = selected[Math.floor(Math.random() * selected.length)];
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 230 + Math.random() * 50;
    item.style.left = `${Math.cos(angle) * radius + container.offsetWidth / 2}px`;
    item.style.top = `${Math.sin(angle) * radius + container.offsetHeight / 2}px`;
    
    container.appendChild(item);
    setTimeout(() => item.remove(), 10000);
}

// --- CONTROLES DE VOLUME ---
document.getElementById('rain-vol').oninput = (e) => {
    audioRain.volume = e.target.value;
    if (audioRain.volume > 0) audioRain.play(); else audioRain.pause();
};

document.getElementById('fire-vol').oninput = (e) => {
    audioFire.volume = e.target.value;
    if (audioFire.volume > 0) audioFire.play(); else audioFire.pause();
};