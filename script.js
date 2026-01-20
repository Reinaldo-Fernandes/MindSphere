/* --- 0. IMPORTS (Devem ficar sempre no topo) --- */
import { auth, db } from './firebase.js'; // Certifique-se que seu arquivo de config chama firebase.js
import { 
    collection, addDoc, query, orderBy, onSnapshot, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* --- 1. SELETORES GLOBAIS --- */
const getEl = (id) => document.getElementById(id);
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const circumference = 212 * 2 * Math.PI;

const taskInput = getEl('task-input');
const subtasksList = getEl('subtasks-list');
const startBtn = getEl('start-btn');


/* --- 2. ESTADOS DO TIMER --- */
let timer = null;
const totalTime = 1500; 
let timeLeft = totalTime; 

/* --- 3. FUNÇÕES DE INTERFACE (ORBIT) --- */

function orbitTalk(text) {
    const speech = getEl('orbit-speech');
    if (!speech) return;
    speech.innerText = text;
    speech.classList.add('active');
    setTimeout(() => speech.classList.remove('active'), 5000);
}

function setOrbitState(state) {
    const orbitImg = getEl('orbit-img');
    if (!orbitImg) return;
   const paths = {
    // Note o 'O' maiúsculo em Orbit e Goblin
    'default': './assistente/orbits/error.png', 
    'foco': './assistente/orbits/foco.png',
    'goblin': './assistente/orbits/Goblin.png',
    'dopamina': './assistente/orbits/dopamina.png',
    'serenidade': './assistente/orbits/serenidade.png',
    'autonomia': './assistente/orbits/autonomia.png',
    'adm': './assistente/orbits/adm.png'
};
    orbitImg.src = paths[state.toLowerCase()] || paths['default'];
}

window.setMode = (mode) => {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f' };
    if (colors[mode]) {
        document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
        setOrbitState(mode);
        orbitTalk(`Lente de ${mode} ativada.`);
    }
};

/* --- 4. LÓGICA DO TIMER --- */

function updateTimer() {
    if (timeLeft <= 0) {
        finalizarCicloFoco();
        return;
    }

    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    // Nasce item no jardim a cada 5 minutos
    const marcasDeTempo = [1200, 900, 600, 300];
    if (marcasDeTempo.includes(timeLeft) && sec === 0) {
        criarItemJardim();
        orbitTalk("O jardim está crescendo... 🌿");
    }

    if (circle) {
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function finalizarCicloFoco() {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    display.innerText = "25:00";
    circle.style.strokeDashoffset = circumference;
    startBtn.innerText = "REINICIAR";
    getEl('audio-complete')?.play();
    
    // Chama a função global que estará no gameficacao.js
    if (window.adicionarProgresso) {
        window.adicionarProgresso('foco', 100);
    }
    
    setOrbitState('default');
}

/* --- 5. JARDIM (SISTEMA DE EMOJIS) --- */

function criarItemJardim() {
    const container = document.querySelector('.sphere-wrapper');
    const gardenSelect = document.getElementById('garden-style');
    if (!container) return;

    const style = gardenSelect ? gardenSelect.value : 'plantas';
    const emojis = {
        plantas: ['🌿', '🌸', '🍃', '🍄', '🍀'],
        espaco: ['✨', '⭐', '☄️', '🌌'],
        notas: ['🎵', '🎶', '🎼', '🎹'],
        comida: ['☕', '🍪', '🥐', '🥯']
    };

    const emojiList = emojis[style] || emojis['plantas'];
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    
    const item = document.createElement('div');
    item.className = 'garden-item';
    item.innerText = emoji;

    const dist = 240 + Math.random() * 30;
    const dur = 25 + Math.random() * 5; 

    item.style.setProperty('--orbit-distance', `${dist}px`);
    item.style.setProperty('--orbit-duration', `${dur}s`);
    item.style.setProperty('--start-angle', `${Math.random() * 360}deg`);
    item.style.animation = `orbitContinuous var(--orbit-duration) linear infinite`;

    container.appendChild(item);
}

/* --- 6. MODO GOBLIN (SUBTAREFAS) --- */

getEl('break-task-btn').onclick = () => {
    const text = taskInput.value.trim();
    if (!text) return;
    
    // Divide em duas partes simples (Pode ser personalizado)
    const parts = [`Começar: ${text}`, `Finalizar: ${text}`];
    
    parts.forEach(t => {
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.innerHTML = `<input type="checkbox"> <span>${t}</span>`;
        
        div.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
                // CAPTURA O TEXTO: Importante para o histórico
                const textoDaTarefa = div.querySelector('span').innerText;

                // ENVIA PARA A GAMIFICAÇÃO: 
                // Passamos o tipo 'goblin', o XP (25) e o TEXTO da tarefa
                if (window.adicionarProgresso) {
                    window.adicionarProgresso('goblin', 25, textoDaTarefa);
                }

                // Efeito visual de conclusão
                div.style.opacity = "0.5";
                div.style.textDecoration = "line-through";
                
                setTimeout(() => div.remove(), 800);
            }
        };
        subtasksList.appendChild(div);
    });
    
    taskInput.value = "";
    setOrbitState('goblin');
    orbitTalk("Tarefas divididas! Um passo de cada vez. 👹");
};

/* --- 7. CONTROLES DE ÁUDIO --- */

function setupAudio(sliderId, audioId) {
    const s = getEl(sliderId), a = getEl(audioId);
    if (s && a) s.oninput = (e) => { 
        a.volume = e.target.value; 
        if (a.volume > 0) a.play(); else a.pause(); 
    };
}
setupAudio('rain-vol', 'audio-rain');
setupAudio('fire-vol', 'audio-fire');

/* --- 8. INICIALIZAÇÃO E BOTÕES PRINCIPAIS --- */

if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});
            
            if (timeLeft === totalTime) {
                const container = document.querySelector('.sphere-wrapper');
                if (container) {
                    container.querySelectorAll('.garden-item').forEach(el => el.remove());
                }
                criarItemJardim();
            }

            timer = setInterval(updateTimer, 1000);
            startBtn.innerText = "PAUSAR";
            setOrbitState('foco');
        } else {
            clearInterval(timer);
            timer = null;
            startBtn.innerText = "RETOMAR";
            setOrbitState('default');
        }
    };
}

