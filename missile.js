const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let ammo = 50; // Increased from 30
let gameOver = false;
let wave = 1;
let waveActive = false;
let waveEnemies = 0;
let enemiesSpawned = 0;

const batteries = [
    { x: 100, y: canvas.height - 20, alive: true },
    { x: canvas.width / 2, y: canvas.height - 20, alive: true },
    { x: canvas.width - 100, y: canvas.height - 20, alive: true }
];

const cities = [];
const enemyMissiles = [];
const playerMissiles = [];
const explosions = [];

function initCities() {
    cities.length = 0;
    const positions = [150, 250, 350, 450, 550, 650];
    positions.forEach(x => {
        cities.push({ x, y: canvas.height - 40, width: 30, height: 30, alive: true });
    });
}

canvas.addEventListener('click', (e) => {
    if (gameOver || ammo <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;

    // Find closest alive battery
    let closestBattery = null;
    let minDist = Infinity;
    batteries.forEach(b => {
        if (b.alive) {
            const dist = Math.sqrt((b.x - targetX) ** 2 + (b.y - targetY) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closestBattery = b;
            }
        }
    });

    if (!closestBattery) return;

    const angle = Math.atan2(targetY - closestBattery.y, targetX - closestBattery.x);
    const speed = 8; // Faster missiles

    playerMissiles.push({
        x: closestBattery.x,
        y: closestBattery.y,
        targetX,
        targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        trail: []
    });

    ammo--;
    document.getElementById('ammo').textContent = ammo;
});

function startWave() {
    waveActive = true;
    waveEnemies = 5 + wave * 2; // Fewer missiles per wave
    enemiesSpawned = 0;
}

function spawnEnemyMissile() {
    if (!waveActive || enemiesSpawned >= waveEnemies) return;

    const startX = Math.random() * canvas.width;
    let targetX, targetY;

    // 60% target cities, 30% batteries, 10% random
    const rand = Math.random();
    if (rand < 0.6) {
        const aliveCities = cities.filter(c => c.alive);
        if (aliveCities.length > 0) {
            const target = aliveCities[Math.floor(Math.random() * aliveCities.length)];
            targetX = target.x;
            targetY = target.y;
        } else {
            targetX = Math.random() * canvas.width;
            targetY = canvas.height - 20;
        }
    } else if (rand < 0.9) {
        const aliveBatteries = batteries.filter(b => b.alive);
        if (aliveBatteries.length > 0) {
            const battery = aliveBatteries[Math.floor(Math.random() * aliveBatteries.length)];
            targetX = battery.x;
            targetY = battery.y;
        } else {
            targetX = Math.random() * canvas.width;
            targetY = canvas.height - 20;
        }
    } else {
        targetX = Math.random() * canvas.width;
        targetY = canvas.height - 20;
    }

    const angle = Math.atan2(targetY, targetX - startX);
    const speed = 1 + wave * 0.1; // Slower missiles, gradual increase

    enemyMissiles.push({
        x: startX,
        y: 0,
        targetX,
        targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        trail: []
    });

    enemiesSpawned++;
}

function createExplosion(x, y, maxRadius) {
    explosions.push({
        x, y,
        radius: 0,
        maxRadius: maxRadius || 50, // Bigger explosions
        growing: true
    });
}

let spawnTimer = 0;

function update() {
    if (gameOver) return;

    // Start wave if needed
    if (!waveActive && enemyMissiles.length === 0 && explosions.length === 0) {
        startWave();
    }

    // Spawn enemy missiles gradually
    if (waveActive && enemiesSpawned < waveEnemies) {
        spawnTimer++;
        const spawnDelay = Math.max(30, 90 - wave * 5); // Spawn rate increases with wave
        if (spawnTimer >= spawnDelay) {
            spawnEnemyMissile();
            spawnTimer = 0;
        }
    }

    // Check if wave is complete
    if (waveActive && enemiesSpawned >= waveEnemies && enemyMissiles.length === 0 && explosions.length === 0) {
        waveActive = false;
        // Bonus for surviving cities
        const aliveCities = cities.filter(c => c.alive).length;
        const aliveBatteries = batteries.filter(b => b.alive).length;
        score += aliveCities * 50 + aliveBatteries * 25;

        // Reload ammo
        ammo += 30;
        document.getElementById('ammo').textContent = ammo;
        document.getElementById('score').textContent = score;

        wave++;
        setTimeout(() => alert(`Wave ${wave - 1} Complete! Bonus: ${aliveCities * 50 + aliveBatteries * 25}`), 100);
    }

    // Update player missiles
    for (let i = playerMissiles.length - 1; i >= 0; i--) {
        const m = playerMissiles[i];
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 10) m.trail.shift();

        m.x += m.vx;
        m.y += m.vy;

        const dist = Math.sqrt((m.x - m.targetX) ** 2 + (m.y - m.targetY) ** 2);
        if (dist < 8) {
            createExplosion(m.x, m.y);
            playerMissiles.splice(i, 1);
        }
    }

    // Update enemy missiles
    for (let i = enemyMissiles.length - 1; i >= 0; i--) {
        const m = enemyMissiles[i];
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 20) m.trail.shift();

        m.x += m.vx;
        m.y += m.vy;

        // Check if reached target
        if (m.y >= canvas.height - 40) {
            createExplosion(m.x, m.y, 35);
            enemyMissiles.splice(i, 1);

            // Check if hit city
            cities.forEach(c => {
                if (c.alive && Math.abs(c.x - m.x) < 40) {
                    c.alive = false;
                    document.getElementById('cities').textContent = cities.filter(c => c.alive).length;
                }
            });

            // Check if hit battery
            batteries.forEach(b => {
                if (b.alive && Math.abs(b.x - m.x) < 40) {
                    b.alive = false;
                }
            });
        }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const ex = explosions[i];

        if (ex.growing) {
            ex.radius += 3; // Faster growth
            if (ex.radius >= ex.maxRadius) {
                ex.growing = false;
            }
        } else {
            ex.radius -= 2;
            if (ex.radius <= 0) {
                explosions.splice(i, 1);
                continue;
            }
        }

        // Check collision with enemy missiles
        for (let j = enemyMissiles.length - 1; j >= 0; j--) {
            const m = enemyMissiles[j];
            const dist = Math.sqrt((m.x - ex.x) ** 2 + (m.y - ex.y) ** 2);
            if (dist < ex.radius) {
                createExplosion(m.x, m.y, 30);
                enemyMissiles.splice(j, 1);
                score += 25;
                document.getElementById('score').textContent = score;
            }
        }
    }

    // Check game over
    const aliveCities = cities.filter(c => c.alive).length;
    if (aliveCities === 0) {
        gameOver = true;
        setTimeout(() => {
            alert(`Game Over! Wave ${wave}\nFinal Score: ${score}`);
            location.reload();
        }, 1000);
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    // Draw batteries
    batteries.forEach(b => {
        if (b.alive) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(b.x - 15, b.y - 10, 30, 10);
            ctx.fillRect(b.x - 5, b.y - 15, 10, 10);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillRect(b.x - 15, b.y - 5, 30, 5);
        }
    });

    // Draw cities
    cities.forEach(c => {
        if (c.alive) {
            ctx.fillStyle = '#0099ff';
            ctx.fillRect(c.x - 15, c.y, c.width, c.height);
            ctx.fillRect(c.x - 5, c.y - 10, 10, 10);
            ctx.fillRect(c.x + 5, c.y - 5, 5, 5);
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(c.x - 10, c.y + 20, 20, 10);
        }
    });

    // Draw player missile trails
    playerMissiles.forEach(m => {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        m.trail.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Draw missile head
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemy missile trails
    enemyMissiles.forEach(m => {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        m.trail.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Draw missile head
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw explosions
    explosions.forEach(ex => {
        const gradient = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw wave info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    if (waveActive) {
        ctx.fillText(`Wave ${wave} - Incoming: ${waveEnemies - enemiesSpawned}`, canvas.width / 2, 20);
    } else {
        ctx.fillText(`Wave ${wave} Starting...`, canvas.width / 2, 20);
    }

    // Draw crosshair at mouse position
    if (!gameOver) {
        const rect = canvas.getBoundingClientRect();
        canvas.addEventListener('mousemove', (e) => {
            canvas.mouseX = e.clientX - rect.left;
            canvas.mouseY = e.clientY - rect.top;
        });

        if (canvas.mouseX && canvas.mouseY) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(canvas.mouseX - 10, canvas.mouseY);
            ctx.lineTo(canvas.mouseX + 10, canvas.mouseY);
            ctx.moveTo(canvas.mouseX, canvas.mouseY - 10);
            ctx.lineTo(canvas.mouseX, canvas.mouseY + 10);
            ctx.stroke();
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initCities();
gameLoop();
