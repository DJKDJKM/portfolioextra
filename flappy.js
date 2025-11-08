const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');
const medalElement = document.getElementById('medal');
const startScreenElement = document.getElementById('startScreen');

let gameRunning = false;
let score = 0;
let bestScore = localStorage.getItem('flappyBest') || 0;

// Bird
const bird = {
    x: 100,
    y: canvas.height / 2,
    radius: 20,
    velocity: 0,
    gravity: 0.5,
    jump: -9
};

// Pipes
let pipes = [];
const pipeWidth = 80;
const pipeGap = 180;
const pipeSpeed = 3;
let frameCount = 0;

// Controls
function flap() {
    if (gameRunning) {
        bird.velocity = bird.jump;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning && startScreenElement.style.display === 'none' && !gameOverElement.classList.contains('show')) {
            return;
        }
        flap();
    }
});

canvas.addEventListener('click', flap);

function createPipe() {
    const minHeight = 100;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        scored: false
    });
}

function update() {
    if (!gameRunning) return;

    frameCount++;

    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Check ground collision
    if (bird.y + bird.radius > canvas.height - 20) {
        endGame();
        return;
    }

    // Check ceiling collision
    if (bird.y - bird.radius < 0) {
        bird.y = bird.radius;
        bird.velocity = 0;
    }

    // Create pipes
    if (frameCount % 90 === 0) {
        createPipe();
    }

    // Update pipes
    pipes = pipes.filter(pipe => {
        pipe.x -= pipeSpeed;

        // Check collision
        if (bird.x + bird.radius > pipe.x &&
            bird.x - bird.radius < pipe.x + pipeWidth) {
            if (bird.y - bird.radius < pipe.topHeight ||
                bird.y + bird.radius > pipe.bottomY) {
                endGame();
                return false;
            }
        }

        // Score
        if (!pipe.scored && bird.x > pipe.x + pipeWidth) {
            pipe.scored = true;
            score++;
            scoreElement.textContent = score;
        }

        return pipe.x > -pipeWidth;
    });
}

function draw() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4a148c');
    gradient.addColorStop(1, '#6a1b9a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + frameCount * 0.5) % canvas.width;
        const y = (i * 211) % canvas.height;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }

    // Draw pipes
    pipes.forEach(pipe => {
        // Pipe gradient
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        pipeGradient.addColorStop(0, '#00e676');
        pipeGradient.addColorStop(1, '#00c853');

        // Top pipe
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);

        // Top pipe cap
        ctx.fillStyle = '#00e676';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipeWidth + 10, 30);

        // Bottom pipe
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);

        // Bottom pipe cap
        ctx.fillStyle = '#00e676';
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 30);

        // Pipe highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(pipe.x + 5, 0, 10, pipe.topHeight);
        ctx.fillRect(pipe.x + 5, pipe.bottomY, 10, canvas.height - pipe.bottomY);
    });

    // Ground
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Ground pattern
    ctx.fillStyle = '#6d4c41';
    for (let i = 0; i < canvas.width / 30; i++) {
        ctx.fillRect(i * 30 - (frameCount * pipeSpeed % 30), canvas.height - 20, 28, 20);
    }

    // Draw bird
    ctx.save();
    ctx.translate(bird.x, bird.y);

    // Rotate bird based on velocity
    const rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);
    ctx.rotate(rotation);

    // Bird body
    ctx.fillStyle = '#e91e63';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#e91e63';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bird highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-7, -7, 8, 0, Math.PI * 2);
    ctx.fill();

    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Bird eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(10, -7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.moveTo(bird.radius - 5, 0);
    ctx.lineTo(bird.radius + 10, -3);
    ctx.lineTo(bird.radius + 10, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    startScreenElement.style.display = 'none';
    gameRunning = true;
    score = 0;
    frameCount = 0;
    pipes = [];
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    scoreElement.textContent = score;
}

function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;

    // Determine medal
    let medal = '';
    if (score >= 40) medal = '🥇';
    else if (score >= 30) medal = '🥈';
    else if (score >= 20) medal = '🥉';
    else if (score >= 10) medal = '🏅';

    medalElement.textContent = medal;

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBest', bestScore);
    }
    bestScoreElement.textContent = bestScore;

    gameOverElement.classList.add('show');
}

function restartGame() {
    gameOverElement.classList.remove('show');
    startGame();
}

bestScoreElement.textContent = bestScore;
gameLoop();