getEl('panic-btn').onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    if (display) display.innerText = "25:00";
    if (circle) circle.style.strokeDashoffset = circumference;

    const container = document.querySelector('.sphere-wrapper');
    if (container) {
        container.querySelectorAll('.garden-item').forEach(el => el.remove());
    }

    setOrbitState('default');
    if (startBtn) startBtn.innerText = "INICIAR";
    orbitTalk("Tudo limpo! Vamos recomeçar? 🌿");
};

// Configuração inicial do círculo
if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

// Fechar modais genéricos
document.querySelectorAll('.close-modal').forEach(b => {
    b.onclick = () => document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
});

/* --- 9. ADM --- */
// Adicione esta função ao final do seu script.js
export async function enviarFeedback(msg) {
    if (!auth.currentUser) return orbitTalk("Faz login para me contar!");
    
    try {
        await addDoc(collection(db, "feedbacks"), {
            email: auth.currentUser.email,
            mensagem: msg,
            data: new Date()
        });
        orbitTalk("Feedback enviado! O Orbit Admin já recebeu.");
    } catch (e) {
        console.error("Erro ao enviar feedback: ", e);
    }
}

// ------------ Carregar os Feedbacks e Métricas

async function carregarDadosAdmin() {
    const wall = document.getElementById('feedback-wall');
    const totalUsersEl = document.getElementById('count-users');
    
    // 1. Buscar métricas simples (Total de feedbacks, por exemplo)
    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    
    // 2. Usar onSnapshot para que, se alguém enviar um feedback agora
    onSnapshot(q, (snapshot) => {
        wall.innerHTML = ""; 
        document.getElementById('fb-count').innerText = snapshot.size; // Atualiza contador
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const dataFormatada = data.data?.toDate().toLocaleString('pt-BR');
            
            // Criando o card com o mesmo estilo do seu app
            const card = document.createElement('div');
            card.className = 'feedback-item'; // Estilize isso no seu CSS
            card.innerHTML = `
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 3px solid var(--accent-cyan);">
                    <p style="margin: 0; font-size: 0.8rem; color: var(--accent-pink);">${dataFormatada}</p>
                    <p style="margin: 5px 0; font-weight: bold;">${data.email}:</p>
                    <p style="margin: 0; opacity: 0.9;">${data.mensagem}</p>
                </div>
            `;
            wall.appendChild(card);
        });
    });
}/* --- LOGICA DE FEEDBACK (BOTÃO PEQUENO NO PERFIL) --- */

