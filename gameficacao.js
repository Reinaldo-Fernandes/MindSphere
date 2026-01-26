import { db, auth } from "./firebase.js";
import { 
    doc, updateDoc, arrayUnion, increment, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl = (id) => document.getElementById(id);

const RELIC_CONFIG = {
    aleatorios: 30, estacoes: 4, hiperfoco: 17, madrugada: 16, 
    matutino: 12, meses: 12, noturno: 16, reigoblin: 17, vespertino: 17 
};

export function iniciarObservadorGamificacao(uid) {
    if (!uid) return;
    onSnapshot(doc(db, "users", uid), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.userDB = data; 
            atualizarInterface(data);
        }
    });
}

function atualizarInterface(data) {
    const xpTotal = data.xp || 0;
    const nivel = Math.floor(xpTotal / 1000) + 1;
    const xpNoNivel = xpTotal % 1000;
    const porcentagem = (xpNoNivel / 1000) * 100;

    if (getEl('user-level-badge')) getEl('user-level-badge').innerText = `Nível ${nivel}`;
    if (getEl('xp-text')) getEl('xp-text').innerText = `${xpNoNivel}/1000 XP`;
    const fill = getEl('xp-bar-fill');
    if (fill) fill.style.width = `${porcentagem}%`;

    const histList = getEl('goblin-history-list');
    if (histList && data.historicoGoblin) {
        histList.innerHTML = data.historicoGoblin.slice(-5).reverse().map(item => `
            <div class="history-item">
                <span style="color:var(--accent-pink)">👹</span>
                <span>${item.tarefa}</span>
                <small>${item.data}</small>
            </div>
        `).join('');
    }

    const shelf = getEl('trophy-shelf-content');
    if (shelf && data.conquistas) {
        shelf.innerHTML = ""; 
        data.conquistas.forEach(id => {
            if (!id || !id.includes('_')) return;
            const [cat, num] = id.split('_');
            const catClean = cat.toLowerCase().trim();
            
            const div = document.createElement('div');
            div.className = 'trophy-item';
            const img = document.createElement('img');
            img.src = `./components/${catClean}/${num}.png`;
            img.onerror = () => div.remove();
            
            div.appendChild(img);
            shelf.appendChild(div);
        });
    }
}

// ÚNICA DEFINIÇÃO DA FUNÇÃO
function mostrarModalConquista(cat, num) {
    const modal = getEl('conquista-modal');
    const img = getEl('conquista-img');
    if (modal && img) {
        img.src = `./components/${cat.toLowerCase()}/${num}.png`;
        modal.classList.add('active');
        getEl('audio-complete')?.play().catch(()=>{});
    }
}

window.adicionarProgresso = async (tipo, xpGanho, nomeTarefa = "") => {
    const user = auth.currentUser;
    if (!user || !window.userDB) return;

    const userRef = doc(db, "users", user.uid);
    const agora = new Date();
    const hora = agora.getHours();
    const conquistasAtuais = window.userDB.conquistas || [];

    let categoria = 'aleatorios';
    if (tipo === 'foco') categoria = 'hiperfoco';
    else if (hora >= 0 && hora < 6) categoria = 'madrugada';
    else if (hora >= 6 && hora < 12) categoria = 'matutino';
    else if (hora >= 12 && hora < 18) categoria = 'vespertino';
    else categoria = 'noturno';

    categoria = categoria.toLowerCase();
    const maxImg = RELIC_CONFIG[categoria] || 10;
    let disponiveis = [];
    
    for (let i = 1; i <= maxImg; i++) {
        const id = `${categoria}_${i}`;
        if (!conquistasAtuais.includes(id)) disponiveis.push(i);
    }

    if (disponiveis.length === 0 && categoria !== 'aleatorios') {
        categoria = 'aleatorios';
        for (let i = 1; i <= RELIC_CONFIG.aleatorios; i++) {
            if (!conquistasAtuais.includes(`aleatorios_${i}`)) disponiveis.push(i);
        }
    }

    let idFinal = null, numSorteado = null;
    if (disponiveis.length > 0) {
        numSorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)];
        idFinal = `${categoria}_${numSorteado}`;
    }

    const up = { xp: increment(xpGanho) };
    if (idFinal) up.conquistas = arrayUnion(idFinal);
    if (tipo === 'goblin' && nomeTarefa) {
        up.historicoGoblin = arrayUnion({
            tarefa: nomeTarefa,
            data: agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
        });
    }

    try {
        await updateDoc(userRef, up);
        if (idFinal) mostrarModalConquista(categoria, numSorteado);
    } catch (e) { console.error(e); }
};

window.fecharConquista = () => getEl('conquista-modal')?.classList.remove('active');