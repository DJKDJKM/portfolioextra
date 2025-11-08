const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3, level = 1;
let gameRunning = true;
let bestScore = localStorage.getItem('breakoutBest') || 0;

const paddle = { x: canvas.width / 2 - 60, y: canvas.height - 30, width: 120, height: 15, speed: 8, defaultWidth: 120 };
const ball = { x: canvas.width / 2, y: canvas.height - 50, radius: 8, dx: 4, dy: -4 };
let bricks = [];
let powerups = [];
let multiBall = false;
let extraBalls = [];
let stickyPaddle = false;
let ballStuck = false;

const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 55;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 10;

const BRICK_COLORS = ['#e74c3c', '#e67e22', '#f39c12', '#2ecc71', '#3498db'];

function initBricks() {
    bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            bricks.push({
                x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: BRICK_COLORS[row],
                visible: true,
                hasPowerup: Math.random() < 0.15 // 15% chance
            });
        }
    }
}

function spawnPowerup(x, y) {
    const types = ['expand', 'shrink', 'multiball', 'sticky', 'slow', 'extralife'];
    powerups.push({
        x: x,
        y: y,
        width: 30,
        height: 15,
        dy: 2,
        type: types[Math.floor(Math.random() * types.length)]
    });
}

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.code === 'Space' && ballStuck) {
        ballStuck = false;
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.width / 2;
});
canvas.addEventListener('click', () => {
    if (ballStuck) ballStuck = false;
});

