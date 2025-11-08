const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3, wave = 1;
let gameOver = false;

const player = { x: canvas.width / 2, y: canvas.height - 60, width: 40, height: 40, speed: 5 };
const bullets = [];
const enemies = [];
const enemyBullets = [];
const particles = [];
const stars = [];

let canShoot = true;

// Create starfield
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2
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
        x: player.x,
        y: player.y - 20,
        vy: -10
    });
    canShoot = false;
    setTimeout(() => canShoot = true, 200);
}

function spawnWave() {
    enemies.length = 0;
    const rows = 3 + Math.floor(wave / 3);
    const cols = 8;

    for (let row = 0; row < Math.min(rows, 5); row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: -100 - col * 70,
                y: 80 + row * 60,
                targetX: 80 + col * 60,
                targetY: 80 + row * 60,
                width: 35,
                height: 35,
                type: row < 2 ? 'bee' : 'butterfly',
                diving: false,
                divePhase: 0,
                shootTimer: Math.random() * 200,
                formationReached: false
            });
        }
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color
        });
    }
}

function update() {
    if (gameOver) return;

    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    // Player movement
    if (keys['ArrowLeft'] && player.x > 20) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - 20) player.x += player.speed;

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].vy;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].vy;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Check player collision
        const dx = enemyBullets[i].x - player.x;
        const dy = enemyBullets[i].y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            enemyBullets.splice(i, 1);
            lives--;
            document.getElementById('lives').textContent = lives;
            createParticles(player.x, player.y, '#00ffff');

            if (lives <= 0) {
                gameOver = true;
                alert(`Game Over! Final Score: ${score}`);
                location.reload();
            }
        }
    }

    // Update enemies
    enemies.forEach(enemy => {
        if (!enemy.formationReached) {
            // Move to formation
            const dx = enemy.targetX - enemy.x;
            const dy = enemy.targetY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 2) {
                enemy.x += (dx / dist) * 3;
                enemy.y += (dy / dist) * 3;
            } else {
                enemy.formationReached = true;
            }
        } else {
            // Formation behavior
            if (!enemy.diving && Math.random() < 0.002) {
                enemy.diving = true;
                enemy.divePhase = 0;
            }

            if (enemy.diving) {
                enemy.divePhase += 0.05;
                const angle = enemy.divePhase;
                enemy.x = enemy.targetX + Math.sin(angle) * 100;
                enemy.y += 4;

                if (enemy.y > canvas.height) {
                    enemy.y = -50;
                    enemy.x = enemy.targetX;
                    enemy.diving = false;
                }
            } else {
                // Wobble in formation
                enemy.x = enemy.targetX + Math.sin(Date.now() * 0.001 + enemy.targetX) * 10;
            }

            // Enemy shooting
            enemy.shootTimer++;
            if (enemy.shootTimer > 150 && Math.random() < 0.01) {
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + 20,
                    vy: 5
                });
                enemy.shootTimer = 0;
            }
        }
    });

    // Bullet-enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = b.x - e.x;
            const dy = b.y - e.y;

            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += e.type === 'bee' ? 50 : 100;
                document.getElementById('score').textContent = score;
                createParticles(e.x, e.y, e.type === 'bee' ? '#ffff00' : '#ff00ff');
                break;
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Check wave complete
    if (enemies.length === 0) {
        wave++;
        document.getElementById('wave').textContent = wave;
        setTimeout(spawnWave, 2000);
    }
}

function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
        ctx.fillRect(b.x - 2, b.y, 4, 10);
    });

    // Draw enemy bullets
    ctx.fillStyle = '#ff0000';
    enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        if (enemy.type === 'bee') {
            ctx.fillStyle = '#ffff00';
            // Bee shape
            ctx.beginPath();
            ctx.arc(-8, 0, 8, 0, Math.PI * 2);
            ctx.arc(8, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-12, -5, 24, 10);
        } else {
            ctx.fillStyle = '#ff00ff';
            // Butterfly shape
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(-12, 0);
            ctx.lineTo(0, 12);
            ctx.lineTo(12, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
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

spawnWave();
gameLoop();
