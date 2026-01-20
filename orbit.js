/* ==========================================================
   ORBIT.JS - Motor de Personalidade com Memória
   ========================================================== */

const OrbitAI = {
    sessao: {
        focosConcluidos: 0,
        nomeUsuario: "Viajante"
    },

    memoria: {
        saudacoes: [
            "Pronto para mais um ciclo, {nome}?",
            "Sistema online. Como posso ajudar hoje, {nome}?",
            "Explorando novas fronteiras de produtividade, {nome}?"
        ],
        foco: [
            "Modo de foco ativado. Silenciando distrações...",
            "Excelente escolha. O tempo é seu recurso mais valioso.",
            "Iniciando isolamento mental. Vamos produzir!"
        ],
        descanso: [
            "Ciclo concluído! Hora de esticar as costas, {nome}.",
            "Ótimo trabalho. Uma pausa agora vai renovar sua mente.",
            "Sessão finalizada. Sinta esse progresso!"
        ],
        conquista: [
            "Uau! Você desbloqueou um novo marco no sistema!",
            "O XP está subindo! Sua evolução é constante, {nome}."
        ],
        admin: [
            "Comandante, o sistema está operando em 100%.",
            "Métricas atualizadas. Todos os viajantes estão seguros.",
            "Modo de supervisão ativo. Deseja analisar os feedbacks?"
        ]
    },

    falar(mensagem) {
        const balao = document.getElementById('orbit-bubble');
        if (balao) {
            // Substitui o placeholder {nome} pelo nome real do usuário
            const textoFinal = mensagem.replace("{nome}", this.sessao.nomeUsuario);
            
            balao.classList.remove('active');
            setTimeout(() => {
                balao.innerText = textoFinal;
                balao.classList.add('active');
                setTimeout(() => balao.classList.remove('active'), 6000);
            }, 300);
        }
    },

    reagir(evento, dados = {}) {
        if (dados.nome) this.sessao.nomeUsuario = dados.nome;

        let categoria = 'admin';
        if (evento === 'timer_start') categoria = 'foco';
        if (evento === 'timer_end') {
            this.sessao.focosConcluidos++;
            if (this.sessao.focosConcluidos >= 3) {
                this.falar(`Impressionante, {nome}! Você já completou ${this.sessao.focosConcluidos} ciclos hoje. Ritmo de elite!`);
                return;
            }
            categoria = 'descanso';
        }
        if (evento === 'conquista_nova') categoria = 'conquista';
        if (evento === 'boas_vindas') {
            const frase = this.getFrase('saudacoes');
            this.falar(frase);
            return;
        }
        if (evento === 'login_adm') {
            this.falar("Identidade confirmada. Terminal de comando liberado, Comandante.");
            return;
        }

        this.falar(this.getFrase(categoria));
    },

    getFrase(categoria) {
        const frases = this.memoria[categoria];
        return frases[Math.floor(Math.random() * frases.length)];
    }
};

window.OrbitAI = OrbitAI;