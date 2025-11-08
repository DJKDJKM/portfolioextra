const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const bestElement = document.getElementById('best');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');
const startScreenElement = document.getElementById('startScreen');

const gridSize = 30;
const tileCount = canvas.width / gridSize;

let gameRunning = false;
let score = 0;
let bestScore = localStorage.getItem('snakeBest') || 0;
bestElement.textContent = bestScore;

let snake = [];
let apple = {};
let dx = 0;
let dy = 0;
let gameSpeed = 100;
let lastRenderTime = 0;

function initSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
}

function generateApple() {
    let attempts = 0;
    let validPosition = false;

    while (!validPosition && attempts < 100) {
        apple = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };

        // Check if apple spawned on snake
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === apple.x && segment.y === apple.y) {
                validPosition = false;
                break;
            }
        }
        attempts++;
    }
}

// Controls
let nextDx = 1;
let nextDy = 0;

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch(e.key) {
        case 'ArrowUp':
            if (dy !== 1) {
                nextDx = 0;
                nextDy = -1;
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (dy !== -1) {
                nextDx = 0;
                nextDy = 1;
            }
            e.preventDefault();
            break;
        case 'ArrowLeft':
            if (dx !== 1) {
                nextDx = -1;
                nextDy = 0;
            }
            e.preventDefault();
            break;
        case 'ArrowRight':
            if (dx !== -1) {
                nextDx = 1;
                nextDy = 0;
            }
            e.preventDefault();
            break;
    }
});

function update() {
    if (!gameRunning) return;

    // Update direction
    dx = nextDx;
    dy = nextDy;

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            endGame();
            return;
        }
    }

    snake.unshift(head);

    // Check apple collision
    if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        scoreElement.textContent = score;

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('snakeBest', bestScore);
            bestElement.textContent = bestScore;
        }

        generateApple();

        // Speed up slightly
        if (gameSpeed > 50) {
            gameSpeed -= 1;
        }
    } else {
        snake.pop();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw apple
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
        apple.x * gridSize + gridSize / 2,
        apple.y * gridSize + gridSize / 2,
        gridSize / 2 - 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Apple highlight
    ctx.fillStyle = '#ff8f8f';
    ctx.beginPath();
    ctx.arc(
        apple.x * gridSize + gridSize / 3,
        apple.y * gridSize + gridSize / 3,
        gridSize / 6,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = '#4ecdc4';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#4ecdc4';
        } else {
            // Body
            ctx.fillStyle = '#3dbdb4';
            ctx.shadowBlur = 0;
        }

        ctx.fillRect(
            segment.x * gridSize + 2,
            segment.y * gridSize + 2,
            gridSize - 4,
            gridSize - 4
        );

        // Body gradient
        if (index > 0) {
            const gradient = ctx.createLinearGradient(
                segment.x * gridSize,
                segment.y * gridSize,
                (segment.x + 1) * gridSize,
                (segment.y + 1) * gridSize
            );
            gradient.addColorStop(0, '#4ecdc4');
            gradient.addColorStop(1, '#2ca89e');
            ctx.fillStyle = gradient;
            ctx.fillRect(
                segment.x * gridSize + 2,
                segment.y * gridSize + 2,
                gridSize - 4,
                gridSize - 4
            );
        }

        // Eyes on head
        if (index === 0) {
            ctx.fillStyle = '#000';
            ctx.shadowBlur = 0;

            let eyeX = segment.x * gridSize + gridSize / 2;
            let eyeY = segment.y * gridSize + gridSize / 2;

            if (dx === 1) {
                ctx.fillRect(eyeX + 5, eyeY - 8, 5, 5);
                ctx.fillRect(eyeX + 5, eyeY + 3, 5, 5);
            } else if (dx === -1) {
                ctx.fillRect(eyeX - 10, eyeY - 8, 5, 5);
                ctx.fillRect(eyeX - 10, eyeY + 3, 5, 5);
            } else if (dy === 1) {
                ctx.fillRect(eyeX - 8, eyeY + 5, 5, 5);
                ctx.fillRect(eyeX + 3, eyeY + 5, 5, 5);
            } else if (dy === -1) {
                ctx.fillRect(eyeX - 8, eyeY - 10, 5, 5);
                ctx.fillRect(eyeX + 3, eyeY - 10, 5, 5);
            }
        }
    });

    ctx.shadowBlur = 0;
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const timeSinceLastRender = currentTime - lastRenderTime;

    if (timeSinceLastRender < gameSpeed) {
        draw();
        return;
    }

    lastRenderTime = currentTime;

    update();
    draw();
}

function startGame() {
    startScreenElement.style.display = 'none';
    gameRunning = true;
    score = 0;
    gameSpeed = 100;
    scoreElement.textContent = score;
    initSnake();
    generateApple();
}

function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
    gameOverElement.classList.add('show');
}

function restartGame() {
    gameOverElement.classList.remove('show');
    startGame();
}

requestAnimationFrame(gameLoop);
