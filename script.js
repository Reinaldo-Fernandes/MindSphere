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

/* --- 1. SELETORES GLOBAIS & ESTADOS --- */
const getEl = (id) => document.getElementById(id);
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const circumference = 212 * 2 * Math.PI;

const taskInput = getEl('task-input');
const subtasksList = getEl('subtasks-list');
const authTrigger = getEl('auth-trigger');
const userDisplayName = getEl('user-display-name');
const startBtn = getEl('start-btn');

let timer = null;
const totalTime = 1500; // 25 min
let timeLeft = totalTime; 
let userDB = { xp: 0, focos: 0, goblins: 0, conquistas: [] };

/* --- 2. CORE: ORBIT & INTERFACE --- */

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

// Fechar Modais
document.querySelectorAll('.close-modal, .back-to-login').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
        setOrbitState('default');
    };
});

/* --- 3. JARDIM ORBITANTE --- */

function limparJardim() {
    document.querySelectorAll('.garden-item').forEach(el => el.remove());
}

function criarItemJardim() {
    const container = document.querySelector('.sphere-wrapper');
    const style = getEl('garden-style')?.value || 'plantas';
    const emojis = {
        plantas: ['🌿', '🌸', '🍃', '🍄', '🍀'],
        espaco: ['✨', '⭐', '☄️', '🌌'],
        notas: ['🎵', '🎶', '🎼', '🎹']
    };
    const emojiList = emojis[style] || emojis['plantas'];
    const item = document.createElement('div');
    item.className = 'garden-item';
    item.innerText = emojiList[Math.floor(Math.random() * emojiList.length)];

    item.style.setProperty('--orbit-distance', `${230 + Math.random() * 50}px`);
    item.style.setProperty('--orbit-duration', `${20 + Math.random() * 10}s`);
    item.style.setProperty('--start-angle', `${Math.random() * 360}deg`);
    container?.appendChild(item);
}

/* --- 4. MODO GOBLIN --- */

function createSubtask(text) {
    const div = document.createElement('div');
    div.className = 'subtask-item';
    div.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;";
    div.innerHTML = `<input type="checkbox" class="goblin-checkbox"> <span>${text}</span>`;

    div.querySelector('.goblin-checkbox').onchange = (e) => {
        if (e.target.checked) {
            div.style.opacity = "0.5";
            div.style.textDecoration = "line-through";
            adicionarProgresso('goblin', 20);
            orbitTalk("Tarefa esmagada! 👹");
        }
    };
    subtasksList.appendChild(div);
}

getEl('break-task-btn').onclick = () => {
    const val = taskInput.value.trim();
    if (!val) return orbitTalk("O que vamos esmagar hoje? 👹");
    subtasksList.innerHTML = "";
    const steps = val.includes(',') ? val.split(',') : [val, "Preparar", "Executar", "Finalizar"];
    steps.forEach(s => createSubtask(s.trim()));
    setOrbitState('goblin');
};

/* --- 5. TIMER & FOCO --- */

async function finalizarCicloFoco() {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    if (display) display.innerText = "25:00";
    if (circle) circle.style.strokeDashoffset = circumference;
    if (startBtn) startBtn.innerText = "REINICIAR";
    
    getEl('audio-complete')?.play();
    adicionarProgresso('foco', 100);
    setOrbitState('default');
}

function updateTimer() {
    if (timeLeft <= 0) {
        finalizarCicloFoco();
        return;
    }
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    if ([1200, 900, 600, 300].includes(timeLeft)) {
        criarItemJardim();
        orbitTalk("O jardim está florescendo... 🌿");
    }

    if (circle) {
        circle.style.strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;
    }
}

if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});
            if (timeLeft === totalTime) { limparJardim(); criarItemJardim(); }
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

/* --- 6. FIREBASE & AUTH --- */

onAuthStateChanged(auth, async (user) => {
    if (user) {
        userDisplayName.innerText = user.displayName || "Viajante";
        authTrigger.innerText = "👤 PERFIL";
        onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) userDB = snap.data();
            else setDoc(doc(db, "users", user.uid), userDB);
        });
    } else {
        userDisplayName.innerText = "Viajante";
        authTrigger.innerText = "🔑 ENTRAR";
    }
});

