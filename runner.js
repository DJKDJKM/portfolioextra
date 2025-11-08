const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');
const startScreenElement = document.getElementById('startScreen');

let gameRunning = false;
let score = 0;
let bestScore = localStorage.getItem('runnerBest') || 0;
let gameSpeed = 5;
let gravity = 0.6;

// Player
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    velocityY: 0,
    jumping: false,
    jumpsLeft: 2,
    maxJumps: 2
};

// Ground
const groundY = canvas.height - 60;
player.y = groundY - player.height;

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
let minObstacleGap = 100;

// Coins
let coins = [];
let coinTimer = 0;

// Particles
let particles = [];

// Bullets
let bullets = [];
let shootCooldown = 0;
let ammo = 20;
let maxAmmo = 20;

function shoot() {
    if (shootCooldown > 0 || ammo <= 0) return;

    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 3,
        width: 15,
        height: 6,
        speed: 12
    });

    ammo--;
    shootCooldown = 15;

    // Shooting particles
    createParticles(player.x + player.width, player.y + player.height / 2, '#ffed4e', 5);
}

// Controls
function jump() {
    if (player.jumpsLeft > 0) {
        player.velocityY = -12;
        player.jumping = true;
        player.jumpsLeft--;

        // Jump particles
        createParticles(player.x + player.width / 2, player.y + player.height, '#4ecdc4', 8);
    }
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }

    if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        shoot();
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) {
        jump();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameRunning) {
        shoot();
    }
});

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -3,
            life: 30,
            color: color
        });
    }
}

function spawnObstacle() {
    const height = 30 + Math.random() * 40;
    const rand = Math.random();
    let type, health;

    if (rand > 0.7) {
        type = 'spike';
        health = 1; // Spikes can be destroyed
    } else if (rand > 0.4) {
        type = 'box';
        health = 2; // Boxes need 2 hits
    } else {
        type = 'strong';
        health = 3; // Strong obstacles need 3 hits
    }

    obstacles.push({
        x: canvas.width,
        y: groundY - height,
        width: type === 'spike' ? 30 : 40,
        height: height,
        type: type,
        health: health,
        maxHealth: health
    });
}

function spawnCoin() {
    coins.push({
        x: canvas.width,
        y: groundY - 100 - Math.random() * 100,
        radius: 15,
        collected: false
    });
}

function update() {
    if (!gameRunning) return;

    // Update score
    score++;
    scoreElement.textContent = Math.floor(score / 10);

    // Cooldowns
    if (shootCooldown > 0) shootCooldown--;

    // Increase difficulty
    if (score % 500 === 0) {
        gameSpeed += 0.5;
    }

    // Update player
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Ground collision
    if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.jumping = false;
        player.jumpsLeft = player.maxJumps;
    }

    // Update bullets
    bullets = bullets.filter(b => {
        b.x += b.speed;
        return b.x < canvas.width + b.width;
    });

    // Spawn obstacles
    obstacleTimer++;
    if (obstacleTimer > minObstacleGap) {
        if (Math.random() < 0.02) {
            spawnObstacle();
            obstacleTimer = 0;
        }
    }

    // Spawn coins
    coinTimer++;
    if (coinTimer > 80 && Math.random() < 0.03) {
        spawnCoin();
        coinTimer = 0;
    }

    // Update obstacles
    obstacles = obstacles.filter(obs => {
        obs.x -= gameSpeed;

        // Check collision with bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (bullet.x < obs.x + obs.width &&
                bullet.x + bullet.width > obs.x &&
                bullet.y < obs.y + obs.height &&
                bullet.y + bullet.height > obs.y) {

                // Hit the obstacle
                obs.health--;
                bullets.splice(i, 1);

                // Create explosion particles
                createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#ff6b6b', 15);

                if (obs.health <= 0) {
                    // Obstacle destroyed! Give bonus points and ammo
                    score += 20;
                    ammo = Math.min(ammo + 2, maxAmmo);
                    createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#ffd700', 20);
                    return false; // Remove obstacle
                }
                break;
            }
        }

        // Check collision with player
        if (obs.x < player.x + player.width &&
            obs.x + obs.width > player.x &&
            obs.y < player.y + player.height &&
            obs.y + obs.height > player.y) {
            endGame();
            return false;
        }

        return obs.x > -obs.width;
    });

    // Update coins
    coins = coins.filter(coin => {
        coin.x -= gameSpeed;

        // Check collision with player
        if (!coin.collected) {
            const dx = (player.x + player.width / 2) - coin.x;
            const dy = (player.y + player.height / 2) - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.width / 2 + coin.radius) {
                coin.collected = true;
                score += 50;
                ammo = Math.min(ammo + 5, maxAmmo); // Coins give ammo too!
                createParticles(coin.x, coin.y, '#ffd700', 12);
                return false;
            }
        }

        return coin.x > -coin.radius * 2;
    });

    // Update particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        return p.life > 0;
    });
}

