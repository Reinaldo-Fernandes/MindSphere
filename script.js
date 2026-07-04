/* ==========================================================================
   0. IMPORTS E CONFIGURAÇÕES INICIAIS
========================================================================== 
*/
import { auth, db } from './firebase.js';
import { 
    collection, addDoc, query, orderBy, onSnapshot, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { iniciarObservadorGamificacao } from "./gameficacao.js";
import { initThreeBackground, add3DPlant } from './visual.js';

initThreeBackground();


/* ==========================================================================
   1. ESTADOS GLOBAIS E SELETORES
========================================================================== 
*/
let timer = null;
let totalTime = 1500; 
let timeLeft = totalTime; 
let gardenItemCount = 0;
const circumference = 212 * 2 * Math.PI;
const starCount = window.innerWidth < 768 ? 1000 : 3000;
const getEl = (id) => document.getElementById(id);
const display = getEl('timer-display');
const circle = document.querySelector('.progress-ring__circle');
const taskInput = getEl('task-input');
const subtasksList = getEl('subtasks-list');
const startBtn = getEl('start-btn');
const durationSelect = getEl('timer-duration');

/* ==========================================================================
   2. SISTEMA DE LOGIN E PERMISSÕES (PREMIUM/ADMIN)
========================================================================== 
*/
auth.onAuthStateChanged(user => {
    const opt1h = getEl('opt-1h');
    const opt2h = getEl('opt-2h');
    
    if (user) {
        iniciarObservadorGamificacao(user.uid);
        if(opt1h) { opt1h.disabled = false; opt1h.innerText = "1 Hora (Premium)"; }
        if(opt2h) { opt2h.disabled = false; opt2h.innerText = "2 Horas (Premium)"; }
        
        // CORREÇÃO AQUI: Substituímos o nome da função e adicionamos uma verificação de segurança
        if (getEl('feedback-wall') || getEl('adm-panel')) {
            if (typeof conectarDadosDashboard === 'function') {
                conectarDadosDashboard();
            }
        }
    } else {
        if(opt1h) { opt1h.disabled = true; opt1h.innerText = "1 Hora (Bloqueado 🔒)"; }
        if(opt2h) { opt2h.disabled = true; opt2h.innerText = "2 Horas (Bloqueado 🔒)"; }
    }
});

/* ==========================================================================
   3. LÓGICA DO TIMER E VISUALIZAÇÃO
========================================================================== 
*/
function atualizarDisplayVisual() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    if (display) display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;

    if (circle) {
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function updateTimer() {
    if (timeLeft <= 0) {
        finalizarCicloFoco();
        return;
    }

    timeLeft--;
    const elapsed = totalTime - timeLeft; 
    const intervaloCrescimento = totalTime > 1500 ? 900 : 300; 

    if (elapsed > 0 && elapsed % intervaloCrescimento === 0) {
        spawnGardenItem(); 
        orbitTalk("O jardim está se expandindo... 🌿");
    }

    if (elapsed > 0 && elapsed % 1800 === 0) pausarParaDescanso();
    
    // Exemplo: A cada 45 minutos (2700 segundos) de foco
    if (elapsed === 2700) {
        window.OrbitAI.reagir('alerta_saude');
    }

    // Quando o ciclo terminar totalmente
    if (timeLeft <= 0) {
        window.OrbitAI.reagir('sugerir_jogo');
    }

    atualizarDisplayVisual();
}

function pausarParaDescanso() {
    clearInterval(timer);
    timer = null;
    if (startBtn) startBtn.innerText = "RETOMAR";
    setOrbitState('default');
    orbitTalk("Hora de esticar as costas! Pausa recomendada. ☕");
    getEl('audio-complete')?.play();
}

function finalizarCicloFoco() {
    clearInterval(timer);
    timer = null;
    timeLeft = totalTime;
    atualizarDisplayVisual();
    if (startBtn) startBtn.innerText = "REINICIAR";
    getEl('audio-complete')?.play();
    if (window.adicionarProgresso) window.adicionarProgresso('foco', 100);
    setOrbitState('default');
}

/* ==========================================================================
   4. O JARDIM ORBITAL (SISTEMA DE EMOJIS)
========================================================================== 
*/
function spawnGardenItem() {
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
    if (totalTime > 1500) item.classList.add('premium-item');

    item.innerText = emoji;
    item.style.setProperty('--orbit-duration', `25s`);
    item.style.setProperty('--orbit-distance', `170px`);
    item.style.setProperty('--start-angle', `${gardenItemCount * 45}deg`);
    

    if (window.add3DPlant) add3DPlant(emoji);
    container.appendChild(item);
    gardenItemCount++;
}

/* ==========================================================================
   5. INTERFACE DO ORBIT (LENTES E FALA)
========================================================================== 
*/
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

window.setMode = (mode) => {
    const colors = { dopamina: '#ff2da4', serenidade: '#5ef3ff', autonomia: '#adff2f', goblin: '#ff4d4d' };
    if (colors[mode]) {
        document.documentElement.style.setProperty('--accent-cyan', colors[mode]);
        setOrbitState(mode);
        orbitTalk(`Lente de ${mode} ativada.`);
    }
};

/* ==========================================================================
   6. CONTROLES DO TIMER (START/PAUSE/DURATION) - CORRIGIDO
========================================================================== 
*/

// Mudar o tempo INSTANTANEAMENTE ao selecionar no menu
if (durationSelect) {
    durationSelect.onchange = () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
            startBtn.innerText = "INICIAR";
            setOrbitState('default');
        }
        totalTime = parseInt(durationSelect.value);
        timeLeft = totalTime;
        
        // Limpa o jardim visual ao trocar o tempo
        const container = document.querySelector('.sphere-wrapper');
        if (container) {
            container.querySelectorAll('.garden-item').forEach(el => el.remove());
            gardenItemCount = 0;
        }
        
        atualizarDisplayVisual(); // Isso faz o 60:00 ou 120:00 aparecer na hora
    };
}

