/* --- CONFIGURAÇÕES E ESTADOS --- */
let timer = null;
let timeLeft = 1500; 
const totalTime = 1500;

// Elementos Principais
const body = document.body;
const startBtn = document.getElementById('start-btn');
const panicBtn = document.getElementById('panic-btn');
const orbitImg = document.getElementById('orbit-img');
const orbitSpeech = document.getElementById('orbit-speech');
const display = document.getElementById('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const subtasksList = document.getElementById('subtasks-list');
const taskInput = document.getElementById('task-input');
const breakTaskBtn = document.getElementById('break-task-btn');

// Elementos de Áudio
const audioRain = document.getElementById('audio-rain');
const audioFire = document.getElementById('audio-fire');
const audioStart = document.getElementById('audio-start');
const audioComplete = document.getElementById('audio-complete');

// Elementos de Navegação/Modais
const authModal = document.getElementById('auth-modal');
const registerModal = document.getElementById('register-modal');
const authTrigger = document.getElementById('auth-trigger');

// Configuração do Círculo de Progresso
const circumference = 212 * 2 * Math.PI;
if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

/* --- FUNÇÕES DE INTERFACE (ORBIT & LENTES) --- */

function orbitTalk(text) {
    if (!orbitSpeech) return;
    orbitSpeech.innerText = text;
    orbitSpeech.classList.add('active');
    setTimeout(() => orbitSpeech.classList.remove('active'), 5000);
}

function setOrbitState(state) {
    const paths = {
        'default': './assistente/orbits/Orbit.png',
        'foco': './assistente/orbits/foco.png',
        'goblin': './assistente/orbits/Goblin.png',
        'dopamina': './assistente/orbits/dopamina.png',
        'serenidade': './assistente/orbits/serenidade.png',
        'autonomia': './assistente/orbits/autonomia.png',
        'login': './assistente/orbits/login.png',
        'cadastro': './assistente/orbits/cadastro.png'
    };

    const lowerState = state.toLowerCase();
    if (paths[lowerState] && orbitImg) {
        orbitImg.src = paths[lowerState];
    }
}

// Lógica de Lentes (Mudança de Cores)
window.setMode = (mode) => {
    const modes = {
        dopamina: { color: '#ff2da4', talk: "Modo Dopamina: Estímulo máximo!" },
        serenidade: { color: '#5ef3ff', talk: "Modo Serenidade: Calma profunda." },
        autonomia: { color: '#adff2f', talk: "Modo Autonomia: Você no controle." }
    };

    if (modes[mode]) {
        document.documentElement.style.setProperty('--accent-cyan', modes[mode].color);
        setOrbitState(mode);
        orbitTalk(modes[mode].talk);
    }
};

function spawnGardenItem() {
    const container = document.querySelector('.sphere-wrapper');
    const gardenStyle = document.getElementById('garden-style');
    
    // Verifica se os elementos existem para não dar erro no console
    if (!container || !gardenStyle) return;

    const style = gardenStyle.value;
    const items = { 
        plantas: ['🌿', '🌱', '🌸', '🍀'], 
        espaco: ['✨', '🪐', '🌟', '☄️'], 
        notas: ['🎵', '🎹', '🎸', '🎶'], 
        comida: ['☕', '🍪', '🥐', '🧁'] 
    };
    
    const selected = items[style] || items.plantas;
    const emoji = selected[Math.floor(Math.random() * selected.length)];
    
    const item = document.createElement('div');
    item.className = 'garden-item'; 
    item.innerText = emoji;
    
    // CONFIGURAÇÃO DA ÓRBITA (Passando para o CSS)
    const duration = 15 + Math.random() * 20; // Velocidade aleatória
    const radius = 220 + Math.random() * 60;  // Distância do centro
    const startAngle = Math.random() * 360;   // Ângulo inicial

    item.style.setProperty('--orbit-duration', `${duration}s`);
    item.style.setProperty('--orbit-distance', `${radius}px`);
    item.style.setProperty('--start-angle', `${startAngle}deg`);
    
    container.appendChild(item);
    console.log("Ícone criado:", emoji); // Check no console (F12) para ver se rodou
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        if (audioComplete) audioComplete.play();
        orbitTalk("Ciclo concluído! 🏆");
        startBtn.innerText = "REINICIAR";
        setOrbitState('default');
        return;
    }

    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    if (circle) {
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    // Florescer a cada 5 minutos (300 segundos)
    if (timeLeft > 0 && timeLeft % 300 === 0) {
        spawnGardenItem();
        orbitTalk("Seu jardim está crescendo!");
    }
}

/* --- BOTÕES DE CONTROLE --- */

startBtn.onclick = () => {
    // Sair do Onboarding
    if (body.classList.contains('onboarding-active')) {
        body.classList.remove('onboarding-active');
        document.getElementById('mixer-anchor')?.appendChild(startBtn);
    }

    if (!timer) {
        if (audioStart) audioStart.play().catch(() => {});
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

panicBtn.onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    if (circle) circle.style.strokeDashoffset = circumference;
    startBtn.innerText = "INICIAR FOCO";
    document.querySelectorAll('.garden-item').forEach(el => el.remove());
    orbitTalk("Sistema resetado.");
    setOrbitState('default');
    orbitTalk("Sistema resetado.");
};

/* --- GOBLIN MODE --- */

breakTaskBtn.onclick = () => {
    const task = taskInput.value.trim();
    if (!task) {
        orbitTalk("Digite uma tarefa primeiro! 👹");
        return;
    }
    
    setOrbitState('goblin');
    const steps = [
        "Preparar o ambiente",
        "Iniciar os primeiros 5 minutos",
        "Dividir o resto em blocos",
        "Revisar progresso"
    ];
    
    subtasksList.innerHTML = "";
    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `<input type="checkbox"> <span>${step}</span>`;
        subtasksList.appendChild(div);
    });
    orbitTalk("Tarefa dividida. Vamos esmagar isso!");
};

taskInput.onfocus = () => setOrbitState('goblin');
taskInput.onblur = () => { if(!taskInput.value) setOrbitState('default'); };

/* --- SISTEMA DE MODAIS (LOGIN/REGISTRO) --- */

// Abrir Modal Inicial
if (authTrigger) {
    authTrigger.onclick = () => {
        authModal.classList.add('active');
        setOrbitState('login');
    };
}

// Trocar de Login para Registro
const goToRegister = document.getElementById('go-to-register');
if (goToRegister) {
    goToRegister.onclick = (e) => {
        e.preventDefault();
        authModal.classList.remove('active');
        registerModal.classList.add('active');
        setOrbitState('cadastro');
    };
}

// Trocar de Registro para Login
const goToLogin = document.getElementById('go-to-login');
if (goToLogin) {
    goToLogin.onclick = (e) => {
        e.preventDefault();
        registerModal.classList.remove('active');
        authModal.classList.add('active');
        setOrbitState('login');
    };
}

// Fechar qualquer modal
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        authModal.classList.remove('active');
        registerModal?.classList.remove('active');
        setOrbitState('default');
    };
});

/* --- CONTROLES DE ÁUDIO --- */

document.getElementById('rain-vol').oninput = (e) => {
    const vol = e.target.value;
    audioRain.volume = vol;
    if (vol > 0) audioRain.play().catch(() => {}); else audioRain.pause();
};

document.getElementById('fire-vol').oninput = (e) => {
    const vol = e.target.value;
    audioFire.volume = vol;
    if (vol > 0) audioFire.play().catch(() => {}); else audioFire.pause();
};