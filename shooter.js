const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

let gameRunning = true;
let score = 0;
let lives = 3;
let level = 1;

// Player
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    speed: 5
};

// Controls
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
        shoot();
    }
});
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Bullets
let bullets = [];
let shootCooldown = 0;
let weaponType = 'single'; // single, double, triple
let weaponTimer = 0;

function shoot() {
    if (shootCooldown > 0) return;
    shootCooldown = 10;

    if (weaponType === 'single') {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 15,
            speed: 7
        });
    } else if (weaponType === 'double') {
        bullets.push({
            x: player.x + 5,
            y: player.y,
            width: 4,
            height: 15,
            speed: 7
        });
        bullets.push({
            x: player.x + player.width - 9,
            y: player.y,
            width: 4,
            height: 15,
            speed: 7
        });
    } else if (weaponType === 'triple') {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 15,
            speed: 7
        });
        bullets.push({
            x: player.x + 5,
            y: player.y + 5,
            width: 4,
            height: 15,
            speed: 7,
            vx: -1
        });
        bullets.push({
            x: player.x + player.width - 9,
            y: player.y + 5,
            width: 4,
            height: 15,
            speed: 7,
            vx: 1
        });
    }
}

// Enemies
let enemies = [];
let enemySpeed = 1;
let enemySpawnRate = 100;
let frameCount = 0;

function spawnEnemy() {
    const enemyTypes = ['normal', 'fast', 'tank'];
    const type = enemyTypes[Math.floor(Math.random() * Math.min(enemyTypes.length, Math.ceil(level / 3) + 1))];

    let enemy = {
        x: Math.random() * (canvas.width - 40),
        y: -40,
        type: type
    };

    if (type === 'normal') {
        enemy.width = 35;
        enemy.height = 35;
        enemy.speed = enemySpeed + Math.random();
        enemy.health = Math.ceil(level / 2);
        enemy.color = '#ff6b6b';
        enemy.points = 10;
    } else if (type === 'fast') {
        enemy.width = 25;
        enemy.height = 25;
        enemy.speed = (enemySpeed + Math.random()) * 2;
        enemy.health = 1;
        enemy.color = '#ffd93d';
        enemy.points = 20;
    } else if (type === 'tank') {
        enemy.width = 50;
        enemy.height = 50;
        enemy.speed = (enemySpeed + Math.random()) * 0.6;
        enemy.health = Math.ceil(level / 2) + 3;
        enemy.color = '#9d4edd';
        enemy.points = 30;
    }

    enemies.push(enemy);
}

// Power-ups
let powerups = [];
function spawnPowerup(x, y) {
    const types = ['doubleShot', 'tripleShot', 'health'];
    powerups.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        speed: 2,
        type: types[Math.floor(Math.random() * types.length)]
    });
}

// Particles for explosions
let particles = [];
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

// Update game state
function update() {
    if (!gameRunning) return;

    frameCount++;
    if (shootCooldown > 0) shootCooldown--;

    // Update weapon timer
    if (weaponTimer > 0) {
        weaponTimer--;
        if (weaponTimer === 0) {
            weaponType = 'single';
        }
    }

    // Move player
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;

    // Move bullets
    bullets = bullets.filter(b => {
        b.y -= b.speed;
        if (b.vx) b.x += b.vx;
        return b.y > -b.height && b.x > -10 && b.x < canvas.width + 10;
    });

    // Spawn enemies
    if (frameCount % Math.max(30, enemySpawnRate - level * 5) === 0) {
        spawnEnemy();
    }

    // Move enemies
    enemies = enemies.filter(e => {
        e.y += e.speed;

        // Check collision with player
        if (e.x < player.x + player.width &&
            e.x + e.width > player.x &&
            e.y < player.y + player.height &&
            e.y + e.height > player.y) {
            lives--;
            livesElement.textContent = lives;
            createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ff6b6b');
            if (lives <= 0) {
                endGame();
            }
            return false;
        }

        return e.y < canvas.height + e.height;
    });

    // Move powerups and check collisions
    powerups = powerups.filter(p => {
        p.y += p.speed;

        // Check collision with player
        if (p.x < player.x + player.width &&
            p.x + p.width > player.x &&
            p.y < player.y + player.height &&
            p.y + p.height > player.y) {

            if (p.type === 'doubleShot') {
                weaponType = 'double';
                weaponTimer = 600; // 10 seconds at 60fps
            } else if (p.type === 'tripleShot') {
                weaponType = 'triple';
                weaponTimer = 600;
            } else if (p.type === 'health') {
                lives = Math.min(lives + 1, 5);
                livesElement.textContent = lives;
            }
            createExplosion(p.x + p.width / 2, p.y + p.height / 2, '#10b981');
            return false;
        }

        return p.y < canvas.height + p.height;
    });

    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i] &&
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y) {

                enemies[j].health--;
                bullets.splice(i, 1);

                if (enemies[j].health <= 0) {
                    score += enemies[j].points * level;
                    scoreElement.textContent = score;
                    createExplosion(enemies[j].x + enemies[j].width / 2,
                                  enemies[j].y + enemies[j].height / 2, enemies[j].color);

                    // 15% chance to drop powerup
                    if (Math.random() < 0.15) {
                        spawnPowerup(enemies[j].x + enemies[j].width / 2 - 10, enemies[j].y);
                    }

                    enemies.splice(j, 1);

                    // Level up every 200 points
                    if (score > 0 && score % 200 === 0) {
                        level++;
                        levelElement.textContent = level;
                        enemySpeed += 0.3;
                    }
                }
                break;
            }
        }
    }

    // Update particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
    });
}

// Draw everything
function draw() {
    // Clear canvas with slight trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars background
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + frameCount * 0.5) % canvas.width;
        const y = (i * 211) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }

    // Draw player (triangle spaceship)
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Player glow
    ctx.strokeStyle = '#9d9ef5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw bullets
    ctx.fillStyle = '#4ecdc4';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Bullet glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4ecdc4';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
    });

    // Draw enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);

        // Enemy glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.shadowBlur = 0;

        // Health bar
        if (e.health > 1) {
            const maxHealth = e.type === 'tank' ? Math.ceil(level / 2) + 3 : Math.ceil(level / 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(e.x, e.y - 8, e.width, 3);
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(e.x, e.y - 8, e.width * (e.health / maxHealth), 3);
        }
    });

    // Draw powerups
    powerups.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(frameCount * 0.05);

        if (p.type === 'doubleShot') {
            ctx.fillStyle = '#10b981';
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x2', 0, 0);
        } else if (p.type === 'tripleShot') {
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x3', 0, 0);
        } else if (p.type === 'health') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', 0, 0);
        }

        ctx.restore();
    });

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.classList.add('show');
}

function restartGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    level = 1;
    enemySpeed = 1;
    bullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    frameCount = 0;
    weaponType = 'single';
    weaponTimer = 0;
    shootCooldown = 0;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 80;

    scoreElement.textContent = score;
    livesElement.textContent = lives;
    levelElement.textContent = level;
    gameOverElement.classList.remove('show');
}

// Start the game
gameLoop();