if (startBtn) {
    startBtn.onclick = () => {
        if (document.body.classList.contains('onboarding-active')) {
            document.body.classList.remove('onboarding-active');
            getEl('mixer-anchor')?.appendChild(startBtn);
        }

        if (!timer) {
            getEl('audio-start')?.play().catch(() => {});

            // Inicia novo ciclo se o tempo tiver acabado ou for igual ao total
            if (timeLeft <= 0) {
                timeLeft = totalTime;
            }
            
            if (gardenItemCount === 0) spawnGardenItem();

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

/* ==========================================================================
   7. MODO GOBLIN E ÁUDIO
========================================================================== 
*/
const breakBtn = getEl('break-task-btn');
if (breakBtn) {
    breakBtn.onclick = () => {
        const text = taskInput.value.trim();
        if (!text) return orbitTalk("Escreva algo para eu dividir! 👹");
        
        const parts = [`Preparar: ${text}`, `Executar: ${text}`, `Finalizar: ${text}`];
        parts.forEach(t => {
            const div = document.createElement('div');
            div.className = 'subtask-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            const span = document.createElement('span');
            span.textContent = t;
            div.appendChild(checkbox);
            div.appendChild(document.createTextNode(' '));
            div.appendChild(span);
            checkbox.onchange = (e) => {
                if (e.target.checked && window.adicionarProgresso) {
                    window.adicionarProgresso('goblin', 25, t);
                    div.style.opacity = "0.5";
                    setTimeout(() => div.remove(), 800);
                }
            };
            subtasksList.appendChild(div);
        });
        taskInput.value = "";
        window.setMode('goblin');
    };
}

function setupAudio(sliderId, audioId) {
    const s = getEl(sliderId), a = getEl(audioId);
    if (s && a) s.oninput = (e) => { 
        a.volume = e.target.value; 
        if (a.volume > 0) a.play(); else a.pause(); 
    };
}
setupAudio('rain-vol', 'audio-rain');
setupAudio('fire-vol', 'audio-fire');

/* ==========================================================================
   8. AGENDA E LEMBRETES
========================================================================== 
*/
function atualizarCardLembrete(texto) {
    const card = getEl('quick-reminder-card');
    const p = getEl('reminder-text');
    if (!card || !p) return;
    card.style.display = (texto && texto.trim() !== "") ? 'block' : 'none';
    if(texto) p.innerText = texto.substring(0, 100);
}

getEl('agenda-trigger')?.addEventListener('click', () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (getEl('agenda-date')) {
        getEl('agenda-date').value = hoje;
        getEl('agenda-notes').value = localStorage.getItem(`note_${hoje}`) || "";
    }
    getEl('agenda-modal').classList.add('active');
});

getEl('save-agenda')?.addEventListener('click', () => {
    const data = getEl('agenda-date').value;
    const texto = getEl('agenda-notes').value;
    localStorage.setItem(`note_${data}`, texto);
    if (data === new Date().toISOString().split('T')[0]) atualizarCardLembrete(texto);
    orbitTalk("Lembrete guardado! 💾");
    getEl('agenda-modal').classList.remove('active');
});

/* ==========================================================================
   9. ADMIN E FEEDBACK (CORRIGIDO)
========================================================================== 
*/

// FUNÇÃO PARA ABRIR O FEEDBACK
const btnFeedback = document.getElementById('feedback-trigger');
if (btnFeedback) {
    btnFeedback.onclick = (e) => {
        e.preventDefault();
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex'; // Força a exibição
            console.log("Modal de feedback aberta");
        }
    };
}

// FUNÇÃO PARA ENVIAR O FEEDBACK
getEl('send-fb-btn')?.addEventListener('click', async () => {
    const texto = getEl('fb-text').value.trim();
    const statusMsg = getEl('orbit-msg-fb'); // Certifique-se que este ID existe no HTML
    
    if (!texto) {
        orbitTalk("Escreva algo antes de enviar! ✍️");
        return;
    }

    try {
        await addDoc(collection(db, "feedbacks"), {
            nome: getEl('fb-user-name').value || "Anônimo",
            mensagem: texto,
            data: new Date(),
            email: auth.currentUser?.email || "N/A"
        });

        if (statusMsg) statusMsg.innerText = "Recebido! Orbit Admin avisado.";
        orbitTalk("Feedback enviado! Obrigado. ✨");

        setTimeout(() => {
            const modal = getEl('feedback-modal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
            getEl('fb-text').value = ""; // Limpa o campo
        }, 2000);
    } catch (e) { 
        console.error("Erro ao enviar feedback:", e);
        orbitTalk("Houve um erro ao enviar. ❌");
    }
});
/* ==========================================================================
   10. MODAIS E INICIALIZAÇÃO (VERSÃO MOBILE FRIENDLY)
========================================================================== */

const safeClick = (id, callback) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', (e) => {
            // Removemos o preventDefault para testar a resposta pura
            callback(e);
        });
    }
};

