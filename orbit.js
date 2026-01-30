/* ==========================================================
   ORBIT.JS - Corrigido e Seguro
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
        incentivoGoblin: [
            "Só mais um pouco! Você está a {falta} tarefas de uma nova relíquia 👹",
            "O Rei Goblin está observando... Faltam {falta} para o seu prêmio!",
            "Mantenha o ritmo! {falta} passos para a sua recompensa."
        ],
        saude: [
            "Detecto cansaço mental. Que tal um gole de água? 💧",
            "Você está focado há muito tempo. Estique os braços!",
            "Pausa de segurança: Olhe para longe por 20 segundos. 🧊"
        ],
        // MUDAMOS O NOME PARA EVITAR ERRO DE ACENTUAÇÃO
        gameficacao: [
            "Que tal um desafio rápido para relaxar? Temos jogos no sistema! 🎮",
            "O estresse subiu? O mini-game de alívio está liberado!",
            "Um mestre também precisa de diversão. Confira seus jogos! 🚀"
        ],
        conquista: [
            "Uau! Você desbloqueou um novo marco no sistema!",
            "O XP está subindo! Sua evolução é constante, {nome}."
        ],
        admin: [
            "Sistema operando normalmente.",
            "Aguardando comandos, {nome}."
        ]
    },

    falar(mensagem) {
        if (!mensagem) return;
        const balao = document.getElementById('orbit-bubble') || document.getElementById('orbit-speech');
        if (balao) {
            const textoFinal = mensagem.replace(/{nome}/g, this.sessao.nomeUsuario);
            balao.classList.remove('active');
            setTimeout(() => {
                balao.innerText = textoFinal;
                balao.classList.add('active');
                setTimeout(() => balao.classList.remove('active'), 7000);
            }, 300);
        }
    },

    reagir(evento, dados = {}) {
        if (dados.nome) this.sessao.nomeUsuario = dados.nome;

        if (evento === 'alerta_saude') return this.falar(this.getFrase('saude'));
        
        if (evento === 'progresso_goblin') {
            const faltam = 10 - (dados.contador % 10);
            if (faltam <= 3 && faltam > 0) {
                const frase = this.getFrase('incentivoGoblin').replace("{falta}", faltam);
                return this.falar(frase);
            }
            return; // Não fala nada se não estiver perto de 10
        }

        if (evento === 'sugerir_jogo') return this.falar(this.getFrase('gameficacao'));

        let categoria = 'admin';
        if (evento === 'timer_start') categoria = 'foco';
        if (evento === 'timer_end') {
            this.sessao.focosConcluidos++;
            categoria = 'descanso';
        }
        if (evento === 'conquista_nova') categoria = 'conquista';
        
        this.falar(this.getFrase(categoria));
    },

    // FUNÇÃO REFEITA PARA SER À PROVA DE ERROS
    getFrase(categoria) {
        const lista = this.memoria[categoria];
        
        // Se a categoria não existir ou estiver vazia, retorna uma frase padrão da categoria admin
        if (!lista || lista.length === 0) {
            console.warn(`OrbitAI: Categoria '${categoria}' não encontrada na memória.`);
            return this.memoria.admin[0];
        }
        
        return lista[Math.floor(Math.random() * lista.length)];
    }
};

window.OrbitAI = OrbitAI;