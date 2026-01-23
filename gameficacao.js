import { auth, db } from './firebase.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl = (id) => document.getElementById(id);

async function adicionarProgresso(tipo, quantidade, detalheTarefa = "") {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    
    try {
        const docSnap = await getDoc(userRef);
        let userDB = docSnap.exists() ? docSnap.data() : { xp: 0, focos: 0, goblins: 0, conquistas: [] };

        const valorXP = Number(quantidade) || 0;
        const xpAtual = Number(userDB.xp) || 0;
        const nivelAnterior = Math.floor(xpAtual / 1000) + 1;
        
        userDB.xp = xpAtual + valorXP;
        const nivelAtual = Math.floor(userDB.xp / 1000) + 1;

        if (nivelAtual > nivelAnterior) {
            const numAleatorio = Math.floor(Math.random() * 30) + 1;
            verificarEPremiar("Aleatorio", numAleatorio.toString(), `EVOLUÇÃO: NÍVEL ${nivelAtual}`, userDB);
        }
        
        if (tipo === 'goblin') {
            userDB.goblins = (Number(userDB.goblins) || 0) + 1;
            if (detalheTarefa) {
                if (!userDB.historicoGoblin) userDB.historicoGoblin = [];
                userDB.historicoGoblin.unshift({ 
                    texto: detalheTarefa, 
                    data: new Date().toLocaleDateString('pt-BR') 
                });
                if (userDB.historicoGoblin.length > 15) userDB.historicoGoblin.pop();
            }
        }

        if (tipo === 'foco') {
            userDB.focos = (Number(userDB.focos) || 0) + 1;
        }

        await updateDoc(userRef, userDB);
        window.userDB = userDB;
        atualizarInterfacePerfil();
        
    } catch (error) {
        console.error("Erro ao progredir:", error);
    }
}

function atualizarInterfacePerfil() {
    const userDB = window.userDB;
    if (!userDB) return;

    const nivel = Math.floor((userDB.xp || 0) / 1000) + 1;
    const xpNoNivel = (userDB.xp || 0) % 1000;

    const nivelBadge = getEl('user-level-badge');
    const xpFill = getEl('xp-bar-fill');
    const xpText = getEl('xp-text');

    if (nivelBadge) nivelBadge.innerText = `Nível ${nivel}`;
    if (xpFill) xpFill.style.width = `${(xpNoNivel / 1000) * 100}%`;
    if (xpText) xpText.innerText = `${xpNoNivel} / 1000 XP`;

    // ATUALIZAÇÃO DO HISTÓRICO VISUAL
    const historyList = getEl('goblin-history-list');
    if (historyList && userDB.historicoGoblin) {
        historyList.innerHTML = userDB.historicoGoblin.map(item => `
            <div class="history-item" style="border-left: 2px solid var(--accent-pink); padding: 5px 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05)">
                <div style="font-size: 0.8rem;">${item.texto}</div>
                <small style="opacity: 0.5; font-size: 0.6rem;">${item.data}</small>
            </div>
        `).join('');
    }

    const shelf = getEl('trophy-shelf-content');
    if (shelf) {
        shelf.innerHTML = (userDB.conquistas || []).map(id => {
            const [pasta, arquivo] = id.split('_');
            return `
                <div class="trophy-item">
                    <img src="./assistente/gameficacao/${pasta}/${arquivo}.png" 
                         onerror="this.src='./assistente/orbits/Orbit.png'">
                </div>`;
        }).join('');
    }
}

/* --- EXPOSIÇÃO GLOBAL --- */
window.adicionarProgresso = adicionarProgresso;
window.atualizarInterfacePerfil = atualizarInterfacePerfil;

window.verificarEPremiar = (pasta, arquivo, titulo, userDB) => {
    const target = userDB || window.userDB;
    if (!target.conquistas) target.conquistas = [];
    const idConquista = `${pasta}_${arquivo}`;
    if (!target.conquistas.includes(idConquista)) {
        target.conquistas.push(idConquista);
        window.mostrarPopUpConquista(pasta, arquivo, titulo);
    }
};

window.mostrarPopUpConquista = (pasta, arquivo, titulo) => {
    const popup = getEl('conquista-popup');
    const imgTag = popup.querySelector('#conquista-img');
    const tituloTag = popup.querySelector('#conquista-nome-item');

    if (imgTag) {
        imgTag.src = `./assistente/gameficacao/${pasta}/${arquivo}.png`;
        imgTag.onerror = () => { imgTag.src = './assistente/orbits/Orbit.png'; };
    }
    if (tituloTag) tituloTag.innerText = titulo;

    popup.classList.add('active');
    if (window.OrbitAI) {
        window.OrbitAI.falar(`Incrível! Você desbloqueou: ${titulo}!`);
    }
};

window.fecharConquista = () => {
    getEl('conquista-popup').classList.remove('active');
};