/* --- GAMIFICAÇÃO & CONQUISTAS --- */

// Importações necessárias do Firebase e do seu arquivo de configuração
import { auth, db } from './firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const MESES_NOMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Atalho para selecionar elementos (caso não esteja global)
const getEl = (id) => document.getElementById(id);

async function adicionarProgresso(tipo, quantidade) {
    if (!auth.currentUser) return;
    
    // Assume-se que userDB está disponível globalmente via firebase.js
    // ou deve ser buscado antes da atualização
    userDB.xp = (userDB.xp || 0) + quantidade;
    const agora = new Date();
    const hora = agora.getHours();
    const mes = agora.getMonth(); // 0-11

    // 1. Conquistas de Goblin
    if (tipo === 'goblin') {
        userDB.goblins = (userDB.goblins || 0) + 1;
        const num = Math.min(Math.ceil(userDB.goblins / 2), 17);
        verificarEPremiar("reigoblin", num.toString(), `Rei Goblin Nível ${num}`);
    }
    
    // 2. Conquistas de Foco
    if (tipo === 'foco') {
        userDB.focos = (userDB.focos || 0) + 1;
        
        // Hiperfoco Progressivo
        verificarEPremiar("hiperfoco", Math.min(userDB.focos, 17).toString(), `Hiperfoco #${userDB.focos}`);

        // Por Horário
        if (hora >= 0 && hora < 6) {
            verificarEPremiar("madrugador", (Math.floor(Math.random() * 16) + 1).toString(), "Guardião da Madrugada");
        } else if (hora >= 18) {
            verificarEPremiar("noturno", (Math.floor(Math.random() * 16) + 1).toString(), "Explorador Noturno");
        } else if (hora >= 12 && hora < 18) {
            verificarEPremiar("vespertico", (Math.floor(Math.random() * 17) + 1).toString(), "Energia Vespertina");
        }

        // Por Mês (Ajustado para buscar arquivos 1 a 12)
        const arquivoMes = (mes + 1).toString(); 
        verificarEPremiar("meses", arquivoMes, `Relíquia de ${MESES_NOMES[mes]}`);

        // Por Estação (Hemisfério Sul)
        let estacao = "";
        if (mes >= 8 && mes <= 10) estacao = "Primavera";
        else if (mes === 11 || mes <= 1) estacao = "Verão";
        else if (mes >= 2 && mes <= 4) estacao = "Outono";
        else estacao = "Inverno";
        verificarEPremiar("estações", estacao, `Alma do ${estacao}`);
    }

    // Persistência no Firebase
    await updateDoc(doc(db, "users", auth.currentUser.uid), userDB);
    atualizarInterfacePerfil();
}

function verificarEPremiar(pasta, arquivo, titulo) {
    const id = `${pasta}_${arquivo}`;
    if (!userDB.conquistas.includes(id)) {
        userDB.conquistas.push(id);
        window.mostrarConquista(pasta, arquivo, titulo);
    }
}

window.mostrarConquista = (pasta, arquivo, titulo) => {
    const modal = getEl('conquista-modal');
    getEl('conquista-img').src = `./assistente/gameficação/${pasta}/${arquivo}.png`;
    getEl('conquista-titulo').innerText = titulo.toUpperCase();
    getEl('relic-step').style.display = 'block';
    getEl('orbit-congrats-step').style.display = 'none';
    modal.classList.add('active');
    modal.style.display = 'flex';
};

window.proximoPassoConquista = () => {
    getEl('relic-step').style.display = 'none';
    getEl('orbit-congrats-step').style.display = 'flex';
};

window.fecharConquista = () => {
    getEl('conquista-modal').classList.remove('active');
    getEl('conquista-modal').style.display = 'none';
};

function atualizarInterfacePerfil() {
    const shelf = getEl('trophy-shelf-content');
    if (!shelf) return;
    shelf.innerHTML = ''; 
    if (userDB.conquistas && userDB.conquistas.length > 0) {
        userDB.conquistas.forEach(id => {
            const [p, a] = id.split('_');
            const item = document.createElement('div');
            item.className = 'trophy-item';
            item.innerHTML = `<img src="./assistente/gameficação/${p}/${a}.png" onerror="this.src='./assistente/orbits/Orbit.png'">`;
            shelf.appendChild(item);
        });
    }
}

/* --- LOGIN, REGISTRO & SENHA (Interações de UI) --- */

getEl('toggle-password').onclick = () => {
    const passInput = getEl('login-password');
    const type = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = type;
    getEl('toggle-password').classList.toggle('fa-eye');
    getEl('toggle-password').classList.toggle('fa-eye-slash');
};

getEl('forgot-password-link').onclick = (e) => {
    e.preventDefault();
    getEl('auth-modal').classList.remove('active');
    getEl('forgot-password-modal').classList.add('active');
};

document.querySelectorAll('.back-to-login').forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
});

getEl('go-to-register').onclick = () => { 
    getEl('auth-modal').classList.remove('active'); 
    getEl('register-modal').classList.add('active'); 
};

getEl('go-to-login').onclick = () => { 
    getEl('register-modal').classList.remove('active'); 
    getEl('auth-modal').classList.add('active'); 
};

// Exportar funções necessárias para uso global em outros scripts se necessário
export { adicionarProgresso, atualizarInterfacePerfil };