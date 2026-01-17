/* --- 0. FIREBASE CONFIG --- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCvq3MnFtZKZP4QFpkOMknUnaR6tK17YPc",
    authDomain: "mindsphere-6ec32.firebaseapp.com",
    projectId: "mindsphere-6ec32",
    storageBucket: "mindsphere-6ec32.firebasestorage.app",
    messagingSenderId: "538583383443",
    appId: "1:538583383443:web:f17b6a4cb3c703978ebc66",
    measurementId: "G-MLKWN431SD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- SELETORES GLOBAIS ---
const getEl = (id) => document.getElementById(id);
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const circumference = 212 * 2 * Math.PI; 
const taskInput = getEl('task-input');
const breakTaskBtn = getEl('break-task-btn');
const clearTasksBtn = getEl('clear-tasks-btn');
const subtasksList = getEl('subtasks-list');
const goblinHistoryContainer = getEl('goblin-history');
const authTrigger = getEl('auth-trigger');
const userDisplayName = getEl('user-display-name');
const logoutBtn = getEl('logout-btn');

/* --- 1. ESTADOS --- */
let timer = null;
const totalTime = 1500; // 25 minutos
let timeLeft = totalTime; 
let userDB = { xp: 0, focos: 0, goblins: 0, conquistas: [] };

const configGameficacao = {
    hiperfoco: { titulo: "Cristais de Hiperfoco", total: 17, pasta: "hiperfoco" },
    reigoblin: { titulo: "Coroas do Rei Goblin", total: 17, pasta: "reigoblin" },
    madrugada: { titulo: "Orbes da Alvorada", total: 16, pasta: "madrugada" },
    matutino: { titulo: "Brilho Matinal", total: 16, pasta: "matutino" },
    vespertino: { titulo: "Ocaso Sereno", total: 17, pasta: "vespertino" },
    noturno: { titulo: "Estrelas da Noite", total: 16, pasta: "noturno" },
    aleatorio: { titulo: "Relíquias Perdidas", total: 30, pasta: "aleatorio" }
};

/* --- 2. CORE: ESTADO DO ORBIT & LENTES --- */

function setOrbitState(state) {
    const orbitImg = getEl('orbit-img');
    if (!orbitImg) return;

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

    const newState = state.toLowerCase();
    const newSrc = paths[newState] || paths['default'];
    orbitImg.src = newSrc;

    orbitImg.onerror = () => {
        if (orbitImg.src.includes('Goblin.png')) {
            orbitImg.src = './assistente/orbits/goblin.png';
        } else {
            orbitImg.src = './assistente/orbits/Orbit.png';
        }
    };
}

window.setMode = (mode) => {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f' };
    if (colors[mode]) {
        document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
        setOrbitState(mode);
        orbitTalk(`Lente de ${mode} ativada.`);
    }
};

function orbitTalk(text) {
    const speech = getEl('orbit-speech');
    if (!speech) return;
    speech.innerText = text;
    speech.classList.add('active');
    setTimeout(() => speech.classList.remove('active'), 5000);
}

/* --- 3. JARDIM ORBITANTE --- */

function limparJardim() {
    const container = document.querySelector('.sphere-wrapper');
    if (container) {
        container.querySelectorAll('.garden-item').forEach(el => el.remove());
    }
}

function criarItemJardim() {
    const container = document.querySelector('.sphere-wrapper');
    const gardenSelect = getEl('garden-style');
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

   const dist = 230 + Math.random() * 50;
    const dur = 20 + Math.random() * 10; 

    item.style.setProperty('--orbit-distance', `${dist}px`);
    item.style.setProperty('--orbit-duration', `${dur}s`);
    item.style.setProperty('--start-angle', `${Math.random() * 360}deg`);
    container.appendChild(item);
}

/* --- 4. MODO GOBLIN & HISTÓRICO PERSISTENTE --- */

if (goblinHistoryContainer) {
    const savedHistory = localStorage.getItem('goblinHistoryData');
    if (savedHistory) goblinHistoryContainer.innerHTML = savedHistory;
}

function saveToGoblinHistory(taskText) {
    if (!goblinHistoryContainer) return;
    const emptyMsg = goblinHistoryContainer.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const entry = document.createElement('div');
    entry.className = 'history-item';
    entry.style.cssText = "padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem; display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease;";
    
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    entry.innerHTML = `<span style="color: var(--accent-pink);">👹</span> [${time}] ${taskText} - Concluída!`;
    
    goblinHistoryContainer.prepend(entry);
    localStorage.setItem('goblinHistoryData', goblinHistoryContainer.innerHTML);
}

function createSubtask(text) {
    const div = document.createElement('div');
    div.className = 'subtask-item';
    div.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;";
    div.innerHTML = `<input type="checkbox" class="goblin-checkbox"> <span>${text}</span>`;

    const checkbox = div.querySelector('.goblin-checkbox');
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            div.style.opacity = "0.5";
            div.style.textDecoration = "line-through";
            saveToGoblinHistory(text);
            userDB.goblins++;
            ganharConquista('reigoblin');
            salvarProgresso();
            orbitTalk("Tarefa esmagada! Salva no histórico. 👹");
        }
    });
    subtasksList.appendChild(div);
}

if (breakTaskBtn) {
    breakTaskBtn.onclick = () => {
        const taskValue = taskInput?.value.trim();
        if (!taskValue) return orbitTalk("Digite algo primeiro! 👹");
        subtasksList.innerHTML = "";
        const steps = taskValue.includes(',') ? taskValue.split(',') : [taskValue, "Preparar", "Executar", "Finalizar"];
        steps.forEach(step => createSubtask(step.trim()));
        setOrbitState('goblin');
        orbitTalk("Tarefa dividida!");
    };
}

