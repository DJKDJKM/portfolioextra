const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0, lives = 3, level = 1;
let gameOver = false;

const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: false,
    size: 15
};

const bullets = [];
const asteroids = [];
const particles = [];
const powerups = [];

let shootCooldown = 0;
let shieldActive = false;
let shieldTimer = 0;
let rapidFireActive = false;
let rapidFireTimer = 0;

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && !gameOver) {
        e.preventDefault();
        shoot();
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

function shoot() {
    if (shootCooldown > 0) return;

    const angle = ship.angle - Math.PI / 2;
    const spreadCount = rapidFireActive ? 3 : 1;
    const spreadAngle = 0.2;

    for (let i = 0; i < spreadCount; i++) {
        const offset = spreadCount === 1 ? 0 : (i - 1) * spreadAngle;
        const shootAngle = angle + offset;

        bullets.push({
            x: ship.x + Math.cos(shootAngle) * ship.size,
            y: ship.y + Math.sin(shootAngle) * ship.size,
            vx: Math.cos(shootAngle) * 8 + ship.vx,
            vy: Math.sin(shootAngle) * 8 + ship.vy,
            life: 60
        });
    }

    shootCooldown = rapidFireActive ? 5 : 15;
}

function spawnPowerup(x, y) {
    if (Math.random() < 0.3) {
        const types = ['shield', 'rapidfire', 'extralife'];
        powerups.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            type: types[Math.floor(Math.random() * types.length)],
            life: 300
        });
    }
}

function createAsteroid(x, y, size) {
    const asteroidSize = size || 3;
    // Create consistent shape points for this asteroid
    const points = [];
    const numPoints = 8;
    const baseRadius = asteroidSize * 10;

    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const variance = (Math.random() - 0.5) * 5;
        const radius = baseRadius + variance;
        points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        });
    }

    asteroids.push({
        x: x !== undefined ? x : Math.random() * canvas.width,
        y: y !== undefined ? y : Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (4 - asteroidSize),
        vy: (Math.random() - 0.5) * (4 - asteroidSize),
        size: asteroidSize,
        angle: Math.random() * Math.PI * 2,
        rotation: (Math.random() - 0.5) * 0.1,
        points: points
    });
}

function createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30
        });
    }
}

function initLevel() {
    asteroids.length = 0;
    const count = 3 + level;
    for (let i = 0; i < count; i++) {
        createAsteroid();
    }
}

function resetShip() {
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;
}

function update() {
    if (gameOver) return;

    // Update cooldowns and timers
    if (shootCooldown > 0) shootCooldown--;
    if (shieldTimer > 0) {
        shieldTimer--;
        if (shieldTimer === 0) shieldActive = false;
    }
    if (rapidFireTimer > 0) {
        rapidFireTimer--;
        if (rapidFireTimer === 0) rapidFireActive = false;
    }

    // Ship rotation and thrust
    if (keys['ArrowLeft']) ship.angle -= 0.1;
    if (keys['ArrowRight']) ship.angle += 0.1;

    if (keys['ArrowUp']) {
        const angle = ship.angle - Math.PI / 2;
        ship.vx += Math.cos(angle) * 0.2;
        ship.vy += Math.sin(angle) * 0.2;
        ship.thrust = true;

        // Thrust particles
        if (Math.random() < 0.3) {
            particles.push({
                x: ship.x - Math.cos(angle) * ship.size,
                y: ship.y - Math.sin(angle) * ship.size,
                vx: -Math.cos(angle) * 3 + (Math.random() - 0.5),
                vy: -Math.sin(angle) * 3 + (Math.random() - 0.5),
                life: 20
            });
        }
    } else {
        ship.thrust = false;
    }

    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Update ship position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Wrap ship around screen
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        if (b.life <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // Update asteroids
    asteroids.forEach(a => {
        a.x += a.vx;
        a.y += a.vy;
        a.angle += a.rotation;

        if (a.x < 0) a.x = canvas.width;
        if (a.x > canvas.width) a.x = 0;
        if (a.y < 0) a.y = canvas.height;
        if (a.y > canvas.height) a.y = 0;
    });

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Check collision with ship
        const dx = ship.x - p.x;
        const dy = ship.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ship.size + 10) {
            if (p.type === 'shield') {
                shieldActive = true;
                shieldTimer = 600;
            } else if (p.type === 'rapidfire') {
                rapidFireActive = true;
                rapidFireTimer = 600;
            } else if (p.type === 'extralife') {
                lives++;
                document.getElementById('lives').textContent = lives;
            }
            createParticles(p.x, p.y);
            powerups.splice(i, 1);
            continue;
        }

        if (p.life <= 0) powerups.splice(i, 1);
    }

    // Bullet-asteroid collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const a = asteroids[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < a.size * 10) {
                bullets.splice(i, 1);
                asteroids.splice(j, 1);
                createParticles(a.x, a.y);

                score += (4 - a.size) * 10;
                document.getElementById('score').textContent = score;

                if (a.size === 3) {
                    spawnPowerup(a.x, a.y);
                }

                if (a.size > 1) {
                    createAsteroid(a.x, a.y, a.size - 1);
                    createAsteroid(a.x, a.y, a.size - 1);
                }
                break;
            }
        }
    }

    // Ship-asteroid collision
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        const dx = ship.x - a.x;
        const dy = ship.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ship.size + a.size * 10) {
            if (shieldActive) {
                shieldActive = false;
                shieldTimer = 0;
                asteroids.splice(i, 1);
                createParticles(a.x, a.y);
            } else {
                lives--;
                document.getElementById('lives').textContent = lives;
                createParticles(ship.x, ship.y);

                if (lives <= 0) {
                    gameOver = true;
                    setTimeout(() => {
                        alert(`Game Over! Final Score: ${score}`);
                        location.reload();
                    }, 100);
                } else {
                    resetShip();
                    asteroids.splice(i, 1);
                }
            }
        }
    }

    // Level completion
    if (asteroids.length === 0 && !gameOver) {
        level++;
        document.getElementById('level').textContent = level;
        setTimeout(initLevel, 1000);
    }
}

function draw() {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw shield around ship
    if (shieldActive) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.size + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = rapidFireActive ? '#ff00ff' : '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.closePath();
    ctx.stroke();

    // Draw thrust flame
    if (ship.thrust) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-ship.size / 4, ship.size);
        ctx.lineTo(0, ship.size + 8);
        ctx.lineTo(ship.size / 4, ship.size);
        ctx.fill();
    }
    ctx.restore();

    // Draw bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw asteroids with consistent shapes
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.beginPath();

        a.points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    });

    // Draw particles
    ctx.fillStyle = '#ff6600';
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw powerups
    powerups.forEach(p => {
        ctx.save();
        let color, symbol;
        if (p.type === 'shield') {
            color = '#00ffff';
            symbol = 'S';
        } else if (p.type === 'rapidfire') {
            color = '#ff00ff';
            symbol = 'R';
        } else {
            color = '#00ff00';
            symbol = '+';
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7 + Math.sin(p.life * 0.1) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, p.x, p.y);
        ctx.restore();
    });

    // Draw status indicators at bottom
    const statusY = canvas.height - 20;
    ctx.textAlign = 'left';

    if (shieldActive) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`SHIELD: ${Math.ceil(shieldTimer / 60)}s`, 10, statusY);
    }

    if (rapidFireActive) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 14px Arial';
        const xOffset = shieldActive ? 140 : 10;
        ctx.fillText(`RAPID FIRE: ${Math.ceil(rapidFireTimer / 60)}s`, xOffset, statusY);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start
initLevel();
gameLoop();
