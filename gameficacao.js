import { db, auth } from "./firebase.js";
import { 
    doc, updateDoc, arrayUnion, increment, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const getEl = (id) => document.getElementById(id);

const RELIC_CONFIG = {
    aleatorios: 30, estacoes: 4, hiperfoco: 17, madrugada: 16, 
    matutino: 12, meses: 12, noturno: 16, reigoblin: 17, vespertino: 17 
};

// Variável local para evitar múltiplas renderizações desnecessárias
let ultimaConquistaCount = 0;

export function iniciarObservadorGamificacao(uid) {
    if (!uid) return;
    const userRef = doc(db, "users", uid);

    return onSnapshot(userRef, 
        (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                window.userDB = data; 
                atualizarInterface(data);
            } else {
                console.warn("Documento do usuário não encontrado no Firestore.");
            }
        }, 
        (error) => {
            console.error("Erro de permissão no Firestore:", error);
            // Aqui você pode avisar o usuário ou tentar criar o doc inicial
        }
    );
}

function atualizarInterface(data) {
    // 1. Lógica de Nível e XP
    const xpTotal = data.xp || 0;
    const nivel = Math.floor(xpTotal / 1000) + 1;
    const xpNoNivel = xpTotal % 1000;
    
    if (getEl('user-level-badge')) getEl('user-level-badge').innerText = `Nível ${nivel}`;
    if (getEl('xp-text')) getEl('xp-text').innerText = `${xpNoNivel}/1000 XP`;
    
    const fill = getEl('xp-bar-fill');
    if (fill) fill.style.width = `${(xpNoNivel / 1000) * 100}%`;

    // 2. Histórico Goblin (Otimizado: só reconstrói se houver dados)
    const histList = getEl('goblin-history-list');
    if (histList && data.historicoGoblin) {
        histList.innerHTML = "";
        data.historicoGoblin.slice(-5).reverse().forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-item';

            const icon = document.createElement('span');
            icon.style.color = 'var(--accent-pink)';
            icon.textContent = '👹';

            const tarefaEl = document.createElement('span');
            tarefaEl.textContent = item.tarefa;

            const dataEl = document.createElement('small');
            dataEl.textContent = item.data;

            row.appendChild(icon);
            row.appendChild(tarefaEl);
            row.appendChild(dataEl);
            histList.appendChild(row);
        });
    }

    // 3. Prateleira de Troféus (Otimizado: só reconstrói se o número de conquistas mudou)
    const shelf = getEl('trophy-shelf-content');
    const conquistasAtuais = data.conquistas || [];
    
    if (shelf && conquistasAtuais.length !== ultimaConquistaCount) {
        ultimaConquistaCount = conquistasAtuais.length;
        shelf.innerHTML = ""; 
        conquistasAtuais.forEach(id => {
            if (!id || !id.includes('_')) return;
            const [cat, num] = id.split('_');
            const catClean = cat.toLowerCase().trim();
            
            const div = document.createElement('div');
            div.className = `trophy-item ${catClean}`; 
            div.innerHTML = `<img src="./components/${catClean}/${num}.png" onerror="this.parentElement.remove()">`;
            shelf.appendChild(div);
        });
    }
}

function mostrarModalConquista(cat, num) {
    const modal = getEl('conquista-modal');
    const img = getEl('conquista-img');
    if (modal && img) {
        img.src = `./components/${cat.toLowerCase()}/${num}.png`;
        modal.classList.add('active');
        modal.style.display = 'flex'; // Garante visibilidade
        getEl('audio-complete')?.play().catch(()=>{});
    }
}

const COOLDOWN_MS = 15000; // 15 segundos — abaixo disso, um humano normal não conclui outra ação real

window.adicionarProgresso = async (tipo, xpGanho, nomeTarefa = "") => {
    const user = auth.currentUser;
    if (!user || !window.userDB) return;

    const userRef = doc(db, "users", user.uid);
    const agora = new Date();
    const hora = agora.getHours();
    const conquistasAtuais = window.userDB.conquistas || [];

    // --- DETECÇÃO DE RITMO SUSPEITO ---
    // Se a última vez que XP foi somado foi há menos de COOLDOWN_MS,
    // a ação ainda é registrada (tarefa marcada, histórico salvo),
    // mas o XP e o sorteio de relíquia dessa rodada ficam retidos.
    const ultimaAtualizacaoMs = window.userDB.ultimaAtualizacaoXP?.toMillis?.() || 0;
    const emCooldown = (agora.getTime() - ultimaAtualizacaoMs) < COOLDOWN_MS;
    const xpEfetivo = emCooldown ? 0 : xpGanho;

    if (emCooldown && xpGanho > 0) {
        console.log("XP retido: ações muito rápidas detectadas, aguardando ritmo normal.");
    }
    
    let categoria;
    let deveGanharReliquia = false;

    // --- LÓGICA GOBLIN (1 relíquia a cada 10 missões) ---
    if (tipo === 'goblin') {
        const novoContador = (window.userDB.contadorGoblin || 0) + 1;
        categoria = 'reigoblin';
        // Só tenta sortear relíquia se for múltiplo de 10 E não estiver em cooldown
        if (novoContador % 10 === 0 && !emCooldown) {
            deveGanharReliquia = true;
        }
    } else if (!emCooldown) {
        // Lógica de Foco/Tempo (Ganha sempre por enquanto ou ajuste aqui)
        deveGanharReliquia = true; 
        if (tipo === 'foco') categoria = 'hiperfoco';
        else if (hora >= 0 && hora < 6) categoria = 'madrugada';
        else if (hora >= 6 && hora < 12) categoria = 'matutino';
        else if (hora >= 12 && hora < 18) categoria = 'vespertino';
        else categoria = 'noturno';
    }

    // --- SORTEIO OTIMIZADO ---
    let idFinal = null;
    let numSorteado = null;

    if (deveGanharReliquia) {
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

        if (disponiveis.length > 0) {
            numSorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)];
            idFinal = `${categoria}_${numSorteado}`;
        }
    }

    // --- OPERAÇÃO ATÔMICA (Economiza escritas) ---
    const up = { xp: increment(xpEfetivo), ultimaAtualizacaoXP: serverTimestamp() };
    
    if (idFinal) up.conquistas = arrayUnion(idFinal);
    
    if (tipo === 'goblin') {
        up.contadorGoblin = increment(1); // Importante para a trava de 10
        const contadorAtual = (window.userDB.contadorGoblin || 0) + 1;
    // Chama o Orbit para incentivar se estiver perto de 10
    window.OrbitAssistant.reagir('progresso_goblin', { contador: contadorAtual });
        if (nomeTarefa) {
            up.historicoGoblin = arrayUnion({
                tarefa: nomeTarefa,
                data: agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
            });
        }
    }

    try {
        await updateDoc(userRef, up);
        if (idFinal) mostrarModalConquista(categoria, numSorteado);
    } catch (e) { console.error("Erro Firebase:", e); }
};

window.fecharConquista = () => getEl('conquista-modal')?.classList.remove('active');
