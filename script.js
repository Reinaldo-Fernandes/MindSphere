let timer = null;
let timeLeft = 1500;
const totalTime = 1500;

// Referências da Interface
const startBtn = document.getElementById('start-btn');
const orbitSpeech = document.getElementById('orbit-speech');
const orbitImg = document.getElementById('orbit-img');
const taskInput = document.getElementById('task-input');
const mixerAnchor = document.getElementById('mixer-anchor');
const circle = document.querySelector('.progress-ring__circle');
const display = document.getElementById('timer-display');

// Referências de Áudio e Mixagem
const rainVol = document.getElementById('rain-vol');
const fireVol = document.getElementById('fire-vol');
const audioRain = document.getElementById('audio-rain');
const audioFire = document.getElementById('audio-fire');

// Configuração do Círculo de Progresso
const circumference = 212 * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Mensagem de Boas-vindas ao carregar
window.onload = () => {
    orbitTalk("Olá! Sou o Orbit. 🚀 Vamos cultivar o foco hoje? Clique abaixo para iniciar.");
};

// Sistema de Fala do Orbit (Balão de texto)
function orbitTalk(text) {
    orbitSpeech.classList.remove('active');
    setTimeout(() => {
        orbitSpeech.innerText = text;
        orbitSpeech.classList.add('active');
        setTimeout(() => orbitSpeech.classList.remove('active'), 8000);
    }, 100);
}

// Lógica do Botão Iniciar / Pausar
startBtn.addEventListener('click', () => {
    if (document.body.classList.contains('onboarding-active')) {
        document.body.classList.remove('onboarding-active');
        setTimeout(() => {
            mixerAnchor.appendChild(startBtn);
            startBtn.style.marginTop = "0";
            startBtn.style.fontSize = "0.85rem";
        }, 600);
        orbitTalk("Foco ligado! Estarei aqui no cantinho vigiando tudo. Bons estudos!");
    }

    if (!timer) {
        timer = setInterval(updateTimer, 1000);
        startBtn.innerText = "PAUSAR";
        orbitTalk("Cronómetro a contar! Concentração total agora. 🧠");
    } else {
        clearInterval(timer);
        timer = null;
        startBtn.innerText = "RETOMAR";
        orbitTalk("Pausa rápida? Tudo bem, estarei à tua espera. ✨");
    }
});

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        document.getElementById('audio-alarm').play();
        orbitTalk("Sessão concluída! Excelente trabalho. Mereces um descanso. 🌿");
        return;
    }
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    circle.style.strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
    
    if (timeLeft % 300 === 0 && timeLeft !== totalTime) spawnPlant();
}

function setMode(mode) {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f' };
    const messages = {
        dopamina: "Modo Dopamina! Vamos tornar isto divertido e estimulante. ✨",
        serenidade: "Modo Serenidade... Respira fundo e foca com calma. 🌊",
        autonomia: "Modo Autonomia ativado! Tu estás no controlo total. 🦾"
    };

    document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
    const fileName = mode.charAt(0).toUpperCase() + mode.slice(1);
    orbitImg.src = `./assistente/orbits/${fileName}.png`;
    orbitTalk(messages[mode]);
}

// Lógica Modo Goblin
taskInput.addEventListener('focus', () => {
    orbitImg.src = `./assistente/orbits/Goblin.png`;
    orbitTalk("Modo Goblin ativado! Vamos organizar essas tarefas? 👹");
});

taskInput.addEventListener('blur', () => {
    if (taskInput.value === "") {
        const currentAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-cyan').trim().toLowerCase();
        if (currentAccent === '#ff2da4') orbitImg.src = `./assistente/orbits/Dopamina.png`;
        else if (currentAccent === '#adff2f') orbitImg.src = `./assistente/orbits/Autonomia.png`;
        else orbitImg.src = `./assistente/orbits/Serenidade.png`;
    }
});

document.getElementById('break-task-btn').addEventListener('click', () => {
    if(taskInput.value) {
        orbitImg.src = `./assistente/orbits/Goblin.png`;
        orbitTalk("Esmagando a tarefa! Assim fica muito mais fácil. 🔥");
    }
});

// Controle de Som Automático
rainVol.addEventListener('input', (e) => {
    const vol = e.target.value;
    audioRain.volume = vol;
    if (vol > 0) audioRain.play().catch(() => {});
    else audioRain.pause();
});

fireVol.addEventListener('input', (e) => {
    const vol = e.target.value;
    audioFire.volume = vol;
    if (vol > 0) audioFire.play().catch(() => {});
    else audioFire.pause();
});

function spawnPlant() {
    const orbit = document.getElementById('orbit-1');
    const plant = document.createElement('div');
    plant.className = 'garden-item';
    plant.innerText = '🌿';
    const angle = Math.random() * Math.PI * 2;
    const r = orbit.offsetWidth / 2;
    plant.style.position = 'absolute';
    plant.style.left = `calc(50% + ${Math.cos(angle) * r}px)`;
    plant.style.top = `calc(50% + ${Math.sin(angle) * r}px)`;
    plant.style.transform = 'translate(-50%, -50%)';
    orbit.appendChild(plant);
    document.getElementById('audio-plant').play();
}

document.getElementById('panic-btn').addEventListener('click', () => location.reload());