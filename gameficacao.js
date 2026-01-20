import { auth, db } from './firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl = (id) => document.getElementById(id);

// Configuração de Nível: Cada nível precisa de 1000 XP
const XP_PER_LEVEL = 1000;

async function adicionarProgresso(tipo, quantidade, detalheTarefa = "") {
    if (!auth.currentUser) return;
    
    let userDB = window.userDB || { xp: 0, focos: 0, goblins: 0, conquistas: [], historicoGoblin: [] };
    
    // 1. Atualiza XP e Goblins
    userDB.xp = (userDB.xp || 0) + quantidade;

    if (tipo === 'goblin') {
        userDB.goblins = (userDB.goblins || 0) + 1;
        
        // Salva no histórico com data
        if (detalheTarefa) {
            if (!userDB.historicoGoblin) userDB.historicoGoblin = [];
            userDB.historicoGoblin.unshift({
                texto: detalheTarefa,
                data: new Date().toLocaleDateString('pt-BR')
            });
            if (userDB.historicoGoblin.length > 15) userDB.historicoGoblin.pop();
        }

        // Prêmio a cada 10 tarefas do Modo Goblin
        if (userDB.goblins % 10 === 0) {
            const numEspecial = userDB.goblins / 10;
            verificarEPremiar("especial_goblin", numEspecial.toString(), `Mestre Goblin: ${userDB.goblins} Tarefas`);
        }

        const numRei = Math.min(Math.ceil(userDB.goblins / 2), 17);
        verificarEPremiar("reigoblin", numRei.toString(), `Rei Goblin Nível ${numRei}`);
    }

    if (tipo === 'foco') {
        userDB.focos = (userDB.focos || 0) + 1;
        verificarEPremiar("hiperfoco", Math.min(userDB.focos, 17).toString(), `Hiperfoco #${userDB.focos}`);
    }

    // 2. Salva no Firebase
    await updateDoc(doc(db, "users", auth.currentUser.uid), userDB);
    window.userDB = userDB;
    atualizarInterfacePerfil();
}

function atualizarInterfacePerfil() {
    const userDB = window.userDB;
    if (!userDB) return;

    // Lógica de Nível e XP
    const nivel = Math.floor(userDB.xp / 1000) + 1;
    const xpNoNivel = userDB.xp % 1000;

    const nivelBadge = getEl('user-level-badge');
    const xpFill = getEl('xp-bar-fill');

    if (nivelBadge) {
        nivelBadge.innerText = `Nível ${nivel}`;
        // Adiciona a classe de brilho vermelho
        nivelBadge.classList.add('xp-ganho-anim');
        setTimeout(() => nivelBadge.classList.remove('xp-ganho-anim'), 1000);
    }
    
    if (xpFill) xpFill.style.width = `${(xpNoNivel / 1000) * 100}%`;

    // --- Estante de Troféus ---
    const shelf = getEl('trophy-shelf-content');
    if (shelf) {
        shelf.innerHTML = userDB.conquistas.map(id => {
            const [p, a] = id.split('_');
            return `<div class="trophy-item"><img src="./assistente/gameficação/${p}/${a}.png" onerror="this.src='./assistente/orbits/Orbit.png'"></div>`;
        }).join('');
    }

    // --- Histórico Goblin ---
    const historyList = getEl('goblin-history-list');
    if (historyList) {
        if (!userDB.historicoGoblin || userDB.historicoGoblin.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">Nenhuma tarefa concluída.</p>';
        } else {
            historyList.innerHTML = userDB.historicoGoblin.map(t => `
                <div class="history-item">
                    <span>${t.texto}</span>
                    <small>${t.data}</small>
                </div>
            `).join('');
        }
    }
}

// Funções globais
window.adicionarProgresso = adicionarProgresso;
window.atualizarInterfacePerfil = atualizarInterfacePerfil;
window.verificarEPremiar = (pasta, arquivo, titulo) => {
    if (!window.userDB.conquistas.includes(`${pasta}_${arquivo}`)) {
        window.userDB.conquistas.push(`${pasta}_${arquivo}`);
        window.mostrarConquista(pasta, arquivo, titulo);
    }
};