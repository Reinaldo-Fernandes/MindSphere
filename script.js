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
const audioPlant = document.getElementById('audio-plant');
const audioAlarm = document.getElementById('audio-alarm');

// Configuração inicial de looping
audioRain.loop = true;
audioFire.loop = true;

// Configuração do Círculo de Progresso
const circumference = 212 * 2 * Math.PI;
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Mensagem de Boas-vindas
window.onload = () => {
    orbitTalk("Olá! Sou o Orbit. 🚀 Vamos cultivar o foco hoje? Clique abaixo para iniciar.");
};

// Sistema de Fala do Orbit
function orbitTalk(text) {
    orbitSpeech.classList.remove('active');
    setTimeout(() => {
        orbitSpeech.innerText = text;
        orbitSpeech.classList.add('active');
        setTimeout(() => orbitSpeech.classList.remove('active'), 8000);
    }, 100);
}

// Botão Iniciar / Pausar com Som de Feedback
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
        
        // Toca som de início (start)
        audioPlant.currentTime = 0;
        audioPlant.play().catch(e => console.log("Áudio aguardando interação..."));
    } else {
        clearInterval(timer);
        timer = null;
        startBtn.innerText = "RETOMAR";
        orbitTalk("Pausa rápida? Tudo bem, estarei à tua espera. ✨");
    }
});

// Atualização do Timer e Som de Conclusão
function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        
        // Toca som de alarme ao completar
        audioAlarm.currentTime = 0;
        audioAlarm.volume = 1.0;
        audioAlarm.play();
        
        orbitTalk("Sessão concluída! Excelente trabalho. Mereces um descanso. 🌿");
        return;
    }
    
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    
    circle.style.strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
    
    if (timeLeft % 300 === 0 && timeLeft !== totalTime && timeLeft > 0) {
        spawnPlant();
    }
}

// Controle de Volume e Ativação de Áudio em Loop
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

// Troca de Modos
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

// Lógica Modo Goblin e Input
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

function spawnPlant() {
    const orbit = document.getElementById('orbit-1');
    const plant = document.createElement('div');
    plant.className = 'garden-item';
    plant.innerText = '🌿';
    const angle = Math.random() * Math.PI * 2;
    const r = orbit.offsetWidth / 2;
    plant.style.left = `calc(50% + ${Math.cos(angle) * r}px)`;
    plant.style.top = `calc(50% + ${Math.sin(angle) * r}px)`;
    orbit.appendChild(plant);
    
    audioPlant.currentTime = 0;
    audioPlant.play().catch(() => {});
}

document.getElementById('panic-btn').addEventListener('click', () => location.reload());

// --- ESTADO DE GAMIFICAÇÃO ---
let usuarioLogado = false;
const conquistas = [
    { id: 'first_cycle', nome: 'Pioneiro', img: './conquistas/pioneiro.png', desc: 'Primeiro ciclo completo', unlocked: false },
    { id: 'goblin_king', nome: 'Mestre Goblin', img: './conquistas/goblin.png', desc: 'Dividiu uma tarefa difícil', unlocked: false },
    { id: 'night_owl', nome: 'Coruja', img: './conquistas/coruja.png', desc: 'Focou durante a noite', unlocked: false }
];

// Abrir/Fechar Modais
const authModal = document.getElementById('auth-modal');
const shelfModal = document.getElementById('shelf-modal');
const authTrigger = document.getElementById('auth-trigger');

authTrigger.onclick = () => {
    if (!usuarioLogado) authModal.classList.add('active');
    else {
        renderTrophies();
        shelfModal.classList.add('active');
    }
};

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        authModal.classList.remove('active');
        shelfModal.classList.remove('active');
    }
});

// Simular Login
document.getElementById('auth-form').onsubmit = (e) => {
    e.preventDefault();
    usuarioLogado = true;
    authModal.classList.remove('active');
    authTrigger.innerText = "👤 PERFIL";
    orbitTalk("Conectado! Agora cada minuto de foco vira um prêmio na sua estante.");
};

// Função para Desbloquear
function checkUnlock(id) {
    if (!usuarioLogado) return;
    const item = conquistas.find(c => c.id === id);
    if (item && !item.unlocked) {
        item.unlocked = true;
        orbitTalk(`🏆 CONQUISTA! Você desbloqueou: ${item.nome}!`);
        // Aqui você pode tocar um som de prêmio se desejar
    }
}

function renderTrophies() {
    const grid = document.getElementById('trophy-display');
    grid.innerHTML = conquistas.map(c => `
        <div class="trophy-item ${c.unlocked ? 'unlocked' : ''}">
            <img src="${c.img}" alt="${c.nome}">
            <span>${c.nome}</span>
            <p style="font-size: 0.6rem; opacity: 0.7;">${c.desc}</p>
        </div>
    `).join('');
}

// --- INTEGRAÇÃO COM O QUE JÁ EXISTE ---

// No fim da função updateTimer(), dentro do if(timeLeft <= 0):
// checkUnlock('first_cycle');

// No evento de clique do seu botão de Modo Goblin:
// checkUnlock('goblin_king');