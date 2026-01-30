// stellar-flow.js
(function() {
    let snake, food, obstacles, dx, dy, score, level, gameInterval;
    const gridSize = 20; 
    let gameRunning = false;
    let canvas, ctx, startBtn, scoreDisplay;

    // Variáveis de toque
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

        // Controles de Toque (Mobile)
        canvas.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
            // Impede que a tela balance/role enquanto joga
            if(gameRunning) e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            if (!gameRunning) return;
            e.preventDefault();
            
            let touchEndX = e.changedTouches[0].clientX;
            let touchEndY = e.changedTouches[0].clientY;
            
            let diffX = touchEndX - touchStartX;
            let diffY = touchEndY - touchStartY;

            // Sensibilidade mínima para evitar toques acidentais
            if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) return;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0 && dx === 0) { dx = gridSize; dy = 0; } // Direita
                else if (diffX < 0 && dx === 0) { dx = -gridSize; dy = 0; } // Esquerda
            } else {
                if (diffY > 0 && dy === 0) { dx = 0; dy = gridSize; } // Baixo
                else if (diffY < 0 && dy === 0) { dx = 0; dy = -gridSize; } // Cima
            }
        }, { passive: false });

        // Controles de Teclado (Desktop)
        document.addEventListener('keydown', e => {
            if (!gameRunning) return;
            const goingUp = dy === -gridSize;
            const goingDown = dy === gridSize;
            const goingRight = dx === gridSize;
            const goingLeft = dx === -gridSize;

            if (e.key === 'ArrowUp' && !goingDown) { dx = 0; dy = -gridSize; }
            if (e.key === 'ArrowDown' && !goingUp) { dx = 0; dy = gridSize; }
            if (e.key === 'ArrowLeft' && !goingRight) { dx = -gridSize; dy = 0; }
            if (e.key === 'ArrowRight' && !goingLeft) { dx = gridSize; dy = 0; }
        });

        // Eventos de Interface
        trigger.addEventListener('click', () => {
            overlay.style.display = 'flex';
            gameRunning = false;
            startBtn.style.display = 'flex';
            startBtn.innerHTML = `<span>INICIAR FLUXO</span>`;
        });

        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            gameRunning = false;
            clearInterval(gameInterval);
        });

        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startBtn.style.display = 'none';
            resetGame();
        });
    });

    // --- Lógica do Jogo (Mantida e Estável) ---
    function resetGame() {
        snake = [
            {x: gridSize * 5, y: gridSize * 5},
            {x: gridSize * 4, y: gridSize * 5}
        ];
        dx = gridSize; 
        dy = 0; 
        score = 0;
        level = 1;
        obstacles = [];
        gameRunning = true;
        updateScore();
        generateFood();
        startLevel();
    }

    function startLevel() {
        obstacles = [];
        const numObstacles = level * 2; 
        for (let i = 0; i < numObstacles; i++) { generateObstacle(); }
        clearInterval(gameInterval);
        const speed = Math.max(110 - (level * 5), 50);
        gameInterval = setInterval(draw, speed);
    }

    function generateObstacle() {
        let obsX, obsY, validPos = false;
        while (!validPos) {
            obsX = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
            obsY = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
            const onSnake = snake.some(p => p.x === obsX && p.y === obsY);
            const onFood = food && food.x === obsX && food.y === obsY;
            const onObstacle = obstacles.some(o => o.x === obsX && o.y === obsY);
            if (!onSnake && !onFood && !onObstacle) validPos = true;
        }
        obstacles.push({x: obsX, y: obsY});
    }

    function generateFood() {
        let validPos = false;
        while (!validPos) {
            food = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
            };
            const onSnake = snake.some(p => p.x === food.x && p.y === food.y);
            const onObstacle = obstacles.some(o => o.x === food.x && o.y === food.y);
            if (!onSnake && !onObstacle) validPos = true;
        }
    }

    function updateScore() {
        if (scoreDisplay) scoreDisplay.textContent = `NÍVEL ${level} • SCORE ${score}`;
    }

    function draw() {
        ctx.fillStyle = "rgba(2, 6, 23, 0.3)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar Comida
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#fbbf24";
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(food.x + 10, food.y + 10, 6, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar Barreiras
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0055";
        ctx.fillStyle = "rgba(255, 0, 85, 0.8)";
        obstacles.forEach(obs => {
            ctx.beginPath();
            ctx.roundRect(obs.x + 2, obs.y + 2, gridSize - 4, gridSize - 4, 4);
            ctx.fill();
        });

        // Lógica de Movimento
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        if (head.x < 0) head.x = canvas.width - gridSize;
        else if (head.x >= canvas.width) head.x = 0;
        if (head.y < 0) head.y = canvas.height - gridSize;
        else if (head.y >= canvas.height) head.y = 0;

        const hitSelf = snake.some(p => p.x === head.x && p.y === head.y);
        const hitObstacle = obstacles.some(o => o.x === head.x && o.y === head.y);

        if (hitSelf || hitObstacle) { gameOver(); return; }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            updateScore();
            generateFood();
            if (score > 0 && score % 100 === 0) { level++; startLevel(); }
        } else {
            snake.pop();
        }

        // Desenhar Cobra
        snake.forEach((part, i) => {
            const isHead = i === 0;
            ctx.shadowBlur = isHead ? 20 : 10;
            ctx.shadowColor = "#00f2ff";
            const gradient = ctx.createRadialGradient(part.x+10, part.y+10, 2, part.x+10, part.y+10, 10);
            gradient.addColorStop(0, "#fff"); 
            gradient.addColorStop(0.4, "#00f2ff");
            gradient.addColorStop(1, "rgba(0, 71, 255, 0.3)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            const size = isHead ? 9 : Math.max(8 - (i * 0.2), 4); 
            ctx.arc(part.x + 10, part.y + 10, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    function gameOver() {
        gameRunning = false;
        clearInterval(gameInterval);
        startBtn.style.display = 'flex';
        startBtn.innerHTML = `<div style="font-size: 0.8rem">SISTEMA SOBRECARREGADO<br>SCORE: ${score}<br><br><span style="color:#fff">REINICIAR</span></div>`;
    }
})();