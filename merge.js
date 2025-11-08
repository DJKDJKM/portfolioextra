const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const bestElement = document.getElementById('best');
const levelElement = document.getElementById('level');
const nextFruitElement = document.getElementById('nextFruit');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');

let gameRunning = true;
let score = 0;
let level = 1;
let bestScore = localStorage.getItem('mergeBest') || 0;
bestElement.textContent = bestScore;

// Fruit types with emojis, sizes, and colors
const fruitTypes = [
    { emoji: '🍒', radius: 15, color: '#ff6b9d', points: 1 },
    { emoji: '🍓', radius: 20, color: '#ff5757', points: 3 },
    { emoji: '🍇', radius: 25, color: '#9b59b6', points: 6 },
    { emoji: '🍊', radius: 30, color: '#ff9f43', points: 10 },
    { emoji: '🍋', radius: 33, color: '#ffd93d', points: 15 },
    { emoji: '🍎', radius: 36, color: '#ff4757', points: 21 },
    { emoji: '🍑', radius: 38, color: '#ffb8b8', points: 28 },
    { emoji: '🍍', radius: 40, color: '#f9ca24', points: 36 },
    { emoji: '🥥', radius: 42, color: '#8b4513', points: 45 },
    { emoji: '🍉', radius: 50, color: '#1dd1a1', points: 55 }
];

// Physics
let fruits = [];
let nextFruitType = Math.floor(Math.random() * 3);
let dropX = canvas.width / 2;
let canDrop = true;
let dropCooldown = 0;
let comboCount = 0;
let comboTimer = 0;

const gravity = 0.5;
const damping = 0.7;
const groundY = canvas.height - 10;

// Particles for merge effects
let particles = [];
function createMergeEffect(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

// Preview fruit
let previewFruit = null;

// Mouse/Click handling
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    dropX = e.clientX - rect.left;
    dropX = Math.max(40, Math.min(canvas.width - 40, dropX));
});

canvas.addEventListener('click', () => {
    if (gameRunning && canDrop) {
        dropFruit();
    }
});

function dropFruit() {
    const fruit = fruitTypes[nextFruitType];
    fruits.push({
        x: dropX,
        y: 50,
        vx: 0,
        vy: 0,
        type: nextFruitType,
        radius: fruit.radius,
        merged: false
    });

    nextFruitType = Math.floor(Math.random() * Math.min(3, level + 2));
    nextFruitElement.textContent = fruitTypes[nextFruitType].emoji;
    canDrop = false;
    dropCooldown = 30;
}

