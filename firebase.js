/* --- 0. FIREBASE CONFIG & MODULES --- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, onSnapshot, collection, query, orderBy, getDoc
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
export const auth = getAuth(app);
export const db = getFirestore(app);

window.userDB = { xp: 0, focos: 0, goblins: 0, conquistas: [], nome: "Viajante" };

const getEl = (id) => document.getElementById(id);
const notify = (msg) => {
    if (window.OrbitAI) window.OrbitAI.falar(msg);
    else alert(msg);
};

/* --- 1. FIREBASE AUTH OBSERVER --- */
onAuthStateChanged(auth, async (user) => {
    const authTrigger = getEl('auth-trigger');
    const userDisplayName = getEl('user-display-name');

    if (user) {
        if (authTrigger) authTrigger.innerText = "👤 PERFIL";
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

      /* --- Dentro de onAuthStateChanged no firebase.js --- */
if (docSnap.exists()) {
    window.userDB = docSnap.data();
    const nomeUser = window.userDB.nome || "Viajante";
    
    if (userDisplayName) userDisplayName.innerText = nomeUser;
    
    // Orbit dá as boas-vindas personalizadas
    setTimeout(() => {
        if (window.OrbitAI) {
            if (window.userDB.tipo === 'adm') {
                window.OrbitAI.reagir('login_adm');
            } else {
                window.OrbitAI.reagir('boas_vindas', { nome: nomeUser });
            }
        }
    }, 1500);

    if (window.userDB.tipo === 'adm') {
        aplicarEsteticaGlobalADM();
    }
}

    } else {
        if (authTrigger) authTrigger.innerText = "🔑 LOGIN";
        document.body.classList.remove('admin-mode');
    }
});

/* --- 2. FUNÇÕES ADMINISTRATIVAS --- */
function aplicarEsteticaGlobalADM() {
    document.body.classList.add('admin-mode');
    const mainOrbit = document.querySelector('.orbit-character img') || getEl('orbit-img');
    if (mainOrbit) mainOrbit.src = "./assistente/orbits/adm.png";
    ativarModoAdmin(); 
}

function ativarModoAdmin() {
    const profileScroll = document.querySelector('.profile-scroll-area');
    if (profileScroll && !getEl('adm-panel')) {
        profileScroll.innerHTML = `
            <div id="adm-panel" class="adm-dashboard-content">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="adm-metric-card"><label>Viajantes</label><span id="stat-users">0</span></div>
                    <div class="adm-metric-card"><label>Feedbacks</label><span id="stat-fb">0</span></div>
                </div>
                <div class="adm-metric-card"><label>Energia Total (XP Global)</label><span id="stat-xp">0</span></div>
                <h4 style="color:#00ff41; font-size:0.7rem; margin: 15px 0 5px 0; border-bottom: 1px solid rgba(0,255,65,0.2);">MURAL DE FEEDBACKS</h4>
                <div id="feedback-wall-perfil" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;"></div>
            </div>
        `;
        conectarDadosDashboard();
    }
}

function conectarDadosDashboard() {
    onSnapshot(collection(db, "users"), (snap) => {
        if(getEl('stat-users')) getEl('stat-users').innerText = snap.size;
        let xpAcumulado = 0;
        snap.forEach(d => xpAcumulado += (d.data().xp || 0));
        if(getEl('stat-xp')) getEl('stat-xp').innerText = xpAcumulado;
    });

    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    onSnapshot(q, (snap) => {
        if(getEl('stat-fb')) getEl('stat-fb').innerText = snap.size;
        const wall = getEl('feedback-wall-perfil');
        if (wall) {
            wall.innerHTML = "";
            snap.forEach(doc => {
                const f = doc.data();
                const item = document.createElement('div');
                item.style = "background: rgba(255,255,255,0.03); padding: 8px; border-radius: 8px; border-left: 3px solid #00ff41; margin-bottom: 5px; font-size: 0.8rem;";
                item.innerHTML = `<b>${f.nome || 'Anônimo'}:</b> ${f.mensagem}`;
                wall.appendChild(item);
            });
        }
    });
}

/* --- 3. EVENTOS DE INTERFACE --- */
const authTrigger = getEl('auth-trigger');
if (authTrigger) {
    authTrigger.onclick = () => {
        if (auth.currentUser) {
            getEl('profile-modal')?.classList.add('active');
            if (window.atualizarInterfacePerfil) window.atualizarInterfacePerfil();
        } else {
            getEl('auth-modal')?.classList.add('active');
        }
    };
}

getEl('login-btn').onclick = async () => {
    const email = getEl('login-email').value;
    const pass = getEl('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        getEl('auth-modal').classList.remove('active');
    } catch (e) { notify("Erro no login: Verifique e-mail e senha."); }
};

getEl('register-confirm-btn').onclick = async () => {
    const nome = getEl('reg-name').value;
    const email = getEl('reg-email').value;
    const pass = getEl('reg-password').value;
    if (!nome) return notify("Digite um nome de viajante.");
    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", res.user.uid), { nome, xp: 0, focos: 0, goblins: 0, conquistas: [] });
        getEl('register-modal').classList.remove('active');
    } catch (e) { notify("Erro no cadastro."); }
};

const resetBtn = getEl('send-reset-btn');
if (resetBtn) {
    resetBtn.onclick = async () => {
        const email = getEl('reset-email').value;
        if (!email) return notify("Digite seu e-mail.");
        try {
            await sendPasswordResetEmail(auth, email);
            notify("Link enviado ao seu e-mail!");
            getEl('forgot-password-modal').classList.remove('active');
        } catch (e) { notify("E-mail não encontrado."); }
    };
}

const logoutBtn = getEl('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => auth.signOut().then(() => location.reload());
}

// GATILHO DO TIMER (Protegido contra erro de ReferenceError)
const btnStart = getEl('timer-start'); 
if (btnStart) {
    btnStart.addEventListener('click', () => {
        if (window.iniciarTimer) window.iniciarTimer();
        if (window.OrbitAI) window.OrbitAI.reagir('timer_start');
    });
}

// Exportação ÚNICA
export { sendPasswordResetEmail };