function update() {
    if (!gameRunning) return;

    if (keys['ArrowLeft'] && paddle.x > 0) paddle.x -= paddle.speed;
    if (keys['ArrowRight'] && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;

    // Update powerups
    powerups = powerups.filter(p => {
        p.y += p.dy;

        // Check collision with paddle
        if (p.y + p.height > paddle.y &&
            p.x + p.width > paddle.x &&
            p.x < paddle.x + paddle.width) {

            // Apply powerup
            if (p.type === 'expand') {
                paddle.width = Math.min(paddle.width + 40, 200);
            } else if (p.type === 'shrink') {
                paddle.width = Math.max(paddle.width - 30, 60);
            } else if (p.type === 'multiball') {
                for (let i = 0; i < 2; i++) {
                    extraBalls.push({
                        x: ball.x,
                        y: ball.y,
                        radius: ball.radius,
                        dx: (Math.random() - 0.5) * 8,
                        dy: -4
                    });
                }
            } else if (p.type === 'sticky') {
                stickyPaddle = true;
                setTimeout(() => stickyPaddle = false, 10000);
            } else if (p.type === 'slow') {
                ball.dx *= 0.7;
                ball.dy *= 0.7;
            } else if (p.type === 'extralife') {
                lives++;
                document.getElementById('lives').textContent = lives;
            }

            return false; // Remove powerup
        }

        return p.y < canvas.height;
    });

    // Update ball
    if (!ballStuck) {
        ball.x += ball.dx;
        ball.y += ball.dy;
    } else {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius;
    }

    // Update extra balls
    extraBalls.forEach((b, index) => {
        b.x += b.dx;
        b.y += b.dy;

        if (b.x + b.radius > canvas.width || b.x - b.radius < 0) b.dx = -b.dx;
        if (b.y - b.radius < 0) b.dy = -b.dy;

        // Remove if falls off screen
        if (b.y + b.radius > canvas.height) {
            extraBalls.splice(index, 1);
        }
    });

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx = -ball.dx;
    if (ball.y - ball.radius < 0) ball.dy = -ball.dy;

    if (ball.y + ball.radius > canvas.height) {
        lives--;
        document.getElementById('lives').textContent = lives;
        if (lives <= 0) endGame();
        else {
            ball.x = canvas.width / 2;
            ball.y = canvas.height - 50;
            ball.dy = -Math.abs(ball.dy);
        }
    }

    // Paddle collision for main ball
    if (ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        if (stickyPaddle) {
            ballStuck = true;
        } else {
            ball.dy = -Math.abs(ball.dy);
            const hitPos = (ball.x - paddle.x) / paddle.width;
            ball.dx = (hitPos - 0.5) * 10;
        }
    }

    // Paddle collision for extra balls
    extraBalls.forEach(b => {
        if (b.y + b.radius > paddle.y && b.x > paddle.x && b.x < paddle.x + paddle.width) {
            b.dy = -Math.abs(b.dy);
            const hitPos = (b.x - paddle.x) / paddle.width;
            b.dx = (hitPos - 0.5) * 10;
        }
    });

    // Brick collision for main ball
    bricks.forEach(brick => {
        if (!brick.visible) return;
        if (ball.x > brick.x && ball.x < brick.x + brick.width &&
            ball.y > brick.y && ball.y < brick.y + brick.height) {
            ball.dy = -ball.dy;
            brick.visible = false;
            score += 10 * level;
            document.getElementById('score').textContent = score;
            if (brick.hasPowerup) {
                spawnPowerup(brick.x + brick.width / 2, brick.y);
            }
        }
    });

    // Brick collision for extra balls
    extraBalls.forEach(b => {
        bricks.forEach(brick => {
            if (!brick.visible) return;
            if (b.x > brick.x && b.x < brick.x + brick.width &&
                b.y > brick.y && b.y < brick.y + brick.height) {
                b.dy = -b.dy;
                brick.visible = false;
                score += 10 * level;
                document.getElementById('score').textContent = score;
                if (brick.hasPowerup) {
                    spawnPowerup(brick.x + brick.width / 2, brick.y);
                }
            }
        });
    });

    if (bricks.every(b => !b.visible)) {
        level++;
        document.getElementById('level').textContent = level;
        initBricks();
        ball.dx *= 1.1;
        ball.dy *= 1.1;
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddle
    ctx.fillStyle = stickyPaddle ? '#9b59b6' : '#3498db';
    ctx.shadowBlur = 15;
    ctx.shadowColor = stickyPaddle ? '#9b59b6' : '#3498db';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;

    // Draw main ball
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw extra balls
    ctx.fillStyle = '#ffd700';
    extraBalls.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw bricks
    bricks.forEach(brick => {
        if (brick.visible) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

            // Powerup indicator
            if (brick.hasPowerup) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
        }
    });

    // Draw powerups
    powerups.forEach(p => {
        let color, text;
        if (p.type === 'expand') { color = '#2ecc71'; text = 'EXPAND'; }
        else if (p.type === 'shrink') { color = '#e74c3c'; text = 'SHRINK'; }
        else if (p.type === 'multiball') { color = '#ffd700'; text = 'x3'; }
        else if (p.type === 'sticky') { color = '#9b59b6'; text = 'STICKY'; }
        else if (p.type === 'slow') { color = '#3498db'; text = 'SLOW'; }
        else if (p.type === 'extralife') { color = '#e91e63'; text = '+1'; }

        ctx.fillStyle = color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, p.x + p.width / 2, p.y + p.height / 2);
    });

    // Draw status
    if (stickyPaddle) {
        ctx.fillStyle = '#9b59b6';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STICKY PADDLE ACTIVE', canvas.width / 2, 20);
    }
    if (ballStuck) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Press SPACE to release', canvas.width / 2, 40);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('breakoutBest', bestScore);
    }
    document.getElementById('bestScore').textContent = bestScore;
    document.getElementById('gameOver').classList.add('show');
}

function restartGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    level = 1;
    ball.dx = 4;
    ball.dy = -4;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    paddle.x = canvas.width / 2 - 60;
    paddle.width = paddle.defaultWidth;
    powerups = [];
    extraBalls = [];
    stickyPaddle = false;
    ballStuck = false;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    initBricks();
    document.getElementById('gameOver').classList.remove('show');
}

initBricks();
gameLoop();
