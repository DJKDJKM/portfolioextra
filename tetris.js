const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const finalLinesElement = document.getElementById('finalLines');
const bestScoreElement = document.getElementById('bestScore');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let board = [];
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = true;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let bestScore = localStorage.getItem('tetrisBest') || 0;

// Tetromino shapes
const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[1,1,1],[0,1,0]], // T
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,0,1]], // J
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]]  // Z
];

const COLORS = [
    '#00f0f0', // I - cyan
    '#f0f000', // O - yellow
    '#a000f0', // T - purple
    '#f0a000', // L - orange
    '#0000f0', // J - blue
    '#00f000', // S - green
    '#f00000'  // Z - red
];

let currentPiece = null;
let nextPiece = null;

function initBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

function createPiece() {
    const type = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[type],
        color: COLORS[type],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
        y: 0
    };
}

function drawBlock(x, y, color, context = ctx) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Highlight
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
}

function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    // Draw placed blocks
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

function drawPiece(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(piece.x + x, piece.y + y, piece.color);
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const offsetX = (4 - nextPiece.shape[0].length) / 2;
    const offsetY = (4 - nextPiece.shape.length) / 2;

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(offsetX + x, offsetY + y, nextPiece.color, nextCtx);
            }
        });
    });
}

function collide(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x;
                const newY = piece.y + y;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        });
    });
}

function rotate(piece) {
    const newShape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );

    const oldShape = piece.shape;
    piece.shape = newShape;

    if (collide(piece)) {
        piece.shape = oldShape;
        return false;
    }
    return true;
}

function clearLines() {
    let linesCleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++; // Check the same line again
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;
        linesElement.textContent = lines;

        // Scoring
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;
        scoreElement.textContent = score;

        // Level up every 10 lines
        level = Math.floor(lines / 10) + 1;
        levelElement.textContent = level;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
}

function movePiece(dir) {
    currentPiece.x += dir;
    if (collide(currentPiece)) {
        currentPiece.x -= dir;
    }
}

function dropPiece() {
    currentPiece.y++;
    if (collide(currentPiece)) {
        currentPiece.y--;
        merge();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();

        if (collide(currentPiece)) {
            endGame();
        }
    }
    dropCounter = 0;
}

function hardDrop() {
    while (!collide({...currentPiece, y: currentPiece.y + 1})) {
        currentPiece.y++;
    }
    dropPiece();
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch(e.key) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowDown':
            dropPiece();
            break;
        case 'ArrowUp':
            rotate(currentPiece);
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
});

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        dropPiece();
    }

    drawBoard();
    drawPiece(currentPiece);
    drawNextPiece();

    if (gameRunning) {
        requestAnimationFrame(update);
    }
}

function endGame() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    finalLinesElement.textContent = lines;

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('tetrisBest', bestScore);
    }
    bestScoreElement.textContent = bestScore;

    gameOverElement.classList.add('show');
}

function restartGame() {
    gameRunning = true;
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    dropCounter = 0;

    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = level;

    initBoard();
    currentPiece = createPiece();
    nextPiece = createPiece();

    gameOverElement.classList.remove('show');
    requestAnimationFrame(update);
}

// Initialize
initBoard();
currentPiece = createPiece();
nextPiece = createPiece();
bestScoreElement.textContent = bestScore;
requestAnimationFrame(update);
