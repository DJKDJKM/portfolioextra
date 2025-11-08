const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3, level = 1;
let gameOver = false;

const player = { x: 400, y: 500, width: 40, height: 40, angle: -Math.PI/2, speed: 3, canShoot: true };
const bullets = [];
const enemyTanks = [];
const enemyBullets = [];
const obstacles = [];
const explosions = [];

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && player.canShoot && !gameOver) {
        e.preventDefault();
        shootBullet();
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

function shootBullet() {
    bullets.push({
        x: player.x + Math.cos(player.angle) * 25,
        y: player.y + Math.sin(player.angle) * 25,
        vx: Math.cos(player.angle) * 8,
        vy: Math.sin(player.angle) * 8
    });
    player.canShoot = false;
    setTimeout(() => player.canShoot = true, 300);
}

function createObstacles() {
    obstacles.length = 0;
    const positions = [
        [200, 150], [600, 150], [400, 300],
        [150, 400], [650, 400], [300, 200], [500, 200]
    ];
    positions.forEach(([x, y]) => {
        obstacles.push({ x, y, width: 60, height: 60, hp: 3 });
    });
}

function spawnEnemyTank() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { x = Math.random() * canvas.width; y = 0; }
    else if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height; }
    else { x = 0; y = Math.random() * canvas.height; }

    enemyTanks.push({
        x, y,
        width: 35,
        height: 35,
        angle: 0,
        hp: 2,
        shootTimer: 0
    });
}

function createExplosion(x, y) {
    explosions.push({ x, y, radius: 5, maxRadius: 40, life: 30 });
}

function initLevel() {
    enemyTanks.length = 0;
    createObstacles();
    const tankCount = 3 + level;
    for (let i = 0; i < tankCount; i++) {
        setTimeout(() => spawnEnemyTank(), i * 2000);
    }
}

function update() {
    if (gameOver) return;

    // Player movement
    const oldX = player.x;
    const oldY = player.y;

    if (keys['w']) {
        player.y -= player.speed;
    }
    if (keys['s']) {
        player.y += player.speed;
    }
    if (keys['a']) {
        player.x -= player.speed;
    }
    if (keys['d']) {
        player.x += player.speed;
    }

    // Player rotation (face mouse would be ideal, but let's use movement direction)
    if (keys['w']) player.angle = -Math.PI/2;
    if (keys['s']) player.angle = Math.PI/2;
    if (keys['a']) player.angle = Math.PI;
    if (keys['d']) player.angle = 0;

    // Keep player in bounds
    player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

    // Check player collision with obstacles
    obstacles.forEach(obs => {
        if (player.x + 20 > obs.x && player.x - 20 < obs.x + obs.width &&
            player.y + 20 > obs.y && player.y - 20 < obs.y + obs.height) {
            player.x = oldX;
            player.y = oldY;
        }
    });

    // Update player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        // Check obstacle collision
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obs = obstacles[j];
            if (b.x > obs.x && b.x < obs.x + obs.width &&
                b.y > obs.y && b.y < obs.y + obs.height) {
                bullets.splice(i, 1);
                obs.hp--;
                if (obs.hp <= 0) obstacles.splice(j, 1);
                break;
            }
        }
    }

    // Update enemy tanks
    enemyTanks.forEach(enemy => {
        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 200) {
            enemy.x += (dx / dist) * 1.5;
            enemy.y += (dy / dist) * 1.5;
        }

        enemy.angle = Math.atan2(dy, dx);

        // Enemy shooting
        enemy.shootTimer++;
        if (enemy.shootTimer > 120 && dist < 400) {
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(enemy.angle) * 5,
                vy: Math.sin(enemy.angle) * 5
            });
            enemy.shootTimer = 0;
        }
    });

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Check player collision
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            enemyBullets.splice(i, 1);
            lives--;
            document.getElementById('lives').textContent = lives;
            createExplosion(player.x, player.y);

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
        for (let j = enemyTanks.length - 1; j >= 0; j--) {
            const enemy = enemyTanks[j];
            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;

            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                bullets.splice(i, 1);
                enemy.hp--;

                if (enemy.hp <= 0) {
                    enemyTanks.splice(j, 1);
                    createExplosion(enemy.x, enemy.y);
                    score += 100;
                    document.getElementById('score').textContent = score;
                }
                break;
            }
        }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.radius += 2;
        exp.life--;
        if (exp.life <= 0) explosions.splice(i, 1);
    }

    // Check level completion
    if (enemyTanks.length === 0 && bullets.length === 0) {
        level++;
        document.getElementById('level').textContent = level;
        setTimeout(initLevel, 1000);
    }
}

function draw() {
    // Background
    ctx.fillStyle = '#3d5c3d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#4a6b4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Draw obstacles
    ctx.fillStyle = '#8b4513';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Draw player tank
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Tank body
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(-20, -15, 40, 30);

    // Tank turret
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(-10, -10, 20, 20);

    // Tank barrel
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(0, -3, 25, 6);

    ctx.restore();

    // Draw enemy tanks
    ctx.fillStyle = '#f44336';
    enemyTanks.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        // Tank body
        ctx.fillStyle = '#f44336';
        ctx.fillRect(-17, -13, 34, 26);

        // Tank turret
        ctx.fillStyle = '#c62828';
        ctx.fillRect(-8, -8, 16, 16);

        // Tank barrel
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(0, -2, 20, 4);

        ctx.restore();
    });

    // Draw bullets
    ctx.fillStyle = '#ffeb3b';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#ff5722';
    enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw explosions
    explosions.forEach(exp => {
        ctx.globalAlpha = exp.life / 30;
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, '#ff9800');
        gradient.addColorStop(1, '#ff5722');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initLevel();
gameLoop();
