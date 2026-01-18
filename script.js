/* --- 0. FIREBASE CONFIG --- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, updateDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

/* --- 1. SELETORES GLOBAIS --- */
const getEl = (id) => document.getElementById(id);
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const circumference = 212 * 2 * Math.PI;

const taskInput = getEl('task-input');
const subtasksList = getEl('subtasks-list');
const authTrigger = getEl('auth-trigger');
const userDisplayName = getEl('user-display-name');
const startBtn = getEl('start-btn');

/* --- 2. ESTADOS E CONFIGURAÇÃO DE DATAS --- */
let timer = null;
const totalTime = 1500; 
let timeLeft = totalTime; 
let userDB = { xp: 0, focos: 0, goblins: 0, conquistas: [], nome: "Viajante" };

// Nomes das pastas para automação
const MESES_NOMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* --- 3. FUNÇÕES DE INTERFACE --- */

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
        'autonomia': './assistente/orbits/autonomia.png',
        'login': './assistente/orbits/login.png',
        'cadastro': './assistente/orbits/cadastro.png'
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

/* --- 4. TIMER & JARDIM --- */

function updateTimer() {
    if (timeLeft <= 0) { finalizarCicloFoco(); return; }
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    if (circle) circle.style.strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
    if ([1200, 900, 600, 300].includes(timeLeft)) criarItemJardim();
}

async function finalizarCicloFoco() {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    circle.style.strokeDashoffset = circumference;
    startBtn.innerText = "REINICIAR";
    getEl('audio-complete')?.play();
    adicionarProgresso('foco', 100);
    setOrbitState('default');
}

if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }
        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});
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

function criarItemJardim() {
    const container = document.querySelector('.sphere-wrapper');
    const style = getEl('garden-style')?.value || 'plantas';
    const emojis = { plantas: ['🌿', '🌸', '🍃'], espaco: ['✨', '⭐'], notas: ['🎵', '🎶'], comida: ['☕', '🍰'] };
    const item = document.createElement('div');
    item.className = 'garden-item';
    item.innerText = emojis[style][Math.floor(Math.random() * emojis[style].length)];
    item.style.setProperty('--orbit-distance', `${230 + Math.random() * 50}px`);
    item.style.setProperty('--orbit-duration', `${20 + Math.random() * 10}s`);
    item.style.setProperty('--start-angle', `${Math.random() * 360}deg`);
    container?.appendChild(item);
}

/* --- 5. MODO GOBLIN --- */

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
                adicionarProgresso('goblin', 25);
                setTimeout(() => div.remove(), 800);
            }
        };
        subtasksList.appendChild(div);
    });
    taskInput.value = "";
    setOrbitState('goblin');
};

/* --- 6. GAMIFICAÇÃO & CONQUISTAS --- */

async function adicionarProgresso(tipo, quantidade) {
    if (!auth.currentUser) return;
    
    userDB.xp = (userDB.xp || 0) + quantidade;
    const agora = new Date();
    const hora = agora.getHours();
    const mes = agora.getMonth(); // 0-11

    // 1. Conquistas de Goblin
    if (tipo === 'goblin') {
        userDB.goblins = (userDB.goblins || 0) + 1;
        const num = Math.min(Math.ceil(userDB.goblins / 2), 17);
        verificarEPremiar("reigoblin", num.toString(), `Rei Goblin Nível ${num}`);
    }
    
    // 2. Conquistas de Foco (Sazonais e Horário)
    if (tipo === 'foco') {
        userDB.focos = (userDB.focos || 0) + 1;
        
        // Hiperfoco Progressivo
        verificarEPremiar("hiperfoco", Math.min(userDB.focos, 17).toString(), `Hiperfoco #${userDB.focos}`);

        // Por Horário (Sorteio entre 1 e 16/17 conforme sua pasta)
        if (hora >= 0 && hora < 6) {
            verificarEPremiar("madrugador", (Math.floor(Math.random() * 16) + 1).toString(), "Guardião da Madrugada");
        } else if (hora >= 18) {
            verificarEPremiar("noturno", (Math.floor(Math.random() * 16) + 1).toString(), "Explorador Noturno");
        } else if (hora >= 12 && hora < 18) {
            verificarEPremiar("vespertico", (Math.floor(Math.random() * 17) + 1).toString(), "Energia Vespertina");
        }

        // Por Mês
        verificarEPremiar("meses", (mes + 1).toString(), `Relíquia de ${MESES_NOMES[mes]}`);

        // Por Estação (Hemisfério Sul)
        let estacao = "";
        if (mes >= 8 && mes <= 10) estacao = "Primavera";
        else if (mes === 11 || mes <= 1) estacao = "Verão";
        else if (mes >= 2 && mes <= 4) estacao = "Outono";
        else estacao = "Inverno";
        verificarEPremiar("estações", estacao, `Alma do ${estacao}`);
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), userDB);
    atualizarInterfacePerfil();
}