function update() {
    if (!gameRunning) return;

    // Cooldown for dropping
    if (dropCooldown > 0) {
        dropCooldown--;
        if (dropCooldown === 0) {
            canDrop = true;
        }
    }

    // Update combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            comboCount = 0;
        }
    }

    // Update particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.life--;
        return p.life > 0;
    });

    // Update fruits
    fruits.forEach((fruit, i) => {
        // Apply gravity
        fruit.vy += gravity;

        // Update position
        fruit.x += fruit.vx;
        fruit.y += fruit.vy;

        // Wall collision
        if (fruit.x - fruit.radius < 0) {
            fruit.x = fruit.radius;
            fruit.vx *= -damping;
        }
        if (fruit.x + fruit.radius > canvas.width) {
            fruit.x = canvas.width - fruit.radius;
            fruit.vx *= -damping;
        }

        // Ground collision
        if (fruit.y + fruit.radius > groundY) {
            fruit.y = groundY - fruit.radius;
            fruit.vy *= -damping;
            fruit.vx *= 0.95;
        }

        // Collision with other fruits
        for (let j = i + 1; j < fruits.length; j++) {
            const other = fruits[j];
            const dx = other.x - fruit.x;
            const dy = other.y - fruit.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = fruit.radius + other.radius;

            if (distance < minDist) {
                // Check if same type for merging
                if (fruit.type === other.type && fruit.type < fruitTypes.length - 1 && !fruit.merged && !other.merged) {
                    // Merge!
                    fruit.merged = true;
                    other.merged = true;

                    const newType = fruit.type + 1;
                    const newFruit = fruitTypes[newType];
                    const mergeX = (fruit.x + other.x) / 2;
                    const mergeY = (fruit.y + other.y) / 2;

                    fruits.push({
                        x: mergeX,
                        y: mergeY,
                        vx: 0,
                        vy: -3,
                        type: newType,
                        radius: newFruit.radius,
                        merged: false
                    });

                    // Combo system
                    comboCount++;
                    comboTimer = 120; // 2 seconds to maintain combo
                    const comboMultiplier = Math.min(comboCount, 5);
                    const points = newFruit.points * comboMultiplier;

                    score += points;
                    scoreElement.textContent = score;

                    // Create merge particles
                    createMergeEffect(mergeX, mergeY, fruitTypes[fruit.type].color);

                    // Level up
                    const newLevel = Math.floor(score / 100) + 1;
                    if (newLevel > level) {
                        level = newLevel;
                        levelElement.textContent = level;
                        // Create level up effect
                        for (let i = 0; i < 50; i++) {
                            particles.push({
                                x: canvas.width / 2,
                                y: canvas.height / 2,
                                vx: (Math.random() - 0.5) * 10,
                                vy: (Math.random() - 0.5) * 10,
                                life: 60,
                                color: '#ffd700',
                                size: 5
                            });
                        }
                    }

                    // Update best score
                    if (score > bestScore) {
                        bestScore = score;
                        localStorage.setItem('mergeBest', bestScore);
                        bestElement.textContent = bestScore;
                    }
                } else {
                    // Regular collision
                    const angle = Math.atan2(dy, dx);
                    const targetX = fruit.x + Math.cos(angle) * minDist;
                    const targetY = fruit.y + Math.sin(angle) * minDist;

                    const ax = (targetX - other.x) * 0.1;
                    const ay = (targetY - other.y) * 0.1;

                    fruit.vx -= ax;
                    fruit.vy -= ay;
                    other.vx += ax;
                    other.vy += ay;
                }
            }
        }
    });

    // Remove merged fruits
    fruits = fruits.filter(f => !f.merged);

    // Check game over (fruit above top line)
    for (let fruit of fruits) {
        if (fruit.y - fruit.radius < 80 && Math.abs(fruit.vy) < 0.5) {
            endGame();
            return;
        }
    }
}

function draw() {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffeaa7');
    gradient.addColorStop(1, '#fdcb6e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Drop zone
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, canvas.width, 80);

    // Danger line
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(canvas.width, 80);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview next fruit position
    if (canDrop && gameRunning) {
        ctx.globalAlpha = 0.5;
        const preview = fruitTypes[nextFruitType];
        ctx.fillStyle = preview.color;
        ctx.beginPath();
        ctx.arc(dropX, 50, preview.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = `${preview.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(preview.emoji, dropX, 50);
        ctx.globalAlpha = 1;
    }

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 40;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw fruits
    fruits.forEach(fruit => {
        const fruitData = fruitTypes[fruit.type];

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(fruit.x, groundY, fruit.radius * 0.8, fruit.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fruit body
        ctx.fillStyle = fruitData.color;
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
        ctx.fill();

        // Fruit emoji
        ctx.fillStyle = '#000';
        ctx.font = `${fruit.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fruitData.emoji, fruit.x, fruit.y);

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(fruit.x - fruit.radius * 0.3, fruit.y - fruit.radius * 0.3,
               fruit.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw combo counter
    if (comboCount > 1 && comboTimer > 0) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeText(`${comboCount}x COMBO!`, canvas.width / 2, 10);
        ctx.fillText(`${comboCount}x COMBO!`, canvas.width / 2, 10);
    }

    // Ground
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
    gameOverElement.classList.add('show');
}

function restartGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    fruits = [];
    particles = [];
    comboCount = 0;
    comboTimer = 0;
    nextFruitType = Math.floor(Math.random() * 3);
    canDrop = true;
    dropCooldown = 0;

    scoreElement.textContent = score;
    levelElement.textContent = level;
    nextFruitElement.textContent = fruitTypes[nextFruitType].emoji;
    gameOverElement.classList.remove('show');
}

nextFruitElement.textContent = fruitTypes[nextFruitType].emoji;
gameLoop();
