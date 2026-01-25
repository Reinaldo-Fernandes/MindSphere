import { auth, db } from './firebase.js'; 
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const getEl = (id) => document.getElementById(id);

/* --- 1. CONFIGURAÇÕES DE CAMINHO --- */
// AJUSTE AQUI: Se não funcionar com ./assistente, tente apenas ./gameficacao
const FOLDER_BASE = "./assistente/gameficacao"; 

const IMAGENS_CONFIG = {
    aleatorios: { folder: `${FOLDER_BASE}/aleatorios`, total: 30 },
    matutino:   { folder: `${FOLDER_BASE}/matutino`,   total: 12 },
    vespertino: { folder: `${FOLDER_BASE}/vespertino`, total: 17 },
    noturno:    { folder: `${FOLDER_BASE}/noturno`,    total: 16 },
    madrugada:  { folder: `${FOLDER_BASE}/madrugada`,  total: 16 },
    reigoblin:  { folder: `${FOLDER_BASE}/reigoblin`,  total: 17 },
    hiperfoco:  { folder: `${FOLDER_BASE}/hiperfoco`,  total: 17 },
    meses:      { folder: `${FOLDER_BASE}/meses`,      total: 12 }
};

/* --- 2. LÓGICA DE FIREBASE (Ação) --- */

async function processarEGravarRecompensa(cat) {
    const config = IMAGENS_CONFIG[cat.toLowerCase()];
    if (!config || !auth.currentUser) return;

    const sorteio = Math.floor(Math.random() * config.total) + 1;
    const novoID = `${cat.toLowerCase()}_${sorteio}`;
    const caminhoFinal = `${config.folder}/${sorteio}.png`;

    // Modal
    const modal = getEl('conquista-modal');
    const img = getEl('conquista-img');
    if (modal && img) {
        img.src = caminhoFinal;
        modal.style.display = 'flex';
    }

    // Salva no Banco
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
        conquistas: arrayUnion(novoID)
    });
}

// Chame esta função window.registrarProgressoGoblin() no seu botão de completar tarefa
window.registrarProgressoGoblin = async () => {
    if (!auth.currentUser) return;
    console.log("Registrando progresso..."); // Verifique se isso aparece no console ao clicar
    
    const userRef = doc(db, "users", auth.currentUser.uid);
    const u = window.userDB || { subtarefas_progresso: 0, goblins: 0 };
    
    let novoSub = (u.subtarefas_progresso || 0) + 1;
    let updates = { xp: increment(50) };

    if (novoSub >= 2) {
        updates.subtarefas_progresso = 0;
        updates.goblins = increment(1);
    } else {
        updates.subtarefas_progresso = novoSub;
    }

    await updateDoc(userRef, updates);
};

/* --- 3. INTERFACE (Visual) --- */

const atualizarInterfacePerfil = () => {
    const u = window.userDB;
    if (!u) return;

    // Atualiza Nível e XP
    const xp = u.xp || 0;
    const nivel = Math.floor(xp / 1000) + 1;
    if (getEl('user-level-badge')) getEl('user-level-badge').innerText = `Nível ${nivel}`;
    if (getEl('xp-text')) getEl('xp-text').innerText = `${xp % 1000} / 1000 XP`;
    if (getEl('xp-bar-fill')) getEl('xp-bar-fill').style.width = `${(xp % 1000) / 10}%`;

    // Mural de Goblins
    const mural = getEl('goblin-history-list');
    if (mural) {
        mural.innerHTML = (u.goblins || 0) > 0 
            ? `<div class="history-item" style="color:#ff4d4d; font-weight:bold; font-size:1.2rem; text-align:center;">👹 ${u.goblins} Goblins Derrotados!</div>`
            : `<p class="empty-msg">Nenhum goblin avistado ainda.</p>`;
    }
    renderizarGaleria();
};

const renderizarGaleria = () => {
    const container = getEl('trophy-shelf-content');
    if (!container || !window.userDB?.conquistas) return;

    container.innerHTML = window.userDB.conquistas.map(id => {
        const parts = id.split('_');
        if (parts.length < 2) return '';
        const cat = parts[0];
        const val = parts[1];
        const config = IMAGENS_CONFIG[cat];
        if (!config) return '';

        return `
            <div class="trophy-item unlocked">
                <img src="${config.folder}/${val}.png" 
                     alt="${id}"
                     onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/610/610333.png';">
            </div>
        `;
    }).join('');
};

/* --- 4. INICIALIZAÇÃO --- */

onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                
                // Lógica Rei Goblin: Se o número de goblins aumentou e é múltiplo de 10
                if (window.userDB && data.goblins > (window.userDB.goblins || 0)) {
                    if (data.goblins % 10 === 0) processarEGravarRecompensa('reigoblin');
                }

                window.userDB = data;
                atualizarInterfacePerfil();
            }
        });
    }
});