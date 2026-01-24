/* --- gameficacao.js --- */
import { auth, db } from './firebase.js'; 
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* --- 1. CONFIGURAÇÕES GLOBAIS --- */
// Removida a barra inicial para evitar conflito de diretório raiz no Live Server
const BASE_PATH = 'components/';

const IMAGENS_CONFIG = {
    comuns: {
        aleatorios: { folder: "aleatorios", total: 30 },
        matutino:   { folder: "matutino",   total: 12 },
        vespertino: { folder: "vespertino", total: 17 },
        noturno:    { folder: "noturno",    total: 16 },
        madrugada:  { folder: "madrugada",  total: 16 }
    },
    especiais: {
        estacoes:   { folder: "estacoes",   total: 4 },
        meses:      { folder: "meses",      total: 12 },
        hiperfoco:  { folder: "hiperfoco",  total: 17 },
        reigoblin:  { folder: "reigoblin",  total: 17 }
    }
};

const getEl = (id) => document.getElementById(id);

/* --- 2. GESTÃO DE INTERFACE (UI) --- */

const atualizarInterfacePerfil = () => {
    const u = window.userDB;
    if (!u) return;

    if (getEl('user-display-name')) getEl('user-display-name').innerText = u.nome || "Viajante";
    
    if (getEl('user-title')) {
        const nivel = Math.floor((u.xp || 0) / 1000) + 1;
        getEl('user-title').innerText = u.tipo === 'adm' ? "MASTER ADMIN" : `Viajante Nvl ${nivel}`;
    }

    renderizarGaleria();
    renderizarHistoricoGoblin();
};

const renderizarGaleria = () => {
    const container = document.getElementById('trophy-shelf-content');
    if (!container || !window.userDB?.conquistas) return;

    container.innerHTML = window.userDB.conquistas.map(id => {
        if (!id) return '';

        let pasta = "aleatorios";
        let fileName = "";
        const idLower = id.toLowerCase();

        // 1. LÓGICA DE PASTAS
        if (idLower.includes("goblin")) pasta = "reigoblin";
        else if (idLower.includes("matutino")) pasta = "matutino";
        else if (idLower.includes("vespertino")) pasta = "vespertino";
        else if (idLower.includes("noturno")) pasta = "noturno";
        else if (idLower.includes("madrugada")) pasta = "madrugada";
        else if (idLower.includes("hiperfoco")) pasta = "hiperfoco";
        
        // 2. DEFINIR SE É NÚMERO OU NOME (ESTAÇÕES)
        const nomesFixos = ["primavera", "verao", "outono", "inverno", "estacao"];
        const ehNomeFixo = nomesFixos.some(n => idLower.includes(n));

        if (ehNomeFixo) {
            pasta = "estacoes";
            fileName = id; // Ex: "Inverno"
        } else {
            // SEGREDO: Se não tiver número no ID (ex: "ReiGoblin"), ele força o "1"
            fileName = id.includes('_') ? id.split('_').pop() : "1";
        }

        const url = `${BASE_PATH}${pasta}/${fileName}.png`;

        return `
            <div class="trophy-item unlocked">
                <img src="${url}" 
                     alt="${id}"
                     onerror="this.onerror=null; this.src='${BASE_PATH}aleatorios/1.png';">
            </div>
        `;
    }).join('');
};

const renderizarHistoricoGoblin = () => {
    const mural = getEl('goblin-history-list') || getEl('goblin-history');
    if (!mural) return;
    const total = window.userDB?.goblins || 0;
    mural.innerHTML = total > 0 ? `👹 ${total} Goblins derrotados!` : "Nenhum goblin avistado.";
};

/* --- 3. LÓGICA DE RECOMPENSAS --- */
let statusExibindo = false;

window.processarRecompensa = (categoria) => {
    if (statusExibindo) return;
    statusExibindo = true;

    const config = IMAGENS_CONFIG.comuns[categoria] || IMAGENS_CONFIG.especiais[categoria];
    if (!config) {
        statusExibindo = false;
        return;
    }

    // CORREÇÃO: Definindo as variáveis que faltavam
    const sorteio = Math.floor(Math.random() * config.total) + 1;
    const pasta = config.folder;
    const urlFinal = `${BASE_PATH}${pasta}/${sorteio}.png`;

    const modal = getEl('conquista-modal');
    const imgElement = getEl('conquista-img');

    if (modal && imgElement) {
        imgElement.src = urlFinal;
        modal.style.display = 'flex';
        if (getEl('relic-step')) getEl('relic-step').style.display = 'block';
        if (getEl('orbit-congrats-step')) getEl('orbit-congrats-step').style.display = 'none';
    }

    setTimeout(() => { statusExibindo = false; }, 3000);
};

/* --- 4. SINCRONIZAÇÃO FIREBASE --- */
onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                window.userDB = snap.data();
                atualizarInterfacePerfil();
            }
        });
    } else {
        window.userDB = null;
    }
});

/* --- 5. EVENTOS GLOBAIS --- */
window.proximoPassoConquista = () => {
    if (getEl('relic-step')) getEl('relic-step').style.display = 'none';
    if (getEl('orbit-congrats-step')) getEl('orbit-congrats-step').style.display = 'flex';
};

window.fecharConquista = () => {
    if (getEl('conquista-modal')) getEl('conquista-modal').style.display = 'none';
};