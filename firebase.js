/* --- 0. CONFIGURAÇÃO --- */
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

/* --- 1. LOGIN (REFEITO PARA SER À PROVA DE FALHAS) --- */
const realizarLogin = async () => {
    const email = getEl('login-email')?.value;
    const pass = getEl('login-password')?.value;

    if (!email || !pass) return notify("Preencha e-mail e senha.");

    try {
        console.log("Tentando logar...");
        await signInWithEmailAndPassword(auth, email, pass);
        console.log("Logado com sucesso!");
        getEl('auth-modal')?.classList.remove('active');
    } catch (e) {
        console.error("Erro no login:", e);
        notify("Dados inválidos ou erro de conexão.");
    }
};

// Vincula o botão de login (usando listener que é mais seguro que onclick direto)
getEl('login-btn')?.addEventListener('click', realizarLogin);

/* --- 2. REGISTRO --- */
getEl('register-confirm-btn')?.addEventListener('click', async () => {
    const nome = getEl('reg-name')?.value;
    const email = getEl('reg-email')?.value;
    const pass = getEl('reg-password')?.value;
    
    if (!nome || !email || !pass) return notify("Preencha todos os campos.");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", res.user.uid), { 
            nome, xp: 0, focos: 0, goblins: 0, conquistas: [], tipo: 'user' 
        });
        getEl('register-modal')?.classList.remove('active');
        notify("Bem-vindo ao MindSphere!");
    } catch (e) { notify("Erro ao criar conta."); }
});

/* --- 3. OBSERVAR MUDANÇA DE USUÁRIO --- */
onAuthStateChanged(auth, async (user) => {
    const authTrigger = getEl('auth-trigger');
    const userDisplayName = getEl('user-display-name');

    if (user) {
        if (authTrigger) authTrigger.innerText = "👤 PERFIL";
        const docSnap = await getDoc(doc(db, "users", user.uid));

        if (docSnap.exists()) {
            window.userDB = docSnap.data();
            const nomeUser = window.userDB.nome || "Viajante";
            if (userDisplayName) userDisplayName.innerText = nomeUser;

            if (window.userDB.tipo === 'adm') {
                aplicarEsteticaGlobalADM();
                setTimeout(() => {
                    conectarDadosDashboard();
                    window.OrbitAI?.reagir('login_adm');
                }, 1000);
            } else {
                window.OrbitAI?.verificarAusencia();
            }
        }
    } else {
        if (authTrigger) authTrigger.innerText = "🔑 LOGIN";
        document.body.classList.remove('admin-mode');
    }
});

/* --- 4. FUNÇÕES ADM --- */
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
    }, (err) => console.log("Aguardando permissão ADM..."));

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
    }, (err) => console.log("Aguardando permissão ADM..."));
}

/* --- 5. INTERFACE --- */
getEl('auth-trigger')?.addEventListener('click', () => {
    if (auth.currentUser) {
        getEl('profile-modal')?.classList.add('active');
    } else {
        getEl('auth-modal')?.classList.add('active');
    }
});

getEl('logout-btn')?.addEventListener('click', () => auth.signOut().then(() => location.reload()));

const btnStart = getEl('timer-start'); 
btnStart?.addEventListener('click', () => {
    if (window.iniciarTimer) window.iniciarTimer();
    window.OrbitAI?.reagir('timer_start');
});

export { sendPasswordResetEmail };