if (clearTasksBtn) {
    clearTasksBtn.onclick = () => {
        subtasksList.innerHTML = "";
        taskInput.value = "";
        orbitTalk("Lista limpa! Suas vitórias continuam no perfil. 👹");
    };
}

/* --- 5. TIMER & FOCO --- */

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timer);
        timer = null;
        getEl('audio-complete')?.play();
        finalizarCicloFoco();
        if (startBtn) startBtn.innerText = "REINICIAR";
        setOrbitState('default');
        return;
    }

    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    const marcasDeTempo = [1200, 900, 600, 300];
    if (marcasDeTempo.includes(timeLeft)) {
        criarItemJardim();
        orbitTalk("O jardim está florescendo... 🌿");
    }

    if (circle) {
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

const startBtn = getEl('start-btn');
if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});
            
            // Lógica: Se o timer estiver no início (25:00), limpa o jardim antigo e planta a nova
            if (timeLeft === totalTime) {
                limparJardim();
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

/* --- 6. FIREBASE AUTH & LOGOUT --- */

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (userDisplayName) userDisplayName.innerText = user.displayName || user.email.split('@')[0];
        onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                userDB = docSnap.data();
                renderizarEstante();
                
                const container = document.querySelector('.sphere-wrapper');
                if (container) {
                    limparJardim();
                    const totalItens = Math.floor(userDB.xp / 50);
                    for(let i = 0; i < Math.min(totalItens, 30); i++) {
                        criarItemJardim();
                    }
                }
            }
        });
        authTrigger.innerText = "👤 PERFIL";
        authTrigger.onclick = () => getEl('profile-modal')?.classList.add('active');
    } else {
        authTrigger.innerText = "🔑 ENTRAR / REGISTAR";
        authTrigger.onclick = () => {
            getEl('auth-modal')?.classList.add('active');
            setOrbitState('login');
        };
    }
});

if (logoutBtn) {
    logoutBtn.onclick = () => {
        auth.signOut().then(() => {
            localStorage.removeItem('goblinHistoryData');
            orbitTalk("Sessão encerrada. 👋");
            setTimeout(() => { window.location.reload(); }, 1500);
        });
    };
}

async function salvarProgresso() {
    const user = auth.currentUser;
    if (user) {
        try { await updateDoc(doc(db, "usuarios", user.uid), userDB); } 
        catch (e) { console.error("Erro ao salvar:", e); }
    }
}

function ganharConquista(categoria) {
    const id = `${categoria}_${userDB[categoria] || 1}`; 
    if (!userDB.conquistas.includes(id)) {
        userDB.conquistas.push(id);
        userDB.xp += 25;
        salvarProgresso();
        criarItemJardim();
    }
}

function renderizarEstante() {
    const shelf = getEl('trophy-shelf-content');
    if (!shelf) return;
    shelf.innerHTML = '';
    Object.keys(configGameficacao).forEach(chave => {
        const cat = configGameficacao[chave];
        const section = document.createElement('div');
        section.className = 'trophy-category';
        section.innerHTML = `<h4>${cat.titulo}</h4><div class="trophy-grid"></div>`;
        const grid = section.querySelector('.trophy-grid');
        for (let i = 1; i <= cat.total; i++) {
            const isUnlocked = userDB.conquistas.includes(`${chave}_${i}`);
            const slot = document.createElement('div');
            slot.className = `trophy-slot ${isUnlocked ? 'unlocked' : 'locked'}`;
            slot.innerHTML = `<img src="./assistente/gameficação/${cat.pasta}/${i}.png">`;
            grid.appendChild(slot);
        }
        shelf.appendChild(section);
    });
}

function finalizarCicloFoco() {
    userDB.focos++;
    userDB.xp += 50;
    ganharConquista('hiperfoco');
    salvarProgresso();
    criarItemJardim(); 
    orbitTalk("Ciclo concluído! Algo novo brotou no jardim. 🏆");
}

/* --- 7. INTERFACE E MIXER --- */

getEl('go-to-register')?.addEventListener('click', () => {
    getEl('auth-modal')?.classList.remove('active');
    getEl('register-modal')?.classList.add('active');
    setOrbitState('cadastro');
});

getEl('go-to-login')?.addEventListener('click', () => {
    getEl('register-modal')?.classList.remove('active');
    getEl('auth-modal')?.classList.add('active');
    setOrbitState('login');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        getEl('auth-modal')?.classList.remove('active');
        getEl('register-modal')?.classList.remove('active');
        getEl('profile-modal')?.classList.remove('active');
        setOrbitState('default');
    };
});

getEl('rain-vol').oninput = (e) => { 
    const v = e.target.value; 
    const audio = getEl('audio-rain');
    if(audio) { audio.volume = v; if (v > 0) audio.play(); else audio.pause(); }
};

getEl('fire-vol').oninput = (e) => { 
    const v = e.target.value;
    const audio = getEl('audio-fire');
    if(audio) { audio.volume = v; if (v > 0) audio.play(); else audio.pause(); }
};

getEl('panic-btn').onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    if (circle) circle.style.strokeDashoffset = circumference;
    if (startBtn) startBtn.innerText = "INICIAR";
    setOrbitState('default');
    orbitTalk("Timer reiniciado. O jardim limpará no próximo 'Iniciar'. 🌿");
};

if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}