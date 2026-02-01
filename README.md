
---
markdown
# 🧠 MindSphere — Ecossistema de Foco para Neurodivergentes

> **"A produtividade não é uma linha reta. Cada cérebro tem seu ritmo, suas pausas e suas cores."**

O **MindSphere** é um ambiente de foco projetado especificamente para as necessidades de pessoas neurodivergentes (TDAH, Autismo, TOD e TOC). Ao contrário de ferramentas rígidas, ele utiliza **design adaptativo**, **sonoridade imersiva** e **gamificação sensorial** para transformar a gestão do tempo em uma experiência de baixo estresse.

![MindSphere Preview](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blueviolet?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🚀 Diferenciais de UX & Engenharia

O projeto utiliza técnicas avançadas de interface para garantir acessibilidade cognitiva:

* **Onboarding Imersivo:** O assistente *Orbit* guia o usuário através de uma transição suave, reduzindo a ansiedade da "tela em branco".
* **Interface Vitral (Glassmorphism):** Estética moderna com `backdrop-filter`, focando na redução da poluição visual para evitar sobrecarga sensorial.
* **Arquitetura de Transições:** O cronômetro central possui lógica de realocação dinâmica (DOM relocation), movendo-se para o mixer inferior ao iniciar a sessão para liberar espaço visual.
* **Body Doubling Virtual:** O Orbit atua como uma presença de suporte, oferecendo feedback via balões de fala cronometrados.

---

## 🛸 Funcionalidades de Destaque

| Recurso | Função | Impacto Neurodivergente |
| :--- | :--- | :--- |
| **Goblin Mode 👹** | Split de tarefas complexas | Combate a paralisia de decisão e o "overwhelm". |
| **Lentes Neurológicas** | Cromoterapia dinâmica | Ajusta o ambiente visual (Dopamina, Serenidade, Autonomia). |
| **Jardim Orbitante** | Gamificação passiva | Transforma tempo em recompensas visuais (plantas e astros). |
| **Mixer Sensorial** | Camadas de áudio ASMR | Bloqueio de distrações externas com controle individual. |
| **Stellar Flow** | Mini-game de pausa | Proporciona "dopamina limpa" durante intervalos. |

---

## 🛠️ Stack Tecnológica

* **Frontend:** HTML5 Semântico, CSS3 (Variáveis, Flexbox, Grid e Keyframe Animations).
* **Lógica:** Vanilla JavaScript (ES6+) com manipulação intensa de DOM e Web Audio API.
* **Backend & Persistência:**
    * **Firebase Auth:** Gestão de acesso e perfis.
    * **Cloud Firestore:** Sincronização de XP, conquistas e "Histórico Goblin".
    * **LocalStorage:** Cache local para persistência de estado imediato.
* **Gráficos:** Canvas API e integração com Three.js (Background dinâmico).

---

## ⚙️ Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/mindsphere.git](https://github.com/seu-usuario/mindsphere.git)

```

2. Como o projeto utiliza Firebase (Módulos JS), é necessário rodar através de um servidor local:
* Se usar VS Code, instale a extensão **Live Server**.
* Clique em `Go Live` no arquivo `index.html`.


3. Certifique-se de configurar suas chaves do Firebase em `firebase.js`.

---

## 📱 Mobile First

O layout foi desenhado para ser totalmente responsivo (`mobile.css`), priorizando o alcance do polegar nos controles principais e garantindo que o **Mixer** permaneça acessível como uma "barra de ferramentas" na base da tela.

---

## 📝 Licença & Créditos

Desenvolvido por **[Seu Nome]**.
Este projeto é uma iniciativa para suporte à comunidade neurodivergente. Sinta-se à vontade para contribuir!

---

### O que eu mudei e por que?

1.  **Badges de Tecnologia:** Adicionei escudos visuais no topo. Recrutadores batem o olho nisso para saber se você domina a stack.
2.  **Tabela de Impacto:** Em vez de apenas listar funções, eu expliquei o *porquê* delas existirem (ex: "Combate a paralisia de decisão"). Isso mostra que você pensou no usuário.
3.  **Seção de Execução:** Essencial. Sem explicar como rodar o `Live Server` ou configurar o `firebase.js`, outros desenvolvedores podem ter dificuldade em testar seu trabalho.
4.  **Hierarquia de Tópicos:** Usei blocos de código e negrito para guiar a leitura de quem está com pressa.

**Gostaria que eu gerasse uma seção de "Próximos Passos (Roadmap)" para mostrar o que você ainda planeja implementar no MindSphere?**

```