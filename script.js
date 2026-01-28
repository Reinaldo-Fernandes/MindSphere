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

/* ==========================================================================
   1. ESTADOS GLOBAIS E SELETORES
========================================================================== 
*/
let timer = null;
let totalTime = 1500; 
let timeLeft = totalTime; 
let gardenItemCount = 0;
const circumference = 212 * 2 * Math.PI;

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
        if (getEl('feedback-wall')) carregarDadosAdmin();
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
            div.innerHTML = `<input type="checkbox"> <span>${t}</span>`;
            div.querySelector('input').onchange = (e) => {
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
   9. ADMIN E FEEDBACK
========================================================================== 
*/
getEl('send-fb-btn')?.addEventListener('click', async () => {
    const texto = getEl('fb-text').value.trim();
    if (!texto) return;
    try {
        await addDoc(collection(db, "feedbacks"), {
            nome: getEl('fb-user-name').value || "Anônimo",
            mensagem: texto,
            data: new Date(),
            email: auth.currentUser?.email || "N/A"
        });
        getEl('orbit-msg-fb').innerText = "Recebido! Orbit Admin avisado.";
        setTimeout(() => getEl('feedback-modal').style.display = 'none', 2000);
    } catch (e) { console.error(e); }
});

async function carregarDadosAdmin() {
    const wall = getEl('feedback-wall');
    if (!wall) return;
    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    onSnapshot(q, (snapshot) => {
        wall.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            wall.innerHTML += `<div class="feedback-item"><b>${data.email}:</b> ${data.mensagem}</div>`;
        });
    });
}

/* ==========================================================================
   10. MODAIS E INICIALIZAÇÃO
========================================================================== 
*/
getEl('auth-trigger').onclick = () => getEl('auth-modal').classList.add('active');
getEl('game-trigger')?.addEventListener('click', () => getEl('game-modal').classList.add('active'));

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.modal-vitral').forEach(m => m.classList.remove('active'));
        if (getEl('feedback-modal')) getEl('feedback-modal').style.display = 'none';
    };
});

window.addEventListener('load', () => {
    const hoje = new Date().toISOString().split('T')[0];
    atualizarCardLembrete(localStorage.getItem(`note_${hoje}`));
    atualizarDisplayVisual(); // Garante que o timer comece com 25:00 visualmente
});