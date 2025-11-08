const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3, level = 1;
let gameOver = false;

const player = { x: canvas.width / 2 - 20, y: canvas.height - 60, width: 40, height: 30, speed: 5 };
const bullets = [];
const enemyBullets = [];
const enemies = [];
const shields = [];
let enemyDir = 1;
let enemySpeed = 1;
let canShoot = true;

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && canShoot && !gameOver) {
        e.preventDefault();
        shoot();
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

function shoot() {
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
    canShoot = false;
    setTimeout(() => canShoot = true, 300);
}

function createEnemies() {
    enemies.length = 0;
    const rows = 4;
    const cols = 10;
    const startX = 80;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: startX + col * 60,
                y: startY + row * 50,
                width: 40,
                height: 30,
                type: row < 2 ? 1 : 0,
                frame: 0
            });
        }
    }
}

function createShields() {
    shields.length = 0;
    const shieldY = canvas.height - 150;
    for (let i = 0; i < 4; i++) {
        const shieldX = 100 + i * 180;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 8; col++) {
                shields.push({
                    x: shieldX + col * 8,
                    y: shieldY + row * 8,
                    width: 8,
                    height: 8,
                    hp: 3
                });
            }
        }
    }
}

function enemyShoot() {
    if (enemies.length === 0) return;
    const shooter = enemies[Math.floor(Math.random() * enemies.length)];
    enemyBullets.push({
        x: shooter.x + shooter.width / 2 - 2,
        y: shooter.y + shooter.height,
        width: 4,
        height: 10
    });
}

function initLevel() {
    createEnemies();
    createShields();
    enemySpeed = 1 + level * 0.3;
}

function update() {
    if (gameOver) return;

    // Player movement
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 8;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += 5;
        if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }

    // Move enemies
    let shouldMoveDown = false;
    enemies.forEach(e => {
        e.x += enemyDir * enemySpeed;
        e.frame = (e.frame + 0.1) % 2;
        if (e.x <= 0 || e.x + e.width >= canvas.width) shouldMoveDown = true;
    });

    if (shouldMoveDown) {
        enemyDir *= -1;
        enemies.forEach(e => e.y += 20);
    }

    // Enemy shooting
    if (Math.random() < 0.01) enemyShoot();

    // Bullet-enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (b.x < e.x + e.width && b.x + b.width > e.x &&
                b.y < e.y + e.height && b.y + b.height > e.y) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += (e.type + 1) * 10;
                document.getElementById('score').textContent = score;
                break;
            }
        }
    }

    // Bullet-shield collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = shields.length - 1; j >= 0; j--) {
            const s = shields[j];
            if (b.x < s.x + s.width && b.x + b.width > s.x &&
                b.y < s.y + s.height && b.y + b.height > s.y) {
                bullets.splice(i, 1);
                s.hp--;
                if (s.hp <= 0) shields.splice(j, 1);
                break;
            }
        }
    }

    // Enemy bullet-shield collision
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        for (let j = shields.length - 1; j >= 0; j--) {
            const s = shields[j];
            if (b.x < s.x + s.width && b.x + b.width > s.x &&
                b.y < s.y + s.height && b.y + b.height > s.y) {
                enemyBullets.splice(i, 1);
                s.hp--;
                if (s.hp <= 0) shields.splice(j, 1);
                break;
            }
        }
    }

    // Enemy bullet-player collision
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        if (b.x < player.x + player.width && b.x + b.width > player.x &&
            b.y < player.y + player.height && b.y + b.height > player.y) {
            enemyBullets.splice(i, 1);
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) {
                gameOver = true;
                alert(`Game Over! Final Score: ${score}`);
                location.reload();
            }
        }
    }

    // Check if enemies reached bottom
    enemies.forEach(e => {
        if (e.y + e.height > canvas.height - 100) {
            gameOver = true;
            alert('Invasion Complete! Game Over!');
            location.reload();
        }
    });

    // Level complete
    if (enemies.length === 0) {
        level++;
        document.getElementById('level').textContent = level;
        setTimeout(initLevel, 1000);
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(player.x + 15, player.y - 10, 10, 10);

    // Draw bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // Draw enemy bullets
    ctx.fillStyle = '#ff0000';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // Draw enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.type === 1 ? '#ff00ff' : '#00ffff';
        const frame = Math.floor(e.frame);
        if (frame === 0) {
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.fillRect(e.x + 5, e.y - 5, 10, 5);
            ctx.fillRect(e.x + 25, e.y - 5, 10, 5);
        } else {
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.fillRect(e.x, e.y - 5, 10, 5);
            ctx.fillRect(e.x + 30, e.y - 5, 10, 5);
        }
    });

    // Draw shields
    shields.forEach(s => {
        ctx.fillStyle = s.hp === 3 ? '#00ff00' : s.hp === 2 ? '#ffff00' : '#ff6600';
        ctx.fillRect(s.x, s.y, s.width, s.height);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initLevel();
gameLoop();
