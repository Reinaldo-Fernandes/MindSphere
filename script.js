/* --- 0. IMPORTS --- */
import { auth, db } from './firebase.js';
import { 
    collection, addDoc, query, orderBy, onSnapshot, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { iniciarObservadorGamificacao } from "./gameficacao.js";

/* --- 1. ESTADOS GLOBAIS (Declarar apenas UMA vez) --- */
let timer = null;
let totalTime = 1500; 
let timeLeft = totalTime; 
let lastBreakTime = 0;
const circumference = 212 * 2 * Math.PI;
window.getEl = (id) => document.getElementById(id);

/* --- 2. SELETORES --- */
function getEl(id) { return document.getElementById(id); }
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const taskInput = getEl('task-input');
const subtasksList = getEl('subtasks-list');
const startBtn = getEl('start-btn');

/* --- 3. OBSERVADOR DE LOGIN --- */
auth.onAuthStateChanged(user => {
    const opt1h = getEl('opt-1h');
    const opt2h = getEl('opt-2h');
    
    if (user) {
        iniciarObservadorGamificacao(user.uid);
        if(opt1h) { opt1h.disabled = false; opt1h.innerText = "1 Hora (Premium)"; }
        if(opt2h) { opt2h.disabled = false; opt2h.innerText = "2 Horas (Premium)"; }
    } else {
        if(opt1h) { opt1h.disabled = true; opt1h.innerText = "1 Hora (Bloqueado 🔒)"; }
        if(opt2h) { opt2h.disabled = true; opt2h.innerText = "2 Horas (Bloqueado 🔒)"; }
    }
});

/* --- FUNÇÕES DE INTERFACE (Lentes) --- */
window.setMode = (mode) => {
    const colors = { 
        dopamina: '#ff2da4', 
        serenidade: '#5ef3ff', 
        autonomia: '#adff2f',
        goblin: '#ff4d4d' // Cor para o modo goblin
    };

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
    const elapsed = totalTime - timeLeft; 
    
    // 5 MINUTOS = 300 segundos
    const intervaloCrescimento = 300; 

    // REMOVEMOS o "elapsed === 1". 
    // Agora ele só cria itens nos intervalos de 5 minutos (300, 600, 900...)
    if (elapsed > 0 && elapsed % intervaloCrescimento === 0) {
        spawnGardenItem(); 
        orbitTalk("O jardim está se expandindo... 🌿");
    }

    // Pausa sugerida (a cada 30 min)
    if (elapsed > 0 && elapsed % 1800 === 0) {
        pausarParaDescanso();
    }

    atualizarDisplayVisual();
}

/* No topo do seu script.js, junto com os outros estados globais */
let gardenItemCount = 0; 

function spawnGardenItem() {
    console.log("Criando item no jardim..."); 
    const container = document.querySelector('.sphere-wrapper');
    const gardenStyle = getEl('garden-style');
    
    if (!container) return;

    const style = gardenStyle ? gardenStyle.value : 'plantas';
    const items = { 
        plantas: ['🌿', '🌱', '🌸', '🍀', '🌻', '🍃'], 
        espaco: ['✨', '🪐', '🌟', '☄️', '🌙', '🛰️'], 
        notas: ['🎵', '🎹', '🎸', '🎶', '🎷', '🎻'], 
        comida: ['☕', '🍪', '🥐', '🧁', '🍎', '🍓'] 
    };
    
    const selected = items[style] || items.plantas;
    const emoji = selected[Math.floor(Math.random() * selected.length)];
    
    const item = document.createElement('div');
    item.className = 'garden-item'; 
    item.innerText = emoji;
    
    // --- LÓGICA DE DISTÂNCIA FIXA E NÃO SOBREPOSIÇÃO ---
    const duration = 25; // Todos na mesma velocidade (em segundos)
    const radius = 170;  // Distância fixa do centro (em pixels)
    
    // Cada novo item surge 45 graus à frente do anterior (evita sobrepor)
    const angleStep = 45; 
    const startAngle = gardenItemCount * angleStep;

    item.style.setProperty('--orbit-duration', `${duration}s`);
    item.style.setProperty('--orbit-distance', `${radius}px`);
    item.style.setProperty('--start-angle', `${startAngle}deg`);
    
    container.appendChild(item);
    gardenItemCount++; // Incrementa para o próximo item
}

function atualizarDisplayVisual() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    if (circle) {
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function pausarParaDescanso() {
    clearInterval(timer);
    timer = null;
    if (startBtn) startBtn.innerText = "RETOMAR";
    setOrbitState('default');
    orbitTalk("Hora de esticar as costas! Pausa de 5 min recomendada. ☕");
    getEl('audio-complete')?.play();
}

function finalizarCicloFoco() {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    atualizarDisplayVisual();
    if (startBtn) startBtn.innerText = "REINICIAR";
    getEl('audio-complete')?.play();
    
    if (window.adicionarProgresso) {
        window.adicionarProgresso('foco', 100);
    }
    setOrbitState('default');
}

/* --- 5. INTERFACE & ORBIT --- */

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
        'default': './components/orbits/error.png', 
        'foco': './components/orbits/foco.png',
        'goblin': './components/orbits/Goblin.png',
        'dopamina': './components/orbits/dopamina.png',
        'serenidade': './components/orbits/serenidade.png',
        'autonomia': './components/orbits/autonomia.png',
        'adm': './components/orbits/adm.png'
    };
    orbitImg.src = paths[state.toLowerCase()] || paths['default'];
}