// Abrir Login
safeClick('auth-trigger', () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('active');
});

// Reset e Esqueci Senha (Garanta que esses IDs existam no seu HTML)
safeClick('reset-password-btn', () => {
    // Sua lógica de reset do Firebase aqui
    console.log("Reset solicitado");
});

// Fechar todas as modais - Versão corrigida para Mobile
document.querySelectorAll('.close-modal, .modal-vitral').forEach(el => {
    el.addEventListener('click', function(e) {
        // Se clicar na lateral da modal (fundo) ou no botão fechar, ela fecha
        if (e.target === this || this.classList.contains('close-modal')) {
            document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
        }
    });
});

// Abrir Perfil
safeClick('profile-trigger', () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('active');
});

// Fechar modal de perfil especificamente (caso o close-modal geral falhe)
document.querySelector('#profile-modal .close-modal').onclick = () => {
    document.getElementById('profile-modal').classList.remove('active');
};

// Adicione isso ao final do seu script.js
safeClick('game-trigger', () => {
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay) {
        gameOverlay.classList.add('active'); // Usa o padrão de modais do seu script.js
        gameOverlay.style.display = 'flex';  // Garante a compatibilidade com o stellar-flow.js
    }
});

/* ==========================================================================
   11. Lógica do Botão RESET (Pânico) - SEM CONFIRMAÇÃO
========================================================================== 
*/
/* ==========================================================================
   11. Lógica do Botão RESET / PÂNICO (Unificada)
========================================================================== 
*/
const panicBtn = document.getElementById('panic-btn'); // Única declaração necessária

if (panicBtn) {
    // CLIQUE ÚNICO: Reset do Timer e Jardim
    panicBtn.addEventListener('click', () => {
        // 1. Para o cronômetro imediatamente
        clearInterval(timer);
        timer = null;
        
        // 2. Reseta o tempo para o valor selecionado no seletor
        timeLeft = totalTime;
        atualizarDisplayVisual();
        
        // 3. Limpa o jardim visual (remove todos os emojis)
        const container = document.querySelector('.sphere-wrapper');
        if (container) {
            container.querySelectorAll('.garden-item').forEach(el => el.remove());
            gardenItemCount = 0;
        }
        
        // 4. Reseta os textos da interface
        if (startBtn) startBtn.innerText = "INICIAR";
        setOrbitState('default');
        orbitTalk("Resetado! ✨");
        
        console.log("Sistema resetado instantaneamente.");
    });

    // CLIQUE DUPLO: Alívio Sensorial (Modo Pânico Aprimorado)
    panicBtn.addEventListener('dblclick', () => {
        console.log("⚠️ MODO PÂNICO ATIVADO: Limpando estímulos...");
        
        // 1. Silenciar Mixer de Áudio
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // 2. Resetar Sliders de volume visualmente
        const rainVol = document.getElementById('rain-vol');
        const fireVol = document.getElementById('fire-vol');
        if(rainVol) rainVol.value = 0;
        if(fireVol) fireVol.value = 0;

        // 3. Esconder elementos que causam distração
        document.body.style.filter = "grayscale(100%) brightness(70%)";
        const garden = document.getElementById('plants-display');
        if(garden) garden.style.display = 'none';
        document.querySelectorAll('.orbit-path').forEach(o => o.style.display = 'none');
        
        // 4. Feedback do Assistente
        if (window.OrbitAI && typeof window.OrbitAI.falar === 'function') {
            window.OrbitAI.falar("Respire fundo... Tudo em silêncio agora. ✨");
        } else {
            orbitTalk("Respire fundo... Tudo em silêncio. ✨");
        }
    });
}

