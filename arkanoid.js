const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3, level = 1;
let gameOver = false;

const paddle = { x: canvas.width / 2 - 60, y: canvas.height - 30, width: 120, height: 15, speed: 8 };
const balls = [{ x: canvas.width / 2, y: canvas.height - 50, vx: 5, vy: -5, radius: 8, stuck: true }];
const bricks = [];
const powerups = [];
const particles = [];

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
});

canvas.addEventListener('click', () => {
    balls.forEach(ball => {
        if (ball.stuck) {
            ball.stuck = false;
            ball.vy = -5;
            ball.vx = (Math.random() - 0.5) * 8;
        }
    });
});

function createBricks() {
    bricks.length = 0;
    const rows = 5 + level;
    const cols = 10;
    const brickWidth = 55;
    const brickHeight = 20;
    const padding = 5;

    for (let row = 0; row < Math.min(rows, 10); row++) {
        for (let col = 0; col < cols; col++) {
            const hp = Math.min(row + 1, 3);
            bricks.push({
                x: col * (brickWidth + padding) + 5,
                y: row * (brickHeight + padding) + 50,
                width: brickWidth,
                height: brickHeight,
                hp,
                maxHp: hp,
                powerup: Math.random() < 0.15 ? ['expand', 'multi', 'slow', 'laser'][Math.floor(Math.random() * 4)] : null
            });
        }
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color
        });
    }
}

function dropPowerup(x, y, type) {
    powerups.push({
        x, y,
        type,
        vy: 3,
        width: 30,
        height: 15
    });
}

function activatePowerup(type) {
    switch(type) {
        case 'expand':
            paddle.width = 180;
            setTimeout(() => paddle.width = 120, 10000);
            break;
        case 'multi':
            const ball = balls[0];
            for (let i = 0; i < 2; i++) {
                balls.push({
                    x: ball.x,
                    y: ball.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -5,
                    radius: 8,
                    stuck: false
                });
            }
            break;
        case 'slow':
            balls.forEach(b => {
                b.vx *= 0.7;
                b.vy *= 0.7;
            });
            break;
    }
}

function update() {
    if (gameOver) return;

    // Update balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        if (ball.stuck) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius - 5;
            continue;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collision
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.vx = -ball.vx;
            ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
        }

        if (ball.y - ball.radius < 0) {
            ball.vy = -ball.vy;
            ball.y = ball.radius;
        }

        // Paddle collision
        if (ball.y + ball.radius > paddle.y &&
            ball.y - ball.radius < paddle.y + paddle.height &&
            ball.x > paddle.x &&
            ball.x < paddle.x + paddle.width) {
            ball.vy = -Math.abs(ball.vy);
            ball.vx += (ball.x - (paddle.x + paddle.width / 2)) * 0.1;
            ball.y = paddle.y - ball.radius;
        }

        // Ball falls
        if (ball.y > canvas.height) {
            balls.splice(i, 1);
            if (balls.length === 0) {
                lives--;
                document.getElementById('lives').textContent = lives;

                if (lives <= 0) {
                    gameOver = true;
                    alert(`Game Over! Final Score: ${score}`);
                    location.reload();
                } else {
                    balls.push({ x: canvas.width / 2, y: canvas.height - 50, vx: 5, vy: -5, radius: 8, stuck: true });
                }
            }
        }
    }

    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.vy;

        if (p.y > canvas.height) {
            powerups.splice(i, 1);
            continue;
        }

        // Check paddle collision
        if (p.y + p.height > paddle.y &&
            p.y < paddle.y + paddle.height &&
            p.x + p.width > paddle.x &&
            p.x < paddle.x + paddle.width) {
            activatePowerup(p.type);
            powerups.splice(i, 1);
            score += 50;
            document.getElementById('score').textContent = score;
        }
    }

    // Ball-brick collision
    balls.forEach(ball => {
        for (let i = bricks.length - 1; i >= 0; i--) {
            const brick = bricks[i];

            if (ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height) {

                // Determine collision side
                const overlapLeft = ball.x + ball.radius - brick.x;
                const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
                const overlapTop = ball.y + ball.radius - brick.y;
                const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    ball.vx = -ball.vx;
                } else {
                    ball.vy = -ball.vy;
                }

                brick.hp--;
                score += 10;
                document.getElementById('score').textContent = score;

                const colors = ['#ff0000', '#ff6600', '#ffff00', '#00ff00'];
                createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, colors[brick.hp]);

                if (brick.hp <= 0) {
                    if (brick.powerup) {
                        dropPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.powerup);
                    }
                    bricks.splice(i, 1);
                    score += 50;
                    document.getElementById('score').textContent = score;
                }
                break;
            }
        }
    });

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Level complete
    if (bricks.length === 0) {
        level++;
        document.getElementById('level').textContent = level;
        balls.length = 0;
        balls.push({ x: canvas.width / 2, y: canvas.height - 50, vx: 5, vy: -5, radius: 8, stuck: true });
        createBricks();
    }
}

function draw() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddle
    const paddleGradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
    paddleGradient.addColorStop(0, '#8b5cf6');
    paddleGradient.addColorStop(0.5, '#a78bfa');
    paddleGradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw balls
    balls.forEach(ball => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw bricks
    bricks.forEach(brick => {
        const hpRatio = brick.hp / brick.maxHp;
        const colors = ['#22c55e', '#fbbf24', '#f97316', '#ef4444'];
        ctx.fillStyle = colors[Math.min(brick.maxHp - 1, 3)];
        ctx.globalAlpha = 0.3 + hpRatio * 0.7;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Draw powerup indicator
        if (brick.powerup) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '14px Arial';
            ctx.fillText('?', brick.x + brick.width / 2 - 5, brick.y + brick.height / 2 + 5);
        }
    });

    // Draw powerups
    powerups.forEach(p => {
        const colors = { expand: '#00ff00', multi: '#ff00ff', slow: '#00ffff', laser: '#ff0000' };
        ctx.fillStyle = colors[p.type];
        ctx.fillRect(p.x, p.y, p.width, p.height);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.type[0].toUpperCase(), p.x + p.width / 2, p.y + p.height / 2 + 4);
    });

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

createBricks();
gameLoop();
