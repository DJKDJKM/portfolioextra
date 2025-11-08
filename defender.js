const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3;
let gameOver = false;
let scrollOffset = 0;

const player = { x: 100, y: 300, vx: 0, vy: 0, speed: 4 };
const bullets = [];
const enemies = [];
const clouds = [];
const particles = [];

let canShoot = true;

// Create clouds for scrolling background
for (let i = 0; i < 20; i++) {
    clouds.push({
        x: Math.random() * canvas.width * 3,
        y: Math.random() * canvas.height,
        size: Math.random() * 40 + 20,
        speed: Math.random() * 0.5 + 0.2
    });
}

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && canShoot && !gameOver) {
        e.preventDefault();
        shootBullet();
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

function shootBullet() {
    bullets.push({
        x: player.x + 30,
        y: player.y,
        vx: 12
    });
    canShoot = false;
    setTimeout(() => canShoot = true, 150);
}

function spawnEnemy() {
    const type = Math.random() < 0.5 ? 'jet' : 'bomber';
    enemies.push({
        x: canvas.width + scrollOffset + 100,
        y: Math.random() * (canvas.height - 100) + 50,
        vx: type === 'jet' ? -4 : -2,
        type,
        hp: type === 'jet' ? 1 : 3
    });
}

function createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40
        });
    }
}

function update() {
    if (gameOver) return;

    // Player movement
    player.vx = 0;
    player.vy = 0;

    if (keys['ArrowLeft']) player.vx = -player.speed;
    if (keys['ArrowRight']) player.vx = player.speed;
    if (keys['ArrowUp']) player.vy = -player.speed;
    if (keys['ArrowDown']) player.vy = player.speed;

    player.x += player.vx;
    player.y += player.vy;

    // Keep player in bounds
    player.x = Math.max(20, Math.min(canvas.width - 40, player.x));
    player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

    // Scrolling effect
    scrollOffset += 1;

    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + scrollOffset < -cloud.size) {
            cloud.x = canvas.width + Math.random() * 200;
        }
    });

    // Spawn enemies
    if (Math.random() < 0.02) spawnEnemy();

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        if (bullets[i].x > canvas.width + scrollOffset + 100) {
            bullets.splice(i, 1);
        }
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].x += enemies[i].vx;

        if (enemies[i].x < -100 + scrollOffset) {
            enemies.splice(i, 1);
            continue;
        }

        // Enemy sine wave movement
        if (enemies[i].type === 'jet') {
            enemies[i].y += Math.sin(Date.now() * 0.005 + i) * 2;
        }

        // Check collision with player
        const dx = enemies[i].x - scrollOffset - player.x;
        const dy = enemies[i].y - player.y;
        if (Math.abs(dx) < 40 && Math.abs(dy) < 25) {
            enemies.splice(i, 1);
            lives--;
            document.getElementById('lives').textContent = lives;
            createParticles(player.x, player.y);

            if (lives <= 0) {
                gameOver = true;
                alert(`Game Over! Final Score: ${score}`);
                location.reload();
            }
        }
    }

    // Bullet-enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = b.x - (e.x - scrollOffset);
            const dy = b.y - e.y;

            if (Math.abs(dx) < 35 && Math.abs(dy) < 20) {
                bullets.splice(i, 1);
                e.hp--;

                if (e.hp <= 0) {
                    enemies.splice(j, 1);
                    score += e.type === 'jet' ? 50 : 150;
                    document.getElementById('score').textContent = score;
                    createParticles(e.x - scrollOffset, e.y);
                }
                break;
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x - scrollOffset, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x - scrollOffset + cloud.size * 0.7, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - scrollOffset + cloud.size * 1.3, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player
    ctx.fillStyle = '#22c55e';
    ctx.save();
    ctx.translate(player.x, player.y);

    // Plane body
    ctx.fillRect(-20, -8, 50, 16);
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(40, -8);
    ctx.lineTo(40, 8);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, -20, 30, 8);
    ctx.fillRect(0, 12, 30, 8);

    ctx.restore();

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y - 2, 10, 4);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        const ex = enemy.x - scrollOffset;

        ctx.save();
        ctx.translate(ex, enemy.y);

        if (enemy.type === 'jet') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-25, -8, 50, 16);
            ctx.fillRect(-10, -18, 20, 8);
            ctx.fillRect(-10, 10, 20, 8);
        } else {
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(-30, -10, 60, 20);
            ctx.fillRect(-15, -25, 30, 12);
            ctx.fillRect(-15, 13, 30, 12);
        }

        ctx.restore();
    });

    // Draw particles
    ctx.fillStyle = '#ff6600';
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 40;
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

gameLoop();