/* ==========================================================================
   12. Lógica do Botão COLETAR Relíquia
========================================================================== 
*/

// Lógica do Botão COLETAR Relíquia
safeClick('btn-coletar', () => {
    const step1 = document.getElementById('relic-step');
    const step2 = document.getElementById('orbit-congrats-step');
    
    if (step1 && step2) {
        step1.style.display = 'none';
        step2.style.display = 'flex';
        
        // Toca o som de upgrade se existir
        getEl('audio-up')?.play().catch(() => {});
    }
});

// Botão Finalizar Conquista (O "De nada!")
safeClick('btn-finalizar-conquista', () => {
    const modal = document.getElementById('conquista-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        
        // Reset para a próxima vez que abrir
        document.getElementById('relic-step').style.display = 'block';
        document.getElementById('orbit-congrats-step').style.display = 'none';
    }
});

/* ==========================================================================
   13. Gerenciamento Sensorial
========================================================================== */
const sensorySettings = {
    init() {
        this.bindEvents();
        console.log("Sistema Sensorial inicializado.");
    },

    bindEvents() {
        const getById = (id) => document.getElementById(id);
        const sensoryModal = getById('sensory-settings-modal');

        // 1. Animações de Fundo (Three.js)
        getById('toggle-bg-animation')?.addEventListener('change', (e) => {
            const canvas = getById('three-canvas');
            if (canvas) canvas.style.opacity = e.target.checked ? '1' : '0';
        });

        // 2. Jardim Orbitante
        getById('toggle-garden')?.addEventListener('change', (e) => {
            const garden = getById('plants-display');
            const orbits = document.querySelectorAll('.orbit-path');
            const state = e.target.checked ? 'block' : 'none';
            if (garden) garden.style.display = state;
            orbits.forEach(orb => orb.style.display = state);
        });

        // 3. Assistente Orbit (Falas)
        getById('toggle-orbit-speech')?.addEventListener('change', (e) => {
            const speech = getById('orbit-speech');
            if (speech) speech.style.visibility = e.target.checked ? 'visible' : 'hidden';
        });

        // 4. Modo Tons de Cinza
        getById('toggle-grayscale')?.addEventListener('change', (e) => {
            document.body.style.filter = e.target.checked ? "grayscale(100%) contrast(90%)" : "none";
        });

        // 5. Botão Abrir
        getById('sensory-trigger')?.addEventListener('click', () => {
            console.log("Botão clicado: Abrindo modal");
            if (sensoryModal) {
                sensoryModal.classList.add('active');
                sensoryModal.style.display = 'flex';
            }
        });

        // 6. Botões Fechar
        const closeSelectors = '#apply-sensory-btn, #sensory-settings-modal .close-modal';
        document.querySelectorAll(closeSelectors).forEach(btn => {
            btn.addEventListener('click', () => {
                if (sensoryModal) {
                    sensoryModal.classList.remove('active');
                    sensoryModal.style.display = 'none';
                }
            });
        });
    } // Fim bindEvents
}; // Fim sensorySettings

// Inicialização segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => sensorySettings.init());
} else {
    sensorySettings.init();
}

/* ==========================================================================
   14. Orbit Contextual Helper (Explicações por Hover/Tap)
========================================================================== */
const setupOrbitContextHelp = () => {
    const infoElements = document.querySelectorAll('[data-info]');
    let helpTimer;

    infoElements.forEach(el => {
        // DESKTOP: Mouse parado por 1 segundo
        el.addEventListener('mouseenter', () => {
            const text = el.getAttribute('data-info');
            helpTimer = setTimeout(() => {
                if (window.OrbitAI) window.OrbitAI.falar(text);
            }, 1000); 
        });

        el.addEventListener('mouseleave', () => {
            clearTimeout(helpTimer);
        });

        // MOBILE: Toque rápido
        el.addEventListener('touchstart', (e) => {
            const text = el.getAttribute('data-info');
            if (window.OrbitAI) window.OrbitAI.falar(text);
        }, { passive: true });
    });
};

// Inicializa o sistema de ajuda
if (document.readyState === 'complete') {
    setupOrbitContextHelp();
} else {
    window.addEventListener('load', setupOrbitContextHelp);
}