const fbTrigger = getEl('feedback-trigger');
if (fbTrigger) {
    fbTrigger.onclick = () => {
        // 1. Fecha o perfil (removendo a classe active)
        getEl('profile-modal').classList.remove('active');
        
        // 2. Abre o feedback (usando a classe active para garantir visibilidade)
        const modalFb = getEl('feedback-modal');
        if (modalFb) {
            modalFb.style.display = 'flex'; // Garante o display
            setTimeout(() => modalFb.classList.add('active'), 10); // Ativa o efeito vitral
        }
        
        // 3. Preenche dados se logado
        if (auth.currentUser) {
            getEl('fb-user-name').value = window.userDB?.nome || auth.currentUser.email;
        }
    };
}

// Enviar para o Firebase (Mantendo sua lógica de sucesso)
const sendFbBtn = getEl('send-fb-btn');
if (sendFbBtn) {
    sendFbBtn.onclick = async () => {
        const nome = getEl('fb-user-name').value.trim();
        const texto = getEl('fb-text').value.trim();

        if (!texto) return orbitTalk("Escreva algo antes de enviar!");

        try {
            // Importante: use addDoc e collection que importamos no topo
            await addDoc(collection(db, "feedbacks"), {
                nome: nome || "Anônimo",
                mensagem: texto,
                data: new Date(),
                userId: auth.currentUser ? auth.currentUser.uid : "deslogado",
                email: auth.currentUser?.email || "N/A"
            });

            getEl('orbit-msg-fb').innerText = "Recebido! Vou levar para o meu criador.";
            
            setTimeout(() => {
                getEl('feedback-modal').style.display = 'none';
                getEl('fb-text').value = "";
            }, 2000);

        } catch (e) {
            console.error(e);
            orbitTalk("Erro ao enviar... tente novamente.");
        }
    };
}

function ativarModoAdmin() {
    document.body.classList.add('admin-mode');
    
    // Troca o Orbit para a versão ADM na página principal
    const orbitImg = document.getElementById('orbit-img');
    if (orbitImg) orbitImg.src = "./assistente/orbits/adm.png";

    // Notificação do Orbit
    setTimeout(() => {
        if (window.orbitTalk) window.orbitTalk("Saudações, Comandante. O terminal de supervisão está pronto.");
    }, 2000);

    // IMPORTANTE: Faz o botão de métricas abrir a página adm.html
    const btnMetrics = document.getElementById('view-metrics');
    if (btnMetrics) {
        btnMetrics.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'adm.html'; // Altere aqui se o seu arquivo se chamar adm.index ou algo assim
        };
    }
}

/* --- 10. LÓGICA DE TRANSIÇÃO DE MODAIS (AUTH) --- */

// Abrir Modal de Login (botão da Header)
getEl('auth-trigger').onclick = () => {
    getEl('auth-modal').classList.add('active');
};

// Ir para tela de Cadastro
const linkIrCadastro = getEl('go-to-register');
if (linkIrCadastro) {
    linkIrCadastro.onclick = (e) => {
        e.preventDefault();
        getEl('auth-modal').classList.remove('active'); // Fecha login
        getEl('register-modal').classList.add('active'); // Abre cadastro
    };
}

// Voltar para tela de Login (dentro do cadastro)
const linkVoltarLogin = getEl('go-to-login');
if (linkVoltarLogin) {
    linkVoltarLogin.onclick = (e) => {
        e.preventDefault();
        getEl('register-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
}

// Ir para Esqueci a Senha
const linkEsqueciSenha = getEl('forgot-password-link');
if (linkEsqueciSenha) {
    linkEsqueciSenha.onclick = (e) => {
        e.preventDefault();
        getEl('auth-modal').classList.remove('active');
        getEl('forgot-password-modal').classList.add('active');
    };
}

// Voltar do Esqueci a Senha para o Login
document.querySelectorAll('.back-to-login').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        getEl('forgot-password-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
});

/* --- VER SENHA (OLHINHO) --- */
const togglePass = getEl('toggle-password');
if (togglePass) {
    togglePass.onclick = function() {
        const inputSenha = getEl('login-password');
        if (inputSenha.type === 'password') {
            inputSenha.type = 'text';
            this.classList.replace('fa-eye', 'fa-eye-slash'); // Muda ícone FontAwesome
        } else {
            inputSenha.type = 'password';
            this.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };
}