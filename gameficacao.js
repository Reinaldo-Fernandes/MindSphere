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

        // --- LÓGICA DE PREMIAÇÃO: APENAS SE SUBIU DE NÍVEL ---
        if (nivelAtual > nivelAnterior) {
            // Prêmio Aleatório (Pasta Aleatorio, arquivos de 1 a 30)
            const numAleatorio = Math.floor(Math.random() * 30) + 1;
            verificarEPremiar("Aleatorio", numAleatorio.toString(), `EVOLUÇÃO: NÍVEL ${nivelAtual}`, userDB);
        }
        
        // --- MODO GOBLIN ---
        if (tipo === 'goblin') {
            userDB.goblins = (Number(userDB.goblins) || 0) + 1;
            
            if (detalheTarefa) {
                // Inicializa o array se ele não existir
                if (!userDB.historicoGoblin) userDB.historicoGoblin = [];
                
                // Adiciona a nova tarefa no topo da lista
                userDB.historicoGoblin.unshift({ 
                    texto: detalheTarefa, 
                    data: new Date().toLocaleDateString('pt-BR') 
                });

                // Mantém apenas as últimas 15 tarefas
                if (userDB.historicoGoblin.length > 15) userDB.historicoGoblin.pop();
                
                console.log("Histórico atualizado:", detalheTarefa);
            }
        }

        if (tipo === 'foco') {
            userDB.focos = (Number(userDB.focos) || 0) + 1;
        }

        // SALVAR NO FIREBASE
        await updateDoc(userRef, userDB);
        window.userDB = userDB;
        atualizarInterfacePerfil();
        
    } catch (error) {
        console.error("Erro ao progredir:", error);
    }
}

// Interface atualizada com o texto de XP (id="xp-text")
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

    // CORREÇÃO AQUI: Removemos a linha "helf" e limpamos a constante shelf
    const shelf = getEl('trophy-shelf-content');
    
    if (shelf) {
        shelf.innerHTML = (userDB.conquistas || []).map(id => {
            const partes = id.split('_');
            if (partes.length < 2) return ''; 
            
            const [pasta, arquivo] = partes;
            
            // Usando caminhos absolutos (começando com /) para garantir funcionamento na Vercel
            return `
                <div class="trophy-item" title="${pasta}: ${arquivo}">
                    <img src="/assistente/gameficacao/${pasta}/${arquivo}.png" 
                         onerror="this.src='/assistente/orbits/Orbit.png'">
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
        if (window.mostrarPopUpConquista) {
            window.mostrarPopUpConquista(pasta, arquivo, titulo);
        }
    }
};

window.mostrarPopUpConquista = (pasta, arquivo, titulo) => {
    // 1. Validação: Se não tiver pasta ou arquivo, para aqui mesmo
    if (!pasta || !arquivo || pasta === "undefined" || arquivo === "undefined") {
        console.error("Erro: Dados de conquista inválidos:", pasta, arquivo);
        return;
    }

    const popup = getEl('conquista-popup');
    const imgTag = getEl('conquista-img');
    const tituloTag = getEl('conquista-nome-item');

    // 2. Caminho Absoluto (o "/" no início é vital na Vercel)
    const caminhoFinal = `/assistente/gameficacao/${pasta}/${arquivo}.png`;
    
    imgTag.src = caminhoFinal;
    
    // 3. Fallback: se a imagem não existir, não mostra erro 404 vazio
    imgTag.onerror = () => { 
        console.warn("Imagem não encontrada no caminho:", caminhoFinal);
        imgTag.src = '/assistente/orbits/Orbit.png'; 
    };

    tituloTag.innerText = titulo;
    popup.classList.add('active');

    if (window.OrbitAI) {
        window.OrbitAI.falar(`Incrível! Você desbloqueou: ${titulo}!`);
    }
};