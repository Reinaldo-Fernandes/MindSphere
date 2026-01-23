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
        console.error("Erro no login:", e.code);
        
        if (e.code === 'auth/user-not-found') {
            notify("Viajante não encontrado! Verifique seu e-mail.");
        } else if (e.code === 'auth/wrong-password') {
            notify("Senha incorreta! Tente novamente.");
        } else if (e.code === 'auth/invalid-email') {
            notify("E-mail inválido.");
        } else {
            notify("Erro ao fazer login: " + e.code);
        }
    }
};
// Vincula o botão de login (usando listener que é mais seguro que onclick direto)
getEl('login-btn')?.addEventListener('click', realizarLogin);

/* --- 2. REGISTRO --- */
/* --- Registro Blindado --- */
getEl('register-confirm-btn')?.addEventListener('click', async () => {
    const nome = getEl('reg-name')?.value;
    const email = getEl('reg-email')?.value;
    const pass = getEl('reg-password')?.value;
    
    if (!nome || !email || !pass) return notify("Preencha todos os campos.");
    if (pass.length < 6) return notify("A senha deve ter no mínimo 6 caracteres.");

    try {
        console.log("Tentando cadastrar...");
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        
        // Criar o documento do usuário no Firestore
        await setDoc(doc(db, "users", res.user.uid), { 
            nome: nome,
            xp: 0, 
            focos: 0, 
            goblins: 0, 
            conquistas: [],
            tipo: 'user', // Defina como 'adm' manualmente no console se precisar
            dataCriacao: new Date()
        });

        console.log("Usuário criado com sucesso!");
        getEl('register-modal')?.classList.remove('active');
        notify(`Bem-vindo, ${nome}!`);

    } catch (e) {
        console.error("Erro no cadastro:", e.code);
        if (e.code === 'auth/email-already-in-use') notify("Este e-mail já está sendo usado.");
        else if (e.code === 'auth/invalid-email') notify("E-mail inválido.");
        else notify("Erro ao criar conta. Tente novamente.");
    }
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

            if (typeof atualizarInterfacePerfil === 'function') {
                atualizarInterfacePerfil();
            }
            
            if (window.userDB.tipo === 'adm') {
                aplicarEsteticaGlobalADM();
                setTimeout(() => {
                    conectarDadosDashboard();
                    // Verifica se a função existe antes de chamar
                    if (typeof window.OrbitAI?.reagir === 'function') {
                        window.OrbitAI.reagir('login_adm');
                    }
                }, 1000);
            } else {
                // Correção aqui: Verifica se a função existe
                if (typeof window.OrbitAI?.verificarAusencia === 'function') {
                    window.OrbitAI.verificarAusencia();
                } else {
                    console.log("Orbit ainda carregando...");
                }
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

/* --- Recuperação de Senha --- */
const resetBtn = getEl('send-reset-btn');

if (resetBtn) {
    resetBtn.onclick = async () => {
        // Captura o e-mail do campo específico do modal de "Esqueci a Senha"
        const email = getEl('reset-email')?.value;

        if (!email) {
            notify("Por favor, digite seu e-mail para recuperar a senha.");
            return;
        }

        try {
            console.log("Enviando e-mail de recuperação para:", email);
            await sendPasswordResetEmail(auth, email);
            
            notify("E-mail enviado! Verifique sua caixa de entrada e spam.");
            
            // Fecha o modal de recuperação se ele estiver aberto
            getEl('forgot-password-modal')?.classList.remove('active');
            
            if (window.OrbitAI) {
                window.OrbitAI.falar("Enviei um corvo eletrônico com sua nova chave de acesso. Olhe seu e-mail!");
            }
        } catch (error) {
            console.error("Erro ao enviar reset:", error.code);
            
            if (error.code === 'auth/user-not-found') {
                notify("Este e-mail não está cadastrado no sistema.");
            } else if (error.code === 'auth/invalid-email') {
                notify("O formato do e-mail é inválido.");
            } else {
                notify("Ocorreu um erro. Tente novamente em instantes.");
            }
        }
    };
}

/* --- 6. CONFIGURAÇÃO DE CAMINHOS E IMAGENS --- */
const BASE_PATH = "C:/Users/Usuário/OneDrive/Desktop/Reinaldo/MindSphere/assistente/";

const IMAGENS_CONFIG = {
    // Recompensas comuns (Aleatórias por micro-marcos)
    comuns: {
        aleatorios: { path: "aleatorios/", total: 30 },
        matutino:   { path: "matutino/",   total: 12 },
        vespertino: { path: "vespertino/", total: 17 },
        noturno:    { path: "noturno/",    total: 16 },
        madrugada:  { path: "madrugada/",  total: 16 }
    },
    // Recompensas Especiais (Únicas por grandes marcos)
    especiais: {
        estacoes:   { path: "estacoes/",   total: 4 },
        meses:      { path: "meses/",      total: 12 },
        hiperfoco:  { path: "hiperfoco/",  total: 17 },
        reigoblin:  { path: "reigoblin/",  total: 17 }
    }
};

/* --- 7. LÓGICA DE EXIBIÇÃO E FILA (ANTI-BUG) --- */
window.recompensaPendentes = [];
let exibindoPremio = false;

/**
 * Função principal para processar conquistas e evitar sobreposição
 */
const processarRecompensa = async (tipoPasta, index = null) => {
    if (exibindoPremio) {
        console.log("Aguardando prêmio atual terminar...");
        window.recompensaPendentes.push({ tipoPasta, index });
        return;
    }

    exibindoPremio = true;
    
    // Se index for null, pegamos uma aleatória daquela pasta
    const config = IMAGENS_CONFIG.comuns[tipoPasta] || IMAGENS_CONFIG.especiais[tipoPasta];
    const imgIndex = index !== null ? index : Math.floor(Math.random() * config.total) + 1;
    const caminhoFinal = `${BASE_PATH}${config.path}${imgIndex}.png`;

    // Lógica de exibição na UI
    exibirNaTela(caminhoFinal);

    // Espera 5 segundos para liberar a próxima
    setTimeout(() => {
        exibindoPremio = false;
        if (window.recompensaPendentes.length > 0) {
            const proximo = window.recompensaPendentes.shift();
            processarRecompensa(proximo.tipoPasta, proximo.index);
        }
    }, 8000); 
};

const exibirNaTela = (src) => {
    const container = getEl('display-recompensa') || criarContainerRecompensa();
    container.innerHTML = `<img src="${src}" class="fade-in-award">`;
    container.classList.add('active');
    notify("🏆 Nova Conquista Desbloqueada!");
    
    setTimeout(() => container.classList.remove('active'), 7000);
};

/* --- 8. SISTEMA DE MARCOS (MILESTONES) --- */
const verificarConquistas = () => {
    const u = window.userDB;

    // --- MARCOS NORMAIS (PASTAS COMUNS) ---
    if (u.chuva_count === 5) processarRecompensa('aleatorios');
    if (u.goblins === 3) processarRecompensa('aleatorios');
    
    // --- MARCOS ESPECIAIS (PASTAS ESPECÍFICAS) ---
    // Ex: 30 dias de uso libera uma imagem aleatória de 'meses'
    if (u.diasUso === 30 && !u.conquistas.includes('trinta_dias')) {
        registrarConquista('trinta_dias', 'meses');
    }

    // Ex: 50 horas de foco libera 'hiperfoco'
    if (u.horasFoco >= 50 && !u.conquistas.includes('mestre_foco')) {
        registrarConquista('mestre_foco', 'hiperfoco');
    }

    // Ex: 10 investidas Goblin Mode libera 'reigoblin'
    if (u.goblins >= 10 && !u.conquistas.includes('rei_goblin_vencido')) {
        registrarConquista('rei_goblin_vencido', 'reigoblin');
    }
};

const registrarConquista = async (id, pasta) => {
    window.userDB.conquistas.push(id);
    processarRecompensa(pasta);
    // Atualiza Firebase
    const userRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userRef, { conquistas: window.userDB.conquistas }, { merge: true });
};

/* --- 9. AJUSTES DE PERFIL E TÍTULOS --- */
function atualizarInterfacePerfil() {
    const u = window.userDB;
    const xpBase = u.xp || 0;
    
    // Cálculo de Nível/Módulo
    const nivel = Math.floor(xpBase / 1000) + 1;
    const modulo = nivel <= 5 ? "Viagem Iniciante" : nivel <= 15 ? "Exploração Profunda" : "Mestre do Espaço";
    
    const titulo = u.tipo === 'adm' ? "MASTER ADMIN" : `Viajante Nvl ${nivel}`;
    
    if (getEl('user-title')) getEl('user-title').innerText = titulo;
    if (getEl('user-module')) getEl('user-module').innerText = `Módulo: ${modulo}`;
    
    // Verifica se há prêmios para disparar
    verificarConquistas();
}

// Helper para criar o container de imagem se não existir
function criarContainerRecompensa() {
    const div = document.createElement('div');
    div.id = 'display-recompensa';
    div.className = 'recompensa-overlay';
    document.body.appendChild(div);
    return div;
}