getEl('register-confirm-btn').onclick = async () => {
    const nome = getEl('reg-name').value;
    const email = getEl('reg-email').value;
    const senha = getEl('reg-password').value;
    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(db, "users", res.user.uid), { nome, xp: 0, focos: 0, goblins: 0, conquistas: [] });
        getEl('register-modal').classList.remove('active');
        orbitTalk("Bem-vindo ao MindSphere!");
    } catch (e) { orbitTalk("Erro ao cadastrar."); }
};

getEl('login-btn').onclick = async () => {
    try {
        await signInWithEmailAndPassword(auth, getEl('login-email').value, getEl('login-password').value);
        getEl('auth-modal').classList.remove('active');
        orbitTalk("Bom te ver de volta!");
    } catch (e) { orbitTalk("Senha ou e-mail incorretos."); }
};

getEl('logout-btn').onclick = async () => {
    try {
        await auth.signOut();
        getEl('profile-modal').classList.remove('active');
        userDB = { xp: 0, focos: 0, goblins: 0, conquistas: [] }; // Limpa estado local
        orbitTalk("Até logo, viajante! 👋");
    } catch (e) {
        orbitTalk("Erro ao sair.");
    }
};

getEl('panic-btn').onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    circle.style.strokeDashoffset = circumference;
    startBtn.innerText = "INICIAR";
    limparJardim();
    setOrbitState('default');
    orbitTalk("Sistema resetado! Respire fundo. 🌬️");
};

/* --- 7. GAMIFICAÇÃO & CONQUISTAS --- */

async function adicionarProgresso(tipo, quantidade) {
    if (!auth.currentUser) return;

    if (tipo === 'foco') {
        userDB.focos++;
        userDB.xp += quantidade;
        if (userDB.focos === 1) {
            userDB.conquistas.push('hiperfoco_1');
            mostrarConquista('hiperfoco', '1', 'Cristal de Hiperfoco I');
        }
    } 
    
    if (tipo === 'goblin') {
        userDB.goblins++;
        userDB.xp += 10;
        if (userDB.goblins === 5) {
            userDB.conquistas.push('goblin_1');
            mostrarConquista('reigoblin', '1', 'Coroa do Rei Goblin');
        }
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), userDB);
}

async function mostrarConquista(pasta, arquivo, titulo) {
    const modal = getEl('conquista-modal');
    const img = getEl('conquista-img');
    const txtTitulo = getEl('conquista-titulo');

    if (modal && img) {
        img.src = `./assistente/gameficação/${pasta}/${arquivo}.png`;
        txtTitulo.innerText = titulo;
        modal.classList.add('active');
        getEl('audio-complete')?.play();
        orbitTalk(`Incrível! Ganhaste: ${titulo} 🏆`);
    }
}

window.fecharConquista = () => {
    getEl('conquista-modal')?.classList.remove('active');
};

/* --- 8. LENTES & UI --- */

window.setMode = (mode) => {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f' };
    if (colors[mode]) {
        document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
        setOrbitState(mode);
        orbitTalk(`Lente de ${mode} ativada.`);
    }
};

getEl('clear-tasks-btn').onclick = () => {
    subtasksList.innerHTML = "";
    taskInput.value = "";
    setOrbitState('default');
    orbitTalk("Lista limpa!");
};

function setupPasswordToggle(inputId, toggleId) {
    const input = getEl(inputId);
    const icon = getEl(toggleId);
    if (input && icon) {
        icon.onclick = () => {
            const isPass = input.type === "password";
            input.type = isPass ? "text" : "password";
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        };
    }
}
setupPasswordToggle('login-password', 'toggle-password');
setupPasswordToggle('reg-password', 'toggle-reg-password');

