const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let level = 1;
let gameOver = false;

const BUBBLE_RADIUS = 20;
const COLS = 14;
const ROWS = 8;
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

const bubbles = [];
let currentBubble = null;
let nextBubble = null;
let shooter = { x: canvas.width / 2, y: canvas.height - 50, angle: -Math.PI / 2 };

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    shooter.angle = Math.atan2(mouseY - shooter.y, mouseX - shooter.x);
    if (shooter.angle > Math.PI / 4) shooter.angle = Math.PI / 4;
    if (shooter.angle < -Math.PI / 4) shooter.angle = -Math.PI / 4;
});

canvas.addEventListener('click', () => {
    if (!currentBubble && !gameOver) {
        shootBubble();
    }
});

function createBubble(color) {
    return {
        color: color || colors[Math.floor(Math.random() * colors.length)],
        radius: BUBBLE_RADIUS
    };
}

function initBubbles() {
    bubbles.length = 0;

    for (let row = 0; row < ROWS; row++) {
        bubbles[row] = [];
        const cols = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < cols; col++) {
            if (Math.random() < 0.8) {
                bubbles[row][col] = createBubble();
            } else {
                bubbles[row][col] = null;
            }
        }
    }

    nextBubble = createBubble();
}

function shootBubble() {
    currentBubble = nextBubble;
    currentBubble.x = shooter.x;
    currentBubble.y = shooter.y;
    currentBubble.vx = Math.cos(shooter.angle) * 10;
    currentBubble.vy = Math.sin(shooter.angle) * 10;

    nextBubble = createBubble();
}

function getBubblePos(row, col) {
    const offsetX = row % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_RADIUS * 2;
    return {
        x: offsetX + col * BUBBLE_RADIUS * 2,
        y: BUBBLE_RADIUS + row * BUBBLE_RADIUS * 1.75
    };
}

function findClosestSlot(x, y) {
    let closestRow = Math.round((y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.75));
    closestRow = Math.max(0, Math.min(ROWS - 1, closestRow));

    const offsetX = closestRow % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_RADIUS * 2;
    let closestCol = Math.round((x - offsetX) / (BUBBLE_RADIUS * 2));

    const maxCols = closestRow % 2 === 0 ? COLS : COLS - 1;
    closestCol = Math.max(0, Math.min(maxCols - 1, closestCol));

    return { row: closestRow, col: closestCol };
}

function getNeighbors(row, col) {
    const neighbors = [];
    const isEvenRow = row % 2 === 0;

    const offsets = isEvenRow ? [
        [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
    ] : [
        [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
    ];

    offsets.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < ROWS) {
            const maxCols = newRow % 2 === 0 ? COLS : COLS - 1;
            if (newCol >= 0 && newCol < maxCols && bubbles[newRow][newCol]) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    });

    return neighbors;
}

function findMatches(row, col, color) {
    const visited = new Set();
    const matches = [];
    const queue = [{ row, col }];

    while (queue.length > 0) {
        const { row: r, col: c } = queue.shift();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (bubbles[r][c] && bubbles[r][c].color === color) {
            matches.push({ row: r, col: c });
            getNeighbors(r, c).forEach(n => queue.push(n));
        }
    }

    return matches;
}

function removeFloatingBubbles() {
    const connected = new Set();
    const queue = [];

    // Start from top row
    for (let col = 0; col < COLS; col++) {
        if (bubbles[0][col]) {
            queue.push({ row: 0, col });
        }
    }

    while (queue.length > 0) {
        const { row, col } = queue.shift();
        const key = `${row},${col}`;

        if (connected.has(key)) continue;
        connected.add(key);

        getNeighbors(row, col).forEach(n => queue.push(n));
    }

    // Remove bubbles not connected
    let removed = 0;
    for (let row = 0; row < ROWS; row++) {
        const maxCols = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < maxCols; col++) {
            if (bubbles[row][col] && !connected.has(`${row},${col}`)) {
                bubbles[row][col] = null;
                removed++;
                score += 10;
            }
        }
    }

    return removed;
}

function update() {
    if (gameOver) return;

    if (currentBubble) {
        currentBubble.x += currentBubble.vx;
        currentBubble.y += currentBubble.vy;

        // Wall collision
        if (currentBubble.x - BUBBLE_RADIUS < 0 || currentBubble.x + BUBBLE_RADIUS > canvas.width) {
            currentBubble.vx *= -1;
        }

        // Top collision or bubble collision
        if (currentBubble.y - BUBBLE_RADIUS <= 0) {
            const slot = findClosestSlot(currentBubble.x, currentBubble.y);
            bubbles[slot.row][slot.col] = { color: currentBubble.color, radius: BUBBLE_RADIUS };

            const matches = findMatches(slot.row, slot.col, currentBubble.color);
            if (matches.length >= 3) {
                matches.forEach(m => {
                    bubbles[m.row][m.col] = null;
                    score += 10;
                });
                removeFloatingBubbles();
            }

            currentBubble = null;
            document.getElementById('score').textContent = score;
            checkWin();
            checkGameOver();
        } else {
            // Check collision with existing bubbles
            for (let row = 0; row < ROWS; row++) {
                const maxCols = row % 2 === 0 ? COLS : COLS - 1;
                for (let col = 0; col < maxCols; col++) {
                    if (bubbles[row][col]) {
                        const pos = getBubblePos(row, col);
                        const dx = currentBubble.x - pos.x;
                        const dy = currentBubble.y - pos.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < BUBBLE_RADIUS * 2) {
                            const slot = findClosestSlot(currentBubble.x, currentBubble.y);
                            bubbles[slot.row][slot.col] = { color: currentBubble.color, radius: BUBBLE_RADIUS };

                            const matches = findMatches(slot.row, slot.col, currentBubble.color);
                            if (matches.length >= 3) {
                                matches.forEach(m => {
                                    bubbles[m.row][m.col] = null;
                                    score += 10;
                                });
                                removeFloatingBubbles();
                            }

                            currentBubble = null;
                            document.getElementById('score').textContent = score;
                            checkWin();
                            checkGameOver();
                            return;
                        }
                    }
                }
            }
        }
    }
}

function checkWin() {
    let hasAny = false;
    for (let row = 0; row < ROWS; row++) {
        const maxCols = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < maxCols; col++) {
            if (bubbles[row][col]) {
                hasAny = true;
                break;
            }
        }
        if (hasAny) break;
    }

    if (!hasAny) {
        level++;
        document.getElementById('level').textContent = level;
        initBubbles();
    }
}

function checkGameOver() {
    for (let col = 0; col < COLS; col++) {
        if (bubbles[ROWS - 1] && bubbles[ROWS - 1][col]) {
            gameOver = true;
            alert(`Game Over! Final Score: ${score}`);
            location.reload();
        }
    }
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bubbles
    for (let row = 0; row < ROWS; row++) {
        const maxCols = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < maxCols; col++) {
            if (bubbles[row][col]) {
                const pos = getBubblePos(row, col);
                ctx.fillStyle = bubbles[row][col].color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, BUBBLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    // Draw current bubble
    if (currentBubble) {
        ctx.fillStyle = currentBubble.color;
        ctx.beginPath();
        ctx.arc(currentBubble.x, currentBubble.y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw shooter
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(shooter.x, shooter.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw aim line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + Math.cos(shooter.angle) * 100, shooter.y + Math.sin(shooter.angle) * 100);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw next bubble
    ctx.fillStyle = nextBubble.color;
    ctx.beginPath();
    ctx.arc(canvas.width - 50, canvas.height - 50, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Next:', canvas.width - 80, canvas.height - 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initBubbles();
gameLoop();
