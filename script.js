/* --- 1. SELETORES GLOBAIS --- */
const getEl = (id) => document.getElementById(id);
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const circumference = 212 * 2 * Math.PI;

const taskInput = getEl('task-input');
const subtasksList = getEl('subtasks-list');
const startBtn = getEl('start-btn');

/* --- 2. ESTADOS DO TIMER --- */
let timer = null;
const totalTime = 1500; 
let timeLeft = totalTime; 

/* --- 3. FUNÇÕES DE INTERFACE (ORBIT) --- */

function orbitTalk(text) {
    const speech = getEl('orbit-speech');
    if (!speech) return;
    speech.innerText = text;
    speech.classList.add('active');
    setTimeout(() => speech.classList.remove('active'), 5000);
}

function setOrbitState(state) {
    const orbitImg = getEl('orbit-img');
    if (!orbitImg) return;
    const paths = {
        'default': './assistente/orbits/Orbit.png',
        'foco': './assistente/orbits/foco.png',
        'goblin': './assistente/orbits/Goblin.png',
        'dopamina': './assistente/orbits/dopamina.png',
        'serenidade': './assistente/orbits/serenidade.png',
        'autonomia': './assistente/orbits/autonomia.png'
    };
    orbitImg.src = paths[state.toLowerCase()] || paths['default'];
}

window.setMode = (mode) => {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f' };
    if (colors[mode]) {
        document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
        setOrbitState(mode);
        orbitTalk(`Lente de ${mode} ativada.`);
    }
};

/* --- 4. LÓGICA DO TIMER --- */

function updateTimer() {
    if (timeLeft <= 0) {
        finalizarCicloFoco();
        return;
    }

    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    // Nasce item no jardim a cada 5 minutos
    const marcasDeTempo = [1200, 900, 600, 300];
    if (marcasDeTempo.includes(timeLeft) && sec === 0) {
        criarItemJardim();
        orbitTalk("O jardim está crescendo... 🌿");
    }

    if (circle) {
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function finalizarCicloFoco() {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    circle.style.strokeDashoffset = circumference;
    startBtn.innerText = "REINICIAR";
    getEl('audio-complete')?.play();
    
    // Chama a função global que estará no gameficacao.js
    if (window.adicionarProgresso) {
        window.adicionarProgresso('foco', 100);
    }
    
    setOrbitState('default');
}

/* --- 5. JARDIM (SISTEMA DE EMOJIS) --- */

function criarItemJardim() {
    const container = document.querySelector('.sphere-wrapper');
    const gardenSelect = document.getElementById('garden-style');
    if (!container) return;

    const style = gardenSelect ? gardenSelect.value : 'plantas';
    const emojis = {
        plantas: ['🌿', '🌸', '🍃', '🍄', '🍀'],
        espaco: ['✨', '⭐', '☄️', '🌌'],
        notas: ['🎵', '🎶', '🎼', '🎹'],
        comida: ['☕', '🍪', '🥐', '🥯']
    };

    const emojiList = emojis[style] || emojis['plantas'];
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    
    const item = document.createElement('div');
    item.className = 'garden-item';
    item.innerText = emoji;

    const dist = 240 + Math.random() * 30;
    const dur = 25 + Math.random() * 5; 

    item.style.setProperty('--orbit-distance', `${dist}px`);
    item.style.setProperty('--orbit-duration', `${dur}s`);
    item.style.setProperty('--start-angle', `${Math.random() * 360}deg`);
    item.style.animation = `orbitContinuous var(--orbit-duration) linear infinite`;

    container.appendChild(item);
}

/* --- 6. MODO GOBLIN (SUBTAREFAS) --- */

getEl('break-task-btn').onclick = () => {
    const text = taskInput.value.trim();
    if (!text) return;
    const parts = [`Começar ${text}`, `Finalizar ${text}`];
    parts.forEach(t => {
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.innerHTML = `<input type="checkbox"> <span>${t}</span>`;
        div.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
                // Chama a função global que estará no gameficacao.js
                if (window.adicionarProgresso) window.adicionarProgresso('goblin', 25);
                setTimeout(() => div.remove(), 800);
            }
        };
        subtasksList.appendChild(div);
    });
    taskInput.value = "";
    setOrbitState('goblin');
};

/* --- 7. CONTROLES DE ÁUDIO --- */

function setupAudio(sliderId, audioId) {
    const s = getEl(sliderId), a = getEl(audioId);
    if (s && a) s.oninput = (e) => { 
        a.volume = e.target.value; 
        if (a.volume > 0) a.play(); else a.pause(); 
    };
}
setupAudio('rain-vol', 'audio-rain');
setupAudio('fire-vol', 'audio-fire');

/* --- 8. INICIALIZAÇÃO E BOTÕES PRINCIPAIS --- */

if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});
            
            if (timeLeft === totalTime) {
                const container = document.querySelector('.sphere-wrapper');
                if (container) {
                    container.querySelectorAll('.garden-item').forEach(el => el.remove());
                }
                criarItemJardim();
            }

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
}

getEl('panic-btn').onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    if (display) display.innerText = "25:00";
    if (circle) circle.style.strokeDashoffset = circumference;

    const container = document.querySelector('.sphere-wrapper');
    if (container) {
        container.querySelectorAll('.garden-item').forEach(el => el.remove());
    }

    setOrbitState('default');
    if (startBtn) startBtn.innerText = "INICIAR";
    orbitTalk("Tudo limpo! Vamos recomeçar? 🌿");
};

// Configuração inicial do círculo
if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

// Fechar modais genéricos
document.querySelectorAll('.close-modal').forEach(b => {
    b.onclick = () => document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
});