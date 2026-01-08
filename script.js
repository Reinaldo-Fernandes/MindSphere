let timer = null;
let timeLeft = 1500;
const totalTime = 1500;

const startBtn = document.getElementById('start-btn');
const orbitSpeech = document.getElementById('orbit-speech');
const mixerAnchor = document.getElementById('mixer-anchor');
const circle = document.querySelector('.progress-ring__circle');
const display = document.getElementById('timer-display');

const circumference = 212 * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

window.onload = () => {
    orbitTalk("Olá! Sou o Orbit. 🚀 Vamos cultivar o foco hoje? Clique abaixo para iniciar.");
};

function orbitTalk(text) {
    orbitSpeech.classList.remove('active');
    setTimeout(() => {
        orbitSpeech.innerText = text;
        orbitSpeech.classList.add('active');
        // O balão desaparece após 8 segundos para não poluir a tela
        setTimeout(() => orbitSpeech.classList.remove('active'), 8000);
    }, 500);
}

startBtn.addEventListener('click', () => {
    if (document.body.classList.contains('onboarding-active')) {
        document.body.classList.remove('onboarding-active');
        setTimeout(() => {
            mixerAnchor.appendChild(startBtn);
            startBtn.style.marginTop = "0";
            startBtn.style.fontSize = "0.85rem";
        }, 600);
        orbitTalk("Foco ligado! Estarei aqui no cantinho vigiando tudo.");
    }

    if (!timer) {
        timer = setInterval(updateTimer, 1000);
        startBtn.innerText = "PAUSAR";
    } else {
        clearInterval(timer);
        timer = null;
        startBtn.innerText = "RETOMAR";
    }
});

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        document.getElementById('audio-alarm').play();
        orbitTalk("Sessão concluída! Mereces um descanso.");
        return;
    }
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    circle.style.strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
    if (timeLeft % 300 === 0) spawnPlant();
}

function setMode(mode) {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f' };
    document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
    orbitTalk(`Modo ${mode} ativado!`);
}

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
}

document.getElementById('panic-btn').addEventListener('click', () => location.reload());