function verificarEPremiar(pasta, arquivo, titulo) {
    const id = `${pasta}_${arquivo}`;
    if (!userDB.conquistas.includes(id)) {
        userDB.conquistas.push(id);
        window.mostrarConquista(pasta, arquivo, titulo);
    }
}

window.mostrarConquista = (pasta, arquivo, titulo) => {
    const modal = getEl('conquista-modal');
    getEl('conquista-img').src = `./assistente/gameficação/${pasta}/${arquivo}.png`;
    getEl('conquista-titulo').innerText = titulo.toUpperCase();
    getEl('relic-step').style.display = 'block';
    getEl('orbit-congrats-step').style.display = 'none';
    modal.classList.add('active');
    modal.style.display = 'flex';
};

window.proximoPassoConquista = () => {
    getEl('relic-step').style.display = 'none';
    getEl('orbit-congrats-step').style.display = 'flex';
};

window.fecharConquista = () => {
    getEl('conquista-modal').classList.remove('active');
    getEl('conquista-modal').style.display = 'none';
};

function atualizarInterfacePerfil() {
    const shelf = getEl('trophy-shelf-content');
    if (!shelf) return;
    shelf.innerHTML = ''; 
    if (userDB.conquistas && userDB.conquistas.length > 0) {
        userDB.conquistas.forEach(id => {
            const [p, a] = id.split('_');
            const item = document.createElement('div');
            item.className = 'trophy-item';
            item.innerHTML = `<img src="./assistente/gameficação/${p}/${a}.png" onerror="this.src='./assistente/orbits/Orbit.png'">`;
            shelf.appendChild(item);
        });
    }
}

/* --- 7. LOGIN, REGISTRO & SENHA --- */

getEl('toggle-password').onclick = () => {
    const passInput = getEl('login-password');
    const type = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = type;
    getEl('toggle-password').classList.toggle('fa-eye');
    getEl('toggle-password').classList.toggle('fa-eye-slash');
};

getEl('forgot-password-link').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('forgot-password-modal').classList.add('active');
};

document.querySelectorAll('.back-to-login').forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
});

getEl('go-to-register').onclick = () => { getEl('auth-modal').classList.remove('active'); getEl('register-modal').classList.add('active'); };
getEl('go-to-login').onclick = () => { getEl('register-modal').classList.remove('active'); getEl('auth-modal').classList.add('active'); };

getEl('send-reset-btn').onclick = async () => {
    const email = getEl('reset-email').value;
    if (!email) return orbitTalk("Digite seu e-mail.");
    try {
        await sendPasswordResetEmail(auth, email);
        orbitTalk("Link enviado ao seu e-mail!");
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    } catch (e) { orbitTalk("E-mail não encontrado."); }
};

/* --- 8. FIREBASE AUTH OBSERVER --- */

onAuthStateChanged(auth, (user) => {
    if (user) {
        authTrigger.innerText = "👤 PERFIL";
        onSnapshot(doc(db, "users", user.uid), (snap) => { 
            if (snap.exists()) {
                userDB = snap.data();
                if (userDisplayName) userDisplayName.innerText = userDB.nome || "Viajante";
            }
        });
    } else {
        authTrigger.innerText = "🔑 ENTRAR / REGISTAR";
    }
});

authTrigger.onclick = () => {
    if (auth.currentUser) {
        getEl('profile-modal').classList.add('active');
        atualizarInterfacePerfil();
    } else {
        getEl('auth-modal').classList.add('active');
    }
};

getEl('login-btn').onclick = async () => {
    try {
        await signInWithEmailAndPassword(auth, getEl('login-email').value, getEl('login-password').value);
        getEl('auth-modal').classList.remove('active');
    } catch (e) { orbitTalk("Erro no login"); }
};

getEl('register-confirm-btn').onclick = async () => {
    const nome = getEl('reg-name').value;
    try {
        const res = await createUserWithEmailAndPassword(auth, getEl('reg-email').value, getEl('reg-password').value);
        await setDoc(doc(db, "users", res.user.uid), { nome, xp: 0, focos: 0, goblins: 0, conquistas: [] });
        getEl('register-modal').classList.remove('active');
    } catch (e) { orbitTalk("Erro no cadastro"); }
};

getEl('logout-btn').onclick = () => auth.signOut().then(() => location.reload());

document.querySelectorAll('.close-modal').forEach(b => {
    b.onclick = () => document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
});

/* --- 9. AUDIO & INIT --- */
function setupAudio(sliderId, audioId) {
    const s = getEl(sliderId), a = getEl(audioId);
    if (s && a) s.oninput = (e) => { a.volume = e.target.value; if (a.volume > 0) a.play(); else a.pause(); };
}
setupAudio('rain-vol', 'audio-rain');
setupAudio('fire-vol', 'audio-fire');

if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}