function draw() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + score * 0.2) % canvas.width;
        const y = (i * 211) % (canvas.height - 100);
        ctx.fillRect(x, y, 2, 2);
    }

    // Ground
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // Ground pattern
    ctx.fillStyle = '#5568d3';
    for (let i = 0; i < canvas.width / 40; i++) {
        ctx.fillRect(i * 40 - (score % 40), groundY, 38, canvas.height - groundY);
    }

    // Draw player (cube with glow)
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#4ecdc4';
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.restore();

    // Player eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 10, player.y + 12, 8, 8);
    ctx.fillRect(player.x + 22, player.y + 12, 8, 8);

    // Draw bullets
    ctx.fillStyle = '#ffed4e';
    bullets.forEach(b => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffed4e';
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Bullet trail
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(b.x - 5, b.y + 1, 5, 4);
    });
    ctx.shadowBlur = 0;

    // Draw obstacles
    obstacles.forEach(obs => {
        // Color based on health
        let color = '#ff6b6b';
        if (obs.type === 'strong') color = '#9d4edd';
        else if (obs.type === 'box') color = '#ff9f43';

        if (obs.type === 'spike') {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.width / 2, obs.y);
            ctx.lineTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        if (obs.type === 'spike') {
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.width / 2, obs.y);
            ctx.lineTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
        ctx.shadowBlur = 0;

        // Health bar for obstacles that can be destroyed
        if (obs.health < obs.maxHealth) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(obs.x, obs.y - 8, obs.width, 3);
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(obs.x, obs.y - 8, obs.width * (obs.health / obs.maxHealth), 3);
        }
    });

    // Draw coins
    coins.forEach(coin => {
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Coin shimmer
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.arc(coin.x - 5, coin.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Draw ammo counter
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Ammo: ${ammo}/${maxAmmo}`, 10, 25);

    // Draw ammo bar
    const ammoBarWidth = 150;
    const ammoBarHeight = 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, ammoBarWidth, ammoBarHeight);
    ctx.fillStyle = ammo > 5 ? '#4ecdc4' : '#ff6b6b';
    ctx.fillRect(10, 35, ammoBarWidth * (ammo / maxAmmo), ammoBarHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 35, ammoBarWidth, ammoBarHeight);

    // Draw controls hint
    if (score < 100) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE = Jump | S or Right-Click = Shoot', canvas.width / 2, 25);
    }
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
    gameSpeed = 5;
    obstacles = [];
    coins = [];
    particles = [];
    bullets = [];
    obstacleTimer = 0;
    coinTimer = 0;
    ammo = maxAmmo;
    shootCooldown = 0;
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.jumping = false;
    player.jumpsLeft = player.maxJumps;
}

function endGame() {
    gameRunning = false;
    const finalDist = Math.floor(score / 10);
    finalScoreElement.textContent = finalDist;

    if (finalDist > bestScore) {
        bestScore = finalDist;
        localStorage.setItem('runnerBest', bestScore);
    }
    bestScoreElement.textContent = bestScore;

    gameOverElement.classList.add('show');
}

function restartGame() {
    gameOverElement.classList.remove('show');
    startGame();
}

bestScoreElement.textContent = bestScore;

// Start the game loop
gameLoop();