/* --- 6. CONTROLE UNIFICADO DO TIMER E JARDIM --- */
if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});

            // Se for um novo ciclo (início total)
            if (timeLeft === totalTime || timeLeft <= 0) {
                const durationSelect = getEl('timer-duration');
                totalTime = durationSelect ? parseInt(durationSelect.value) : 1500;
                timeLeft = totalTime;

                const container = document.querySelector('.sphere-wrapper');
                if (container) {
                    container.querySelectorAll('.garden-item').forEach(el => el.remove());
                    gardenItemCount = 0; // Reseta o contador de posições
                    spawnGardenItem();   // CRIA APENAS O PRIMEIRO AQUI
                }
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

/* --- MODO GOBLIN (SUBTAREFAS / SPLIT) --- */
const breakBtn = getEl('break-task-btn');
if (breakBtn) {
    breakBtn.onclick = () => {
        const text = taskInput.value.trim();
        if (!text) {
            orbitTalk("Escreva uma tarefa para eu dividir! 👹");
            return;
        }
        
        // Divide a tarefa em subtarefas simples
        const parts = [`Preparar: ${text}`, `Executar: ${text}`, `Finalizar: ${text}`];
        
        parts.forEach(t => {
            const div = document.createElement('div');
            div.className = 'subtask-item';
            div.innerHTML = `<input type="checkbox"> <span>${t}</span>`;
            
            div.querySelector('input').onchange = (e) => {
                if (e.target.checked) {
                    const textoDaTarefa = div.querySelector('span').innerText;
                    // Chama a gamificação
                    if (window.adicionarProgresso) {
                        window.adicionarProgresso('goblin', 25, textoDaTarefa);
                    }
                    div.style.opacity = "0.5";
                    div.style.textDecoration = "line-through";
                    setTimeout(() => div.remove(), 800);
                }
            };
            subtasksList.appendChild(div);
        });
        
        taskInput.value = "";
        setMode('goblin'); // Ativa a lente goblin automaticamente
    };
}

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
        // 1. Tratamento de Onboarding
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            // --- INICIAR OU RETOMAR ---
            getEl('audio-start')?.play().catch(() => {});

            // Se for um novo ciclo (início ou após terminar)
            if (timeLeft === totalTime || timeLeft <= 0) {
                const durationSelect = getEl('timer-duration');
                totalTime = durationSelect ? parseInt(durationSelect.value) : 1500;
                timeLeft = totalTime;

                // Limpa o jardim e cria o PRIMEIRO item imediatamente
                const container = document.querySelector('.sphere-wrapper');
                if (container) {
                    container.querySelectorAll('.garden-item').forEach(el => el.remove());
                    spawnGardenItem(); // <--- Agora ele vai aparecer!
                }
            }

            timer = setInterval(updateTimer, 1000);
            startBtn.innerText = "PAUSAR";
            setOrbitState('foco');
        } else {
            // --- PAUSAR ---
            clearInterval(timer);
            timer = null;
            startBtn.innerText = "RETOMAR";
            setOrbitState('default');
        }
    };
}

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

getEl('auth-trigger').onclick = () => getEl('auth-modal').classList.add('active');

const linkIrCadastro = getEl('go-to-register');
if (linkIrCadastro) {
    linkIrCadastro.onclick = (e) => {
        e.preventDefault();
        getEl('auth-modal').classList.remove('active');
        getEl('register-modal').classList.add('active');
    };
}

const linkVoltarLogin = getEl('go-to-login');
if (linkVoltarLogin) {
    linkVoltarLogin.onclick = (e) => {
        e.preventDefault();
        getEl('register-modal').classList.remove('active');
        getEl('auth-modal').classList.add('active');
    };
}

/* --- 11. AGENDA, JOGOS E LEMBRETES (CORRIGIDO) --- */

const agendaDateInput = getEl('agenda-date');
const agendaTextArea = getEl('agenda-notes');

function atualizarCardLembrete(texto) {
    const card = getEl('quick-reminder-card');
    const p = getEl('reminder-text');
    if (!card || !p) return;
    
    if (texto && texto.trim() !== "") {
        card.style.display = 'block';
        p.innerText = texto.length > 100 ? texto.substring(0, 100) + "..." : texto;
    } else {
        card.style.display = 'none';
    }
}

// Abrir Agenda
const agendaTrigger = getEl('agenda-trigger');
if (agendaTrigger) {
    agendaTrigger.onclick = () => {
        const hoje = new Date().toISOString().split('T')[0];
        if (agendaDateInput) {
            agendaDateInput.value = hoje;
            const notaSalva = localStorage.getItem(`note_${hoje}`);
            if (agendaTextArea) agendaTextArea.value = notaSalva || "";
        }
        getEl('agenda-modal').classList.add('active');
    };
}

// Salvar Agenda
const saveAgendaBtn = getEl('save-agenda');
if (saveAgendaBtn) {
    saveAgendaBtn.onclick = () => {
        const dataSelecionada = agendaDateInput?.value;
        const texto = agendaTextArea?.value;
        const hoje = new Date().toISOString().split('T')[0];

        if (dataSelecionada) {
            localStorage.setItem(`note_${dataSelecionada}`, texto);
            if (dataSelecionada === hoje) atualizarCardLembrete(texto);
            
            orbitTalk(`Lembrete guardado! 💾`);
            setTimeout(() => getEl('agenda-modal').classList.remove('active'), 1000);
        }
    };
}

// Modal de Jogo
const gameTrigger = getEl('game-trigger');
if (gameTrigger) {
    gameTrigger.onclick = () => getEl('game-modal').classList.add('active');
}

// Fechamento Universal de Modais
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
        const fbModal = getEl('feedback-modal');
        if (fbModal) fbModal.style.display = 'none';
    };
});

// Carregar ao iniciar
window.addEventListener('load', () => {
    const hoje = new Date().toISOString().split('T')[0];
    const notaHoje = localStorage.getItem(`note_${hoje}`);
    if (notaHoje) atualizarCardLembrete(notaHoje);
});