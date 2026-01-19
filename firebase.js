/* --- 0. FIREBASE CONFIG & MODULES --- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, onSnapshot 
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

// Inicialização
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// userDB precisa estar no objeto window para que o gameficacao.js o veja
window.userDB = { xp: 0, focos: 0, goblins: 0, conquistas: [], nome: "Viajante" };

/* --- 1. FUNÇÕES DE SUPORTE INTERNAS --- */
const getEl = (id) => document.getElementById(id);

// Função simples de aviso caso o orbitTalk não esteja carregado
const notify = (msg) => {
    if (window.orbitTalk) window.orbitTalk(msg);
    else alert(msg);
};

/* --- 2. FIREBASE AUTH OBSERVER --- */

onAuthStateChanged(auth, (user) => {
    const authTrigger = getEl('auth-trigger');
    const userDisplayName = getEl('user-display-name');

    if (user) {
        if (authTrigger) authTrigger.innerText = "👤 PERFIL";
        
        onSnapshot(doc(db, "users", user.uid), (snap) => { 
            if (snap.exists()) {
                window.userDB = snap.data();
                if (userDisplayName) userDisplayName.innerText = window.userDB.nome || "Viajante";
                // Atualiza a estante de troféus se a função existir
                if (window.atualizarInterfacePerfil) window.atualizarInterfacePerfil();
            }
        });
    } else {
        if (authTrigger) authTrigger.innerText = "🔑 ENTRAR / REGISTAR";
    }
});

/* --- 3. EVENTOS DE INTERFACE --- */

// Abrir Modal de Perfil ou Login
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

// Botão de Login
getEl('login-btn').onclick = async () => {
    const email = getEl('login-email').value;
    const pass = getEl('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        getEl('auth-modal').classList.remove('active');
    } catch (e) { notify("Erro no login: Verifique e-mail e senha."); }
};

// Botão de Registro
getEl('register-confirm-btn').onclick = async () => {
    const nome = getEl('reg-name').value;
    const email = getEl('reg-email').value;
    const pass = getEl('reg-password').value;
    
    if (!nome) return notify("Digite um nome de viajante.");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", res.user.uid), { 
            nome: nome, 
            xp: 0, 
            focos: 0, 
            goblins: 0, 
            conquistas: [] 
        });
        getEl('register-modal').classList.remove('active');
    } catch (e) { notify("Erro no cadastro."); }
};

// Reset de Senha
const resetBtn = getEl('send-reset-btn');
if (resetBtn) {
    resetBtn.onclick = async () => {
        const email = getEl('reset-email').value;
        if (!email) return notify("Digite seu e-mail.");
        try {
            await sendPasswordResetEmail(auth, email);
            notify("Link enviado ao seu e-mail!");
            getEl('forgot-password-modal').classList.remove('active');
            getEl('auth-modal').classList.add('active');
        } catch (e) { notify("E-mail não encontrado."); }
    };
}

// Logout
getEl('logout-btn').onclick = () => auth.signOut().then(() => location.reload());

// Exportando para outros módulos usarem
export { sendPasswordResetEmail };