function setupAudio(sliderId, audioId) {
    const s = getEl(sliderId);
    const a = getEl(audioId);
    if (s && a) {
        s.oninput = (e) => {
            a.volume = e.target.value;
            if (a.volume > 0) a.play().catch(() => {}); 
            else a.pause();
        };
    }
}
setupAudio('rain-vol', 'audio-rain');
setupAudio('fire-vol', 'audio-fire');

if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

window.onload = () => {
    if (getEl('orbit-assistant')) getEl('orbit-assistant').style.visibility = "visible";
};

/* --- 9. GESTÃO DE PERFIL & AUTH --- */

// Gerencia o clique no botão de Perfil/Entrar
authTrigger.onclick = () => {
    if (auth.currentUser) {
        // Logado: Abre perfil
        getEl('profile-modal').classList.add('active');
        atualizarInterfacePerfil();
    } else {
        // Deslogado: Abre login
        getEl('auth-modal').classList.add('active');
        setOrbitState('login');
    }
};

function atualizarInterfacePerfil() {
    // Atualiza os textos dentro do modal de perfil com os dados do userDB
    if (getEl('display-xp')) getEl('display-xp').innerText = userDB.xp;
    if (getEl('display-focos')) getEl('display-focos').innerText = userDB.focos;
    if (getEl('display-goblins')) getEl('display-goblins').innerText = userDB.goblins;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        authTrigger.innerText = "👤 PERFIL";
        onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                userDB = snap.data();
                userDisplayName.innerText = userDB.nome || "Viajante";
            } else {
                setDoc(doc(db, "users", user.uid), userDB);
            }
        });
    } else {
        userDisplayName.innerText = "Viajante";
        authTrigger.innerText = "🔑 ENTRAR";
    }
});

/* --- 10. GESTÃO DE NAVEGAÇÃO ENTRE MODAIS --- */

// Abrir Registro a partir do Login
getEl('go-to-register').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('register-modal').classList.add('active');
    setOrbitState('cadastro');
};

// Voltar para Login a partir do Registro
getEl('go-to-login').onclick = (e) => {
    e.preventDefault();
    getEl('register-modal').classList.remove('active');
    getEl('auth-modal').classList.add('active');
    setOrbitState('login');
};

// Abrir Esqueci Minha Senha
/* --- RECUPERAÇÃO DE SENHA --- */
getEl('send-reset-btn').onclick = async () => {
    const email = getEl('reset-email').value;
    if (!email) return orbitTalk("Digite seu e-mail primeiro!");

    try {
        await sendPasswordResetEmail(auth, email);
        orbitTalk("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        getEl('forgot-password-modal').classList.remove('active');
    } catch (e) {
        orbitTalk("Erro: Verifique se o e-mail está correto.");
        console.error(e);
    }
};

// Voltar para Login a partir da Recuperação
document.querySelectorAll('.back-to-login').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
});

/* --- 11. NAVEGAÇÃO ENTRE TELAS DE AUTENTICAÇÃO --- */

// Abrir Recuperação de Senha (dentro do login)
getEl('forgot-password-link').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('forgot-password-modal').classList.add('active');
};

// Voltar para Login (dentro da recuperação)
document.querySelectorAll('.back-to-login').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
});

// Ir para Registro (dentro do login)
getEl('go-to-register').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('register-modal').classList.add('active');
    setOrbitState('cadastro');
};

// Voltar para Login (dentro do registro)
getEl('go-to-login').onclick = (e) => {
    e.preventDefault();
    getEl('register-modal').classList.remove('active');
    getEl('auth-modal').classList.add('active');
    setOrbitState('login');
};

/* --- ENVIO DE E-MAIL PELO FIREBASE --- */
getEl('send-reset-btn').onclick = async (e) => {
    e.preventDefault();
    const email = getEl('reset-email').value.trim();

    if (!email) {
        return orbitTalk("Por favor, digite seu e-mail.");
    }

    try {
        await sendPasswordResetEmail(auth, email);
        orbitTalk("Link de recuperação enviado! Verifique seu e-mail.");
        getEl('forgot-password-modal').classList.remove('active');
    } catch (error) {
        console.error(error);
        orbitTalk("Erro: E-mail não encontrado ou inválido.");
    }
};