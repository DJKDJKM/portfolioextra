const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 15;
const CELL_SIZE = canvas.width / GRID_SIZE;
const MINE_COUNT = 30;

let grid = [];
let gameOver = false;
let gameWon = false;
let firstClick = true;
let timeElapsed = 0;
let timerInterval;
let flagCount = 0;

canvas.addEventListener('click', (e) => {
    if (gameOver || gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        if (firstClick) {
            initGrid(x, y);
            firstClick = false;
            startTimer();
        }

        const cell = grid[y][x];
        if (!cell.flagged) {
            revealCell(x, y);
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameOver || gameWon || firstClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        const cell = grid[y][x];
        if (!cell.revealed) {
            cell.flagged = !cell.flagged;
            flagCount += cell.flagged ? 1 : -1;
            document.getElementById('flags').textContent = flagCount;
        }
    }
});

function initGrid(safeX, safeY) {
    grid = [];

    // Create empty grid
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            grid[y][x] = {
                mine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0
            };
        }
    }

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        // Don't place mine on first click or adjacent cells
        const isSafe = Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;

        if (!grid[y][x].mine && !isSafe) {
            grid[y][x].mine = true;
            minesPlaced++;
        }
    }

    // Calculate adjacent mines
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (!grid[y][x].mine) {
                grid[y][x].adjacentMines = countAdjacentMines(x, y);
            }
        }
    }
}

function countAdjacentMines(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                if (grid[ny][nx].mine) count++;
            }
        }
    }
    return count;
}

function revealCell(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const cell = grid[y][x];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;

    if (cell.mine) {
        gameOver = true;
        clearInterval(timerInterval);
        revealAllMines();
        setTimeout(() => {
            alert('Game Over! You hit a mine!');
            location.reload();
        }, 500);
        return;
    }

    // If no adjacent mines, reveal neighbors
    if (cell.adjacentMines === 0) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                revealCell(x + dx, y + dy);
            }
        }
    }

    checkWin();
}

function revealAllMines() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x].mine) {
                grid[y][x].revealed = true;
            }
        }
    }
}

function checkWin() {
    let unrevealedSafe = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (!grid[y][x].mine && !grid[y][x].revealed) {
                unrevealedSafe++;
            }
        }
    }

    if (unrevealedSafe === 0) {
        gameWon = true;
        clearInterval(timerInterval);
        setTimeout(() => {
            alert(`You Won! Time: ${timeElapsed}s`);
            location.reload();
        }, 500);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        document.getElementById('time').textContent = timeElapsed;
    }, 1000);
}

function draw() {
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = grid[y][x];
            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;

            if (cell.revealed) {
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

                if (cell.mine) {
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (cell.adjacentMines > 0) {
                    const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000', '#808080'];
                    ctx.fillStyle = colors[cell.adjacentMines];
                    ctx.font = `bold ${CELL_SIZE / 2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cell.adjacentMines, px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                }
            } else {
                // Draw raised button
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

                ctx.fillStyle = '#fff';
                ctx.fillRect(px, py, CELL_SIZE - 2, 2);
                ctx.fillRect(px, py, 2, CELL_SIZE - 2);

                ctx.fillStyle = '#808080';
                ctx.fillRect(px + CELL_SIZE - 2, py, 2, CELL_SIZE);
                ctx.fillRect(px, py + CELL_SIZE - 2, CELL_SIZE, 2);

                if (cell.flagged) {
                    ctx.fillStyle = '#ff0000';
                    ctx.font = `${CELL_SIZE / 2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🚩', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
                }
            }

            // Grid lines
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
        }
    }
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

document.getElementById('mines').textContent = MINE_COUNT;
gameLoop();
