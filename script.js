/* --- 0. FIREBASE CONFIG --- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// No topo, junto com os outros imports, adicione o reset:
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


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
const goblinHistoryContainer = getEl('goblin-history-list');
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
        // Mover para o mixer apenas se o anchor existir
        const anchor = getEl('mixer-anchor');
        if(anchor) anchor.appendChild(startBtn);
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
// --- GESTÃO UNIFICADA DE INTERFACE ---

// 1. Abrir Login/Perfil
authTrigger.onclick = () => {
    if (auth.currentUser) {
        getEl('profile-modal').classList.add('active');
    } else {
        getEl('auth-modal').classList.add('active');
        setOrbitState('login');
    }
};

// 2. Trocas entre Modais
getEl('go-to-register').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('register-modal').classList.add('active');
    setOrbitState('cadastro');
};

getEl('go-to-login').onclick = (e) => {
    e.preventDefault();
    getEl('register-modal').classList.remove('active');
    getEl('auth-modal').classList.add('active');
    setOrbitState('login');
};

getEl('forgot-password-link').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('forgot-password-modal').classList.add('active');
};

// 3. Fechar tudo
document.querySelectorAll('.close-modal, .back-to-login').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
        setOrbitState('default');
    };
});

// 4. Lógica do Orbit (Garantir que ele apareça)
function checkOrbitVisibility() {
    const orbit = getEl('orbit-assistant');
    if (orbit) {
        orbit.style.opacity = "1";
        orbit.style.visibility = "visible";
    }
}
window.onload = checkOrbitVisibility;

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

// Desbloqueia o áudio no primeiro clique do usuário no site
document.addEventListener('click', () => {
    const audios = ['audio-rain', 'audio-fire', 'audio-start', 'audio-complete'];
    audios.forEach(id => {
        const a = document.getElementById(id);
        if(a) { a.play().then(() => a.pause()).catch(() => {}); }
    });
}, { once: true });


// --- LOGICA DE TROCA DE MODAIS E ORBIT ---

// 1. Abrir Esqueci a Senha
getEl('forgot-password-link').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('forgot-password-modal').classList.add('active');
    setOrbitState('default'); // Orbit volta ao normal ou um estado de ajuda
};

// 2. Voltar para o Login
document.querySelectorAll('.back-to-login').forEach(btn => {
    btn.onclick = () => {
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
        setOrbitState('login');
    };
});

// 3. Abrir Login/Registro (Corrigindo o Orbit)
getEl('auth-trigger').onclick = () => {
    getEl('auth-modal').classList.add('active');
    setOrbitState('login'); // Agora o Orbit vai mudar!
    orbitTalk("Identifique-se, viajante!");
};

getEl('go-to-register').onclick = () => {
    getEl('auth-modal').classList.remove('active');
    getEl('register-modal').classList.add('active');
    setOrbitState('cadastro');
};

getEl('go-to-login').onclick = () => {
    getEl('register-modal').classList.remove('active');
    getEl('auth-modal').classList.add('active');
    setOrbitState('login');
};

// 4. Lógica do Envio de E-mail
getEl('send-reset-btn').onclick = async () => {
    const email = getEl('reset-email').value;
    if(!email) return orbitTalk("Diga-me seu e-mail para eu te ajudar!");
    
    try {
        await sendPasswordResetEmail(auth, email);
        orbitTalk("Link enviado! Verifique seu e-mail.");
        getEl('forgot-password-modal').classList.remove('active');
        setOrbitState('default');
    } catch (error) {
        orbitTalk("Não achei esse e-mail...");
    }
};

// 5. Clique no Orbit para ver perfil (apenas se logado)
getEl('orbit-img').onclick = () => {
    if (auth.currentUser) {
        getEl('profile-modal').classList.add('active');
    } else {
        orbitTalk("Faça login para ver seu progresso!");
    }
};

// --- 1. Lógica de Ver/Esconder Senha ---
const togglePassword = getEl('toggle-password');
const loginPassword = getEl('login-password');

if (togglePassword && loginPassword) {
    togglePassword.onclick = () => {
        const isPassword = loginPassword.type === "password";
        loginPassword.type = isPassword ? "text" : "password";
        
        // Troca a classe do FontAwesome em vez do texto
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    };
}

// --- 2. Correção da abertura do Login com Orbit ---
// Abrir Modal de Autenticação
getEl('auth-trigger').onclick = () => {
    getEl('auth-modal').classList.add('active');
    setOrbitState('login'); // Orbit aparece no modo login
};

// Trocar para Esqueci a Senha
getEl('forgot-password-link').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('forgot-password-modal').classList.add('active');
    setOrbitState('login'); // Mantém o Orbit visível aqui também
};

// Trocar para Registro
getEl('go-to-register').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('register-modal').classList.add('active');
    setOrbitState('cadastro'); // Muda para o modo cadastro
};

//---- 4 Fechar modais ----
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
        setOrbitState('default'); // Orbit volta ao normal no centro ou posição original
    };
});

/* --- 8. PERSISTÊNCIA NO FIRESTORE --- */

// Escuta mudanças no estado de login
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userDisplayName.innerText = user.displayName || "Viajante";
        authTrigger.innerText = "👤 PERFIL";
        
        // Carrega dados do Firestore
        const userDoc = doc(db, "users", user.uid);
        onSnapshot(userDoc, (docSnap) => {
            if (docSnap.exists()) {
                userDB = docSnap.data();
                atualizarInterfacePerfil();
            } else {
                // Se for um usuário novo, cria o documento inicial
                setDoc(userDoc, { xp: 0, focos: 0, goblins: 0, conquistas: [] });
            }
        });
    } else {
        userDisplayName.innerText = "Viajante";
        authTrigger.innerText = "🔑 ENTRAR / REGISTAR";
    }
});

// Função para salvar qualquer alteração de XP ou tarefas
async function salvarProgresso() {
    const user = auth.currentUser;
    if (user) {
        const userDoc = doc(db, "users", user.uid);
        try {
            await updateDoc(userDoc, userDB);
        } catch (e) {
            console.error("Erro ao salvar no Firestore:", e);
        }
    }
}

// Função para atualizar visualmente os troféus no modal de perfil
function atualizarInterfacePerfil() {
    const shelf = getEl('trophy-shelf-content');
    if (!shelf) return;
    
    // Aqui você pode expandir para renderizar os ícones conforme o userDB.conquistas
    // Exemplo: getEl('user-xp-display').innerText = userDB.xp;
}

// Lógica de Logout
logoutBtn.onclick = () => {
    auth.signOut().then(() => {
        location.reload(); // Recarrega para limpar os estados
    });
};