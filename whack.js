const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let timeLeft = 60;
let combo = 0;
let comboTimer = 0;
let gameOver = false;

const holes = [];
const particles = [];

// Create 9 holes in 3x3 grid
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        holes.push({
            x: 100 + col * 200,
            y: 100 + row * 200,
            moleUp: false,
            moleHeight: 0,
            targetHeight: 0,
            moleType: 'normal', // normal, fast, bomb
            timer: 0
        });
    }
}

canvas.addEventListener('click', (e) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let hit = false;
    holes.forEach(hole => {
        if (hole.moleUp) {
            const dx = clickX - hole.x;
            const dy = clickY - (hole.y - hole.moleHeight);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 40) {
                hit = true;

                if (hole.moleType === 'bomb') {
                    // Hit bomb - lose points and reset combo
                    score = Math.max(0, score - 50);
                    combo = 0;
                    createParticles(hole.x, hole.y - hole.moleHeight, '#ff0000');
                } else {
                    // Hit mole - gain points
                    let points = 10;
                    if (hole.moleType === 'fast') points = 20;

                    combo++;
                    comboTimer = 120;
                    points *= combo;

                    score += points;
                    createParticles(hole.x, hole.y - hole.moleHeight, '#ffff00');
                }

                hole.moleUp = false;
                hole.targetHeight = 0;

                document.getElementById('score').textContent = score;
                document.getElementById('combo').textContent = combo;
            }
        }
    });

    if (!hit && comboTimer === 0) {
        combo = 0;
        document.getElementById('combo').textContent = combo;
    }
});

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            life: 30,
            color
        });
    }
}

function spawnMole() {
    const availableHoles = holes.filter(h => !h.moleUp);
    if (availableHoles.length === 0) return;

    const hole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    hole.moleUp = true;
    hole.targetHeight = 60;

    // Determine mole type
    const rand = Math.random();
    if (rand < 0.1) {
        hole.moleType = 'bomb';
        hole.timer = 60; // Stays up shorter
    } else if (rand < 0.3) {
        hole.moleType = 'fast';
        hole.timer = 40; // Quick mole
    } else {
        hole.moleType = 'normal';
        hole.timer = 90; // Normal duration
    }
}

function update() {
    if (gameOver) return;

    // Spawn moles
    if (Math.random() < 0.03) {
        spawnMole();
    }

    // Update holes
    holes.forEach(hole => {
        if (hole.moleUp) {
            // Move mole up/down
            if (hole.moleHeight < hole.targetHeight) {
                hole.moleHeight += 3;
            }

            // Timer
            hole.timer--;
            if (hole.timer <= 0) {
                hole.targetHeight = 0;
            }

            if (hole.targetHeight === 0 && hole.moleHeight > 0) {
                hole.moleHeight -= 3;
                if (hole.moleHeight <= 0) {
                    hole.moleUp = false;
                    hole.moleHeight = 0;
                }
            }
        }
    });

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // Gravity
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            combo = 0;
            document.getElementById('combo').textContent = combo;
        }
    }
}

function draw() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Draw holes and moles
    holes.forEach(hole => {
        // Hole
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(hole.x, hole.y, 50, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(hole.x, hole.y, 45, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mole
        if (hole.moleHeight > 0) {
            const moleY = hole.y - hole.moleHeight;

            // Body
            if (hole.moleType === 'bomb') {
                ctx.fillStyle = '#000';
            } else if (hole.moleType === 'fast') {
                ctx.fillStyle = '#FFD700';
            } else {
                ctx.fillStyle = '#8B4513';
            }

            ctx.beginPath();
            ctx.ellipse(hole.x, moleY, 35, 40, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(hole.x - 12, moleY - 10, 8, 0, Math.PI * 2);
            ctx.arc(hole.x + 12, moleY - 10, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(hole.x - 12, moleY - 10, 4, 0, Math.PI * 2);
            ctx.arc(hole.x + 12, moleY - 10, 4, 0, Math.PI * 2);
            ctx.fill();

            // Nose
            ctx.fillStyle = '#FFC0CB';
            ctx.beginPath();
            ctx.ellipse(hole.x, moleY + 5, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Special indicators
            if (hole.moleType === 'bomb') {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('💣', hole.x, moleY - 35);
            } else if (hole.moleType === 'fast') {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡', hole.x, moleY - 35);
            }
        }
    });

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw combo indicator
    if (combo > 1) {
        ctx.fillStyle = '#ff00ff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(`${combo}x COMBO!`, canvas.width / 2, 50);
        ctx.fillText(`${combo}x COMBO!`, canvas.width / 2, 50);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Timer countdown
setInterval(() => {
    if (!gameOver && timeLeft > 0) {
        timeLeft--;
        document.getElementById('time').textContent = timeLeft;

        if (timeLeft === 0) {
            gameOver = true;
            alert(`Time's Up! Final Score: ${score}`);
            location.reload();
        }
    }
}, 1000);

gameLoop();
