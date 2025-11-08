const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 8;
const TILE_SIZE = canvas.width / GRID_SIZE;

let grid = [];
let score = 0;
let moves = 30;
let level = 1;
let selectedTile = null;
let animating = false;
let particles = [];

const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

canvas.addEventListener('click', (e) => {
    if (animating) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        handleTileClick(row, col);
    }
});

function handleTileClick(row, col) {
    if (!selectedTile) {
        selectedTile = { row, col };
    } else {
        const dr = Math.abs(selectedTile.row - row);
        const dc = Math.abs(selectedTile.col - col);

        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
            swapTiles(selectedTile.row, selectedTile.col, row, col);
        }

        selectedTile = null;
    }
}

function swapTiles(row1, col1, row2, col2) {
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;

    if (findMatches().length > 0) {
        moves--;
        document.getElementById('moves').textContent = moves;

        processMatches();

        if (moves <= 0) {
            setTimeout(() => {
                alert(`Game Over! Final Score: ${score}`);
                location.reload();
            }, 500);
        }
    } else {
        // Swap back if no match
        const temp2 = grid[row1][col1];
        grid[row1][col1] = grid[row2][col2];
        grid[row2][col2] = temp2;
    }
}

async function processMatches() {
    animating = true;

    while (true) {
        const matches = findMatches();
        if (matches.length === 0) break;

        matches.forEach(match => {
            createParticles(match.row, match.col, grid[match.row][match.col]);
            grid[match.row][match.col] = null;
            score += 10;
        });

        document.getElementById('score').textContent = score;

        await sleep(200);
        applyGravity();
        await sleep(200);
        fillEmptySpaces();
        await sleep(200);
    }

    animating = false;

    // Check level complete
    if (score >= level * 500) {
        level++;
        moves += 10;
        document.getElementById('level').textContent = level;
        document.getElementById('moves').textContent = moves;
    }
}

function findMatches() {
    const matches = [];

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE - 2; col++) {
            if (grid[row][col] &&
                grid[row][col] === grid[row][col + 1] &&
                grid[row][col] === grid[row][col + 2]) {
                matches.push({ row, col });
                matches.push({ row, col: col + 1 });
                matches.push({ row, col: col + 2 });
            }
        }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE - 2; row++) {
            if (grid[row][col] &&
                grid[row][col] === grid[row + 1][col] &&
                grid[row][col] === grid[row + 2][col]) {
                matches.push({ row, col });
                matches.push({ row: row + 1, col });
                matches.push({ row: row + 2, col });
            }
        }
    }

    // Remove duplicates
    return matches.filter((match, index, self) =>
        index === self.findIndex(m => m.row === match.row && m.col === match.col)
    );
}

function applyGravity() {
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
            if (grid[row][col] === null) {
                for (let r = row - 1; r >= 0; r--) {
                    if (grid[r][col] !== null) {
                        grid[row][col] = grid[r][col];
                        grid[r][col] = null;
                        break;
                    }
                }
            }
        }
    }
}

function fillEmptySpaces() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === null) {
                grid[row][col] = colors[Math.floor(Math.random() * colors.length)];
            }
        }
    }
}

function createParticles(row, col, color) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color
        });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initGrid() {
    grid = [];

    do {
        grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            grid[row] = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                grid[row][col] = colors[Math.floor(Math.random() * colors.length)];
            }
        }
    } while (findMatches().length > 0);
}

function draw() {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            // Draw tile
            if (grid[row][col]) {
                ctx.fillStyle = grid[row][col];
                ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

                // Shine effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, (TILE_SIZE - 10) / 3);
            }

            // Highlight selected tile
            if (selectedTile && selectedTile.row === row && selectedTile.col === col) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 4;
                ctx.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            }
        }
    }

    // Draw grid lines
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * TILE_SIZE, 0);
        ctx.lineTo(i * TILE_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * TILE_SIZE);
        ctx.lineTo(canvas.width, i * TILE_SIZE);
        ctx.stroke();
    }

    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

initGrid();
gameLoop();
