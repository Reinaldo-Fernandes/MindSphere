// stellar-flow.js
(function() {
    let snake, food, obstacles, dx, dy, score, level, gameInterval;
    const gridSize = 20; 
    let gameRunning = false;
    let canvas, ctx, startBtn, scoreDisplay;

    // Variáveis de toque (escopo global do módulo)
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('DOMContentLoaded', () => {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        
        const overlay = document.getElementById('game-overlay');
        const trigger = document.getElementById('game-trigger');
        const closeBtn = document.getElementById('close-game');
        startBtn = document.getElementById('game-tap-to-start');
        scoreDisplay = document.getElementById('scoreDisplay');

        // --- TRAVA DE SCROLL E CONTROLE DE TOQUE ---
      // --- TRAVA DE SCROLL E CONTROLE DE TOQUE CORRIGIDO ---
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true }); // Passive true ajuda na performance

canvas.addEventListener('touchmove', e => {
    if(gameRunning) {
        // Bloqueia o scroll da página enquanto joga
        if (e.cancelable) e.preventDefault(); 
    }
}, { passive: false });

canvas.addEventListener('touchend', e => {
    if (!gameRunning) return;
    
    // IMPORTANTE: No touchend, usamos changedTouches
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;
    
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    // Sensibilidade: Ignora toques muito curtos
    if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Movimento Horizontal
        if (diffX > 0 && dx === 0) { dx = gridSize; dy = 0; }
        else if (diffX < 0 && dx === 0) { dx = -gridSize; dy = 0; }
    } else {
        // Movimento Vertical
        if (diffY > 0 && dy === 0) { dx = 0; dy = gridSize; }
        else if (diffY < 0 && dy === 0) { dx = 0; dy = -gridSize; }
    }
}, { passive: false });

        // --- CONTROLE DE TECLADO ---
        document.addEventListener('keydown', e => {
            if (!gameRunning) return;
            const keys = {
                ArrowUp: () => dy === 0 && (dx = 0, dy = -gridSize),
                ArrowDown: () => dy === 0 && (dx = 0, dy = gridSize),
                ArrowLeft: () => dx === 0 && (dx = -gridSize, dy = 0),
                ArrowRight: () => dx === 0 && (dx = gridSize, dy = 0)
            };
            if (keys[e.key]) keys[e.key]();
        });

      
        const initTrigger = () => {
            const trigger = document.getElementById('game-trigger');
            const overlay = document.getElementById('game-overlay');
            const startBtn = document.getElementById('game-tap-to-start');

            if (trigger && overlay) {
                trigger.onclick = (e) => {
                    e.preventDefault();
                    overlay.classList.add('active'); // Usa a classe que trava o scroll no CSS
                    overlay.style.display = 'flex';
                    gameRunning = false;
                    if (startBtn) {
                        startBtn.style.display = 'flex';
                        startBtn.innerHTML = `<span>INICIAR FLUXO</span>`;
                    }
                };
            }
        };

// Chame a função imediatamente e também no DOMContentLoaded
initTrigger();
document.addEventListener('DOMContentLoaded', initTrigger);

        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            gameRunning = false;
            clearInterval(gameInterval);
        });

        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';
            resetGame();
        });
    });

    // --- LÓGICA DO JOGO ---
    function resetGame() {
        snake = [{x: gridSize * 5, y: gridSize * 5}, {x: gridSize * 4, y: gridSize * 5}];
        dx = gridSize; dy = 0; score = 0; level = 1; obstacles = [];
        gameRunning = true;
        updateScore();
        generateFood();
        startLevel();
    }

    function startLevel() {
        obstacles = [];
        for (let i = 0; i < level * 2; i++) generateObstacle();
        clearInterval(gameInterval);
        const speed = Math.max(180 - (level * 5), 70);
        gameInterval = setInterval(draw, speed);
    }

    function generateObstacle() {
        let obsX, obsY, valid = false;
        while (!valid) {
            obsX = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
            obsY = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
            const conflict = snake.some(p => p.x === obsX && p.y === obsY) || 
                             (food && food.x === obsX && food.y === obsY) ||
                             obstacles.some(o => o.x === obsX && o.y === obsY);
            if (!conflict) valid = true;
        }
        obstacles.push({x: obsX, y: obsY});
    }

    function generateFood() {
        let valid = false;
        while (!valid) {
            food = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
            };
            const conflict = snake.some(p => p.x === food.x && p.y === food.y) || 
                             obstacles.some(o => o.x === food.x && o.y === food.y);
            if (!conflict) valid = true;
        }
    }

    function updateScore() {
        if (scoreDisplay) scoreDisplay.textContent = `NÍVEL ${level} • SCORE ${score}`;
    }

    function draw() {
        ctx.fillStyle = "rgba(2, 6, 23, 0.3)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar Comida
        ctx.shadowBlur = 15; ctx.shadowColor = "#fbbf24"; ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(food.x + 10, food.y + 10, 6, 0, Math.PI * 2); ctx.fill();

        // Desenhar Barreiras
        ctx.shadowBlur = 10; ctx.shadowColor = "#ff0055"; ctx.fillStyle = "rgba(255, 0, 85, 0.8)";
        obstacles.forEach(obs => {
            ctx.beginPath(); ctx.roundRect(obs.x + 2, obs.y + 2, gridSize - 4, gridSize - 4, 4); ctx.fill();
        });

        // Movimento
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        if (head.x < 0) head.x = canvas.width - gridSize;
        else if (head.x >= canvas.width) head.x = 0;
        if (head.y < 0) head.y = canvas.height - gridSize;
        else if (head.y >= canvas.height) head.y = 0;

        if (snake.some(p => p.x === head.x && p.y === head.y) || obstacles.some(o => o.x === head.x && o.y === head.y)) {
            gameOver(); return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score += 10; updateScore(); generateFood();
            if (score % 100 === 0) { level++; startLevel(); }
        } else snake.pop();

        // Desenhar Cobra
        snake.forEach((part, i) => {
            const isHead = i === 0;
            ctx.shadowBlur = isHead ? 20 : 10; ctx.shadowColor = "#00f2ff";
            const gradient = ctx.createRadialGradient(part.x+10, part.y+10, 2, part.x+10, part.y+10, 10);
            gradient.addColorStop(0, "#fff"); gradient.addColorStop(0.2, "#00f2ff"); gradient.addColorStop(1, "rgba(0, 71, 255, 0.3)");
            ctx.fillStyle = gradient;
            ctx.beginPath(); ctx.arc(part.x + 10, part.y + 10, isHead ? 9 : Math.max(8 - (i * 0.2), 4), 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    function gameOver() {
        gameRunning = false; clearInterval(gameInterval);
        startBtn.style.display = 'flex';
        startBtn.innerHTML = `<div style="line-height:1.5">SOBRECARGA!<br>SCORE: ${score}<br><small>TOQUE PARA REINICIAR</small></div>`;
    }
})();